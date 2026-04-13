import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { createSubscription, reviseSubscription } from '@/lib/payments/paypal-client';
import { getPlanConfigByKey } from '@/lib/payments/plan-config';
import { validateOrigin } from '@/lib/csrf';
import prisma from '@/lib/prisma';

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

    const body = (await request.json()) as { planKey?: string };
    const { planKey } = body;

    if (!planKey) {
      return NextResponse.json(
        { error: 'Missing planKey' },
        { status: 400 }
      );
    }

    // Look up the plan configuration
    const planConfig = getPlanConfigByKey(planKey);

    if (!planConfig) {
      return NextResponse.json(
        { error: `Invalid plan: ${planKey}` },
        { status: 400 }
      );
    }

    if (!planConfig.paypalPlanId) {
      return NextResponse.json(
        { error: 'PayPal plan ID not configured for this plan' },
        { status: 500 }
      );
    }

    // Check for an existing active subscription
    const existingSub = await prisma.subscription.findUnique({
      where: { user_id: session.user.id },
      select: {
        paypal_subscription_id: true,
        stripe_subscription_id: true,
        payment_provider: true,
        status: true,
        tier: true,
        current_period_end: true,
      },
    });

    // Block cross-provider: if user has active Stripe sub, don't allow PayPal
    if (
      existingSub &&
      existingSub.status === 'ACTIVE' &&
      existingSub.tier !== 'FREE' &&
      existingSub.payment_provider === 'STRIPE' &&
      existingSub.stripe_subscription_id
    ) {
      const endDate = existingSub.current_period_end
        ? existingSub.current_period_end.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'the end of your billing period';

      return NextResponse.json(
        {
          error: `You have an active card subscription. Cancel it first from your account page. You'll keep access until ${endDate}, then you can resubscribe with PayPal.`,
        },
        { status: 409 }
      );
    }

    // If user has an active subscription with a PayPal ID, revise it
    // instead of creating a new one (prevents "pre-approved payments" error)
    if (
      existingSub &&
      existingSub.paypal_subscription_id &&
      existingSub.status === 'ACTIVE' &&
      existingSub.tier !== 'FREE'
    ) {
      const { approvalUrl } = await reviseSubscription(
        existingSub.paypal_subscription_id,
        planConfig.paypalPlanId
      );

      return NextResponse.json({ approvalUrl });
    }

    // No existing active subscription — create a new one
    const { approvalUrl } = await createSubscription(
      planConfig.paypalPlanId,
      session.user.id
    );

    return NextResponse.json({ approvalUrl });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
