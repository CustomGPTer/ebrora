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

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Subscription check
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true },
    });
    if (!user || user.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    // Parse request
    const body = await req.json();
    const { templateSlug, description } = body as { templateSlug: TemplateSlug; description: string };

    if (!templateSlug || !description) {
      return NextResponse.json({ error: 'Template and description are required' }, { status: 400 });
    }

    // Validate description word count (max 100)
    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount > 110) { // small buffer
      return NextResponse.json({ error: 'Description must be 100 words or fewer' }, { status: 400 });
    }

    // Get template sections for the prompt
    const sections = TEMPLATE_SECTIONS[templateSlug];
    if (!sections) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    // Build the system prompt
    const systemPrompt = QUESTION_GENERATION_PROMPT
      .replace('{{TEMPLATE_SLUG}}', templateSlug)
      .replace('{{TEMPLATE_SECTIONS}}', sections);

    // AI Call 1
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Template selected: ${templateSlug}\n\nWork description:\n${description}` },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse and validate
    const parsed: QuestionGenerationResponse = JSON.parse(responseText);
    if (!parsed.questions || parsed.questions.length !== 20) {
      throw new Error(`Expected 20 questions, got ${parsed.questions?.length ?? 0}`);
    }

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        userId: session.user.id,
        templateSlug,
        description,
        questions: JSON.stringify(parsed.questions),
        status: 'QUESTIONS_GENERATED',
      },
    });

    // Log usage
    await prisma.usageRecord.create({
      data: {
        userId: session.user.id,
        action: 'QUESTION_GENERATION',
        tokensUsed: completion.usage?.total_tokens ?? 0,
        generationId: generation.id,
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
