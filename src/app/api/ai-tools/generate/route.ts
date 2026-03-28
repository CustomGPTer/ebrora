// =============================================================================
// API: /api/ai-tools/generate
// AI Call 2 — Generate full document content → build docx → store in Blob
// Adapted from /api/rams/generate for multi-tool support.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { getAiToolConfig, isValidAiToolSlug, getAiToolLimitByTier } from '@/lib/ai-tools';
import { getGenerationPrompt, getTbtTemplateGenerationPrompt, getCoshhTemplateGenerationPrompt, getCdmCheckerTemplateGenerationPrompt, getConfinedSpacesTemplateGenerationPrompt, getErpTemplateGenerationPrompt, getIncidentReportTemplateGenerationPrompt } from '@/lib/ai-tools/system-prompts';
import { generateAiToolDocument } from '@/lib/ai-tools/docx-generator';
import { incrementAiToolUsage } from '@/lib/ai-tools/usage-tracker';
import type { AiToolSlug } from '@/lib/ai-tools';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_RETRIES = 2;
const MAX_TOTAL_ANSWERS = 40;

export async function POST(req: NextRequest) {
  let bodyGenerationId: string | undefined;

  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Parse request
    const body = await req.json();
    const { generationId, answers, description, tbtTemplateSlug, coshhTemplateSlug, cdmCheckerTemplateSlug, confinedSpacesTemplateSlug, erpTemplateSlug, incidentReportTemplateSlug } = body as {
      generationId: string;
      answers: { number: number; question: string; answer: string }[];
      description?: string;
      tbtTemplateSlug?: string;
      coshhTemplateSlug?: string;
      cdmCheckerTemplateSlug?: string;
      confinedSpacesTemplateSlug?: string;
      erpTemplateSlug?: string;
      incidentReportTemplateSlug?: string;
    };
    bodyGenerationId = generationId;

    if (!generationId || !answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'Generation ID and at least one answered question are required.' },
        { status: 400 }
      );
    }

    if (answers.length > MAX_TOTAL_ANSWERS) {
      return NextResponse.json(
        { error: `Too many answers (${answers.length}). Maximum is ${MAX_TOTAL_ANSWERS}.` },
        { status: 400 }
      );
    }

    // Validate answer word counts
    for (const a of answers) {
      const wc = a.answer.trim().split(/\s+/).length;
      if (wc > 160) {
        return NextResponse.json(
          { error: `Answer ${a.number} exceeds the word limit.` },
          { status: 400 }
        );
      }
    }

    // Fetch the generation record
    const generation = await (prisma as any).aiToolGeneration.findUnique({
      where: { id: generationId },
    });

    if (!generation || generation.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Generation not found.' }, { status: 404 });
    }

    if (generation.status !== 'PROCESSING' && generation.status !== 'QUEUED') {
      return NextResponse.json({ error: 'Invalid generation state.' }, { status: 400 });
    }

    const toolSlug = generation.tool_slug as AiToolSlug;
    if (!isValidAiToolSlug(toolSlug)) {
      return NextResponse.json({ error: 'Invalid tool.' }, { status: 400 });
    }

    // Independent tier limit check (prevents replay attacks bypassing chat check)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });
    const tier = user?.subscription?.tier ?? 'FREE';
    const subscriptionStatus = user?.subscription?.status ?? 'ACTIVE';

    // Paid tier: require active subscription
    if (tier !== 'FREE' && subscriptionStatus !== 'ACTIVE') {
      await (prisma as any).aiToolGeneration.update({
        where: { id: generationId },
        data: { status: 'FAILED', error_message: 'Subscription not active' },
      });
      return NextResponse.json(
        { error: 'Your subscription is not active. Please update your billing details.' },
        { status: 403 }
      );
    }

    const monthLimit = getAiToolLimitByTier(tier, toolSlug);
    const nowDate = new Date();
    const periodStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
    const periodEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0, 23, 59, 59);

    const usageThisMonth = await (prisma as any).aiToolGeneration.count({
      where: {
        user_id: session.user.id,
        tool_slug: toolSlug,
        created_at: { gte: periodStart, lte: periodEnd },
        status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
        id: { not: generationId }, // exclude current generation being processed
      },
    });

    if (usageThisMonth >= monthLimit) {
      const toolConfig = getAiToolConfig(toolSlug);
      await (prisma as any).aiToolGeneration.update({
        where: { id: generationId },
        data: { status: 'FAILED', error_message: 'Monthly limit exceeded' },
      });
      return NextResponse.json(
        {
          error: monthLimit === 0
            ? `The ${toolConfig.shortName} is available on Standard and Professional plans.`
            : `You've reached your monthly limit for ${toolConfig.shortName}.`,
          limitReached: true,
        },
        { status: 429 }
      );
    }

    const toolConfig = getAiToolConfig(toolSlug);
    const workDescription = description || generation.description || '';

    // Update status to PROCESSING
    await (prisma as any).aiToolGeneration.update({
      where: { id: generationId },
      data: { status: 'PROCESSING', answers: JSON.stringify(answers) },
    });

    // Get the tool-specific generation prompt (template-aware for TBT, COSHH, CDM, Confined Spaces, ERP)
    const systemPrompt = (toolSlug === 'tbt-generator' && tbtTemplateSlug)
      ? getTbtTemplateGenerationPrompt(tbtTemplateSlug as any)
      : (toolSlug === 'coshh' && coshhTemplateSlug)
      ? getCoshhTemplateGenerationPrompt(coshhTemplateSlug as any)
      : (toolSlug === 'cdm-checker' && cdmCheckerTemplateSlug)
      ? getCdmCheckerTemplateGenerationPrompt(cdmCheckerTemplateSlug as any)
      : (toolSlug === 'confined-spaces' && confinedSpacesTemplateSlug)
      ? getConfinedSpacesTemplateGenerationPrompt(confinedSpacesTemplateSlug as any)
      : (toolSlug === 'emergency-response' && erpTemplateSlug)
      ? getErpTemplateGenerationPrompt(erpTemplateSlug as any)
      : (toolSlug === 'incident-report' && incidentReportTemplateSlug)
      ? getIncidentReportTemplateGenerationPrompt(incidentReportTemplateSlug as any)
      : getGenerationPrompt(toolSlug);

    // Build user message with description + all Q&A
    const answersText = answers
      .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
      .join('\n\n');

    const userMessage = `WORK DESCRIPTION (provided by user):\n${workDescription}\n\nINTERVIEW ANSWERS (${answers.length} questions answered):\n${answersText}`;

    // AI Call with retry loop
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
      if (!responseText) throw new Error('No response from AI');

      try {
        documentContent = JSON.parse(responseText);
        break;
      } catch (parseErr) {
        if (retryCount >= MAX_RETRIES) {
          throw new Error('AI returned invalid JSON after retries');
        }
        messages.push({ role: 'assistant', content: responseText });
        messages.push({
          role: 'user',
          content: 'Your response was not valid JSON. Please respond with ONLY a valid JSON object — no markdown, no code fences, no commentary.',
        });
        retryCount++;
      }
    }

    // Generate the document buffer (xlsx for ITP, docx for others)
    const toolOutputFormat = toolConfig.outputFormat || 'docx';
    let docBuffer: Buffer;
    let mimeType: string;
    let fileExtension: string;

    // Inject TBT template slug into content so docx-generator can route it
    if (toolSlug === 'tbt-generator' && tbtTemplateSlug) {
      documentContent._tbtTemplateSlug = tbtTemplateSlug;
    }

    // Inject COSHH template slug into content so docx-generator can route it
    if (toolSlug === 'coshh' && coshhTemplateSlug) {
      documentContent._coshhTemplateSlug = coshhTemplateSlug;
    }

    // Inject CDM Checker template slug into content so docx-generator can route it
    if (toolSlug === 'cdm-checker' && cdmCheckerTemplateSlug) {
      documentContent._cdmCheckerTemplateSlug = cdmCheckerTemplateSlug;
    }

    // Inject Confined Spaces template slug into content so docx-generator can route it
    if (toolSlug === 'confined-spaces' && confinedSpacesTemplateSlug) {
      documentContent._confinedSpacesTemplateSlug = confinedSpacesTemplateSlug;
    }

    // Inject ERP template slug into content so docx-generator can route it
    if (toolSlug === 'emergency-response' && erpTemplateSlug) {
      documentContent._erpTemplateSlug = erpTemplateSlug;
    }

    // Inject Incident Report template slug into content so docx-generator can route it
    if (toolSlug === 'incident-report' && incidentReportTemplateSlug) {
      documentContent._incidentReportTemplateSlug = incidentReportTemplateSlug;
    }

    if (toolSlug === 'itp') {
      const { generateItpXlsx } = await import('@/lib/ai-tools/templates/itp-xlsx-generator');
      docBuffer = await generateItpXlsx(documentContent);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    } else {
      docBuffer = await generateAiToolDocument(toolSlug, documentContent);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExtension = 'docx';
    }

    // Generate filename
    const projectName = (documentContent.projectName || documentContent.topic || toolConfig.shortName)
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${toolConfig.shortName.replace(/\s+/g, '-')}-${projectName}-${dateStr}.${fileExtension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, docBuffer, {
      access: 'public',
      contentType: mimeType,
    });

    // 24-hour expiry
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update generation record
    await (prisma as any).aiToolGeneration.update({
      where: { id: generationId },
      data: {
        status: 'COMPLETED',
        blob_url: blob.url,
        blob_pathname: blob.pathname,
        filename,
        expires_at: expiresAt,
        completed_at: new Date(),
      },
    });

    // Track usage for account dashboard
    await incrementAiToolUsage(session.user.id, toolSlug);

    return NextResponse.json({
      generationId,
      downloadUrl: blob.url,
      filename,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[AI Tools Generate] Error:', error);

    // Update status to FAILED
    if (bodyGenerationId) {
      try {
        await (prisma as any).aiToolGeneration.update({
          where: { id: bodyGenerationId },
          data: { status: 'FAILED', error_message: error.message?.substring(0, 500) },
        });
      } catch {}
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate document' },
      { status: 500 }
    );
  }
}
