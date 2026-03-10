import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { getUserUsage } from '@/lib/payments/usage-tracker';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        paypalSubscriptionId: true,
        subscriptionActivatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tier = user.subscriptionTier || 'FREE';
    const status = user.subscriptionStatus || 'NONE';

    // Get usage information
    const usage = await getUserUsage(session.user.id);

    // Calculate renewal date (30 days from subscription activation)
    let renewalDate: string | null = null;
    if (user.subscriptionActivatedAt && status === 'ACTIVE') {
      const renewal = new Date(user.subscriptionActivatedAt);
      renewal.setMonth(renewal.getMonth() + 1);
      renewalDate = renewal.toISOString();
    }

    // Determine billing cycle
    let billing = 'MONTHLY';
    // This would need to be stored in the database for accurate tracking
    // For now, default to MONTHLY

    return NextResponse.json({
      tier,
      status,
      billing,
      ramsUsed: usage.used,
      ramsLimit: usage.limit,
      renewalDate,
      subscriptionId: user.paypalSubscriptionId || null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
