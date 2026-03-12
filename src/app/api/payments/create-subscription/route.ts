import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { cancelSubscription } from '@/lib/payments/paypal-client';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { user_id: session.user.id },
    });

    if (!subscription || !subscription.paypal_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { reason?: string };
    const reason = body.reason || 'User requested cancellation';

    // Cancel subscription with PayPal
    const cancelled = await cancelSubscription(subscription.paypal_subscription_id, reason);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Failed to cancel subscription with PayPal' },
        { status: 500 }
      );
    }

    // Update subscription record
    await prisma.subscription.update({
      where: { user_id: session.user.id },
      data: {
        status: 'CANCELLED',
        tier: 'FREE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
