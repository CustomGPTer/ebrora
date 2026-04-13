import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { constructWebhookEvent } from '@/lib/payments/stripe-client';
import {
  resolveTierFromStripePriceId,
  getRamsLimitByTier,
} from '@/lib/payments/plan-config';
import { sendSubscriptionConfirmationEmail } from '@/lib/email';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.warn('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Validate webhook signature
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (error) {
      console.warn('Invalid Stripe webhook signature:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Idempotency: reject duplicate webhook deliveries
    const eventId = event.id;
    try {
      const alreadyProcessed = await prisma.webhookEvent.findUnique({
        where: { transmission_id: eventId },
      });

      if (alreadyProcessed) {
        console.log(`Duplicate Stripe webhook ${eventId} (${event.type}) — skipping`);
        return NextResponse.json({ received: true });
      }
    } catch (dedupeError) {
      console.warn('Stripe webhook dedup check failed, continuing:', dedupeError);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }
      case 'invoice.paid': {
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      }
      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }
      default:
        console.log(`Unhandled Stripe webhook event: ${event.type}`);
    }

    // Record this event so duplicate deliveries are skipped
    try {
      await prisma.webhookEvent.create({
        data: {
          transmission_id: eventId,
          event_type: event.type,
          source: 'STRIPE',
        },
      });
    } catch (dedupeError) {
      console.log(`Stripe webhook event ${eventId} already recorded (race)`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ── Helpers ──

function getUserIdFromMetadata(metadata: Stripe.Metadata | null): string | null {
  return metadata?.userId || null;
}

function getPriceIdFromSubscription(subscription: Stripe.Subscription): string | null {
  const item = subscription.items?.data?.[0];
  return item?.price?.id || null;
}

function getPeriodFromSubscription(subscription: Stripe.Subscription): {
  start: Date;
  end: Date;
} {
  const item = subscription.items?.data?.[0];
  return {
    start: new Date((item?.current_period_start || 0) * 1000),
    end: new Date((item?.current_period_end || 0) * 1000),
  };
}

async function upsertUsageRecord(
  userId: string,
  tier: string
): Promise<void> {
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

// ── Checkout completed — new subscription activated ──

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  try {
    const userId = getUserIdFromMetadata(session.metadata);
    if (!userId) {
      console.warn('No userId in Stripe checkout metadata');
      return;
    }

    // session.subscription can be string or object depending on expansion
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as any)?.id;

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : (session.customer as any)?.id;

    if (!subscriptionId) {
      console.warn('No subscription ID in checkout session');
      return;
    }

    // Fetch full subscription to get price and period
    const { getStripeSubscriptionDetails } = await import(
      '@/lib/payments/stripe-client'
    );
    const details = await getStripeSubscriptionDetails(subscriptionId);

    const tier = resolveTierFromStripePriceId(details.priceId);
    if (!tier) {
      console.error(`Unknown Stripe price ${details.priceId} in checkout for user ${userId}`);
      return;
    }

    // Upsert subscription in DB
    await prisma.subscription.upsert({
      where: { user_id: userId },
      update: {
        tier,
        status: 'ACTIVE',
        payment_provider: 'STRIPE',
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId || undefined,
        current_period_start: details.currentPeriodStart,
        current_period_end: details.currentPeriodEnd,
        // Clear PayPal fields if switching provider
        paypal_subscription_id: null,
      },
      create: {
        user_id: userId,
        tier,
        status: 'ACTIVE',
        payment_provider: 'STRIPE',
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId || undefined,
        current_period_start: details.currentPeriodStart,
        current_period_end: details.currentPeriodEnd,
      },
    });

    await upsertUsageRecord(userId, tier);

    // Send confirmation email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user) {
      try {
        await sendSubscriptionConfirmationEmail(user.email, tier);
      } catch (emailError) {
        console.error('Failed to send Stripe confirmation email:', emailError);
      }
    }

    console.log(`Stripe checkout completed for user ${userId} (tier: ${tier}, sub: ${subscriptionId})`);
  } catch (error) {
    console.error('Error handling Stripe checkout completed:', error);
    throw error;
  }
}

// ── Subscription updated — upgrade, downgrade, or cancel_at_period_end ──

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    const subscriptionId = subscription.id;

    // Find user by stripe_subscription_id
    const existingSub = await prisma.subscription.findFirst({
      where: { stripe_subscription_id: subscriptionId },
    });

    if (!existingSub) {
      console.log(`No DB record for Stripe sub ${subscriptionId} — ignoring update`);
      return;
    }

    const priceId = getPriceIdFromSubscription(subscription);
    const period = getPeriodFromSubscription(subscription);

    // Handle cancel_at_period_end
    if (subscription.cancel_at_period_end) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          status: 'CANCELLED',
          current_period_end: period.end,
        },
      });
      console.log(`Stripe sub ${subscriptionId} set to cancel at period end for user ${existingSub.user_id}`);
      return;
    }

    // Handle plan change (upgrade/downgrade)
    if (priceId) {
      const tier = resolveTierFromStripePriceId(priceId);
      if (tier) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            tier,
            status: 'ACTIVE',
            current_period_start: period.start,
            current_period_end: period.end,
          },
        });

        await upsertUsageRecord(existingSub.user_id, tier);

        console.log(`Stripe sub ${subscriptionId} updated to ${tier} for user ${existingSub.user_id}`);
      }
    }
  } catch (error) {
    console.error('Error handling Stripe subscription updated:', error);
    throw error;
  }
}

