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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Free tier: first 2 templates only
const FREE_TEMPLATES: TemplateSlug[] = ['standard-5x5', 'simple-hml'];

// RAMS per month per subscription tier
const RAMS_LIMITS: Record<string, number> = {
  FREE: 1,
  STANDARD: 10,
  PROFESSIONAL: 30,
};

// Absolute max questions across all rounds to prevent runaway conversations
const MAX_TOTAL_QUESTIONS = 30;
const MAX_ROUNDS = 6;

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to use the RAMS Builder.' },
        { status: 401 }
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
    if (descWords > 110) {
      return NextResponse.json(
        { error: 'Description must be 100 words or fewer' },
        { status: 400 }
      );
    }

    // Fetch user with subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    // Usage limit check (only on first round — don't count mid-conversation rounds)
    if (!rounds || rounds.length === 0) {
      const monthLimit = RAMS_LIMITS[tier] ?? 1;
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const usageThisMonth = await prisma.generation.count({
        where: {
          user_id: user.id,
          created_at: { gte: periodStart, lte: periodEnd },
          status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
        },
      });

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
      .replace('{{MAX_QUESTIONS}}', String(MAX_TOTAL_QUESTIONS));

    // Build messages array with conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Template selected: ${templateSlug}\n\nWork description:\n${description}`,
      },
    ];

    // Add previous rounds as assistant/user message pairs
    if (rounds && rounds.length > 0) {
      for (const round of rounds) {
        // AI's questions (assistant message)
        const questionsText = round.questions
          .map((q) => `${q.id}: ${q.question}${q.context ? ` (${q.context})` : ''}`)
          .join('\n');
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
          messages.push({
            role: 'user',
            content: `Answers to round ${round.roundNumber}:\n${answersText}`,
          });
        }
      }
    }

    // Add the prompt for the next round
    messages.push({
      role: 'user',
      content:
        roundNumber === 1
          ? 'Based on my work description and the template sections, ask me your first batch of questions.'
          : 'Based on my answers so far, ask your next batch of follow-up questions — or tell me you have enough information.',
    });

    // AI Call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error('No response from AI');

    const parsed = JSON.parse(responseText);

    // AI signals it has enough info
    if (parsed.status === 'ready') {
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
    const questions: ConversationQuestion[] = parsed.questions.map(
      (q: any, idx: number) => ({
        id: q.id || `r${roundNumber}q${idx + 1}`,
        question: q.question,
        context: q.context || undefined,
      })
    );

    const newTotal = totalQuestionsAsked + questions.length;

    // If this is the first round, create the generation record
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
          user_id: session.user.id,
          format_id: format.id,
          questions: JSON.stringify(questions),
          status: 'PROCESSING',
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
