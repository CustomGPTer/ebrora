import prisma from '@/lib/prisma';
import { getRamsLimitByTier } from './plan-config';

export async function getUserUsage(
  userId: string
): Promise<{ used: number; limit: number; tier: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
    },
  });

  if (!user) {
    return {
      used: 0,
      limit: getRamsLimitByTier('FREE'),
      tier: 'FREE',
    };
  }

  const tier = user.subscriptionTier || 'FREE';
  const limit = getRamsLimitByTier(tier);

  // Count generations this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const usageRecord = await prisma.usageRecord.findFirst({
    where: {
      userId,
      month: {
        gte: monthStart,
        lt: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1),
      },
    },
    select: {
      generationsCount: true,
    },
  });

  const used = usageRecord?.generationsCount || 0;

  return {
    used,
    limit,
    tier,
  };
}

export async function incrementUsage(userId: string): Promise<boolean> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  try {
    // Upsert usage record for this month
    await prisma.usageRecord.upsert({
      where: {
        userId_month: {
          userId,
          month: monthStart,
        },
      },
      update: {
        generationsCount: {
          increment: 1,
        },
      },
      create: {
        userId,
        month: monthStart,
        generationsCount: 1,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to increment usage:', error);
    return false;
  }
}

export async function resetMonthlyUsage(): Promise<number> {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  try {
    const result = await prisma.usageRecord.updateMany({
      where: {
        month: previousMonth,
      },
      data: {
        generationsCount: 0,
      },
    });

    return result.count;
  } catch (error) {
    console.error('Failed to reset monthly usage:', error);
    return 0;
  }
}

export async function checkUsageLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const usage = await getUserUsage(userId);
  const remaining = Math.max(0, usage.limit - usage.used);
  const allowed = usage.used < usage.limit;

  return {
    allowed,
    remaining,
  };
}

export async function getMonthlyUsage(userId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const usageRecord = await prisma.usageRecord.findFirst({
    where: {
      userId,
      month: monthStart,
    },
    select: {
      generationsCount: true,
    },
  });

  return usageRecord?.generationsCount || 0;
}
