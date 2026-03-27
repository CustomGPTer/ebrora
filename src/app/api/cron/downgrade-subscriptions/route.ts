// =============================================================================
// API: /api/cron/downgrade-subscriptions
// Runs daily. Finds all subscriptions that are not ACTIVE and sets tier to FREE.
// Covers CANCELLED, PAST_DUE, and SUSPENDED statuses.
// Configure in vercel.json: { "path": "/api/cron/downgrade-subscriptions", "schedule": "0 3 * * *" }
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    // Find all non-ACTIVE subscriptions that still have a paid tier
    const result = await prisma.subscription.updateMany({
      where: {
        status: { not: 'ACTIVE' },
        tier: { not: 'FREE' },
      },
      data: {
        tier: 'FREE',
      },
    });

    console.log(`Downgrade cron: ${result.count} subscription(s) set to FREE`);

    return NextResponse.json({
      message: `Downgrade complete. ${result.count} subscription(s) downgraded to FREE.`,
      downgraded: result.count,
    });
  } catch (error: any) {
    console.error('Downgrade cron error:', error);
    return NextResponse.json({ error: 'Downgrade failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
