// =============================================================================
// API: /api/cron/cleanup-downloads
// Deletes ContentDownload records older than 90 days to prevent unbounded growth.
// The rolling 30-day window only needs the last 30 days, so 90 days gives a
// 3× safety margin for analytics before purging.
// Configure in vercel.json: { "path": "/api/cron/cleanup-downloads", "schedule": "0 5 * * 0" }
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const RETENTION_DAYS = 90;

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const result = await prisma.contentDownload.deleteMany({
      where: {
        downloadedAt: { lt: cutoff },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      cutoffDate: cutoff.toISOString(),
    });
  } catch (error) {
    console.error('Download cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: String(error) },
      { status: 500 }
    );
  }
}
