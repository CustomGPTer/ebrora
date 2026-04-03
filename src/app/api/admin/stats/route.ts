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
          created_at: { gte: monthStart },
        },
        select: { id: true },
      }),
    ]);

    // Calculate subscription breakdown
    const subscriptionsByTier = {
      FREE: activeSubscriptions.filter((s) => s.tier === 'FREE').length,
      STARTER: activeSubscriptions.filter((s) => s.tier === 'STARTER').length,
      STANDARD: activeSubscriptions.filter((s) => s.tier === 'STANDARD').length,
      PROFESSIONAL: activeSubscriptions.filter((s) => s.tier === 'PROFESSIONAL').length,
      UNLIMITED: activeSubscriptions.filter((s) => s.tier === 'UNLIMITED').length,
    };

    // Estimate revenue from active subscriptions
    const pricing: Record<string, number> = {
      FREE: 0,
      STARTER: 9.99,
      STANDARD: 9.99,    // legacy — same price as Starter
      PROFESSIONAL: 24.99,
      UNLIMITED: 49.99,
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
