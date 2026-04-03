// =============================================================================
// API: /api/cron/cleanup-ai-tools
// Deletes expired AI tool documents from Vercel Blob (24-hour expiry).
// Configure in vercel.json alongside cleanup-rams.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    // Find all expired AI tool generations with blob URLs
    const expired = await prisma.aiToolGeneration.findMany({
      where: {
        expires_at: { lt: new Date() },
        blob_url: { not: null },
      },
      select: { id: true, blob_url: true, blob_pathname: true },
    });

    let deleted = 0;
    let errors = 0;

    for (const gen of expired) {
      try {
        if (gen.blob_url) {
          await del(gen.blob_url);
        }

        await prisma.aiToolGeneration.update({
          where: { id: gen.id },
          data: {
            blob_url: null,
            blob_pathname: null,
            status: 'EXPIRED',
          },
        });

        deleted++;
      } catch (err) {
        console.error(`Failed to delete AI tool blob for generation ${gen.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      message: `AI tool cleanup complete. Deleted: ${deleted}, Errors: ${errors}`,
      deleted,
      errors,
      total: expired.length,
    });
  } catch (error: any) {
    console.error('AI tool cleanup cron error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
