import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAiToolLimitByTier, getGlobalAiLimitByTier } from '@/lib/ai-tools/constants';
import prisma from '@/lib/prisma';
import { resolveEffectiveTier } from '@/lib/payments/resolve-tier';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ allowed: false, limit: 0, tier: 'NONE' });
    }

    const toolSlug = req.nextUrl.searchParams.get('tool');
    if (!toolSlug) {
      return NextResponse.json({ error: 'Missing tool parameter' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { user_id: session.user.id },
    });

    const tier = resolveEffectiveTier(subscription);

    // Per-tool restriction check (returns 0 if tool is restricted on this tier)
    const toolLimit = getAiToolLimitByTier(tier, toolSlug);

    // Global cap for this tier
    const globalLimit = getGlobalAiLimitByTier(tier);

    // Global usage count this month
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const usedThisMonth = await (prisma as any).aiToolGeneration.count({
      where: {
        user_id: session.user.id,
        created_at: { gte: periodStart, lte: periodEnd },
        status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
      },
    });

    return NextResponse.json({
      allowed: toolLimit > 0 && usedThisMonth < globalLimit,
      limit: globalLimit,
      used: usedThisMonth,
      remaining: Math.max(0, globalLimit - usedThisMonth),
      tier,
    });
  } catch {
    return NextResponse.json({ allowed: false, limit: 0, tier: 'FREE' });
  }
}