// ── Subscription deleted — fully cancelled or all retries failed ──

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    const subscriptionId = subscription.id;

    const existingSub = await prisma.subscription.findFirst({
      where: { stripe_subscription_id: subscriptionId },
    });

    if (!existingSub) {
      console.log(`No DB record for deleted Stripe sub ${subscriptionId} — ignoring`);
      return;
    }

    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'EXPIRED',
        tier: 'FREE',
      },
    });

    console.log(`Stripe sub ${subscriptionId} deleted — user ${existingSub.user_id} downgraded to FREE`);
  } catch (error) {
    console.error('Error handling Stripe subscription deleted:', error);
    throw error;
  }
}

// ── Invoice paid — renewal succeeded ──

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  try {
    // In Stripe API dahlia, subscription is under invoice.parent.subscription_details
    const subRef = invoice.parent?.subscription_details?.subscription;
    const subscriptionId =
      typeof subRef === 'string'
        ? subRef
        : (subRef as any)?.id;

    if (!subscriptionId) return;

    const existingSub = await prisma.subscription.findFirst({
      where: { stripe_subscription_id: subscriptionId },
    });

    if (!existingSub) {
      console.log(`No DB record for Stripe invoice sub ${subscriptionId}`);
      return;
    }

    // Fetch updated period from Stripe
    const { getStripeSubscriptionDetails } = await import(
      '@/lib/payments/stripe-client'
    );
    const details = await getStripeSubscriptionDetails(subscriptionId);

    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'ACTIVE',
        current_period_start: details.currentPeriodStart,
        current_period_end: details.currentPeriodEnd,
      },
    });

    console.log(`Stripe invoice paid — sub ${subscriptionId} renewed for user ${existingSub.user_id}`);
  } catch (error) {
    console.error('Error handling Stripe invoice paid:', error);
    throw error;
  }
}

// ── Invoice payment failed — card declined ──

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  try {
    const subRef = invoice.parent?.subscription_details?.subscription;
    const subscriptionId =
      typeof subRef === 'string'
        ? subRef
        : (subRef as any)?.id;

    if (!subscriptionId) return;

    const existingSub = await prisma.subscription.findFirst({
      where: { stripe_subscription_id: subscriptionId },
    });

    if (!existingSub) {
      console.log(`No DB record for failed Stripe invoice sub ${subscriptionId}`);
      return;
    }

    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'PAST_DUE',
      },
    });

    console.log(`Stripe payment failed — sub ${subscriptionId} now PAST_DUE for user ${existingSub.user_id}`);
  } catch (error) {
    console.error('Error handling Stripe invoice payment failed:', error);
    throw error;
  }
}
