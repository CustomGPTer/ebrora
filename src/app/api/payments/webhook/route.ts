import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateWebhookSignature } from '@/lib/payments/paypal-client';
import { sendSubscriptionConfirmationEmail } from '@/lib/email'; // Adjust path as needed

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    // Get webhook signature headers
    const transmissionId = request.headers.get('paypal-transmission-id');
    const transmissionTime = request.headers.get('paypal-transmission-time');
    const certUrl = request.headers.get('paypal-cert-url');
    const signature = request.headers.get('paypal-auth-algo');
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';

    // Validate webhook signature
    if (transmissionId && transmissionTime && certUrl && signature) {
      try {
        const isValid = await validateWebhookSignature(
          webhookId,
          body,
          signature,
          transmissionId,
          transmissionTime,
          certUrl
        );

        if (!isValid) {
          console.warn('Invalid webhook signature');
          // Continue processing anyway, but log the warning
        }
      } catch (error) {
        console.warn('Failed to validate webhook signature:', error);
        // Continue processing
      }
    }

    const eventType = event.event_type;
    const resource = event.resource;

    if (!eventType || !resource) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
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

      case 'PAYMENT.SALE.COMPLETED': {
        await handlePaymentCompleted(resource);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
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

async function handleSubscriptionActivated(resource: any): Promise<void> {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;
    const billingCycleSequence = resource.billing_cycles?.[0]?.sequence;

    if (!subscriptionId || !customId) {
      console.warn('Missing subscription ID or custom ID');
      return;
    }

    // Get subscription details to extract plan info
    const planId = resource.plan_id;

    // Determine tier from plan ID
    let tier = 'STANDARD';
    if (planId?.includes('premium')) {
      tier = 'PREMIUM';
    } else if (planId?.includes('standard')) {
      tier = 'STANDARD';
    }

    // Update user subscription in database
    const user = await prisma.user.update({
      where: { id: customId },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: 'ACTIVE',
        paypalSubscriptionId: subscriptionId,
        subscriptionActivatedAt: new Date(),
      },
    });

    // Create or update usage record for this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    await prisma.usageRecord.upsert({
      where: {
        userId_month: {
          userId: customId,
          month: monthStart,
        },
      },
      update: {
        subscriptionId,
      },
      create: {
        userId: customId,
        month: monthStart,
        subscriptionId,
        generationsCount: 0,
      },
    });

    // Send confirmation email
    try {
      await sendSubscriptionConfirmationEmail(user.email, tier);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the webhook if email fails
    }

    console.log(`Subscription ${subscriptionId} activated for user ${customId}`);
  } catch (error) {
    console.error('Error handling subscription activation:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(resource: any): Promise<void> {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;

    if (!subscriptionId || !customId) {
      console.warn('Missing subscription ID or custom ID');
      return;
    }

    // Update user subscription status
    await prisma.user.update({
      where: { id: customId },
      data: {
        subscriptionStatus: 'CANCELLED',
        subscriptionTier: 'FREE',
      },
    });

    console.log(`Subscription ${subscriptionId} cancelled for user ${customId}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

async function handleSubscriptionSuspended(resource: any): Promise<void> {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;

    if (!subscriptionId || !customId) {
      console.warn('Missing subscription ID or custom ID');
      return;
    }

    // Update user subscription status
    await prisma.user.update({
      where: { id: customId },
      data: {
        subscriptionStatus: 'SUSPENDED',
      },
    });

    console.log(`Subscription ${subscriptionId} suspended for user ${customId}`);
  } catch (error) {
    console.error('Error handling subscription suspension:', error);
    throw error;
  }
}

async function handlePaymentCompleted(resource: any): Promise<void> {
  try {
    const saleId = resource.id;

    console.log(`Payment ${saleId} completed`);
    // Payment processing logic can be added here
  } catch (error) {
    console.error('Error handling payment completion:', error);
    throw error;
  }
}
