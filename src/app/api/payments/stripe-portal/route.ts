import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { createPortalSession } from '@/lib/payments/stripe-client';
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

    // Look up Stripe customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: session.user.id },
      select: {
        stripe_customer_id: true,
        payment_provider: true,
      },
    });

    if (!subscription || subscription.payment_provider !== 'STRIPE' || !subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe subscription found. Your subscription is managed via PayPal.' },
        { status: 404 }
      );
    }

    const { portalUrl } = await createPortalSession(subscription.stripe_customer_id);

    return NextResponse.json({ portalUrl });
  } catch (error) {
    console.error('Stripe portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
