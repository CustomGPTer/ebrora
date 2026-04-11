import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { TIER_LIMITS } from '@/lib/constants';
import { resolveEffectiveTier } from '@/lib/payments/resolve-tier';
import type { SubscriptionTier } from '@prisma/client';

/**
 * GET  /api/downloads/usage  — returns current usage counts for the logged-in user
 * POST /api/downloads/usage  — records a download and returns updated counts
 *
 * Rolling 30-day window from the user's FIRST download in the current period.
 */

const ROLLING_DAYS = 30;

/** Get the start of the user's rolling 30-day window based on their first download. */
async function getRollingPeriodStart(userId: string, contentType: 'TOOLBOX_TALK' | 'FREE_TEMPLATE'): Promise<Date> {
  const thirtyDaysAgo = new Date(Date.now() - ROLLING_DAYS * 24 * 60 * 60 * 1000);

  // Find the earliest download in the last 30 days
  const firstInWindow = await prisma.contentDownload.findFirst({
    where: {
      userId,
      contentType,
      downloadedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { downloadedAt: 'asc' },
    select: { downloadedAt: true },
  });

  // If no downloads in the last 30 days, window starts now
  return firstInWindow?.downloadedAt || new Date();
}

async function getUsageCounts(userId: string, tier: SubscriptionTier) {
  const thirtyDaysAgo = new Date(Date.now() - ROLLING_DAYS * 24 * 60 * 60 * 1000);

  const [tbtCount, templateCount] = await Promise.all([
    prisma.contentDownload.count({
      where: {
        userId,
        contentType: 'TOOLBOX_TALK',
        downloadedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.contentDownload.count({
      where: {
        userId,
        contentType: 'FREE_TEMPLATE',
        downloadedAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;

  return {
    tbt: {
      used: tbtCount,
      limit: limits.tbtDownloadsPerMonth,
      remaining: Math.max(0, limits.tbtDownloadsPerMonth - tbtCount),
    },
    template: {
      used: templateCount,
      limit: limits.templateDownloadsPerMonth,
      remaining: Math.max(0, limits.templateDownloadsPerMonth - templateCount),
    },
    tier,
  };
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tier: SubscriptionTier = resolveEffectiveTier(user.subscription);

    const usage = await getUsageCounts(session.user.id, tier);

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    let body: { contentType?: string };
    try {
      body = (await request.json()) as { contentType?: string };
    } catch (parseErr) {
      console.error('POST /api/downloads/usage — body parse failed:', parseErr);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const contentType = body.contentType as 'TOOLBOX_TALK' | 'FREE_TEMPLATE';

    if (!contentType || !['TOOLBOX_TALK', 'FREE_TEMPLATE'].includes(contentType)) {
      return NextResponse.json({ error: 'Invalid contentType' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tier: SubscriptionTier = resolveEffectiveTier(user.subscription);

    const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;
    const limitKey = contentType === 'TOOLBOX_TALK' ? 'tbtDownloadsPerMonth' : 'templateDownloadsPerMonth';
    const monthlyLimit = limits[limitKey];

    // Count downloads in rolling 30-day window
    const thirtyDaysAgo = new Date(Date.now() - ROLLING_DAYS * 24 * 60 * 60 * 1000);
    const currentCount = await prisma.contentDownload.count({
      where: {
        userId: session.user.id,
        contentType,
        downloadedAt: { gte: thirtyDaysAgo },
      },
    });

    if (currentCount >= monthlyLimit) {
      return NextResponse.json(
        {
          error: 'Download limit reached',
          code: 'LIMIT_REACHED',
          used: currentCount,
          limit: monthlyLimit,
          tier,
        },
        { status: 429 }
      );
    }

    // Record the download
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    try {
      await prisma.contentDownload.create({
        data: {
          contentType,
          userId: session.user.id,
          email: user.email,
          ipAddress: ip,
        },
      });
    } catch (dbErr) {
      console.error('POST /api/downloads/usage — prisma.create failed:', dbErr);
      return NextResponse.json({ error: 'Failed to record download', detail: String(dbErr) }, { status: 500 });
    }

    // Return updated usage
    const usage = await getUsageCounts(session.user.id, tier);

    return NextResponse.json({
      success: true,
      ...usage,
    });
  } catch (error) {
    console.error('POST /api/downloads/usage — unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 });
  }
}
