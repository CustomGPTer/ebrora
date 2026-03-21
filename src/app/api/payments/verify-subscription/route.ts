import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { getSubscriptionDetails } from '@/lib/payments/paypal-client';

export async function POST(request: NextRequest) {
    try {
          const session = await getSession();
          if (!session || !session.user || !(session.user as any).id) {
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

          // Determine tier from plan ID
          const planId = details.plan_id;
          let tier: 'STANDARD' | 'PROFESSIONAL' = 'STANDARD';
          const premiumMonthly = process.env.PAYPAL_PLAN_PREMIUM_MONTHLY || '';
          const premiumYearly = process.env.PAYPAL_PLAN_PREMIUM_YEARLY || '';
          if (planId === premiumMonthly || planId === premiumYearly) {
                  tier = 'PROFESSIONAL';
                }

          const userId = (session.user as any).id;

          // Upsert subscription
          await prisma.subscription.upsert({
                  where: { user_id: userId },
                  update: {
                            tier,
                            status: 'ACTIVE',
                            paypal_subscription_id: subscriptionId,
                            current_period_start: new Date(),
                          },
                  create: {
                            user_id: userId,
                            tier,
                            status: 'ACTIVE',
                            paypal_subscription_id: subscriptionId,
                            current_period_start: new Date(),
                          },
                });

          // Update usage record
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const ramsLimit = tier === 'PROFESSIONAL' ? 25 : 10;

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
                  { error: error instanceof Error ? error.message : 'Failed to verify subscription' },
                  { status: 500 }
                );
        }
  }
