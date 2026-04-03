// =============================================================================
// API: /api/ai-tools/chat
// Conversational multi-turn question flow for all AI tools.
// Cloned from /api/rams/chat — adapted for multi-tool with GLOBAL usage cap.
// RAMS Builder is NOT affected — it keeps its own routes.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import {
  isValidAiToolSlug,
  getAiToolConfig,
  MAX_TOTAL_QUESTIONS,
  MAX_ROUNDS,
  MAX_ANSWER_WORDS,
  MAX_ANSWERS_PER_ROUND,
  COOLDOWN_MS,
  EXPIRY_THRESHOLD_MS,
  AI_TOOL_LIMITS,
  getAiToolLimitByTier,
  incrementAiToolUsage,
} from '@/lib/ai-tools';
import { getConversationPrompt } from '@/lib/ai-tools/system-prompts';
import { getCrpTemplateConversationPrompt } from '@/lib/carbon-reduction/crp-prompts';
import { getCarbonFootprintTemplateConversationPrompt } from '@/lib/carbon-footprint/cf-prompts';
import { getDayworkSheetTemplateConversationPrompt } from '@/lib/daywork-sheet/dw-prompts';
import { getNcrTemplateConversationPrompt } from '@/lib/ncr/ncr-prompts';
import { getSafetyAlertTemplateConversationPrompt } from '@/lib/safety-alert/sa-prompts';
import { wrapDescription, wrapAnswers, detectInjectionPatterns, logInjectionAttempt } from '@/lib/ai-tools/sanitise-input';
import { findInvalidTemplateSlug } from '@/lib/ai-tools/validate-template-slugs';
import type {
  AiToolSlug,
  AiToolChatRequest,
  AiToolChatResponse,
  AiToolQuestion,
} from '@/lib/ai-tools';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const maxDuration = 300; // Vercel Pro allows up to 300s

// Cooldown: 10 seconds between chat rounds per user (in-memory)
const lastRoundTimestamps = new Map<string, number>();
const COOLDOWN_CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCooldownCleanup = Date.now();

function cleanupCooldownMap() {
  const now = Date.now();
  if (now - lastCooldownCleanup < COOLDOWN_CLEANUP_INTERVAL) return;
  lastCooldownCleanup = now;
  const cutoff = now - COOLDOWN_MS * 2;
  for (const [uid, ts] of lastRoundTimestamps) {
    if (ts < cutoff) lastRoundTimestamps.delete(uid);
  }
}

