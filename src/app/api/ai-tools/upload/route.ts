// =============================================================================
// API: /api/ai-tools/upload
// Handles file upload for Programme Checker and RAMS Review tools.
//
// Flow:
//   1. Auth + tier check (same as /api/ai-tools/chat)
//   2. Parse multipart form (file + toolSlug)
//   3. Validate file type and size
//   4. Extract text from file (PDF / DOCX / XLSX / XER / XML)
//   5. Create AiToolGeneration record (QUEUED)
//   6. Call AI with parsed text → get JSON review content
//   7. Generate premium docx from AI JSON
//   8. Upload docx to Vercel Blob
//   9. Update generation record → COMPLETED
//   10. Return download URL
//
// This is a synchronous route (no polling needed — upload tools are
// single-shot, no multi-round interview). Max duration: 60s on Vercel Pro.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { getAiToolConfig, isValidAiToolSlug } from '@/lib/ai-tools/tool-config';
import { getAiToolLimitByTier } from '@/lib/ai-tools/constants';
import { incrementAiToolUsage } from '@/lib/ai-tools/usage-tracker';
import { getGenerationPrompt } from '@/lib/ai-tools/system-prompts';
import { getProgrammeCheckerTemplateGenerationPrompt } from '@/lib/ai-tools/system-prompts';
import { generateAiToolDocument } from '@/lib/ai-tools/docx-generator';
import { parseUploadedFile } from '@/lib/ai-tools/upload-parser';
import type { AiToolSlug } from '@/lib/ai-tools/types';

export const maxDuration = 300; // Vercel Pro allows up to 300s

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Upload tools that are allowed through this route
const UPLOAD_TOOL_SLUGS: Set<AiToolSlug> = new Set(['programme-checker', 'rams-review']);

// Max file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/xml',
  'text/xml',
  'text/plain', // XER files often served as text/plain
]);

