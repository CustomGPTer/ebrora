// =============================================================================
// API: GET /api/cron/cleanup-visualise
// Deletes expired VisualiseDocument rows and their blobs.
// Runs nightly at 03:15 UK per vercel.json.
// Auth: Bearer ${CRON_SECRET} — same pattern as all other cleanup crons.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const expired = await prisma.visualiseDocument.findMany({
      where: { expires_at: { lt: new Date() } },
      select: { id: true, blob_url: true },
    });

    let deleted = 0;
    let errors = 0;

    for (const doc of expired) {
      try {
        if (doc.blob_url) {
          // Blob delete can fail if already gone — swallow and proceed so the
          // DB row still gets cleaned up.
          try {
            await del(doc.blob_url);
          } catch (blobErr) {
            console.warn('[cleanup-visualise] blob delete failed', { id: doc.id, err: blobErr });
          }
        }
        await prisma.visualiseDocument.delete({ where: { id: doc.id } });
        deleted++;
      } catch (err) {
        errors++;
        console.error('[cleanup-visualise] failed to delete doc', { id: doc.id, err });
      }
    }

    return NextResponse.json({ deleted, errors, total: expired.length });
  } catch (error) {
    console.error('Visualise cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
