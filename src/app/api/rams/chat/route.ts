// =============================================================================
// API: /api/rams/chat
// Conversational multi-turn question flow
// AI reads the work description + previous Q&A rounds, then asks the next
// batch of targeted questions — or signals "ready" when it has enough info.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { CONVERSATION_PROMPT, TEMPLATE_SECTIONS } from '@/lib/rams/system-prompts';
import {
  TemplateSlug,
  ChatRequest,
  ChatResponse,
  ConversationQuestion,
} from '@/lib/rams/types';
import { wrapDescription, wrapAnswers, detectInjectionPatterns, logInjectionAttempt } from '@/lib/ai-tools/sanitise-input';
import { getRamsLimitByTier } from '@/lib/payments/plan-config';
import { FREE_TEMPLATES } from '@/lib/rams/template-config';
import { getRamsUsageThisMonth } from '@/lib/rams/usage';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// RAMS per month per subscription tier — uses shared config
// getRamsLimitByTier handles FREE/STARTER/STANDARD/PROFESSIONAL/UNLIMITED

// Question limits: AI judges readiness between MIN and MAX
const MIN_TOTAL_QUESTIONS = 8;
const MAX_TOTAL_QUESTIONS = 15;
const MAX_ROUNDS = 5;

// Answer validation limits
const MAX_ANSWER_WORDS = 100;
const MAX_ANSWERS_PER_ROUND = 8;

// Cooldown: 10 seconds between chat rounds per user (in-memory — resets on cold start)
const COOLDOWN_MS = 10_000;
const lastRoundTimestamps = new Map<string, number>();

// Housekeeping: purge stale cooldown entries every 5 minutes
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

// Expiry threshold: 1 hour for abandoned generations
const EXPIRY_THRESHOLD_MS = 60 * 60 * 1000;

/**
 * Inline cleanup: mark QUEUED/PROCESSING generations older than 1 hour as EXPIRED.
 * Runs once per request — lightweight query with an index on status + created_at.
 */
