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

    const body = (await request.json()) as { planKey: string };

    if (!body.planKey) {
      return NextResponse.json(
        { error: 'Missing planKey' },
        { status: 400 }
      );
    }

    const planConfig = getPlanConfigByKey(body.planKey);

    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid plan key' },
        { status: 400 }
      );
    }

    if (!planConfig.paypalPlanId) {
      return NextResponse.json(
        { error: 'Plan not configured' },
        { status: 500 }
      );
    }

    const { subscriptionId, approvalUrl } = await createSubscription(
      planConfig.paypalPlanId,
      session.user.email || session.user.id
    );

    // Store the subscription ID temporarily for webhook matching
    // In production, you might want to store this in a temporary cache
    // or database record until the webhook confirms activation

    return NextResponse.json({
      subscriptionId,
      approvalUrl,
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
