import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { validateOrigin } from '@/lib/csrf';
import prisma from '@/lib/prisma';
import { getRamsLimitByTier } from '@/lib/payments/plan-config';

/**
 * POST /api/admin/grant-plan
 *
 * Directly sets a user's subscription tier and status without PayPal.
 * Use case: granting the site owner (or testers) a plan for free.
 * Requires ADMIN role + origin validation.
 *
 * Body: { email: string, tier?: "STARTER" | "PROFESSIONAL" | "UNLIMITED", status?: "ACTIVE" | "CANCELLED" }
 * Defaults: tier = "UNLIMITED", status = "ACTIVE"
 */

const VALID_TIERS = ['FREE', 'STARTER', 'STANDARD', 'PROFESSIONAL', 'UNLIMITED'] as const;
const VALID_STATUSES = ['ACTIVE', 'CANCELLED', 'PAST_DUE', 'EXPIRED'] as const;

export async function POST(request: NextRequest) {
  try {
    // ── CSRF check ──
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    // ── Admin auth check ──
    const session = await requireAdmin();
    const adminEmail = (session.user as any)?.email || 'unknown';

    // ── Parse & validate input ──
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
    const tier = typeof body.tier === 'string' ? body.tier.toUpperCase().trim() : 'UNLIMITED';
    const status = typeof body.status === 'string' ? body.status.toUpperCase().trim() : 'ACTIVE';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    if (!VALID_TIERS.includes(tier as any)) {
      return NextResponse.json(
        { error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as any)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // ── Lookup user ──
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const previousTier = user.subscription?.tier || 'NONE';
    const previousStatus = user.subscription?.status || 'NONE';

    const now = new Date();
    // Far-future expiry so admin-granted plans never lapse
    const farFuture = new Date('2099-12-31T23:59:59Z');

    // ── Upsert subscription ──
    const subscription = await prisma.subscription.upsert({
      where: { user_id: user.id },
      update: {
        tier: tier as any,
        status: status as any,
        current_period_start: now,
        current_period_end: farFuture,
        // paypal_subscription_id left untouched (null for admin-granted)
      },
      create: {
        user_id: user.id,
        tier: tier as any,
        status: status as any,
        current_period_start: now,
        current_period_end: farFuture,
      },
    });

    // ── Upsert RAMS usage record for current month ──
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const ramsLimit = getRamsLimitByTier(tier);

    await prisma.usageRecord.upsert({
      where: {
        user_id_billing_period_start: {
          user_id: user.id,
          billing_period_start: monthStart,
        },
      },
      update: { rams_limit: ramsLimit },
      create: {
        user_id: user.id,
        billing_period_start: monthStart,
        billing_period_end: monthEnd,
        rams_generated: 0,
        rams_limit: ramsLimit,
      },
    });

    // ── Audit log (server-side only) ──
    console.log(
      `[ADMIN GRANT-PLAN] Admin "${adminEmail}" granted "${tier}/${status}" to "${email}" (was "${previousTier}/${previousStatus}")`
    );

    return NextResponse.json({
      success: true,
      user: { email: user.email, name: user.name },
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        paypalSubscriptionId: subscription.paypal_subscription_id || null,
      },
      previous: {
        tier: previousTier,
        status: previousStatus,
      },
      ramsLimit,
    });
  } catch (error) {
    console.error('Grant plan error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to grant plan' },
      { status: 500 }
    );
  }
}
