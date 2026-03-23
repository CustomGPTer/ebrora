// =============================================================================
// API: /api/rams/generate
// AI Call 2 — Generate full document content → validate word counts → retry if
// needed → build docx → store in Vercel Blob
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
import {
  validateWordCounts,
  getWordCountChecks,
  buildRetryPrompt,
} from '@/lib/rams/rich-body-text';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_RETRIES = 3;
const MAX_TOTAL_ANSWERS = 40;

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Parse request
    const body = await req.json();
    const { generationId, answers, description } = body as {
      generationId: string;
      answers: AnsweredQuestion[];
      description?: string;
    };

    if (!generationId || !answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'Generation ID and at least one answered question are required' },
        { status: 400 }
      );
    }

    // Max total answers check
    if (answers.length > MAX_TOTAL_ANSWERS) {
      return NextResponse.json(
        { error: `Too many answers (${answers.length}). Maximum is ${MAX_TOTAL_ANSWERS}.` },
        { status: 400 }
      );
    }

    // Validate answer word counts (max 100 each, with small buffer)
    for (const a of answers) {
      const wc = a.answer.trim().split(/\s+/).length;
      if (wc > 110) {
        return NextResponse.json(
          { error: `Answer ${a.number} exceeds 100-word limit` },
          { status: 400 }
        );
      }
    }

    // Fetch the generation record with format
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
      include: { rams_format: true },
    });

    if (!generation || generation.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Accept both QUEUED (new flow) and PROCESSING (legacy flow)
    if (generation.status !== 'PROCESSING' && generation.status !== 'QUEUED') {
      return NextResponse.json({ error: 'Invalid generation state' }, { status: 400 });
    }

    const templateSlug = generation.rams_format.slug as TemplateSlug;
    const workDescription = description || '';

    // Update status to PROCESSING
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'PROCESSING', answers: JSON.stringify(answers) },
    });

    // Get the template-specific system prompt
    const systemPrompt = DOCUMENT_GENERATION_PROMPTS[templateSlug];
    if (!systemPrompt) {
      throw new Error(`No generation prompt for template: ${templateSlug}`);
    }

    // Build the user message with description + all Q&A
    const answersText = answers
      .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
      .join('\n\n');

    const userMessage = `WORK DESCRIPTION (provided by user):\n${workDescription}\n\nINTERVIEW ANSWERS (${answers.length} questions answered):\n${answersText}`;

    // AI Call 2 with retry loop for word count validation
    let documentContent: any = null;
    let retryCount = 0;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    while (retryCount <= MAX_RETRIES) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages,
        temperature: 0.5,
        max_tokens: 16000,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from AI');
      }

      documentContent = JSON.parse(responseText);

      // Validate word counts
      const checks = getWordCountChecks(templateSlug, documentContent);
      const validation = validateWordCounts(checks);

      if (validation.isValid) {
        // All sections meet minimums — proceed
        break;
      }

      if (retryCount >= MAX_RETRIES) {
        // Max retries reached — use what we have, log the failures
        console.warn(
          `[Generate] Word count validation failed after ${MAX_RETRIES} retries for ${generationId}:`,
          validation.failures
        );
        break;
      }

      // Build retry prompt and add to conversation
      console.log(
        `[Generate] Retry ${retryCount + 1}/${MAX_RETRIES} — sections below minimum:`,
        validation.failures.map((f) => `${f.field}: ${f.actual}/${f.minimum}`)
      );

      messages.push({ role: 'assistant', content: responseText });
      messages.push({ role: 'user', content: buildRetryPrompt(validation.failures) });

      retryCount++;
    }

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

    // Upload to Vercel Blob
    const blob = await put(filename, docxBuffer, {
      access: 'public',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Calculate expiry (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update generation record
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'COMPLETED',
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        filename,
        expiresAt,
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
      const body = await req
        .clone()
        .json()
        .catch(() => null);
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
