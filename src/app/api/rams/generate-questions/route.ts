// =============================================================================
// API: /api/rams/generate-questions
// AI Call 1 — Generate 20 tailored questions based on template + description
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { QUESTION_GENERATION_PROMPT, TEMPLATE_SECTIONS } from '@/lib/rams/system-prompts';
import { TemplateSlug, QuestionGenerationResponse } from '@/lib/rams/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Free tier: first 2 templates only
const FREE_TEMPLATES: TemplateSlug[] = ['standard-5x5', 'simple-hml'];

// RAMS per month per subscription tier
const RAMS_LIMITS: Record<string, number> = {
      FREE: 1,
      STANDARD: 10,
      PROFESSIONAL: 25,
};

export async function POST(req: NextRequest) {
      try {
              // Auth check - must be signed in
        const session = await getServerSession(authOptions);
              if (!session?.user?.id) {
                        return NextResponse.json(
                            { error: 'Please sign in to use the RAMS Builder.' },
                            { status: 401 }
                                  );
              }

        const body = await req.json();
              const { templateSlug, description } = body as { templateSlug: TemplateSlug; description: string };

        if (!templateSlug || !description) {
                  return NextResponse.json({ error: 'Template and description are required' }, { status: 400 });
        }

        // Fetch user with subscription
        const user = await prisma.user.findUnique({
                  where: { id: session.user.id },
                  include: { subscription: true },
        });

        if (!user) {
                  return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Determine tier: if no subscription record, treat as FREE
        const tier = user.subscription?.tier ?? 'FREE';
              const subscriptionStatus = user.subscription?.status ?? 'ACTIVE';

        // For paid tiers, require active subscription
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

        // Monthly usage limit check
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
                                    message: tier === 'FREE'
                                      ? 'Sign up for a paid plan to generate more RAMS each month.'
                                                    : 'Your monthly limit resets at the start of next month, or upgrade your plan for a higher limit.',
                      },
                      { status: 429 }
                            );
        }

        // Validate description word count (max 100)
        const wordCount = description.trim().split(/\s+/).length;
              if (wordCount > 110) {
                        return NextResponse.json({ error: 'Description must be 100 words or fewer' }, { status: 400 });
              }

        // Get template sections for the prompt
        const sections = TEMPLATE_SECTIONS[templateSlug];
              if (!sections) {
                        return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
              }

        const systemPrompt = QUESTION_GENERATION_PROMPT
                .replace('{{TEMPLATE_SLUG}}', templateSlug)
                .replace('{{TEMPLATE_SECTIONS}}', sections);

        // AI Call 1
        const completion = await openai.chat.completions.create({
                  model: 'gpt-4.1',
                  messages: [
                      { role: 'system', content: systemPrompt },
                      { role: 'user', content: `Template selected: ${templateSlug}\n\nWork description:\n${description}` },
                            ],
                  temperature: 0.7,
                  max_tokens: 3000,
                  response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content;
              if (!responseText) throw new Error('No response from AI');

        const parsed: QuestionGenerationResponse = JSON.parse(responseText);
              if (!parsed.questions || parsed.questions.length !== 20) {
                        throw new Error(`Expected 20 questions, got ${parsed.questions?.length ?? 0}`);
              }

        const format = await prisma.ramsFormat.findUnique({ where: { slug: templateSlug } });
              if (!format) {
                        return NextResponse.json({ error: 'Invalid template format' }, { status: 400 });
              }

        const generation = await prisma.generation.create({
                  data: {
                              user_id: session.user.id,
                              format_id: format.id,
                              questions: JSON.stringify(parsed.questions),
                              status: 'PROCESSING',
                  },
        });

        return NextResponse.json({
                  generationId: generation.id,
                  questions: parsed.questions,
        });
      } catch (error: any) {
              console.error('Question generation error:', error);
              return NextResponse.json(
                  { error: error.message || 'Failed to generate questions' },
                  { status: 500 }
                      );
      }
}
