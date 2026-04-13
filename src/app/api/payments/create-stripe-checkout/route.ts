import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { createCheckoutSession } from '@/lib/payments/stripe-client';
import { getPlanConfigByKey, getStripePriceId } from '@/lib/payments/plan-config';
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

    const stripePriceId = getStripePriceId(planKey);

    if (!stripePriceId) {
      return NextResponse.json(
        { error: 'Stripe price ID not configured for this plan' },
        { status: 500 }
      );
    }

    // Block cross-provider: if user has active PayPal sub, don't allow Stripe
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

    if (
      existingSub &&
      existingSub.status === 'ACTIVE' &&
      existingSub.tier !== 'FREE' &&
      existingSub.payment_provider === 'PAYPAL' &&
      existingSub.paypal_subscription_id
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
          error: `You have an active PayPal subscription. Cancel it first from your account page. You'll keep access until ${endDate}, then you can resubscribe with card.`,
        },
        { status: 409 }
      );
    }

    // If user has an active Stripe sub, update it instead of creating a new one
    if (
      existingSub &&
      existingSub.stripe_subscription_id &&
      existingSub.status === 'ACTIVE' &&
      existingSub.tier !== 'FREE' &&
      existingSub.payment_provider === 'STRIPE'
    ) {
      const { updateStripeSubscription } = await import(
        '@/lib/payments/stripe-client'
      );
      const updated = await updateStripeSubscription(
        existingSub.stripe_subscription_id,
        stripePriceId
      );

      // Update DB immediately (webhook will also fire, idempotent)
      const { resolveTierFromStripePriceId } = await import(
        '@/lib/payments/plan-config'
      );
      const { upsertUsageRecord } = await import(
        '@/lib/payments/usage-tracker'
      );
      const newTier = resolveTierFromStripePriceId(updated.priceId);

      if (newTier) {
        await prisma.subscription.update({
          where: { user_id: session.user.id },
          data: {
            tier: newTier,
            current_period_end: updated.currentPeriodEnd,
            current_period_start: updated.currentPeriodStart,
          },
        });

        await upsertUsageRecord(session.user.id, newTier);
      }

      return NextResponse.json({ updated: true, tier: newTier });
    }

    // No existing active subscription — create Stripe Checkout Session
    const userEmail = (session.user as any).email || '';
    const { checkoutUrl } = await createCheckoutSession(
      stripePriceId,
      session.user.id,
      userEmail
    );

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('Create Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
