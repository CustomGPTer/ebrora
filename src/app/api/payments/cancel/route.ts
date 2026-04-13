import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { cancelSubscription } from '@/lib/payments/paypal-client';
import { cancelStripeSubscription } from '@/lib/payments/stripe-client';
import prisma from '@/lib/prisma';
import { validateOrigin } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    // CSRF check
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { user_id: session.user.id },
      select: {
        paypal_subscription_id: true,
        stripe_subscription_id: true,
        payment_provider: true,
        status: true,
        tier: true,
      },
    });

    if (!subscription || subscription.status === 'EXPIRED' || subscription.tier === 'FREE') {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    let reason = 'User requested cancellation';
    try {
      const body = (await request.json()) as { reason?: string };
      if (body.reason) reason = body.reason;
    } catch {
      // Empty or malformed body is fine — use default reason
    }

    // ── Branch on payment provider ──

    if (subscription.payment_provider === 'STRIPE' && subscription.stripe_subscription_id) {
      // Stripe: cancel at period end (user keeps access until then)
      const cancelled = await cancelStripeSubscription(subscription.stripe_subscription_id);

      if (!cancelled) {
        return NextResponse.json(
          { error: 'Failed to cancel subscription with Stripe' },
          { status: 500 }
        );
      }
    } else if (subscription.paypal_subscription_id) {
      // PayPal: existing flow
      const cancelled = await cancelSubscription(subscription.paypal_subscription_id, reason);

      if (!cancelled) {
        return NextResponse.json(
          { error: 'Failed to cancel subscription with PayPal' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Update subscription record — keep tier intact until period ends.
    // Both providers' webhooks will handle the final state change.
    await prisma.subscription.update({
      where: { user_id: session.user.id },
      data: {
        status: 'CANCELLED',
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
