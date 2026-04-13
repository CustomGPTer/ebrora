import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { getUserUsage } from '@/lib/payments/usage-tracker';
import { getSubscriptionDetails } from '@/lib/payments/paypal-client';
import { getStripeSubscriptionDetails } from '@/lib/payments/stripe-client';
import { resolveBillingFromPlanId, resolveBillingFromStripePriceId } from '@/lib/payments/plan-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { user_id: session.user.id },
    });

    const tier = subscription?.tier || 'FREE';
    const status = subscription?.status || 'ACTIVE';
    const paymentProvider = subscription?.payment_provider || null;

    // Get usage information
    const usage = await getUserUsage(session.user.id);

    // Calculate renewal date from subscription period
    let renewalDate: string | null = null;
    if (subscription?.current_period_end && status === 'ACTIVE') {
      renewalDate = subscription.current_period_end.toISOString();
    }

    // Determine billing cycle from provider
    let billing = 'MONTHLY';
    if (status === 'ACTIVE') {
      if (paymentProvider === 'STRIPE' && subscription?.stripe_subscription_id) {
        try {
          const details = await getStripeSubscriptionDetails(subscription.stripe_subscription_id);
          billing = resolveBillingFromStripePriceId(details.priceId);
        } catch {
          // If we can't reach Stripe, default to MONTHLY — non-critical
        }
      } else if (subscription?.paypal_subscription_id) {
        try {
          const details = await getSubscriptionDetails(subscription.paypal_subscription_id);
          billing = resolveBillingFromPlanId(details.plan_id);
        } catch {
          // If we can't reach PayPal, default to MONTHLY — non-critical
        }
      }
    }

    return NextResponse.json({
      tier,
      status,
      billing,
      paymentProvider,
      ramsUsed: usage.used,
      ramsLimit: usage.limit,
      renewalDate,
      subscriptionId: subscription?.paypal_subscription_id || subscription?.stripe_subscription_id || null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
