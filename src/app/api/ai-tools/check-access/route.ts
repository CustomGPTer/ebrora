import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAiToolLimitByTier } from '@/lib/ai-tools/constants';
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
    const limit = getAiToolLimitByTier(tier, toolSlug);

    return NextResponse.json({
      allowed: limit > 0,
      limit,
      tier,
    });
  } catch {
    return NextResponse.json({ allowed: false, limit: 0, tier: 'FREE' });
  }
}
