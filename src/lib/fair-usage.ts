// =============================================================================
// Fair Usage Policy — Daily Limit Enforcement for Unlimited Plan
//
// Shared utility called by RAMS chat, AI tools chat, TBT download, and
// template download routes. Only enforces on the UNLIMITED tier.
//
// Counts today's records from EXISTING tables (no schema changes):
//   - RAMS:       Generation table (status in COMPLETED/PROCESSING/QUEUED)
//   - AI tools:   AiToolGeneration table (status in COMPLETED/PROCESSING/QUEUED)
//   - TBT:        ContentDownload table (contentType = TOOLBOX_TALK)
//   - Templates:  ContentDownload table (contentType = FREE_TEMPLATE)
//
// Day boundary: midnight UK time (Europe/London).
// =============================================================================
import { prisma } from '@/lib/prisma';
import { DAILY_FAIR_USE_LIMITS, type FairUsageFeature } from '@/lib/constants';

/** Map feature names to their daily cap */
const FEATURE_LIMITS: Record<FairUsageFeature, number> = {
  rams: DAILY_FAIR_USE_LIMITS.ramsPerDay,
  aiTools: DAILY_FAIR_USE_LIMITS.aiToolUsesPerDay,
  templateDownloads: DAILY_FAIR_USE_LIMITS.templateDownloadsPerDay,
  tbtDownloads: DAILY_FAIR_USE_LIMITS.tbtDownloadsPerDay,
};

/** Polite messages shown when the daily fair-use cap is reached */
const FEATURE_MESSAGES: Record<FairUsageFeature, string> = {
  rams: `You've reached your daily RAMS generation limit (${DAILY_FAIR_USE_LIMITS.ramsPerDay} per day). Your allowance resets at midnight — you'll be back to full capacity first thing tomorrow.`,
  aiTools: `You've reached your daily AI document limit (${DAILY_FAIR_USE_LIMITS.aiToolUsesPerDay} per day). Your allowance resets at midnight — you'll be back to full capacity first thing tomorrow.`,
  templateDownloads: `You've reached your daily template download limit (${DAILY_FAIR_USE_LIMITS.templateDownloadsPerDay} per day). Your allowance resets at midnight — you'll be back to full capacity first thing tomorrow.`,
  tbtDownloads: `You've reached your daily toolbox talk download limit (${DAILY_FAIR_USE_LIMITS.tbtDownloadsPerDay} per day). Your allowance resets at midnight — you'll be back to full capacity first thing tomorrow.`,
};

export interface FairUsageResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  message: string;
  isFairUsage: true;
}

/**
 * Get the start and end of "today" in Europe/London timezone.
 * Handles BST/GMT transitions correctly.
 */
function getUKDayBoundaries(): { dayStart: Date; dayEnd: Date } {
  const now = new Date();

  // Format the current date parts in Europe/London
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((p) => p.type === 'year')!.value);
  const month = Number(parts.find((p) => p.type === 'month')!.value) - 1;
  const day = Number(parts.find((p) => p.type === 'day')!.value);

  // Build midnight UK time as a UTC timestamp
  // Create a date at midnight UTC for this calendar date, then adjust for UK offset
  const midnightUK = new Date(Date.UTC(year, month, day));

  // Determine the UK offset for this date (0 for GMT, -1 for BST since UTC is behind)
  const testDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const ukHour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      hour12: false,
    }).format(testDate)
  );
  const offsetHours = ukHour - 12; // positive = UK is ahead of UTC

  // Midnight UK = midnight UTC minus the offset
  const dayStart = new Date(midnightUK.getTime() - offsetHours * 60 * 60 * 1000);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  return { dayStart, dayEnd };
}

/**
 * Count today's usage for a given feature.
 */
async function countTodayUsage(
  userId: string,
  feature: FairUsageFeature,
  dayStart: Date,
  dayEnd: Date
): Promise<number> {
  switch (feature) {
    case 'rams':
      return prisma.generation.count({
        where: {
          user_id: userId,
          created_at: { gte: dayStart, lt: dayEnd },
          status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
        },
      });

    case 'aiTools':
      return prisma.aiToolGeneration.count({
        where: {
          user_id: userId,
          created_at: { gte: dayStart, lt: dayEnd },
          status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
        },
      });

    case 'tbtDownloads':
      return prisma.contentDownload.count({
        where: {
          userId,
          contentType: 'TOOLBOX_TALK',
          downloadedAt: { gte: dayStart, lt: dayEnd },
        },
      });

    case 'templateDownloads':
      return prisma.contentDownload.count({
        where: {
          userId,
          contentType: 'FREE_TEMPLATE',
          downloadedAt: { gte: dayStart, lt: dayEnd },
        },
      });

    default:
      return 0;
  }
}

/**
 * Check whether an Unlimited-tier user has exceeded their daily fair-use cap.
 *
 * Call this AFTER resolving the user's tier. For non-UNLIMITED tiers this
 * immediately returns `{ allowed: true }` — their monthly limits handle it.
 *
 * @param userId  - The user's ID
 * @param tier    - The user's effective subscription tier
 * @param feature - Which feature to check
 */
export async function checkDailyFairUsage(
  userId: string,
  tier: string,
  feature: FairUsageFeature
): Promise<FairUsageResult> {
  const limit = FEATURE_LIMITS[feature];

  // Only applies to UNLIMITED (and legacy ENTERPRISE alias)
  if (tier !== 'UNLIMITED' && tier !== 'ENTERPRISE') {
    return {
      allowed: true,
      used: 0,
      limit,
      remaining: limit,
      message: '',
      isFairUsage: true,
    };
  }

  const { dayStart, dayEnd } = getUKDayBoundaries();
  const used = await countTodayUsage(userId, feature, dayStart, dayEnd);
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
    message: FEATURE_MESSAGES[feature],
    isFairUsage: true,
  };
}
