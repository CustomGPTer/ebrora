import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { getSubscriptionDetails } from '@/lib/payments/paypal-client';
import { getCheckoutSession, getStripeSubscriptionDetails } from '@/lib/payments/stripe-client';
import { resolveTierFromPlanId, resolveTierFromStripePriceId, getRamsLimitByTier } from '@/lib/payments/plan-config';
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

    const body = (await request.json()) as {
      subscriptionId?: string;
      stripeSessionId?: string;
    };

    const userId = session.user.id;

    // ── Stripe verification path ──
    if (body.stripeSessionId) {
      return await verifyStripeSession(body.stripeSessionId, userId);
    }

    // ── PayPal verification path (existing) ──
    if (body.subscriptionId) {
      return await verifyPayPalSubscription(body.subscriptionId, userId);
    }

    return NextResponse.json({ error: 'Missing subscriptionId or stripeSessionId' }, { status: 400 });
  } catch (error) {
    console.error('Verify subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to verify subscription' },
      { status: 500 }
    );
  }
}

// ── Stripe verify ──

async function verifyStripeSession(sessionId: string, userId: string) {
  const checkoutSession = await getCheckoutSession(sessionId);

  // Ownership check: client_reference_id must match logged-in user
  if (checkoutSession.client_reference_id !== userId) {
    console.warn(
      `Stripe verify ownership mismatch: session user ${userId} vs checkout ref ${checkoutSession.client_reference_id}`
    );
    return NextResponse.json(
      { error: 'Session does not belong to this account' },
      { status: 403 }
    );
  }

  if (checkoutSession.payment_status !== 'paid') {
    return NextResponse.json(
      { error: 'Payment not completed', status: checkoutSession.payment_status },
      { status: 400 }
    );
  }

  // Get subscription ID from the checkout session
  const stripeSubId =
    typeof checkoutSession.subscription === 'string'
      ? checkoutSession.subscription
      : (checkoutSession.subscription as any)?.id;

  const stripeCustomerId =
    typeof checkoutSession.customer === 'string'
      ? checkoutSession.customer
      : (checkoutSession.customer as any)?.id;

  if (!stripeSubId) {
    return NextResponse.json(
      { error: 'No subscription found in checkout session' },
      { status: 400 }
    );
  }

  // Fetch subscription details for tier + period
  const details = await getStripeSubscriptionDetails(stripeSubId);
  const tier = resolveTierFromStripePriceId(details.priceId);

  if (!tier) {
    console.error(`Stripe verify failed: unknown price ${details.priceId} for session ${sessionId}`);
    return NextResponse.json(
      { error: 'Unknown subscription plan. Please contact support.' },
      { status: 400 }
    );
  }

  // Upsert subscription
  await prisma.subscription.upsert({
    where: { user_id: userId },
    update: {
      tier,
      status: 'ACTIVE',
      payment_provider: 'STRIPE',
      stripe_subscription_id: stripeSubId,
      stripe_customer_id: stripeCustomerId || undefined,
      current_period_start: details.currentPeriodStart,
      current_period_end: details.currentPeriodEnd,
      paypal_subscription_id: null,
    },
    create: {
      user_id: userId,
      tier,
      status: 'ACTIVE',
      payment_provider: 'STRIPE',
      stripe_subscription_id: stripeSubId,
      stripe_customer_id: stripeCustomerId || undefined,
      current_period_start: details.currentPeriodStart,
      current_period_end: details.currentPeriodEnd,
    },
  });

  await upsertUsageRecord(userId, tier);

  return NextResponse.json({ success: true, tier });
}

// ── PayPal verify (unchanged logic) ──

async function verifyPayPalSubscription(subscriptionId: string, userId: string) {
  const details = await getSubscriptionDetails(subscriptionId);

  if (details.status !== 'ACTIVE' && details.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Subscription not active', status: details.status }, { status: 400 });
  }

  // Ownership check
  if (details.custom_id !== userId) {
    console.warn(
      `Verify ownership mismatch: session user ${userId} tried to claim sub with custom_id ${details.custom_id}`
    );
    return NextResponse.json(
      { error: 'Subscription does not belong to this account' },
      { status: 403 }
    );
  }

  const planId = details.plan_id;
  const tier = resolveTierFromPlanId(planId);

  if (!tier) {
    console.error(`Verify failed: unknown PayPal plan ID ${planId} for subscription ${subscriptionId}`);
    return NextResponse.json(
      { error: 'Unknown subscription plan. Please contact support.' },
      { status: 400 }
    );
  }

  const periodEnd = details.billing_info?.next_billing_time
    ? new Date(details.billing_info.next_billing_time)
    : undefined;

  await prisma.subscription.upsert({
    where: { user_id: userId },
    update: {
      tier,
      status: 'ACTIVE',
      payment_provider: 'PAYPAL',
      paypal_subscription_id: subscriptionId,
      current_period_start: new Date(),
      ...(periodEnd ? { current_period_end: periodEnd } : {}),
    },
    create: {
      user_id: userId,
      tier,
      status: 'ACTIVE',
      payment_provider: 'PAYPAL',
      paypal_subscription_id: subscriptionId,
      current_period_start: new Date(),
      ...(periodEnd ? { current_period_end: periodEnd } : {}),
    },
  });

  await upsertUsageRecord(userId, tier);

  return NextResponse.json({ success: true, tier });
}

// ── Shared helper ──

async function upsertUsageRecord(userId: string, tier: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const ramsLimit = getRamsLimitByTier(tier);

  const existingUsage = await prisma.usageRecord.findFirst({
    where: { user_id: userId, billing_period_start: monthStart },
  });

  if (existingUsage) {
    await prisma.usageRecord.update({
      where: { id: existingUsage.id },
      data: { rams_limit: ramsLimit },
    });
  } else {
    await prisma.usageRecord.create({
      data: {
        user_id: userId,
        billing_period_start: monthStart,
        billing_period_end: monthEnd,
        rams_generated: 0,
        rams_limit: ramsLimit,
      },
    });
  }
}