/** Expire abandoned generations older than 1 hour */
async function expireAbandonedGenerations() {
  const cutoff = new Date(Date.now() - EXPIRY_THRESHOLD_MS);
  try {
    await (prisma as any).aiToolGeneration.updateMany({
      where: {
        status: { in: ['QUEUED', 'PROCESSING'] },
        created_at: { lt: cutoff },
      },
      data: { status: 'EXPIRED' },
    });
  } catch (err) {
    console.warn('[AI Tools Chat] Failed to expire abandoned generations:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await expireAbandonedGenerations();
    cleanupCooldownMap();

    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to use this tool.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Cooldown check
    const lastTs = lastRoundTimestamps.get(userId);
    const now = Date.now();
    if (lastTs && now - lastTs < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - lastTs)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSec} seconds before submitting the next round.` },
        { status: 429 }
      );
    }

    const body: AiToolChatRequest = await req.json();
    const { toolSlug, description, rounds, crpTemplateSlug, carbonFootprintTemplateSlug, dayworkSheetTemplateSlug, ncrTemplateSlug, safetyAlertTemplateSlug } = body;

    // Validate tool slug
    if (!toolSlug || !isValidAiToolSlug(toolSlug)) {
      return NextResponse.json(
        { error: 'Invalid tool specified.' },
        { status: 400 }
      );
    }

    // Validate template slugs against allowlist
    const invalidSlug = findInvalidTemplateSlug(toolSlug, {
      crpTemplateSlug, carbonFootprintTemplateSlug, dayworkSheetTemplateSlug,
      ncrTemplateSlug, safetyAlertTemplateSlug,
    });
    if (invalidSlug) {
      return NextResponse.json(
        { error: 'Invalid template selected.' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'A work description is required.' },
        { status: 400 }
      );
    }

    // Validate description word count
    const descWords = description.trim().split(/\s+/).length;
    if (descWords > 210) {
      return NextResponse.json(
        { error: 'Description must be 200 words or fewer.' },
        { status: 400 }
      );
    }

    // Validate answers in submitted rounds
    if (rounds && rounds.length > 0) {
      for (const round of rounds) {
        if (round.answers && round.answers.length > MAX_ANSWERS_PER_ROUND) {
          return NextResponse.json(
            { error: `Round ${round.roundNumber} exceeds the ${MAX_ANSWERS_PER_ROUND}-answer limit.` },
            { status: 400 }
          );
        }
        if (round.answers) {
          for (const a of round.answers) {
            const wc = a.answer.trim().split(/\s+/).length;
            if (wc > MAX_ANSWER_WORDS) {
              return NextResponse.json(
                { error: `Answer "${a.id}" in round ${round.roundNumber} exceeds the ${MAX_ANSWER_WORDS}-word limit.` },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    // Fetch user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const tier = user.subscription?.tier ?? 'FREE';
    const subscriptionStatus = user.subscription?.status ?? 'ACTIVE';

    // Paid tier: require active subscription
    if (tier !== 'FREE' && subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your subscription is not active. Please update your billing details.' },
        { status: 403 }
      );
    }

    // Usage limit check (only on first round — GLOBAL cap across all tools)
    if (!rounds || rounds.length === 0) {
      const monthLimit = getAiToolLimitByTier(tier, toolSlug);
      const nowDate = new Date();
      const periodStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
      const periodEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0, 23, 59, 59);

      // Global count: all AI tool generations this month (not per-tool)
      const usageThisMonth = await (prisma as any).aiToolGeneration.count({
        where: {
          user_id: user.id,
          created_at: { gte: periodStart, lte: periodEnd },
          status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
        },
      });

      const toolConfig = getAiToolConfig(toolSlug);

      if (usageThisMonth >= monthLimit) {
        const isRestricted = monthLimit === 0;
        return NextResponse.json(
          {
            error: isRestricted
              ? `The ${toolConfig.shortName} requires a paid plan.`
              : `You've used all ${monthLimit} AI document generation${monthLimit === 1 ? '' : 's'} for this month.`,
            limitReached: true,
            used: usageThisMonth,
            limit: monthLimit,
            tier,
            message: isRestricted
              ? 'Upgrade your plan to access this tool and generate professional documents.'
              : tier === 'FREE'
                ? 'Sign up for a paid plan to generate more documents each month.'
                : 'Your monthly limit resets at the start of next month, or upgrade your plan for a higher limit.',
          },
          { status: 429 }
        );
      }
    }

    // Count total questions asked so far
    const totalQuestionsAsked = (rounds || []).reduce(
      (sum, r) => sum + r.questions.length,
      0
    );

    // Safety: check max rounds and max questions
    const roundNumber = (rounds?.length || 0) + 1;
    const toolConfig = getAiToolConfig(toolSlug);

    if (roundNumber > MAX_ROUNDS || totalQuestionsAsked >= MAX_TOTAL_QUESTIONS) {
      return NextResponse.json({
        status: 'ready',
        roundNumber: roundNumber - 1,
        totalQuestionsAsked,
        message: `I have enough information to generate your ${toolConfig.documentLabel}.`,
      } as AiToolChatResponse);
    }

    // Build system prompt
    const systemPrompt = (toolSlug === 'carbon-reduction-plan' && crpTemplateSlug)
      ? getCrpTemplateConversationPrompt(crpTemplateSlug as any)
      : (toolSlug === 'carbon-footprint' && carbonFootprintTemplateSlug)
      ? getCarbonFootprintTemplateConversationPrompt(carbonFootprintTemplateSlug as any)
      : (toolSlug === 'daywork-sheet' && dayworkSheetTemplateSlug)
      ? getDayworkSheetTemplateConversationPrompt(dayworkSheetTemplateSlug as any)
      : (toolSlug === 'ncr' && ncrTemplateSlug)
      ? getNcrTemplateConversationPrompt(ncrTemplateSlug as any)
      : (toolSlug === 'safety-alert' && safetyAlertTemplateSlug)
      ? getSafetyAlertTemplateConversationPrompt(safetyAlertTemplateSlug as any)
      : getConversationPrompt(toolSlug);

    // Injection detection — log suspicious patterns but don't block
    const descPatterns = detectInjectionPatterns(description);
    if (descPatterns.length > 0) {
      logInjectionAttempt(userId, toolSlug, 'description', descPatterns);
    }

    // Build messages array with conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: wrapDescription(description, toolConfig.documentLabel),
      },
    ];

    // Add previous rounds as assistant/user message pairs
    if (rounds && rounds.length > 0) {
      for (const round of rounds) {
        messages.push({
          role: 'assistant',
          content: JSON.stringify({
            status: 'more_questions',
            questions: round.questions,
            roundNumber: round.roundNumber,
          }),
        });

        if (round.answers && round.answers.length > 0) {
          const answersText = round.answers
            .map((a) => `${a.id}: ${a.answer}`)
            .join('\n');

          // Log injection patterns in answers
          const answerPatterns = detectInjectionPatterns(answersText);
          if (answerPatterns.length > 0) {
            logInjectionAttempt(userId, toolSlug, `answers-round-${round.roundNumber}`, answerPatterns);
          }

          messages.push({
            role: 'user',
            content: wrapAnswers(round.roundNumber, answersText),
          });
        }
      }
    }

    // Prompt for next round
    messages.push({
      role: 'user',
      content:
        roundNumber === 1
          ? `Based on my work description, ask me your first batch of questions to generate a ${toolConfig.documentLabel}.`
          : 'Based on my answers so far, ask your next batch of follow-up questions — or tell me you have enough information.',
    });

    // AI Call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error('No response from AI');

    const parsed = JSON.parse(responseText);

    // Record cooldown
    lastRoundTimestamps.set(userId, Date.now());

    // AI signals ready
    if (parsed.status === 'ready') {
      return NextResponse.json({
        status: 'ready',
        roundNumber,
        totalQuestionsAsked,
        message: parsed.message || `I have enough information to generate your ${toolConfig.documentLabel}.`,
      } as AiToolChatResponse);
    }

    // Validate questions
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('AI returned no questions');
    }

    // Normalise question IDs
    const questions: AiToolQuestion[] = parsed.questions.map(
      (q: any, idx: number) => ({
        id: q.id || `r${roundNumber}q${idx + 1}`,
        question: q.question,
        context: q.context || undefined,
      })
    );

    const newTotal = totalQuestionsAsked + questions.length;

    // If first round, create the generation record as QUEUED
    let generationId: string | undefined;
    if (roundNumber === 1) {
      const generation = await (prisma as any).aiToolGeneration.create({
        data: {
          user_id: userId,
          tool_slug: toolSlug,
          description,
          questions: JSON.stringify(questions),
          status: 'QUEUED',
        },
      });
      generationId = generation.id;
      await incrementAiToolUsage(userId, toolSlug);
    }

    return NextResponse.json({
      status: 'more_questions',
      questions,
      roundNumber,
      totalQuestionsAsked: newTotal,
      ...(generationId ? { generationId } : {}),
    } as AiToolChatResponse & { generationId?: string });
  } catch (error: any) {
    console.error('[AI Tools Chat] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
