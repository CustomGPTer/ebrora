import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    // Get current month's date range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeSubscriptions, thisMonthGenerations] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
      }),
      prisma.generation.findMany({
        where: {
          createdAt: { gte: monthStart },
        },
        select: { id: true },
      }),
    ]);

    // Calculate subscription breakdown
    const subscriptionsByTier = {
      FREE: activeSubscriptions.filter((s) => s.tier === 'FREE').length,
      STANDARD: activeSubscriptions.filter((s) => s.tier === 'STANDARD').length,
      PREMIUM: activeSubscriptions.filter((s) => s.tier === 'PREMIUM').length,
    };

    // Estimate revenue from active subscriptions
    const pricing: Record<string, number> = {
      FREE: 0,
      STANDARD: 9.99,
      PREMIUM: 29.99,
    };

    const estimatedRevenue = activeSubscriptions.reduce((sum, sub) => {
      return sum + (pricing[sub.tier] || 0);
    }, 0);

    return NextResponse.json({
      totalUsers,
      activeSubscriptions: activeSubscriptions.length,
      subscriptionsByTier,
      thisMonthGenerations: thisMonthGenerations.length,
      estimatedMonthlyRevenue: estimatedRevenue,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