async function expireAbandonedGenerations() {
  const cutoff = new Date(Date.now() - EXPIRY_THRESHOLD_MS);
  try {
    await prisma.generation.updateMany({
      where: {
        status: { in: ['QUEUED', 'PROCESSING'] },
        created_at: { lt: cutoff },
      },
      data: { status: 'EXPIRED' },
    });
  } catch (err) {
    // Non-critical — log and continue
    console.warn('[Chat] Failed to expire abandoned generations:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Run inline expiry cleanup
    await expireAbandonedGenerations();
    cleanupCooldownMap();

    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to use the RAMS Builder.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ── Cooldown check (10 s between rounds) ──────────────────────────
    const lastTs = lastRoundTimestamps.get(userId);
    const now = Date.now();
    if (lastTs && now - lastTs < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - lastTs)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSec} seconds before submitting the next round.` },
        { status: 429 }
      );
    }

    const body: ChatRequest = await req.json();
    const { templateSlug, description, rounds } = body;

    if (!templateSlug || !description) {
      return NextResponse.json(
        { error: 'Template and description are required' },
        { status: 400 }
      );
    }

    // Validate description word count
    const descWords = description.trim().split(/\s+/).length;
    if (descWords > 100) {
      return NextResponse.json(
        { error: 'Description must be 100 words or fewer' },
        { status: 400 }
      );
    }

    // ── Validate answers in submitted rounds ──────────────────────────
    if (rounds && rounds.length > 0) {
      for (const round of rounds) {
        // Max 8 answers per round
        if (round.answers && round.answers.length > MAX_ANSWERS_PER_ROUND) {
          return NextResponse.json(
            { error: `Round ${round.roundNumber} exceeds the ${MAX_ANSWERS_PER_ROUND}-answer limit.` },
            { status: 400 }
          );
        }

        // 150-word cap per answer
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    // Template access check
    if (tier === 'FREE' && !FREE_TEMPLATES.includes(templateSlug)) {
      return NextResponse.json(
        {
          error: 'This template is only available on paid plans.',
          upgradeRequired: true,
          message: 'Upgrade to access all 10 templates and generate more RAMS each month.',
        },
        { status: 403 }
      );
    }

    // Usage limit check (only on first round — count from QUEUED, exclude EXPIRED)
    if (!rounds || rounds.length === 0) {
      const monthLimit = getRamsLimitByTier(tier);
      const usageThisMonth = await getRamsUsageThisMonth(user.id);

      if (usageThisMonth >= monthLimit) {
        return NextResponse.json(
          {
            error: `You've used all ${monthLimit} RAMS generation${monthLimit === 1 ? '' : 's'} for this month.`,
            limitReached: true,
            used: usageThisMonth,
            limit: monthLimit,
            tier,
            message:
              tier === 'FREE'
                ? 'Sign up for a paid plan to generate more RAMS each month.'
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
    if (roundNumber > MAX_ROUNDS || totalQuestionsAsked >= MAX_TOTAL_QUESTIONS) {
      return NextResponse.json({
        status: 'ready',
        roundNumber: roundNumber - 1,
        totalQuestionsAsked,
        message: 'I have enough information to generate your RAMS document.',
      } as ChatResponse);
    }

    // Build conversation history for the AI
    const sections = TEMPLATE_SECTIONS[templateSlug];
    if (!sections) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    const systemPrompt = CONVERSATION_PROMPT
      .replace('{{TEMPLATE_SLUG}}', templateSlug)
      .replace('{{TEMPLATE_SECTIONS}}', sections)
      .replace('{{ROUND_NUMBER}}', String(roundNumber))
      .replace('{{TOTAL_ASKED}}', String(totalQuestionsAsked))
      .replaceAll('{{MIN_QUESTIONS}}', String(MIN_TOTAL_QUESTIONS))
      .replaceAll('{{MAX_QUESTIONS}}', String(MAX_TOTAL_QUESTIONS));

    // Injection detection — log suspicious patterns but don't block
    const descPatterns = detectInjectionPatterns(description);
    if (descPatterns.length > 0) {
      logInjectionAttempt(userId, 'rams', 'description', descPatterns);
    }

    // Build messages array with conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: wrapDescription(description, `RAMS — Template: ${templateSlug}`),
      },
    ];

    // Add previous rounds as assistant/user message pairs
    if (rounds && rounds.length > 0) {
      for (const round of rounds) {
        // AI's questions (assistant message)
        messages.push({
          role: 'assistant',
          content: JSON.stringify({
            status: 'more_questions',
            questions: round.questions,
            roundNumber: round.roundNumber,
          }),
        });

        // User's answers (user message)
        if (round.answers && round.answers.length > 0) {
          const answersText = round.answers
            .map((a) => `${a.id}: ${a.answer}`)
            .join('\n');

          // Log injection patterns in answers
          const answerPatterns = detectInjectionPatterns(answersText);
          if (answerPatterns.length > 0) {
            logInjectionAttempt(userId, 'rams', `answers-round-${round.roundNumber}`, answerPatterns);
          }

          messages.push({
            role: 'user',
            content: wrapAnswers(round.roundNumber, answersText),
          });
        }
      }
    }

    // Add the prompt for the next round — enforce minimum before allowing "ready"
    const belowMinimum = totalQuestionsAsked < MIN_TOTAL_QUESTIONS;
    messages.push({
      role: 'user',
      content:
        roundNumber === 1
          ? 'Based on my work description and the template sections, ask me your first batch of questions.'
          : belowMinimum
            ? `Based on my answers so far, ask your next batch of follow-up questions. You have only asked ${totalQuestionsAsked} questions so far — the minimum is ${MIN_TOTAL_QUESTIONS}. You MUST continue asking questions. Do NOT signal "ready" yet.`
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

    // Record the cooldown timestamp AFTER successful AI call
    lastRoundTimestamps.set(userId, Date.now());

    // AI signals it has enough info — enforce minimum server-side
    if (parsed.status === 'ready') {
      if (totalQuestionsAsked < MIN_TOTAL_QUESTIONS) {
        // AI tried to finish too early — override and force more questions
        // This is a safety net; the prompt should prevent this in most cases
        throw new Error(
          `Only ${totalQuestionsAsked} questions asked (minimum ${MIN_TOTAL_QUESTIONS}). Please submit again to continue the interview.`
        );
      }
      return NextResponse.json({
        status: 'ready',
        roundNumber,
        totalQuestionsAsked,
        message: parsed.message || 'I have enough information to generate your RAMS document.',
      } as ChatResponse);
    }

    // Validate questions
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('AI returned no questions');
    }

    // Normalise question IDs (ensure unique)
    let questions: ConversationQuestion[] = parsed.questions.map(
      (q: any, idx: number) => ({
        id: q.id || `r${roundNumber}q${idx + 1}`,
        question: q.question,
        context: q.context || undefined,
      })
    );

    // Trim questions if they would exceed MAX_TOTAL_QUESTIONS
    const remaining = MAX_TOTAL_QUESTIONS - totalQuestionsAsked;
    if (questions.length > remaining) {
      questions = questions.slice(0, Math.max(remaining, 1));
    }

    const newTotal = totalQuestionsAsked + questions.length;

    // If this is the first round, create the generation record as QUEUED
    let generationId: string | undefined;
    if (roundNumber === 1) {
      const format = await prisma.ramsFormat.findUnique({
        where: { slug: templateSlug },
      });
      if (!format) {
        return NextResponse.json({ error: 'Invalid template format' }, { status: 400 });
      }

      const generation = await prisma.generation.create({
        data: {
          user_id: userId,
          format_id: format.id,
          questions: JSON.stringify(questions),
          status: 'QUEUED',
        },
      });
      generationId = generation.id;
    }

    return NextResponse.json({
      status: 'more_questions',
      questions,
      roundNumber,
      totalQuestionsAsked: newTotal,
      ...(generationId ? { generationId } : {}),
    } as ChatResponse & { generationId?: string });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
