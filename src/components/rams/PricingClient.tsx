'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type BillingPeriod = 'monthly' | 'yearly';

interface PricingCardProps {
  tier: 'FREE' | 'STANDARD' | 'PREMIUM';
  billingPeriod: BillingPeriod;
  isCurrentPlan?: boolean;
  onUpgrade?: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
  tier,
  billingPeriod,
  isCurrentPlan = false,
  onUpgrade,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const getPriceInfo = () => {
    if (tier === 'FREE') {
      return {
        price: '0',
        period: '/month',
        yearlyNote: null,
        planKey: null,
      };
    }

    if (tier === 'STANDARD') {
      return billingPeriod === 'monthly'
        ? {
            price: '9.99',
            period: '/month',
            yearlyNote: null,
            planKey: 'STANDARD_MONTHLY',
          }
        : {
            price: '99.99',
            period: '/year',
            yearlyNote: '(Save £19.89)',
            planKey: 'STANDARD_YEARLY',
          };
    }

    // PREMIUM
    return billingPeriod === 'monthly'
      ? {
          price: '19.99',
          period: '/month',
          yearlyNote: null,
          planKey: 'PREMIUM_MONTHLY',
        }
      : {
          price: '199.99',
          period: '/year',
          yearlyNote: '(Save £39.89)',
          planKey: 'PREMIUM_YEARLY',
        };
  };

  const getFeatures = () => {
    const baseFeatures = {
      FREE: [
        '1 RAMS/month',
        '2 formats',
        'Standard 5×5 format',
        'H/M/L Simple format',
        'Community support',
      ],
      STANDARD: [
        '10 RAMS/month',
        'All 10 formats',
        'Priority support',
        'Email assistance',
      ],
      PREMIUM: [
        '25 RAMS/month',
        'All 10 formats',
        'Priority generation',
        'Priority support',
        'Email & chat assistance',
      ],
    };
    return baseFeatures[tier];
  };

  const getCtaText = () => {
    if (tier === 'FREE') {
      return isCurrentPlan ? 'Current Plan' : 'Get Started Free';
    }
    return 'Upgrade Now';
  };

  const handleUpgrade = async () => {
    if (tier === 'FREE' || isCurrentPlan) {
      return;
    }

    const { price: priceInfo, planKey } = getPriceInfo();
    if (!planKey) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create subscription'}`);
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as {
        approvalUrl: string;
      };

      // Redirect to PayPal approval
      window.location.href = data.approvalUrl;
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to create subscription. Please try again.');
      setIsLoading(false);
    }
  };

  const priceInfo = getPriceInfo();
  const features = getFeatures();
  const ctaText = getCtaText();
  const isDisabled =
    tier === 'FREE' || isCurrentPlan || (tier !== 'FREE' && isLoading);
  const isFeatured = tier === 'STANDARD';

  return (
    <div
      className={`pricing-card ${
        isFeatured ? 'pricing-card--featured' : ''
      }`}
    >
      <div className="pricing-card__header">
        <h3 className="pricing-card__tier">{tier}</h3>
        <div className="pricing-card__price">
          <span className="pricing-card__currency">£</span>
          <span className="pricing-card__amount">{priceInfo.price}</span>
          <span className="pricing-card__period">{priceInfo.period}</span>
        </div>
        {priceInfo.yearlyNote && (
          <p className="pricing-card__savings">{priceInfo.yearlyNote}</p>
        )}
      </div>

      <ul className="pricing-card__features">
        {features.map((feature, index) => (
          <li key={index} className="pricing-card__feature">
            {feature}
          </li>
        ))}
      </ul>

      <button
        className={`pricing-card__cta ${
          isDisabled ? 'pricing-card__cta--disabled' : ''
        }`}
        onClick={handleUpgrade}
        disabled={isDisabled}
      >
        {isLoading ? 'Processing...' : ctaText}
      </button>
    </div>
  );
};

export default function PricingClient() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const { data: session } = useSession();

  // Determine current plan from user subscription
  // This would be fetched from the API in a real app
  const currentPlan: 'FREE' | 'STANDARD' | 'PREMIUM' | null = null; // Would be fetched

  const toggleBilling = () => {
    setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly');
  };

  return (
    <div className="pricing">
      <div className="pricing__container">
        <header className="pricing__header">
          <h1 className="pricing__title">Simple, Transparent Pricing</h1>
          <p className="pricing__subtitle">
            Choose the perfect plan for your RAMS Builder needs
          </p>
        </header>

        <div className="pricing__toggle-wrapper">
          <div className="pricing__toggle">
            <button
              className={`pricing__toggle-btn ${
                billingPeriod === 'monthly'
                  ? 'pricing__toggle-btn--active'
                  : ''
              }`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`pricing__toggle-btn ${
                billingPeriod === 'yearly'
                  ? 'pricing__toggle-btn--active'
                  : ''
              }`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly
              <span className="pricing__save-badge">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="pricing__cards">
          <PricingCard
            tier="FREE"
            billingPeriod={billingPeriod}
            isCurrentPlan={currentPlan === 'FREE'}
          />
          <PricingCard
            tier="STANDARD"
            billingPeriod={billingPeriod}
            isCurrentPlan={currentPlan === 'STANDARD'}
          />
          <PricingCard
            tier="PREMIUM"
            billingPeriod={billingPeriod}
            isCurrentPlan={currentPlan === 'PREMIUM'}
          />
        </div>

        <section className="pricing__faq">
          <h2 className="pricing__faq-title">Frequently Asked Questions</h2>

          <div className="pricing__faq-items">
            <div className="pricing__faq-item">
              <h3 className="pricing__faq-question">
                What happens after the free trial?
              </h3>
              <p className="pricing__faq-answer">
                After your free month, you'll need to choose a paid plan to
                continue using the RAMS Builder.
              </p>
            </div>

            <div className="pricing__faq-item">
              <h3 className="pricing__faq-question">Can I change plans later?</h3>
              <p className="pricing__faq-answer">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>

            <div className="pricing__faq-item">
              <h3 className="pricing__faq-question">
                What happens if I exceed my RAMS limit?
              </h3>
              <p className="pricing__faq-answer">
                You won't be able to generate more RAMS until the next billing
                cycle, unless you upgrade your plan.
              </p>
            </div>

            <div className="pricing__faq-item">
              <h3 className="pricing__faq-question">Do you offer refunds?</h3>
              <p className="pricing__faq-answer">
                We offer a 14-day money-back guarantee. Contact our support team
                if you need assistance.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
