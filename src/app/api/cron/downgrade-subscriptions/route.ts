// =============================================================================
// API: /api/cron/downgrade-subscriptions
// Runs daily at 3am UTC. Finds all subscriptions that are not ACTIVE and whose
// billing period has ended, then sets tier to FREE.
// Respects grace period: CANCELLED subs with a future current_period_end are
// left untouched so users keep access until their paid period expires.
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
    const now = new Date();

    // Downgrade non-ACTIVE subscriptions to FREE, but ONLY if:
    // - current_period_end is null (never set), OR
    // - current_period_end has passed (grace period expired)
    // This prevents nuking CANCELLED users who still have paid time remaining.
    const result = await prisma.subscription.updateMany({
      where: {
        status: { not: 'ACTIVE' },
        tier: { not: 'FREE' },
        OR: [
          { current_period_end: null },
          { current_period_end: { lt: now } },
        ],
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
