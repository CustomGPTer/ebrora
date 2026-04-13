import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateWebhookSignature, getSubscriptionDetails } from '@/lib/payments/paypal-client';
import { resolveTierFromPlanId } from '@/lib/payments/plan-config';
import { upsertUsageRecord } from '@/lib/payments/usage-tracker';
import { sendSubscriptionConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    // Get webhook signature headers
    const transmissionId = request.headers.get('paypal-transmission-id');
    const transmissionTime = request.headers.get('paypal-transmission-time');
    const certUrl = request.headers.get('paypal-cert-url');
    const transmissionSig = request.headers.get('paypal-transmission-sig');
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';

    // Validate webhook signature
    if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig) {
      console.warn('Missing webhook signature headers');
      return NextResponse.json(
        { error: 'Missing signature headers' },
        { status: 401 }
      );
    }

    try {
      const isValid = await validateWebhookSignature(
        webhookId,
        body,
        transmissionSig,
        transmissionId,
        transmissionTime,
        certUrl
      );

      if (!isValid) {
        console.warn('Invalid webhook signature — rejecting');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Webhook signature validation error:', error);
      return NextResponse.json(
        { error: 'Signature validation failed' },
        { status: 401 }
      );
    }

    const eventType = event.event_type;
    const resource = event.resource;

    if (!eventType || !resource) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Idempotency: reject duplicate webhook deliveries.
    // PayPal retries aggressively — without this, the same event processes multiple times.
    try {
      const alreadyProcessed = await prisma.webhookEvent.findUnique({
        where: { transmission_id: transmissionId },
      });

      if (alreadyProcessed) {
        console.log(`Duplicate webhook ${transmissionId} (${eventType}) — skipping`);
        return NextResponse.json({ received: true });
      }
    } catch (dedupeError) {
      // If the dedup check fails (e.g. table doesn't exist yet), log and continue.
      // Better to double-process than to reject a valid webhook.
      console.warn('Webhook dedup check failed, continuing:', dedupeError);
    }

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED': {
        // Subscription created but not yet approved — log only
        console.log(`Subscription ${resource.id} created (pending approval) for custom_id ${resource.custom_id || 'unknown'}`);
        break;
      }
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        await handleSubscriptionActivated(resource);
        break;
      }
      case 'BILLING.SUBSCRIPTION.UPDATED': {
        // Plan revision approved — treat like a fresh activation
        await handleSubscriptionActivated(resource);
        break;
      }
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        await handleSubscriptionCancelled(resource);
        break;
      }
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        await handleSubscriptionSuspended(resource);
        break;
      }
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        await handleSubscriptionExpired(resource);
        break;
      }
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED': {
        // Treat re-activation the same as activation
        await handleSubscriptionActivated(resource);
        break;
      }
      case 'PAYMENT.SALE.COMPLETED': {
        await handlePaymentCompleted(resource);
        break;
      }
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    // Record this event so duplicate deliveries are skipped
    try {
      await prisma.webhookEvent.create({
        data: {
          transmission_id: transmissionId,
          event_type: eventType,
        },
      });
    } catch (dedupeError) {
      // Unique constraint violation = another request already recorded it — safe to ignore
      console.log(`Webhook event ${transmissionId} already recorded (race with concurrent delivery)`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ── Helpers ──

function determineTier(planId: string): 'STARTER' | 'PROFESSIONAL' | 'UNLIMITED' | null {
  const resolved = resolveTierFromPlanId(planId);
  if (!resolved) {
    console.error(`CRITICAL: Unknown PayPal plan ID in webhook: ${planId}. Skipping tier assignment.`);
  }
  return resolved;
}

// ── Subscription activated / updated / re-activated ──

async function handleSubscriptionActivated(resource: any): Promise<void> {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;

    if (!subscriptionId || !customId) {
      console.warn('Missing subscription ID or custom ID');
      return;
    }

    const planId = resource.plan_id;
    const tier = determineTier(planId);

    if (!tier) {
      console.error(`Cannot activate subscription ${subscriptionId}: unknown plan_id ${planId}`);
      return;
    }

    // Fetch subscription details from PayPal to get the billing period end date
    let periodEnd: Date | undefined;
    try {
      const details = await getSubscriptionDetails(subscriptionId);
      if (details.billing_info?.next_billing_time) {
        periodEnd = new Date(details.billing_info.next_billing_time);
      }
    } catch (detailsError) {
      console.error(`Failed to fetch subscription details on activation for ${subscriptionId}:`, detailsError);
      // Continue without period_end — handlePaymentCompleted will set it later
    }

    // Update or create subscription in database
    await prisma.subscription.upsert({
      where: { user_id: customId },
      update: {
        tier,
        status: 'ACTIVE',
        payment_provider: 'PAYPAL',
        paypal_subscription_id: subscriptionId,
        current_period_start: new Date(),
        ...(periodEnd ? { current_period_end: periodEnd } : {}),
        // Clear Stripe fields if switching provider
        stripe_subscription_id: null,
        stripe_customer_id: null,
      },
      create: {
        user_id: customId,
        tier,
        status: 'ACTIVE',
        payment_provider: 'PAYPAL',
        paypal_subscription_id: subscriptionId,
        current_period_start: new Date(),
        ...(periodEnd ? { current_period_end: periodEnd } : {}),
      },
    });

    // Get user email for confirmation
    const user = await prisma.user.findUnique({
      where: { id: customId },
      select: { email: true },
    });

    // Create or update usage record for this month
    await upsertUsageRecord(customId, tier);

    // Send confirmation email
    if (user) {
      try {
        await sendSubscriptionConfirmationEmail(user.email, tier);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    }

    console.log(`Subscription ${subscriptionId} activated for user ${customId} (tier: ${tier})`);
  } catch (error) {
    console.error('Error handling subscription activation:', error);
    throw error;
  }
}

// ── Subscription cancelled ──

async function handleSubscriptionCancelled(resource: any): Promise<void> {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;

    if (!subscriptionId) {
      console.warn('Missing subscription ID in cancellation webhook');
      return;
    }

    // Only cancel if the webhook subscription ID matches the user's CURRENT subscription.
    let existingSub = customId
      ? await prisma.subscription.findUnique({ where: { user_id: customId } })
      : null;

    // Fallback: find by paypal_subscription_id if custom_id wasn't provided
    if (!existingSub) {
      existingSub = await prisma.subscription.findFirst({
        where: { paypal_subscription_id: subscriptionId },
      });
    }

    if (!existingSub) {
      console.log(`No matching DB subscription for PayPal sub ${subscriptionId} — ignoring`);
      return;
    }

    // CRITICAL: only cancel if this webhook is for the user's CURRENT active subscription
    if (existingSub.paypal_subscription_id !== subscriptionId) {
      console.log(
        `Ignoring cancel for old sub ${subscriptionId} — user has active sub ${existingSub.paypal_subscription_id}`
      );
      return;
    }

    // Set status to CANCELLED — tier stays intact.
    // The resolve-tier logic + cron will handle the eventual downgrade to FREE
    // once current_period_end has passed.
    //
    // If current_period_end was never set (e.g. activation webhook failed to fetch
    // billing details), fetch it now so the cron doesn't immediately downgrade.
    let periodEndUpdate: { current_period_end: Date } | Record<string, never> = {};
    if (!existingSub.current_period_end) {
      try {
        const details = await getSubscriptionDetails(subscriptionId);
        if (details.billing_info?.next_billing_time) {
          periodEndUpdate = { current_period_end: new Date(details.billing_info.next_billing_time) };
        }
      } catch (detailsError) {
        console.error(`Failed to fetch period end for cancelled sub ${subscriptionId}:`, detailsError);
      }
    }

    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'CANCELLED',
        ...periodEndUpdate,
      },
    });

    console.log(`Subscription ${subscriptionId} cancelled for user ${existingSub.user_id}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

// ── Subscription suspended ──

async function handleSubscriptionSuspended(resource: any): Promise<void> {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;

    if (!subscriptionId) {
      console.warn('Missing subscription ID in suspension webhook');
      return;
    }

    let existingSub = customId
      ? await prisma.subscription.findUnique({ where: { user_id: customId } })
      : null;

    if (!existingSub) {
      existingSub = await prisma.subscription.findFirst({
        where: { paypal_subscription_id: subscriptionId },
      });
    }

    if (!existingSub || existingSub.paypal_subscription_id !== subscriptionId) {
      console.log(`Ignoring suspend for non-current sub ${subscriptionId}`);
      return;
    }

    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'PAST_DUE',
      },
    });

    console.log(`Subscription ${subscriptionId} suspended for user ${existingSub.user_id}`);
  } catch (error) {
    console.error('Error handling subscription suspension:', error);
    throw error;
  }
}

// ── Subscription expired ──

async function handleSubscriptionExpired(resource: any): Promise<void> {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;

    if (!subscriptionId) {
      console.warn('Missing subscription ID in expiration webhook');
      return;
    }

    let existingSub = customId
      ? await prisma.subscription.findUnique({ where: { user_id: customId } })
      : null;

    if (!existingSub) {
      existingSub = await prisma.subscription.findFirst({
        where: { paypal_subscription_id: subscriptionId },
      });
    }

    if (!existingSub || existingSub.paypal_subscription_id !== subscriptionId) {
      console.log(`Ignoring expire for non-current sub ${subscriptionId}`);
      return;
    }

    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'EXPIRED',
        tier: 'FREE',
      },
    });

    console.log(`Subscription ${subscriptionId} expired for user ${existingSub.user_id}`);
  } catch (error) {
    console.error('Error handling subscription expiration:', error);
    throw error;
  }
}

// ── Payment completed ──

async function handlePaymentCompleted(resource: any): Promise<void> {
  try {
    const saleId = resource.id;
    const billingAgreementId = resource.billing_agreement_id;

    console.log(`Payment ${saleId} completed for subscription ${billingAgreementId || 'unknown'}`);

    if (!billingAgreementId) {
      return;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { paypal_subscription_id: billingAgreementId },
    });

    if (!subscription) {
      console.log(`No DB subscription found for PayPal agreement ${billingAgreementId}`);
      return;
    }

    // Fetch subscription details from PayPal to get the next billing date
    try {
      const details = await getSubscriptionDetails(billingAgreementId);
      const nextBillingTime = details.billing_info?.next_billing_time;

      if (nextBillingTime) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            current_period_end: new Date(nextBillingTime),
            current_period_start: new Date(),
            status: 'ACTIVE',
          },
        });
        console.log(`Updated period end to ${nextBillingTime} for user ${subscription.user_id}`);
      }
    } catch (detailsError) {
      console.error(`Failed to fetch subscription details for ${billingAgreementId}:`, detailsError);
    }
  } catch (error) {
    console.error('Error handling payment completion:', error);
    throw error;
  }
}
