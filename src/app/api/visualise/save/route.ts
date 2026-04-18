// =============================================================================
// API: POST /api/visualise/save
//
// Persists an in-memory document blob to Vercel Blob and updates the
// VisualiseDocument DB row. Refreshes the 90-day expiry from `now`.
//
// Save NEVER creates a new document row. The document must already exist
// (generate created it). If it doesn't, 404 and the client re-generates.
//
// Validation: top-level shape and size only. Per-visual data is NOT
// re-validated against the preset registry — the canvas editor (Batch 6)
// writes `canvas.nodes` shapes that the preset's AI-shape Zod schema doesn't
// cover, so strict revalidation would reject legitimate edits. The blob is
// 2 MB capped and comes from the user's own authenticated session.
//
// AMENDMENT (Batch 6c): `canvas.nodes[id].hidden` added as an optional
// boolean to support soft-delete on the canvas. Zod strips unknown keys by
// default, so this MUST stay in sync with VisualCanvasState in types.ts.
//
// Request:  { documentId: string, blobPayload: VisualiseDocumentBlob }
// Response: 200 { success: true, expiresAt: ISO } |
//           400 bad body | 401 | 403 | 404 | 413 oversize | 500
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { put, del } from '@vercel/blob';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  VISUALISE_BLOB_SIZE_LIMIT,
  VISUALISE_DRAFT_EXPIRY_DAYS,
} from '@/lib/visualise/constants';

export const maxDuration = 30;

// ── Top-level blob shape. Preset-specific `data` is kept as unknown. ────────
// This intentionally mirrors VisualiseDocumentBlob in src/lib/visualise/types.ts.
// Keep in sync if the interface changes.
const visualSettingsSchema = z.object({
  paletteId: z.enum(['ebrora-primary', 'ebrora-gold', 'hi-vis', 'slate', 'mono', 'earth']),
  font: z.string(),
  showTitle: z.boolean(),
  layout: z.enum(['horizontal', 'vertical', 'radial']).optional(),
  customColors: z.record(z.string()),
});

const visualCanvasStateSchema = z.object({
  viewBox: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  nodes: z.record(
    z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
      zIndex: z.number(),
      groupId: z.string().optional(),
      hidden: z.boolean().optional(),
    }),
  ),
  groups: z.record(z.object({ nodeIds: z.array(z.string()) })),
});

const visualInstanceSchema = z.object({
  id: z.string().min(1),
  presetId: z.string().min(1),
  title: z.string(),
  data: z.unknown(), // per-preset; not re-validated on save (see file header)
  settings: visualSettingsSchema,
  canvas: visualCanvasStateSchema,
  order: z.number().int().nonnegative(),
});

const blobPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string(),
  sourceText: z.string(),
  visuals: z.array(visualInstanceSchema).max(10), // allows room for future cap changes; AI currently generates ≤3
  createdAt: z.string(),
  updatedAt: z.string(),
});

const requestSchema = z.object({
  documentId: z.string().min(1),
  blobPayload: blobPayloadSchema,
});

export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    const userId = session.user.id;

    // ── Parse + validate body ──────────────────────────────────────────────
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parsed.error.issues.slice(0, 5).map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const { documentId, blobPayload } = parsed.data;

    // ── Size guard ─────────────────────────────────────────────────────────
    const serialised = JSON.stringify(blobPayload);
    if (Buffer.byteLength(serialised, 'utf8') > VISUALISE_BLOB_SIZE_LIMIT) {
      return NextResponse.json(
        { error: 'Document too large', limit: VISUALISE_BLOB_SIZE_LIMIT },
        { status: 413 },
      );
    }

    // ── Ownership check ────────────────────────────────────────────────────
    const existing = await prisma.visualiseDocument.findUnique({
      where: { id: documentId },
      select: { id: true, user_id: true, blob_url: true },
    });

    if (!existing) {
      // Jon's call: never create on save. If the row's gone (e.g. expired
      // cleanup ran while the tab was open), client should re-generate.
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Delete old blob before writing new one to avoid orphans ────────────
    // Old blob may already be gone from a previous delete — swallow errors.
    if (existing.blob_url) {
      try {
        await del(existing.blob_url);
      } catch (err) {
        console.warn('[visualise.save] failed to delete previous blob', { documentId, err });
      }
    }

    // ── Write new blob ─────────────────────────────────────────────────────
    const pathname = `visualise/${userId}/${documentId}/${Date.now()}.json`;
    const blob = await put(pathname, serialised, {
      access: 'public',
      contentType: 'application/json',
    });

    // ── Update DB row ──────────────────────────────────────────────────────
    const now = new Date();
    const expiresAt = new Date(now.getTime() + VISUALISE_DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await prisma.visualiseDocument.update({
      where: { id: documentId },
      data: {
        title: blobPayload.title,
        blob_url: blob.url,
        blob_pathname: pathname,
        visual_count: blobPayload.visuals.length,
        last_saved_at: now,
        expires_at: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[visualise.save] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 },
    );
  }
}
