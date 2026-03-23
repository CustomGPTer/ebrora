import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { getSubscriptionDetails } from '@/lib/payments/paypal-client';

/**
 * POST /api/admin/fix-subscription
 *
 * Syncs a user's subscription record with the actual PayPal state.
 * Body: { email: string }
 *
 * 1. Looks up the user by email
 * 2. If they have a paypal_subscription_id, queries PayPal for the real status
 * 3. Updates the DB record to match PayPal's truth
 *
 * Requires ADMIN role.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { email } = (await request.json()) as { email?: string };

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sub = user.subscription;

    if (!sub || !sub.paypal_subscription_id) {
      return NextResponse.json({
        error: 'No PayPal subscription ID on record for this user',
        currentRecord: sub
          ? { tier: sub.tier, status: sub.status, paypalId: sub.paypal_subscription_id }
          : null,
      }, { status: 404 });
    }

    // Query PayPal for the real subscription state
    const paypalDetails = await getSubscriptionDetails(sub.paypal_subscription_id);

    const paypalStatus = paypalDetails.status; // ACTIVE, CANCELLED, SUSPENDED, etc.
    const planId = paypalDetails.plan_id;

    // Determine tier from plan ID
    let tier: 'STANDARD' | 'PROFESSIONAL' = 'STANDARD';
    const premiumMonthly = process.env.PAYPAL_PLAN_PREMIUM_MONTHLY || '';
    const premiumYearly = process.env.PAYPAL_PLAN_PREMIUM_YEARLY || '';
    if (planId === premiumMonthly || planId === premiumYearly) {
      tier = 'PROFESSIONAL';
    }

    // Map PayPal status to our DB status
    let dbStatus: string;
    if (paypalStatus === 'ACTIVE' || paypalStatus === 'APPROVED') {
      dbStatus = 'ACTIVE';
    } else if (paypalStatus === 'CANCELLED') {
      dbStatus = 'CANCELLED';
    } else if (paypalStatus === 'SUSPENDED') {
      dbStatus = 'PAST_DUE';
    } else {
      dbStatus = paypalStatus;
    }

    // Update the DB record to match PayPal's truth
    const updated = await prisma.subscription.update({
      where: { user_id: user.id },
      data: {
        tier: dbStatus === 'ACTIVE' ? tier : sub.tier,
        status: dbStatus,
        current_period_start: paypalDetails.billing_info?.last_payment?.time
          ? new Date(paypalDetails.billing_info.last_payment.time)
          : sub.current_period_start,
        current_period_end: paypalDetails.billing_info?.next_billing_time
          ? new Date(paypalDetails.billing_info.next_billing_time)
          : sub.current_period_end,
      },
    });

    // Also fix usage record
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const ramsLimit = tier === 'PROFESSIONAL' ? 25 : 10;

    const existingUsage = await prisma.usageRecord.findFirst({
      where: { user_id: user.id, billing_period_start: monthStart },
    });

    if (existingUsage) {
      await prisma.usageRecord.update({
        where: { id: existingUsage.id },
        data: { rams_limit: ramsLimit },
      });
    } else {
      await prisma.usageRecord.create({
        data: {
          user_id: user.id,
          billing_period_start: monthStart,
          billing_period_end: monthEnd,
          rams_generated: 0,
          rams_limit: ramsLimit,
        },
      });
    }

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
      paypal: {
        status: paypalStatus,
        planId,
        nextBillingTime: paypalDetails.billing_info?.next_billing_time,
      },
    });
  } catch (error) {
    console.error('Fix subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fix subscription' },
      { status: 500 }
    );
  }
}