export async function POST(req: NextRequest) {
  let generationId: string | undefined;

  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to use this tool.' }, { status: 401 });
    }
    const userId = session.user.id;

    // ── 2. Parse multipart form ───────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
    }

    const toolSlugRaw = formData.get('toolSlug') as string | null;
    const file = formData.get('file') as File | null;
    const programmeCheckerTemplateSlug = formData.get('programmeCheckerTemplateSlug') as string | null;

    if (!toolSlugRaw || !file) {
      return NextResponse.json({ error: 'Missing toolSlug or file.' }, { status: 400 });
    }

    if (!isValidAiToolSlug(toolSlugRaw) || !UPLOAD_TOOL_SLUGS.has(toolSlugRaw as AiToolSlug)) {
      return NextResponse.json({ error: 'This tool does not accept file uploads.' }, { status: 400 });
    }

    const toolSlug = toolSlugRaw as AiToolSlug;
    const toolConfig = getAiToolConfig(toolSlug);

    // ── 3. Validate file ──────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File too large. Maximum size is 10 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
      }, { status: 400 });
    }

    const mimeType = file.type || 'application/octet-stream';
    const fileName = file.name || 'upload';
    const ext = fileName.toLowerCase().split('.').pop() || '';

    // Allow XER as text/plain
    const isXer = ext === 'xer';
    if (!ALLOWED_MIME_TYPES.has(mimeType) && !isXer) {
      return NextResponse.json({
        error: `File type not supported. Accepted formats: ${toolConfig.uploadFormats?.join(', ') || 'PDF, DOCX, XLSX'}.`,
      }, { status: 400 });
    }

    // ── 4. Tier limit check ───────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    const tier = user?.subscription?.tier ?? 'FREE';
    const subscriptionStatus = user?.subscription?.status ?? 'ACTIVE';

    // Paid tier: require active subscription
    if (tier !== 'FREE' && subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your subscription is not active. Please update your billing details.' },
        { status: 403 }
      );
    }

    const monthLimit = getAiToolLimitByTier(tier, toolSlug);

    if (monthLimit === 0) {
      return NextResponse.json({
        error: 'This tool requires a Standard or Professional subscription. Please upgrade to access it.',
        upgradeRequired: true,
      }, { status: 403 });
    }

    const nowDate = new Date();
    const periodStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
    const periodEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0, 23, 59, 59);

    const usageThisMonth = await (prisma as any).aiToolGeneration.count({
      where: {
        user_id: userId,
        tool_slug: toolSlug,
        created_at: { gte: periodStart, lte: periodEnd },
        status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
      },
    });

    if (usageThisMonth >= monthLimit) {
      return NextResponse.json({
        error: `You have reached your monthly limit of ${monthLimit} ${toolConfig.shortName} generations. Resets on the 1st of next month.`,
        limitReached: true,
      }, { status: 429 });
    }

    // ── 5. Create generation record ───────────────────────────────────────
    const generation = await (prisma as any).aiToolGeneration.create({
      data: {
        user_id: userId,
        tool_slug: toolSlug,
        description: `File upload: ${fileName}`,
        status: 'PROCESSING',
      },
    });
    generationId = generation.id;
    await incrementAiToolUsage(userId, toolSlug);

    // ── 6. Parse file ─────────────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await parseUploadedFile(buffer, fileName, mimeType);

    if (parsed.characterCount < 50) {
      await (prisma as any).aiToolGeneration.update({
        where: { id: generationId },
        data: { status: 'FAILED', error_message: 'Could not extract readable content from file.' },
      });
      return NextResponse.json({
        error: 'Could not extract readable content from the uploaded file. Please check the file is not password-protected or image-only.',
      }, { status: 422 });
    }

    // ── 7. AI Generation — Generate JSON document content ──────────────
    // Upload tools are single-round: skip the conversation phase entirely
    // and go straight to document generation.
    const generationPrompt = (toolSlug === 'programme-checker' && programmeCheckerTemplateSlug)
      ? getProgrammeCheckerTemplateGenerationPrompt(programmeCheckerTemplateSlug as any)
      : getGenerationPrompt(toolSlug);

    // Truncate very large documents to stay within model context limits
    // and avoid timeouts. ~80k chars ≈ 20k tokens — plenty for a thorough review.
    const MAX_TEXT_CHARS = 80_000;
    const parsedText = parsed.text.length > MAX_TEXT_CHARS
      ? parsed.text.slice(0, MAX_TEXT_CHARS) + '\n\n[... document truncated at 80,000 characters for processing ...]'
      : parsed.text;

    const phaseTwoMsg = `UPLOADED FILE: ${fileName} (${parsed.fileType.toUpperCase()})
FILE SIZE: ${(file.size / 1024).toFixed(0)} KB
CHARACTER COUNT: ${parsed.characterCount.toLocaleString()}

FULL PARSED CONTENT:
${parsedText}

Based on the above content, generate the complete ${toolConfig.documentLabel} as specified in the system prompt. Output ONLY valid JSON.`;

    let documentContent: any = null;
    const MAX_RETRIES = 2;
    let retryCount = 0;

    const genMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: generationPrompt },
      { role: 'user', content: phaseTwoMsg },
    ];

    while (retryCount <= MAX_RETRIES) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: genMessages,
        temperature: 0.4,
        max_tokens: 16000,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) throw new Error('No response from AI');

      try {
        documentContent = JSON.parse(responseText);
        break;
      } catch {
        if (retryCount >= MAX_RETRIES) throw new Error('AI returned invalid JSON after retries');
        genMessages.push({ role: 'assistant', content: responseText });
        genMessages.push({
          role: 'user',
          content: 'Your response was not valid JSON. Please respond with ONLY a valid JSON object — no markdown, no code fences.',
        });
        retryCount++;
      }
    }

    // ── 9. Generate docx ──────────────────────────────────────────────────
    // Embed template slug so the docx generator routes to the right builder
    if (toolSlug === 'programme-checker' && programmeCheckerTemplateSlug) {
      documentContent._programmeCheckerTemplateSlug = programmeCheckerTemplateSlug;
    }
    const docBuffer = await generateAiToolDocument(toolSlug, documentContent);

    // ── 10. Upload to Vercel Blob ─────────────────────────────────────────
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-').substring(0, 40);
    const dateStr = new Date().toISOString().split('T')[0];
    const blobFilename = `${toolConfig.shortName.replace(/\s+/g, '-')}-${safeFileName}-${dateStr}.docx`;

    const blob = await put(blobFilename, docBuffer, {
      access: 'public',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // ── 11. Update DB record ──────────────────────────────────────────────
    await (prisma as any).aiToolGeneration.update({
      where: { id: generationId },
      data: {
        status: 'COMPLETED',
        blob_url: blob.url,
        blob_pathname: blob.pathname,
        filename: blobFilename,
        expires_at: expiresAt,
        completed_at: new Date(),
      },
    });

    // ── 12. Increment usage ───────────────────────────────────────────────
    try {
      const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
      const existing = await (prisma as any).aiToolUsage.findFirst({
        where: { user_id: userId, tool_slug: toolSlug, billing_period_start: monthStart },
      });
      if (existing) {
        await (prisma as any).aiToolUsage.update({
          where: { id: existing.id },
          data: { generations_count: { increment: 1 } },
        });
      } else {
        await (prisma as any).aiToolUsage.create({
          data: {
            user_id: userId,
            tool_slug: toolSlug,
            billing_period_start: monthStart,
            billing_period_end: new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0),
            generations_count: 1,
            generations_limit: monthLimit,
          },
        });
      }
    } catch (usageErr) {
      console.warn('[Upload] Failed to increment usage:', usageErr);
    }

    return NextResponse.json({
      generationId,
      downloadUrl: blob.url,
      filename: blobFilename,
      expiresAt: expiresAt.toISOString(),
      fileType: parsed.fileType,
      characterCount: parsed.characterCount,
    });

  } catch (error: any) {
    console.error('[AI Tools Upload] Error:', error);

    if (generationId) {
      try {
        await (prisma as any).aiToolGeneration.update({
          where: { id: generationId },
          data: { status: 'FAILED', error_message: error.message?.substring(0, 500) },
        });
      } catch {}
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process uploaded file.' },
      { status: 500 }
    );
  }
}
