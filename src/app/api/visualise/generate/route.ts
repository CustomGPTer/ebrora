// =============================================================================
// API: POST /api/visualise/generate
//
// Two modes:
//   1. NEW GENERATION — body has `text`, optional `documentId` (for replace-all).
//      Costs 1 use. Returns 1–3 visuals. Creates new VisualiseDocument if no
//      `documentId` (and draft cap not exceeded).
//   2. SINGLE-VISUAL REGENERATE — body has `documentId` + `visualId`.
//      Costs 1 use. Pulls sourceText from the existing blob, asks AI for a
//      single replacement visual, swaps it into the blob preserving other visuals.
//
// Both modes write to the blob. Quota counting uses AiToolGeneration rows
// (tool_slug='visualise') in states COMPLETED/PROCESSING/QUEUED.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';
import { put, del } from '@vercel/blob';
import { randomUUID } from 'crypto';

import { resolveEffectiveTier } from '@/lib/payments/resolve-tier';
import {
  wrapDescription,
  detectInjectionPatterns,
  logInjectionAttempt,
} from '@/lib/ai-tools/sanitise-input';

import {
  VISUALISE_LIMITS,
  VISUALISE_DRAFT_CAP,
  VISUALISE_DRAFT_EXPIRY_DAYS,
  VISUALISE_BLOB_SIZE_LIMIT,
  VISUALISE_TEXT_MIN_WORDS,
  VISUALISE_TEXT_MAX_WORDS,
  VISUALISE_TOOL_SLUG,
  getVisualiseLimit,
} from '@/lib/visualise/constants';
import { buildSystemPrompt } from '@/lib/visualise/ai/systemPrompt';
import { parseAiResponse } from '@/lib/visualise/ai/validateResponse';
import { dropInvalidVisuals, toVisualInstance } from '@/lib/visualise/ai/dropInvalidVisuals';
import { getPresetById } from '@/lib/visualise/presets';
import type {
  VisualiseDocumentBlob,
  GenerateRequest,
  VisualCountPreference,
} from '@/lib/visualise/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const maxDuration = 120;

const MAX_RETRIES = 2;

