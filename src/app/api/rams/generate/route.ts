// =============================================================================
// API: /api/rams/generate
// AI Call 2 — Generate full document content → build docx → store in Vercel Blob
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { DOCUMENT_GENERATION_PROMPTS } from '@/lib/rams/system-prompts';
import { generateRamsDocument } from '@/lib/rams/docx-generator';
import { TemplateSlug, AnsweredQuestion } from '@/lib/rams/types';
import { TEMPLATE_CONFIGS } from '@/lib/rams/template-config';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Parse request
    const body = await req.json();
    const { generationId, answers } = body as {
      generationId: string;
      answers: AnsweredQuestion[];
    };

    if (!generationId || !answers || answers.length !== 20) {
      return NextResponse.json({ error: 'Generation ID and 20 answers are required' }, { status: 400 });
    }

    // Validate answer word counts (max 45 each)
    for (const a of answers) {
      const wc = a.answer.trim().split(/\s+/).length;
      if (wc > 50) { // small buffer
        return NextResponse.json({ error: `Answer ${a.number} exceeds 45-word limit` }, { status: 400 });
      }
    }

    // Fetch the generation record
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
    });
    if (!generation || generation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }
    if (generation.status !== 'QUESTIONS_GENERATED') {
      return NextResponse.json({ error: 'Invalid generation state' }, { status: 400 });
    }

    const templateSlug = generation.templateSlug as TemplateSlug;
    const description = generation.description;

    // Update status
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'GENERATING_DOCUMENT', answers: JSON.stringify(answers) },
    });

    // Get the template-specific system prompt
    const systemPrompt = DOCUMENT_GENERATION_PROMPTS[templateSlug];
    if (!systemPrompt) {
      throw new Error(`No generation prompt for template: ${templateSlug}`);
    }

    // Build the user message with description + all 20 answers
    const answersText = answers
      .map(a => `Q${a.number}: ${a.question}\nA${a.number}: ${a.answer}`)
      .join('\n\n');

    const userMessage = `WORK DESCRIPTION (provided by user):\n${description}\n\nQUESTIONNAIRE ANSWERS:\n${answersText}`;

    // AI Call 2
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse the structured JSON content
    const documentContent = JSON.parse(responseText);

    // Generate the docx buffer using the template builder
    const docxBuffer = await generateRamsDocument(templateSlug, documentContent);

    // Generate a clean filename
    const templateConfig = TEMPLATE_CONFIGS[templateSlug];
    const projectName = (documentContent.projectName || 'RAMS')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `RAMS-${projectName}-${templateConfig.displayName.replace(/\s+/g, '-')}-${dateStr}.docx`;

    // Upload to Vercel Blob (24-hour expiry handled via cleanup, not blob TTL)
    const blob = await put(filename, docxBuffer, {
      access: 'public',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Calculate expiry (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update generation record
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'COMPLETE',
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        filename,
        expiresAt,
      },
    });

    // Log usage
    await prisma.usageRecord.create({
      data: {
        userId: session.user.id,
        action: 'DOCUMENT_GENERATION',
        tokensUsed: completion.usage?.total_tokens ?? 0,
        generationId,
      },
    });

    return NextResponse.json({
      generationId,
      downloadUrl: blob.url,
      filename,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error: any) {
    console.error('Document generation error:', error);

    // Update status to failed if we have a generationId
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.generationId) {
        await prisma.generation.update({
          where: { id: body.generationId },
          data: { status: 'FAILED' },
        });
      }
    } catch {}

    return NextResponse.json(
      { error: error.message || 'Failed to generate document' },
      { status: 500 }
    );
  }
}
