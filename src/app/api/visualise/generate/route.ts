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
import {
  parseAiResponse,
  parseVariantAiResponse,
} from '@/lib/visualise/ai/validateResponse';
import {
  dropInvalidVisuals,
  dropInvalidVariants,
  toVisualInstance,
} from '@/lib/visualise/ai/dropInvalidVisuals';
import { getPresetById } from '@/lib/visualise/presets';
import type {
  VisualiseDocumentBlob,
  VisualInstance,
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

    const {
      text,
      forcePresetId,
      visualCountPreference,
      documentId,
      visualId,
      variantMode,
      silent,
      clarifyAnswers,
      regenerateSource,
    } = body;

    // visualId requires documentId
    if (visualId && !documentId) {
      return NextResponse.json(
        { error: 'visualId requires documentId' },
        { status: 400 },
      );
    }

    // silent requires visualId + forcePresetId (it's the auto-remap path)
    if (silent && (!visualId || !forcePresetId)) {
      return NextResponse.json(
        { error: 'silent requests require visualId and forcePresetId' },
        { status: 400 },
      );
    }

    const isRegenerate = Boolean(visualId);
    // Variant mode is ONLY valid for fresh generations. Regenerate path stays
    // on the legacy single-visual shape so it continues to swap a single
    // VisualInstance cleanly.
    //
    // Batch 1 bug fix: default to TRUE when the client omits the field.
    // Previously `Boolean(undefined) === false` would silently drop users
    // onto the legacy path if the client forgot to send variantMode, which
    // reduced output quality (no alternatives to swap to). Now the flow is:
    //   regenerate → always false
    //   explicit false → false
    //   undefined or true → true
    const useVariantMode = !isRegenerate && variantMode !== false;

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
    //
    // Batch 3a — for per-visual regenerate the caller may request
    // `regenerateSource: 'current-content'`, which serialises the current
    // visual's labels + details + title into a short "tidy up what I've got"
    // context instead of restarting from the original prompt. Useful when
    // the user has edited text in the canvas and wants the AI to refine
    // rather than overwrite.
    let sourceText: string;
    if (isRegenerate) {
      if (regenerateSource === 'current-content' && existingBlob && visualId) {
        const currentVisual = existingBlob.visuals.find((v) => v.id === visualId);
        if (currentVisual) {
          sourceText = serialiseVisualAsSourceText(currentVisual, existingBlob.sourceText);
        } else {
          // Visual not found in blob — fall back to original text.
          sourceText = existingBlob.sourceText ?? '';
        }
      } else {
        sourceText = existingBlob?.sourceText ?? '';
      }
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

    // ── Template lock ───────────────────────────────────────────────────────
    // Batch 3a — when a regenerating visual has `templateLocked: true`, the
    // server forces the AI to target that exact preset regardless of what
    // the body says. Explicit `forcePresetId` in the body takes precedence
    // (the client has just picked a specific preset — probably via silent
    // auto-remap — which is itself a user-driven preset choice). This means
    // a user who locks a template and then picks a different preset from
    // the gallery ends up with the lock pinned to the newly-chosen preset.
    let resolvedForcePresetId: string | undefined = forcePresetId;
    if (isRegenerate && !forcePresetId && existingBlob && visualId) {
      const lockedVisual = existingBlob.visuals.find(
        (v) => v.id === visualId && v.templateLocked === true,
      );
      if (lockedVisual) {
        resolvedForcePresetId = lockedVisual.presetId;
      }
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
    // Auto-delete the oldest draft(s) when at or over the cap so the user
    // never sees a "draft cap reached" error. This is Jon's explicit UX
    // decision — rather than blocking the user and asking them to free up
    // space, we silently roll over their drafts like a browser history.
    //
    // "Oldest" = lowest last_saved_at. Drafts the user has touched most
    // recently are the ones they care about; the stale ones at the bottom
    // of the list are the ones they haven't looked at in days.
    //
    // We delete enough rows to bring the count to DRAFT_CAP - 1, so that
    // after the new draft is created below, the user is exactly at the cap
    // (never over). Blob delete is best-effort per the pattern in
    // src/app/api/visualise/drafts/[id]/route.ts — if blob cleanup fails
    // we still remove the DB row so the user isn't blocked.
    if (!documentId) {
      const draftCount = await prisma.visualiseDocument.count({ where: { user_id: userId } });
      if (draftCount >= VISUALISE_DRAFT_CAP) {
        const toDeleteCount = draftCount - VISUALISE_DRAFT_CAP + 1;
        const stale = await prisma.visualiseDocument.findMany({
          where: { user_id: userId },
          orderBy: { last_saved_at: 'asc' },
          take: toDeleteCount,
          select: { id: true, blob_url: true },
        });

        for (const doc of stale) {
          if (doc.blob_url) {
            try {
              await del(doc.blob_url);
            } catch (err) {
              console.warn('[visualise.generate] stale-draft blob delete failed', {
                id: doc.id,
                err,
              });
            }
          }
        }

        if (stale.length > 0) {
          await prisma.visualiseDocument.deleteMany({
            where: { id: { in: stale.map((d) => d.id) } },
          });
          console.log(
            `[visualise.generate] auto-deleted ${stale.length} stale draft(s) for user ${userId} to make room`,
          );
        }
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

    // Batch CQ fix: if the user picked a specific preset via clarify, route
    // it through the proven `forcePresetId` path rather than the clarify
    // constraints block. The force-preset path has been reliable for
    // months; the "use this preset as FIRST choice" wording in the clarify
    // block was causing variant-mode schema drift ("AI response failed
    // top-level validation (variant mode)" errors). Family / count /
    // palette / data answers continue through the clarify block — those
    // are lighter hints that don't conflict with the response schema.
    //
    // Batch 3a — seed from `resolvedForcePresetId` instead of the raw
    // body `forcePresetId` so that a `templateLocked` flag on the target
    // visual correctly pins the AI to its current preset even when the
    // client didn't send an explicit force.
    let effectiveForcePresetId = resolvedForcePresetId;
    let effectiveClarifyAnswers = clarifyAnswers;
    if (!isRegenerate && clarifyAnswers && !resolvedForcePresetId) {
      const presetAnswer = clarifyAnswers.find(
        (a) => a.topic === 'preset' && a.value && a.value !== 'unknown',
      );
      if (presetAnswer) {
        effectiveForcePresetId = presetAnswer.value;
        effectiveClarifyAnswers = clarifyAnswers.filter((a) => a.topic !== 'preset');
      }
    }

    const systemPrompt = buildSystemPrompt({
      forcePresetId: effectiveForcePresetId,
      visualCount: resolveCount(visualCountPreference, isRegenerate),
      regenerateFrom: regeneratingFromPresetId ?? undefined,
      variantMode: useVariantMode,
      // Batch CQ: clarifyAnswers are ignored in regenerate mode — the existing
      // visual already has a preset, so re-applying clarify hints could produce
      // a mismatched swap. Only threaded through for fresh generations.
      clarifyAnswers: isRegenerate ? undefined : effectiveClarifyAnswers,
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
    // Branch on mode: variant shape has a `variants` array per concept,
    // legacy shape has flat preset_id/title/data per visual.
    let dropResult;
    let aiDocumentTitle: string;
    if (useVariantMode) {
      let parsedVariant = parseVariantAiResponse(documentContent);

      // Batch CQ safety net: if variant-mode validation failed AND clarify
      // hints were present, retry once with clarify stripped. The clarify
      // constraints block can occasionally confuse the AI about the
      // variant-mode response shape — this fallback ensures a bad clarify
      // interaction can't permanently block generation. We don't do this
      // fallback for the legacy (non-variant) branch because its schema is
      // looser and drift is vanishingly rare.
      if (
        !parsedVariant.success &&
        effectiveClarifyAnswers &&
        effectiveClarifyAnswers.length > 0
      ) {
        console.warn(
          '[visualise] variant-mode validation failed WITH clarify hints — retrying once without hints',
        );
        const fallbackSystemPrompt = buildSystemPrompt({
          forcePresetId: effectiveForcePresetId,
          visualCount: resolveCount(visualCountPreference, isRegenerate),
          regenerateFrom: regeneratingFromPresetId ?? undefined,
          variantMode: useVariantMode,
          clarifyAnswers: undefined,
        });
        const fallbackMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
          { role: 'system', content: fallbackSystemPrompt },
          { role: 'user', content: userMessage },
        ];
        let fallbackContent: unknown = null;
        let fallbackRetryCount = 0;
        while (fallbackRetryCount <= MAX_RETRIES) {
          const fallbackCompletion = await openai.chat.completions.create({
            model: 'gpt-4.1',
            messages: fallbackMessages,
            temperature: 0.5,
            max_tokens: 16000,
            response_format: { type: 'json_object' },
          });
          const fallbackText = fallbackCompletion.choices[0]?.message?.content;
          if (!fallbackText) break;
          try {
            fallbackContent = JSON.parse(fallbackText);
            break;
          } catch {
            if (fallbackRetryCount >= MAX_RETRIES) break;
            fallbackMessages.push({ role: 'assistant', content: fallbackText });
            fallbackMessages.push({
              role: 'user',
              content:
                'Your response was not valid JSON. Please respond with ONLY a valid JSON object — no markdown, no code fences, no commentary.',
            });
            fallbackRetryCount++;
          }
        }
        if (fallbackContent) {
          parsedVariant = parseVariantAiResponse(fallbackContent);
          if (parsedVariant.success) {
            documentContent = fallbackContent;
          }
        }
      }

      if (!parsedVariant.success) {
        await markFailed(generationId, `Variant AI response invalid: ${parsedVariant.error.message}`);
        return NextResponse.json(
          { error: 'AI response failed top-level validation (variant mode)' },
          { status: 500 },
        );
      }
      dropResult = dropInvalidVariants(parsedVariant.data);
      aiDocumentTitle = parsedVariant.data.document_title;
    } else {
      const parsed = parseAiResponse(documentContent);
      if (!parsed.success) {
        await markFailed(generationId, `Top-level AI response invalid: ${parsed.error.message}`);
        return NextResponse.json(
          { error: 'AI response failed top-level validation' },
          { status: 500 },
        );
      }
      dropResult = dropInvalidVisuals(parsed.data);
      aiDocumentTitle = parsed.data.document_title;
    }

    // ── Per-visual validation with graceful degradation ─────────────────────
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
    const documentTitle = aiDocumentTitle || fallbackTitle();

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
      // Batch 10: for silent auto-remap, preserve concept-level fields
      // (caption, nodeDescriptions, variants) from the existing visual —
      // they describe the concept, not the preset. The user picked a new
      // preset from the gallery, but the narrative stays the same.
      // Full Regenerate (silent=false) gets fresh caption/descriptions from
      // the AI; legacy regenerate visuals never had them.
      const preserveConceptFields = Boolean(silent);
      // Batch 1b — aiOriginalPresetId tracks the AI's last picked preset
      // so the canvas editor can badge it in the gallery. Two rules:
      //   - Silent auto-remap (user forced a preset): preserve the existing
      //     value. The user's pick doesn't become the "AI's choice".
      //   - Full regenerate (AI freely picked): update to the new presetId.
      // For legacy visuals without the field, silent regen falls back to
      // the EXISTING preset (not the new forced one) — the closest safe
      // approximation of "what the AI last gave you".
      const aiOriginalPresetId = preserveConceptFields
        ? (existingVisual.aiOriginalPresetId ?? existingVisual.presetId)
        : newVisual.presetId;
      mergedVisuals[targetIndex] = {
        ...newVisual,
        id: existingVisual.id,
        order: existingVisual.order,
        caption: preserveConceptFields ? existingVisual.caption : newVisual.caption,
        nodeDescriptions: preserveConceptFields
          ? existingVisual.nodeDescriptions
          : newVisual.nodeDescriptions,
        variants: preserveConceptFields ? existingVisual.variants : newVisual.variants,
        aiOriginalPresetId,
        // Batch 3a — templateLocked is a user-driven UI flag. It survives
        // every regen path (full, silent auto-remap) because the lock
        // reflects the user's intent to pin the preset; only a full
        // replace-all document regenerate drops it (which is handled
        // automatically because that path builds fresh visuals with
        // `toVisualInstance`, which doesn't set the field).
        templateLocked: existingVisual.templateLocked,
      };
      blobPayload = {
        ...existingBlob,
        visuals: mergedVisuals,
        updatedAt: nowIso,
        // Batch 1: preserve existing blob-level reasoning on single-visual
        // regenerate — the overall narrative hasn't changed, only one visual.
        // (The new reasoning from this call applies to only one visual and
        // would be misleading if stored at the document level.)
        reasoning: existingBlob.reasoning,
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
        // Batch 1: fresh reasoning from the full regeneration.
        reasoning: dropResult.reasoning,
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
        // Batch 1: AI chain-of-thought for the DocumentView banner.
        reasoning: dropResult.reasoning,
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

// =============================================================================
// Batch 3a — serialise a VisualInstance into a short prompt fragment suitable
// for feeding to the AI as "current content" in a tidy-up regenerate.
//
// Strategy: walk the visual's title + caption + labels/details from `data`
// and from `nodeDescriptions`, concatenate into a compact plain-text
// representation. We deliberately avoid dumping JSON — the AI should treat
// this as *user-supplied prose about the visual's content*, not as a
// preset data shape it has to preserve verbatim. The original prompt's
// "COUNT concepts + items" rules in systemPrompt still apply, so the AI
// infers count + structure from the prose rather than the JSON scaffolding.
//
// Kept defensive: unknown schemas (preset schemas we don't recognise) fall
// back to listing whatever string values we can find in `data`. The caller
// already validated that the visual exists — here we just stringify it.
// =============================================================================
function serialiseVisualAsSourceText(
  visual: VisualInstance,
  fallbackOriginalText: string | undefined,
): string {
  const parts: string[] = [];
  if (visual.title) parts.push(`Title: ${visual.title}`);
  if (visual.caption) parts.push(visual.caption);

  // Extract label/detail pairs from common sequential shapes. The presets in
  // the flow / process / cycle / timeline families all use `steps[]` or
  // `events[]` arrays of `{ label, detail?, date? }` — we handle those
  // generically so a new preset added later automatically works here.
  const data = visual.data as Record<string, unknown> | null;
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) {
        const entries: string[] = [];
        for (const item of val) {
          if (typeof item === 'string') {
            entries.push(item);
          } else if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            const label = typeof obj.label === 'string' ? obj.label : undefined;
            const detail = typeof obj.detail === 'string' ? obj.detail : undefined;
            const date = typeof obj.date === 'string' ? obj.date : undefined;
            const description = typeof obj.description === 'string' ? obj.description : undefined;
            const pieces = [label, detail, description, date].filter(Boolean);
            if (pieces.length) entries.push(pieces.join(' — '));
          }
        }
        if (entries.length) {
          parts.push(`${humanise(key)}:\n- ${entries.join('\n- ')}`);
        }
      } else if (typeof val === 'string' && val.trim().length > 0) {
        parts.push(`${humanise(key)}: ${val}`);
      }
    }
  }

  if (visual.nodeDescriptions && visual.nodeDescriptions.length > 0) {
    parts.push('Additional context:\n- ' + visual.nodeDescriptions.join('\n- '));
  }

  const text = parts.join('\n\n').trim();
  // Safety net — if serialisation produced nothing useful (very minimal
  // visual, unusual preset shape), fall back to the document's original
  // source text so the AI at least has something to work with.
  if (text.length < 20 && fallbackOriginalText) {
    return fallbackOriginalText;
  }
  return text;
}

/** Turn a camelCase or snake_case key into a Title Case label for prose output. */
function humanise(key: string): string {
  const spaced = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
