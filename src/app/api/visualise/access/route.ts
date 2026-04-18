// =============================================================================
// API: GET /api/visualise/access
// Returns the user's Visualise quota state and draft count.
// Mirrors src/app/api/ai-tools/check-access/route.ts but with Visualise-specific
// limits from VISUALISE_LIMITS (independent of the global aiToolUsesPerMonth cap).
// =============================================================================

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { resolveEffectiveTier } from '@/lib/payments/resolve-tier';
import {
  VISUALISE_LIMITS,
  VISUALISE_DRAFT_CAP,
  VISUALISE_TOOL_SLUG,
  getVisualiseLimit,
} from '@/lib/visualise/constants';
import type { AccessResponse } from '@/lib/visualise/types';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Anonymous users — return an explicit "locked" response with zero counts.
    // The landing page uses this to render the signed-out locked state.
    if (!session?.user?.id) {
      const body: AccessResponse = {
        allowed: false,
        tier: 'FREE',
        limit: VISUALISE_LIMITS.FREE,
        used: 0,
        remaining: 0,
        draftCount: 0,
        draftLimit: VISUALISE_DRAFT_CAP,
      };
      return NextResponse.json(body);
    }

    const userId = session.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    const tier = resolveEffectiveTier(subscription);
    const limit = getVisualiseLimit(tier);

    // Count Visualise generations this calendar month.
    // Matches the window pattern used in src/app/api/ai-tools/check-access/route.ts.
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [used, draftCount] = await Promise.all([
      prisma.aiToolGeneration.count({
        where: {
          user_id: userId,
          tool_slug: VISUALISE_TOOL_SLUG,
          created_at: { gte: periodStart, lte: periodEnd },
          status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
        },
      }),
      prisma.visualiseDocument.count({
        where: { user_id: userId },
      }),
    ]);

    const remaining = Math.max(0, limit - used);

    const body: AccessResponse = {
      allowed: limit > 0 && remaining > 0,
      tier,
      limit,
      used,
      remaining,
      draftCount,
      draftLimit: VISUALISE_DRAFT_CAP,
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error('Visualise access check error:', error);
    // Fail closed — safer than exposing internal error detail.
    const body: AccessResponse = {
      allowed: false,
      tier: 'FREE',
      limit: 0,
      used: 0,
      remaining: 0,
      draftCount: 0,
      draftLimit: VISUALISE_DRAFT_CAP,
    };
    return NextResponse.json(body);
  }
}
