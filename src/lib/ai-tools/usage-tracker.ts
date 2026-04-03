// =============================================================================
// AI Tools — Usage Tracker
// Tracks generations per tool, per user, per month.
// Completely separate from RAMS Builder usage tracking.
// Covers all 35 tools (16 existing + 13 new + 6 batch additions).
// =============================================================================
import prisma from '@/lib/prisma';
import { getAiToolLimitByTier, getGlobalAiLimitByTier } from './constants';
import type { AiToolSlug } from './types';

export async function getAiToolUsage(
  userId: string,
  toolSlug: AiToolSlug
): Promise<{ used: number; limit: number; tier: string }> {
  const subscription = await prisma.subscription.findUnique({
    where: { user_id: userId },
  });

  const tier = subscription?.tier || 'FREE';
  const limit = getAiToolLimitByTier(tier, toolSlug);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const record = await prisma.aiToolUsage.findFirst({
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
    const existing = await prisma.aiToolUsage.findFirst({
      where: {
        user_id: userId,
        tool_slug: toolSlug,
        billing_period_start: monthStart,
      },
    });

    if (existing) {
      await prisma.aiToolUsage.update({
        where: { id: existing.id },
        data: { generations_count: { increment: 1 } },
      });
    } else {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });
      const tier = subscription?.tier || 'FREE';
      const limit = getAiToolLimitByTier(tier, toolSlug);

      await prisma.aiToolUsage.create({
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

/** All 35 tool slugs — used by getAllAiToolUsage and account dashboard */
export const ALL_AI_TOOL_SLUGS: AiToolSlug[] = [
  // Existing 16
  'coshh',
  'itp',
  'manual-handling',
  'dse',
  'tbt-generator',
  'confined-spaces',
  'incident-report',
  'lift-plan',
  'emergency-response',
  'quality-checklist',
  'scope-of-works',
  'permit-to-dig',
  'powra',
  'early-warning',
  'ncr',
  'ce-notification',
  // New 13
  'programme-checker',
  'cdm-checker',
  'noise-assessment',
  'quote-generator',
  'safety-alert',
  'carbon-footprint',
  'rams-review',
  'delay-notification',
  'variation-confirmation',
  'rfi-generator',
  'payment-application',
  'daywork-sheet',
  'carbon-reduction-plan',
  // Batch 1 — Mandated H&S tools
  'wah-assessment',
  'wbv-assessment',
  'riddor-report',
  // Batch 2 — Environmental & Transport
  'traffic-management',
  'waste-management',
  'invasive-species',
];

export async function getAllAiToolUsage(
  userId: string
): Promise<Record<AiToolSlug, { used: number; limit: number }>> {
  const subscription = await prisma.subscription.findUnique({
    where: { user_id: userId },
  });
  const tier = subscription?.tier || 'FREE';

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const records = await prisma.aiToolUsage.findMany({
    where: {
      user_id: userId,
      billing_period_start: {
        gte: monthStart,
        lt: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1),
      },
    },
    select: { tool_slug: true, generations_count: true },
  });

  const result = {} as Record<AiToolSlug, { used: number; limit: number }>;
  for (const slug of ALL_AI_TOOL_SLUGS) {
    const rec = records.find((r: any) => r.tool_slug === slug);
    result[slug] = {
      used: rec?.generations_count || 0,
      limit: getAiToolLimitByTier(tier, slug),
    };
  }

  return result;
}

// =============================================================================
// GLOBAL USAGE — counts ALL tool generations combined per month
// Primary limit enforcement for the global cap model (Batch 2+).
// Uses AiToolGeneration table (source of truth) not AiToolUsage counters.
// =============================================================================

export async function getGlobalAiUsage(
  userId: string
): Promise<{ used: number; limit: number; tier: string }> {
  const subscription = await prisma.subscription.findUnique({
    where: { user_id: userId },
  });

  const tier = subscription?.tier || 'FREE';
  const limit = getGlobalAiLimitByTier(tier);

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const used = await prisma.aiToolGeneration.count({
    where: {
      user_id: userId,
      created_at: { gte: periodStart, lte: periodEnd },
      status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
    },
  });

  return { used, limit, tier };
}

export async function checkGlobalAiUsageLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const usage = await getGlobalAiUsage(userId);
  const remaining = Math.max(0, usage.limit - usage.used);
  return {
    allowed: usage.used < usage.limit,
    remaining,
  };
}
