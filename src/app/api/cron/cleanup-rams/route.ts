// =============================================================================
// API: /api/cron/cleanup-rams
// Deletes expired RAMS documents from Vercel Blob (24-hour expiry)
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/cleanup-rams", "schedule": "0 */6 * * *" }] }
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    // Find all expired generations with blob URLs
    const expired = await prisma.generation.findMany({
      where: {
        expiresAt: { lt: new Date() },
        blobUrl: { not: null },
      },
      select: { id: true, blobUrl: true, blobPathname: true },
    });

    let deleted = 0;
    let errors = 0;

    for (const gen of expired) {
      try {
        // Delete from Vercel Blob
        if (gen.blobUrl) {
          await del(gen.blobUrl);
        }

        // Clear the blob reference in the database
        await prisma.generation.update({
          where: { id: gen.id },
          data: {
            blobUrl: null,
            blobPathname: null,
            status: 'EXPIRED',
          },
        });

        deleted++;
      } catch (err) {
        console.error(`Failed to delete blob for generation ${gen.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      message: `Cleanup complete. Deleted: ${deleted}, Errors: ${errors}`,
      deleted,
      errors,
      total: expired.length,
    });

  } catch (error: any) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
