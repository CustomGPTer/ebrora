import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { getSubscriptionDetails } from '@/lib/payments/paypal-client';
import { resolveTierFromPlanId, getRamsLimitByTier } from '@/lib/payments/plan-config';
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

    const { subscriptionId } = (await request.json()) as { subscriptionId?: string };
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
    }

    // Verify with PayPal
    const details = await getSubscriptionDetails(subscriptionId);

    if (details.status !== 'ACTIVE' && details.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Subscription not active', status: details.status }, { status: 400 });
    }

    // Ownership check: the PayPal subscription's custom_id must match the logged-in user.
    // Prevents an attacker from binding someone else's subscription to their own account.
    if (details.custom_id !== session.user.id) {
      console.warn(
        `Verify ownership mismatch: session user ${session.user.id} tried to claim sub with custom_id ${details.custom_id}`
      );
      return NextResponse.json(
        { error: 'Subscription does not belong to this account' },
        { status: 403 }
      );
    }

    // Determine tier from plan ID using shared resolver
    const planId = details.plan_id;
    const tier = resolveTierFromPlanId(planId);

    if (!tier) {
      console.error(`Verify failed: unknown PayPal plan ID ${planId} for subscription ${subscriptionId}`);
      return NextResponse.json(
        { error: 'Unknown subscription plan. Please contact support.' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Fetch period end from PayPal
    const periodEnd = details.billing_info?.next_billing_time
      ? new Date(details.billing_info.next_billing_time)
      : undefined;

    // Upsert subscription
    await prisma.subscription.upsert({
      where: { user_id: userId },
      update: {
        tier,
        status: 'ACTIVE',
        paypal_subscription_id: subscriptionId,
        current_period_start: new Date(),
        ...(periodEnd ? { current_period_end: periodEnd } : {}),
      },
      create: {
        user_id: userId,
        tier,
        status: 'ACTIVE',
        paypal_subscription_id: subscriptionId,
        current_period_start: new Date(),
        ...(periodEnd ? { current_period_end: periodEnd } : {}),
      },
    });

    // Update usage record
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

    return NextResponse.json({ success: true, tier });
  } catch (error) {
    console.error('Verify subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to verify subscription' },
      { status: 500 }
    );
  }
}
