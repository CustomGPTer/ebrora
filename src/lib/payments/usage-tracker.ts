import prisma from '@/lib/prisma';
import { getRamsLimitByTier } from './plan-config';
import { resolveEffectiveTier } from './resolve-tier';

export async function getUserUsage(
  userId: string
): Promise<{ used: number; limit: number; tier: string }> {
  const subscription = await prisma.subscription.findUnique({
    where: { user_id: userId },
  });

  // Use resolveEffectiveTier to respect subscription status.
  // PAST_DUE / SUSPENDED / expired CANCELLED users correctly resolve to FREE.
  const tier = resolveEffectiveTier(subscription);
  const limit = getRamsLimitByTier(tier);

  // Count generations this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const usageRecord = await prisma.usageRecord.findFirst({
    where: {
      user_id: userId,
      billing_period_start: {
        gte: monthStart,
        lt: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1),
      },
    },
    select: {
      rams_generated: true,
    },
  });

  const used = usageRecord?.rams_generated || 0;

  return {
    used,
    limit,
    tier,
  };
}

export async function incrementUsage(userId: string): Promise<boolean> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

  try {
    // Get effective tier (respects subscription status)
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });
    const tier = resolveEffectiveTier(subscription);
    const ramsLimit = getRamsLimitByTier(tier);

    // Atomic upsert — relies on @@unique([user_id, billing_period_start])
    // Prevents race condition where two concurrent requests both create a record
    await prisma.usageRecord.upsert({
      where: {
        user_id_billing_period_start: {
          user_id: userId,
          billing_period_start: monthStart,
        },
      },
      update: {
        rams_generated: {
          increment: 1,
        },
      },
      create: {
        user_id: userId,
        billing_period_start: monthStart,
        billing_period_end: monthEnd,
        rams_generated: 1,
        rams_limit: ramsLimit,
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
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  try {
    const result = await prisma.usageRecord.updateMany({
      where: {
        billing_period_start: previousMonthStart,
      },
      data: {
        rams_generated: 0,
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
      user_id: userId,
      billing_period_start: monthStart,
    },
    select: {
      rams_generated: true,
    },
  });

  return usageRecord?.rams_generated || 0;
}
