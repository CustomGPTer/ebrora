import Stripe from 'stripe';

// =============================================================================
// Stripe Client — mirrors paypal-client.ts structure
// Uses Stripe Checkout (redirect) for new subscriptions and
// Stripe Customer Portal for billing management.
// =============================================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia',
});

// ── Types ──

export interface StripeSubscriptionDetails {
  id: string;
  customerId: string;
  status: string;
  priceId: string;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
  cancelAtPeriodEnd: boolean;
}

// ── Create Checkout Session ──

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  customerEmail: string,
  returnUrl?: string
): Promise<{ sessionId: string; checkoutUrl: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Check if user already has a Stripe customer ID
  // If so, reuse it to keep subscription history together
  const existingCustomers = await stripe.customers.list({
    email: customerEmail,
    limit: 1,
  });

  let customerId: string | undefined;
  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    ...(customerId
      ? { customer: customerId }
      : { customer_email: customerEmail }),
    client_reference_id: userId,
    success_url:
      (returnUrl || `${baseUrl}/pricing`) +
      '?stripe_session_id={CHECKOUT_SESSION_ID}&subscribed=true',
    cancel_url: `${baseUrl}/pricing`,
    subscription_data: {
      metadata: {
        userId,
      },
    },
    metadata: {
      userId,
    },
  });

  if (!session.url) {
    throw new Error('No checkout URL in Stripe response');
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

// ── Retrieve Checkout Session ──

export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });
}

// ── Get subscription details ──

export async function getStripeSubscriptionDetails(
  subscriptionId: string
): Promise<StripeSubscriptionDetails> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  const item = sub.items.data[0];
  if (!item) {
    throw new Error('No subscription items found');
  }

  return {
    id: sub.id,
    customerId: sub.customer as string,
    status: sub.status,
    priceId: item.price.id,
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    currentPeriodStart: new Date(item.current_period_start * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };
}

// ── Update subscription (upgrade / downgrade) ──

export async function updateStripeSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<StripeSubscriptionDetails> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const item = sub.items.data[0];

  if (!item) {
    throw new Error('No subscription items to update');
  }

  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: item.id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });

  const updatedItem = updated.items.data[0];

  return {
    id: updated.id,
    customerId: updated.customer as string,
    status: updated.status,
    priceId: updatedItem?.price.id || newPriceId,
    currentPeriodEnd: new Date((updatedItem?.current_period_end || 0) * 1000),
    currentPeriodStart: new Date((updatedItem?.current_period_start || 0) * 1000),
    cancelAtPeriodEnd: updated.cancel_at_period_end,
  };
}

// ── Cancel subscription (at period end) ──

export async function cancelStripeSubscription(
  subscriptionId: string
): Promise<boolean> {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return true;
  } catch (error) {
    console.error('Stripe cancel error:', error);
    return false;
  }
}

// ── Immediately cancel subscription (e.g. cross-provider switch) ──

export async function cancelStripeSubscriptionImmediately(
  subscriptionId: string
): Promise<boolean> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    console.error('Stripe immediate cancel error:', error);
    return false;
  }
}

// ── Create Customer Portal session ──

export async function createPortalSession(
  customerId: string,
  returnUrl?: string
): Promise<{ portalUrl: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${baseUrl}/account`,
  });

  return { portalUrl: session.url };
}

// ── Validate webhook signature ──

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

// ── Export raw Stripe instance for edge cases ──

export { stripe };
