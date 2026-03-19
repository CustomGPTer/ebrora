import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { createSubscription } from '@/lib/payments/paypal-client';
import { getPlanConfigByKey } from '@/lib/payments/plan-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { planKey?: string };
    const { planKey } = body;

    if (!planKey) {
      return NextResponse.json(
        { error: 'Missing planKey' },
        { status: 400 }
      );
    }

    // Look up the plan configuration
    const planConfig = getPlanConfigByKey(planKey);

    if (!planConfig) {
      return NextResponse.json(
        { error: `Invalid plan: ${planKey}` },
        { status: 400 }
      );
    }

    if (!planConfig.paypalPlanId) {
      return NextResponse.json(
        { error: 'PayPal plan ID not configured for this plan' },
        { status: 500 }
      );
    }

    // Create subscription with PayPal — returns an approval URL
    // the user is redirected to PayPal to authorise payment.
    // Once approved, PayPal fires BILLING.SUBSCRIPTION.ACTIVATED webhook
    // which writes/updates the subscription record in the database.
    const { approvalUrl } = await createSubscription(
      planConfig.paypalPlanId,
      session.user.id
    );

    return NextResponse.json({ approvalUrl });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
