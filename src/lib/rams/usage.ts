// =============================================================================
// RAMS Builder — Shared Usage Counter
// Single source of truth for monthly RAMS generation counts.
// Used by the chat route (enforcement) and account page (display).
// =============================================================================
import { prisma } from '@/lib/prisma';

/**
 * Count RAMS generations for the current calendar month.
 * Only counts COMPLETED, PROCESSING, and QUEUED — excludes FAILED and EXPIRED
 * so that failed/abandoned attempts don't permanently consume a user's quota.
 */
export async function getRamsUsageThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return prisma.generation.count({
    where: {
      user_id: userId,
      created_at: { gte: periodStart, lte: periodEnd },
      status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
    },
  });
}
