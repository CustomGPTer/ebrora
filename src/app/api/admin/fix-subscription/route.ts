import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { getSubscriptionDetails } from '@/lib/payments/paypal-client';
import { getStripeSubscriptionDetails } from '@/lib/payments/stripe-client';
import { resolveTierFromPlanId, resolveTierFromStripePriceId } from '@/lib/payments/plan-config';
import { upsertUsageRecord } from '@/lib/payments/usage-tracker';
import type { SubscriptionTier } from '@prisma/client';

/**
 * POST /api/admin/fix-subscription  { email: string }
 *
 * Syncs a user's subscription record with the actual provider (PayPal or Stripe) state.
 * Requires ADMIN role. POST-only — state-changing operations must not be GET.
 */

async function fixSubscription(email: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { subscription: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const sub = user.subscription;

  if (!sub) {
    return NextResponse.json({
      error: 'No subscription record for this user',
      currentRecord: null,
    }, { status: 404 });
  }

  let tier: SubscriptionTier;
  let dbStatus: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED';
  let periodStart: Date | undefined;
  let periodEnd: Date | undefined;
  let providerInfo: Record<string, unknown>;

  // ── Stripe path ──
  if (sub.payment_provider === 'STRIPE' && sub.stripe_subscription_id) {
    const stripeDetails = await getStripeSubscriptionDetails(sub.stripe_subscription_id);

    const resolvedTier = resolveTierFromStripePriceId(stripeDetails.priceId);
    tier = resolvedTier || 'STARTER';

    // Map Stripe status to our DB status
    if (stripeDetails.status === 'active') {
      dbStatus = stripeDetails.cancelAtPeriodEnd ? 'CANCELLED' : 'ACTIVE';
    } else if (stripeDetails.status === 'past_due') {
      dbStatus = 'PAST_DUE';
    } else if (stripeDetails.status === 'canceled' || stripeDetails.status === 'unpaid') {
      dbStatus = 'EXPIRED';
    } else {
      dbStatus = 'ACTIVE';
    }

    periodStart = stripeDetails.currentPeriodStart;
    periodEnd = stripeDetails.currentPeriodEnd;

    providerInfo = {
      provider: 'STRIPE',
      status: stripeDetails.status,
      priceId: stripeDetails.priceId,
      resolvedTier: resolvedTier || 'UNKNOWN (defaulted to STARTER)',
      currentPeriodEnd: stripeDetails.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: stripeDetails.cancelAtPeriodEnd,
    };

  // ── PayPal path (existing) ──
  } else if (sub.paypal_subscription_id) {
    const paypalDetails = await getSubscriptionDetails(sub.paypal_subscription_id);

    const paypalStatus = paypalDetails.status;
    const planId = paypalDetails.plan_id;
    const resolvedTier = resolveTierFromPlanId(planId);
    tier = resolvedTier || 'STARTER';

    if (paypalStatus === 'ACTIVE' || paypalStatus === 'APPROVED') {
      dbStatus = 'ACTIVE';
    } else if (paypalStatus === 'CANCELLED') {
      dbStatus = 'CANCELLED';
    } else if (paypalStatus === 'SUSPENDED') {
      dbStatus = 'PAST_DUE';
    } else {
      dbStatus = 'EXPIRED';
    }

    periodStart = paypalDetails.billing_info?.last_payment?.time
      ? new Date(paypalDetails.billing_info.last_payment.time)
      : undefined;
    periodEnd = paypalDetails.billing_info?.next_billing_time
      ? new Date(paypalDetails.billing_info.next_billing_time)
      : undefined;

    providerInfo = {
      provider: 'PAYPAL',
      status: paypalStatus,
      planId,
      resolvedTier: resolvedTier || 'UNKNOWN (defaulted to STARTER)',
      nextBillingTime: paypalDetails.billing_info?.next_billing_time,
    };

  } else {
    return NextResponse.json({
      error: 'No provider subscription ID on record for this user',
      currentRecord: {
        tier: sub.tier,
        status: sub.status,
        provider: sub.payment_provider,
        paypalId: sub.paypal_subscription_id,
        stripeId: sub.stripe_subscription_id,
      },
    }, { status: 404 });
  }

  // Update the DB record to match provider's truth
  const updated = await prisma.subscription.update({
    where: { user_id: user.id },
    data: {
      tier: dbStatus === 'ACTIVE' ? tier : sub.tier,
      status: dbStatus,
      ...(periodStart ? { current_period_start: periodStart } : {}),
      ...(periodEnd ? { current_period_end: periodEnd } : {}),
    },
  });

  // Also fix usage record
  await upsertUsageRecord(user.id, tier);

  return NextResponse.json({
    success: true,
    before: {
      tier: sub.tier,
      status: sub.status,
    },
    after: {
      tier: updated.tier,
      status: updated.status,
      currentPeriodEnd: updated.current_period_end,
    },
    provider: providerInfo,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }
    return await fixSubscription(email);
  } catch (error) {
    console.error('Fix subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fix subscription' },
      { status: 500 }
    );
  }
}
