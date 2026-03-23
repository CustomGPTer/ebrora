// =============================================================================
// AI Tools — Usage Tracker
// Tracks generations per tool, per user, per month.
// Completely separate from RAMS Builder usage tracking.
// Depends on AiToolUsage Prisma model (added in Step 4).
// =============================================================================
import prisma from '@/lib/prisma';
import { getAiToolLimitByTier } from './constants';
import type { AiToolSlug } from './types';

export async function getAiToolUsage(
  userId: string,
  toolSlug: AiToolSlug
): Promise<{ used: number; limit: number; tier: string }> {
  const subscription = await prisma.subscription.findUnique({
    where: { user_id: userId },
  });

  const tier = subscription?.tier || 'FREE';
  const limit = getAiToolLimitByTier(tier);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const record = await (prisma as any).aiToolUsage.findFirst({
    where: {
      user_id: userId,
      tool_slug: toolSlug,
      billing_period_start: {
        gte: monthStart,
        lt: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1),
      },
    },
    select: { generations_count: true },
  });

  return {
    used: record?.generations_count || 0,
    limit,
    tier,
  };
}

export async function incrementAiToolUsage(
  userId: string,
  toolSlug: AiToolSlug
): Promise<boolean> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

  try {
    const existing = await (prisma as any).aiToolUsage.findFirst({
      where: {
        user_id: userId,
        tool_slug: toolSlug,
        billing_period_start: monthStart,
      },
    });

    if (existing) {
      await (prisma as any).aiToolUsage.update({
        where: { id: existing.id },
        data: { generations_count: { increment: 1 } },
      });
    } else {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });
      const tier = subscription?.tier || 'FREE';
      const limit = getAiToolLimitByTier(tier);

      await (prisma as any).aiToolUsage.create({
        data: {
          user_id: userId,
          tool_slug: toolSlug,
          billing_period_start: monthStart,
          billing_period_end: monthEnd,
          generations_count: 1,
          generations_limit: limit,
        },
      });
    }

    return true;
  } catch (error) {
    console.error(`Failed to increment AI tool usage [${toolSlug}]:`, error);
    return false;
  }
}

export async function checkAiToolUsageLimit(
  userId: string,
  toolSlug: AiToolSlug
): Promise<{ allowed: boolean; remaining: number }> {
  const usage = await getAiToolUsage(userId, toolSlug);
  const remaining = Math.max(0, usage.limit - usage.used);
  return {
    allowed: usage.used < usage.limit,
    remaining,
  };
}

export async function getAllAiToolUsage(
  userId: string
): Promise<Record<AiToolSlug, { used: number; limit: number }>> {
  const subscription = await prisma.subscription.findUnique({
    where: { user_id: userId },
  });
  const tier = subscription?.tier || 'FREE';
  const limit = getAiToolLimitByTier(tier);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const records = await (prisma as any).aiToolUsage.findMany({
    where: {
      user_id: userId,
      billing_period_start: {
        gte: monthStart,
        lt: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1),
      },
    },
    select: { tool_slug: true, generations_count: true },
  });

  const allSlugs: AiToolSlug[] = [
    'coshh', 'itp', 'manual-handling', 'dse',
    'drawing-checker', 'tbt-generator', 'confined-spaces',
  ];

  const result = {} as Record<AiToolSlug, { used: number; limit: number }>;
  for (const slug of allSlugs) {
    const rec = records.find((r: any) => r.tool_slug === slug);
    result[slug] = { used: rec?.generations_count || 0, limit };
  }

  return result;
}
