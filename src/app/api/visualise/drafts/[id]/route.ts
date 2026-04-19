// =============================================================================
// API: GET  /api/visualise/drafts/[id] — fetch one draft's full blob
//      DELETE /api/visualise/drafts/[id] — remove blob + DB row
//
// GET returns the VisualiseDocumentBlob JSON *directly* (not wrapped in an
// object). This matches src/components/visualise/VisualiseClient.tsx which
// does `await res.json() as VisualiseDocumentBlob` on the initial deep-link
// load effect.
//
// The trade-off of the raw shape is that server-side metadata (e.g.
// expiresAt, daysUntilExpiry) can't piggy-back on this response — the
// client should use /api/visualise/drafts for that, or /api/visualise/access.
// Acceptable: deep-link-to-draft doesn't need expiry info to render.
//
// DELETE: destructive. Blob delete failures don't block the DB row delete —
// the cleanup cron will eventually sweep orphaned blobs on its own cadence
// if anything slipped through.
//
// Responses:
//   GET:    200 VisualiseDocumentBlob | 401 | 403 | 404 | 410 (blob_url null)
//           | 502 (blob fetch failed) | 500
//   DELETE: 200 { success: true }      | 401 | 403 | 404 | 500
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { del } from '@vercel/blob';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { VisualiseDocumentBlob } from '@/lib/visualise/types';
import { migrateVisualiseDocumentBlob } from '@/lib/visualise/migrations/presetIdMigrations';

export const maxDuration = 30;

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const doc = await prisma.visualiseDocument.findUnique({
      where: { id },
      select: { id: true, user_id: true, blob_url: true },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    if (doc.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!doc.blob_url) {
      // Row exists (e.g. from an aborted generate) but no blob written —
      // 410 Gone is the right code: the resource exists in the index but
      // its content is permanently unavailable.
      return NextResponse.json(
        { error: 'Draft has no saved content' },
        { status: 410 },
      );
    }

    // Fetch the blob. `cache: 'no-store'` ensures we never serve a stale
    // copy after a recent save.
    let blobRes: Response;
    try {
      blobRes = await fetch(doc.blob_url, { cache: 'no-store' });
    } catch (err) {
      console.error('[visualise.drafts.get] blob fetch threw', { id, err });
      return NextResponse.json({ error: 'Failed to fetch draft content' }, { status: 502 });
    }

    if (!blobRes.ok) {
      console.error('[visualise.drafts.get] blob fetch not-ok', { id, status: blobRes.status });
      return NextResponse.json({ error: 'Failed to fetch draft content' }, { status: 502 });
    }

    let blob: VisualiseDocumentBlob;
    try {
      blob = (await blobRes.json()) as VisualiseDocumentBlob;
    } catch (err) {
      console.error('[visualise.drafts.get] blob JSON parse failed', { id, err });
      return NextResponse.json({ error: 'Draft content is corrupt' }, { status: 502 });
    }

    // Batch 4a-i — silently remap retired preset IDs to their consolidated
    // replacements. Pure function; returns the same reference when no remap
    // was needed. User sees their draft open and render as before.
    blob = migrateVisualiseDocumentBlob(blob);

    return NextResponse.json(blob);
  } catch (error) {
    console.error('[visualise.drafts.get] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load draft' },
      { status: 500 },
    );
  }
}

// ── DELETE ──────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const doc = await prisma.visualiseDocument.findUnique({
      where: { id },
      select: { id: true, user_id: true, blob_url: true },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    if (doc.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Blob delete is best-effort — if it fails the DB row still gets removed.
    // Cleanup cron won't re-touch it because the row is gone.
    if (doc.blob_url) {
      try {
        await del(doc.blob_url);
      } catch (err) {
        console.warn('[visualise.drafts.delete] blob delete failed', { id, err });
      }
    }

    await prisma.visualiseDocument.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[visualise.drafts.delete] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete draft' },
      { status: 500 },
    );
  }
}