export async function POST(req: NextRequest) {
  let generationId: string | undefined;
  let userId: string | undefined;

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    userId = session.user.id;

    // ── Parse body ──────────────────────────────────────────────────────────
    let body: GenerateRequest;
    try {
      body = (await req.json()) as GenerateRequest;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { text, forcePresetId, visualCountPreference, documentId, visualId } = body;

    // visualId requires documentId
    if (visualId && !documentId) {
      return NextResponse.json(
        { error: 'visualId requires documentId' },
        { status: 400 },
      );
    }

    const isRegenerate = Boolean(visualId);

    // ── Tier check ──────────────────────────────────────────────────────────
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });
    const tier = resolveEffectiveTier(subscription);
    const limit = getVisualiseLimit(tier);
    if (limit <= 0) {
      return NextResponse.json(
        { error: 'Visualise is not available on your current plan', tier },
        { status: 402 },
      );
    }

    // ── Validate forcePresetId (if provided) ────────────────────────────────
    if (forcePresetId && !getPresetById(forcePresetId)) {
      return NextResponse.json(
        { error: `Unknown forcePresetId: ${forcePresetId}` },
        { status: 400 },
      );
    }

    // ── Load existing document (for regenerate or replace-all) ──────────────
    let existingDoc: { id: string; blob_url: string | null; blob_pathname: string | null; title: string | null } | null = null;
    let existingBlob: VisualiseDocumentBlob | null = null;

    if (documentId) {
      const doc = await prisma.visualiseDocument.findUnique({
        where: { id: documentId },
        select: { id: true, user_id: true, blob_url: true, blob_pathname: true, title: true },
      });
      if (!doc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      if (doc.user_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      existingDoc = doc;

      if (doc.blob_url) {
        try {
          const res = await fetch(doc.blob_url, { cache: 'no-store' });
          if (res.ok) {
            existingBlob = (await res.json()) as VisualiseDocumentBlob;
          }
        } catch (err) {
          console.warn('[visualise.generate] failed to fetch existing blob', { documentId, err });
        }
      }

      if (isRegenerate && !existingBlob) {
        return NextResponse.json(
          { error: 'Cannot regenerate — existing document has no saved blob' },
          { status: 409 },
        );
      }
    }

    // ── Resolve source text ─────────────────────────────────────────────────
    // NEW: user-pasted in body.text. Regenerate: pulled from blob.sourceText.
    let sourceText: string;
    if (isRegenerate) {
      sourceText = existingBlob?.sourceText ?? '';
      if (!sourceText) {
        return NextResponse.json(
          { error: 'Cannot regenerate — original source text is not stored on this document' },
          { status: 409 },
        );
      }
    } else {
      if (typeof text !== 'string') {
        return NextResponse.json({ error: 'Missing text' }, { status: 400 });
      }
      sourceText = text;
    }

    // Word-count bounds.
    const wordCount = countWords(sourceText);
    if (wordCount < VISUALISE_TEXT_MIN_WORDS || wordCount > VISUALISE_TEXT_MAX_WORDS) {
      return NextResponse.json(
        {
          error: `Text must be between ${VISUALISE_TEXT_MIN_WORDS} and ${VISUALISE_TEXT_MAX_WORDS} words (got ${wordCount})`,
        },
        { status: 400 },
      );
    }

    // ── Draft cap (new documents only) ──────────────────────────────────────
    if (!documentId) {
      const draftCount = await prisma.visualiseDocument.count({ where: { user_id: userId } });
      if (draftCount >= VISUALISE_DRAFT_CAP) {
        return NextResponse.json(
          {
            error: `Draft cap reached (${VISUALISE_DRAFT_CAP}). Delete an existing draft before creating a new one.`,
            draftLimit: VISUALISE_DRAFT_CAP,
          },
          { status: 409 },
        );
      }
    }

    // ── Quota check ─────────────────────────────────────────────────────────
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const usedThisMonth = await prisma.aiToolGeneration.count({
      where: {
        user_id: userId,
        tool_slug: VISUALISE_TOOL_SLUG,
        created_at: { gte: periodStart, lte: periodEnd },
        status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
      },
    });

    if (usedThisMonth >= limit) {
      return NextResponse.json(
        {
          error: 'Monthly quota reached',
          used: usedThisMonth,
          limit,
          tier,
        },
        { status: 429 },
      );
    }

    // ── Create generation row (PROCESSING) ──────────────────────────────────
    const generation = await prisma.aiToolGeneration.create({
      data: {
        user_id: userId,
        tool_slug: VISUALISE_TOOL_SLUG,
        description: sourceText.slice(0, 2000),
        status: 'PROCESSING',
      },
      select: { id: true },
    });
    generationId = generation.id;

    // ── Injection scan (non-blocking) ───────────────────────────────────────
    const injections = detectInjectionPatterns(sourceText);
    if (injections.length > 0) {
      logInjectionAttempt(userId, VISUALISE_TOOL_SLUG, 'text', injections);
    }

    // ── Build system prompt + user message ──────────────────────────────────
    // wrapDescription produces the full <user_work_description>-wrapped block
    // with anti-injection guardrail copy. Do NOT wrap again.
    const userMessage = wrapDescription(sourceText, 'Visualise visual document');

    const regeneratingFromPresetId = isRegenerate
      ? findVisualPresetId(existingBlob, visualId ?? '')
      : undefined;

    const systemPrompt = buildSystemPrompt({
      forcePresetId,
      visualCount: resolveCount(visualCountPreference, isRegenerate),
      regenerateFrom: regeneratingFromPresetId ?? undefined,
    });

    // ── Call OpenAI with JSON retry loop ────────────────────────────────────
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    let documentContent: unknown = null;
    let retryCount = 0;
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
      } catch {
        if (retryCount >= MAX_RETRIES) {
          throw new Error('AI returned invalid JSON after retries');
        }
        messages.push({ role: 'assistant', content: responseText });
        messages.push({
          role: 'user',
          content:
            'Your response was not valid JSON. Please respond with ONLY a valid JSON object — no markdown, no code fences, no commentary.',
        });
        retryCount++;
      }
    }

    // ── Validate top-level shape ────────────────────────────────────────────
    const parsed = parseAiResponse(documentContent);
    if (!parsed.success) {
      await markFailed(generationId, `Top-level AI response invalid: ${parsed.error.message}`);
      return NextResponse.json(
        { error: 'AI response failed top-level validation' },
        { status: 500 },
      );
    }

    // ── Per-visual validation with graceful degradation ─────────────────────
    const dropResult = dropInvalidVisuals(parsed.data);
    if (dropResult.valid.length === 0) {
      await markFailed(
        generationId,
        `All visuals failed per-preset validation. Reasons: ${dropResult.droppedReasons
          .map((r) => `${r.presetId}: ${r.reason}`)
          .join(' | ')}`,
      );
      return NextResponse.json(
        { error: 'AI produced no valid visuals. Please try different text.' },
        { status: 500 },
      );
    }

    // For regenerate, only the first valid visual is used. Extras discarded.
    const validVisuals = isRegenerate ? dropResult.valid.slice(0, 1) : dropResult.valid;

    // ── Assemble blob ───────────────────────────────────────────────────────
    const nowIso = new Date().toISOString();
    const documentTitle = parsed.data.document_title || fallbackTitle();

    let blobPayload: VisualiseDocumentBlob;

    if (isRegenerate && existingBlob) {
      // Single-visual regenerate — swap the targeted visual, keep others.
      const newVisual = toVisualInstance(validVisuals[0], 0, randomUUID);
      // Reuse the existing visual's id + order so the client's ordering is preserved.
      const targetIndex = existingBlob.visuals.findIndex((v) => v.id === visualId);
      if (targetIndex < 0) {
        await markFailed(generationId, `Visual ${visualId} not found in document ${documentId}`);
        return NextResponse.json({ error: 'Target visual not found' }, { status: 404 });
      }
      const existingVisual = existingBlob.visuals[targetIndex];
      const mergedVisuals = [...existingBlob.visuals];
      mergedVisuals[targetIndex] = {
        ...newVisual,
        id: existingVisual.id,
        order: existingVisual.order,
      };
      blobPayload = {
        ...existingBlob,
        visuals: mergedVisuals,
        updatedAt: nowIso,
      };
    } else if (documentId && existingBlob) {
      // Replace-all inside an existing document.
      blobPayload = {
        schemaVersion: 1,
        title: documentTitle,
        sourceText,
        visuals: validVisuals.map((v, i) => toVisualInstance(v, i, randomUUID)),
        createdAt: existingBlob.createdAt,
        updatedAt: nowIso,
      };
    } else {
      // New document.
      blobPayload = {
        schemaVersion: 1,
        title: documentTitle,
        sourceText,
        visuals: validVisuals.map((v, i) => toVisualInstance(v, i, randomUUID)),
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    }

    // ── Size guard ──────────────────────────────────────────────────────────
    const serialised = JSON.stringify(blobPayload);
    if (Buffer.byteLength(serialised, 'utf8') > VISUALISE_BLOB_SIZE_LIMIT) {
      await markFailed(generationId, 'Blob payload exceeds size limit');
      return NextResponse.json({ error: 'Document too large' }, { status: 413 });
    }

    // ── Persist DB row + blob ──────────────────────────────────────────────
    const documentIdFinal = existingDoc?.id ?? (await createDocRow(userId, documentTitle)).id;
    const expiresAt = new Date(Date.now() + VISUALISE_DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // Delete old blob before writing new one to avoid orphans.
    if (existingDoc?.blob_url) {
      try {
        await del(existingDoc.blob_url);
      } catch (err) {
        // Old blob may already be gone — not fatal.
        console.warn('[visualise.generate] failed to delete previous blob', { err });
      }
    }

    const pathname = `visualise/${userId}/${documentIdFinal}/${Date.now()}.json`;
    const blob = await put(pathname, serialised, {
      access: 'public',
      contentType: 'application/json',
    });

    await prisma.visualiseDocument.update({
      where: { id: documentIdFinal },
      data: {
        title: documentTitle,
        blob_url: blob.url,
        blob_pathname: pathname,
        visual_count: blobPayload.visuals.length,
        last_saved_at: new Date(),
        expires_at: expiresAt,
      },
    });

    // Mark generation complete.
    await prisma.aiToolGeneration.update({
      where: { id: generationId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
      },
    });

    // ── Response ────────────────────────────────────────────────────────────
    const newUsed = usedThisMonth + 1;
    return NextResponse.json({
      documentId: documentIdFinal,
      document: blobPayload,
      droppedCount: dropResult.droppedCount,
      usage: {
        used: newUsed,
        limit,
        remaining: Math.max(0, limit - newUsed),
      },
    });
  } catch (error) {
    console.error('[visualise.generate] error:', error);
    if (generationId) {
      await markFailed(generationId, error instanceof Error ? error.message : 'Unknown error').catch(() => {});
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}

// ── helpers ────────────────────────────────────────────────────────────────

function countWords(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function resolveCount(
  pref: VisualCountPreference | undefined,
  isRegenerate: boolean,
): 1 | 2 | 3 | undefined {
  if (isRegenerate) return 1;
  if (pref === 1 || pref === 2 || pref === 3) return pref;
  return undefined;
}

function findVisualPresetId(blob: VisualiseDocumentBlob | null, visualId: string): string | null {
  if (!blob) return null;
  return blob.visuals.find((v) => v.id === visualId)?.presetId ?? null;
}

function fallbackTitle(): string {
  const d = new Date();
  const iso = d.toISOString().slice(0, 10);
  return `Untitled document — ${iso}`;
}

async function createDocRow(userId: string, title: string) {
  // Temp expiry — will be overwritten right after blob write. Non-null required by schema.
  const tempExpiry = new Date(Date.now() + VISUALISE_DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return prisma.visualiseDocument.create({
    data: {
      user_id: userId,
      title,
      expires_at: tempExpiry,
    },
    select: { id: true },
  });
}

async function markFailed(generationId: string, errorMessage: string) {
  return prisma.aiToolGeneration.update({
    where: { id: generationId },
    data: {
      status: 'FAILED',
      error_message: errorMessage.slice(0, 500),
      completed_at: new Date(),
    },
  });
}
