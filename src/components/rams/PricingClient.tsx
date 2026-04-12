'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & DATA
   ═══════════════════════════════════════════════════════════════════════════ */

type BillingPeriod = 'monthly' | 'yearly';
type Tier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'UNLIMITED';

interface TierData {
  tier: Tier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  ramsPerMonth: string;
  aiUses: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
  cta: string;
}

const TIERS: TierData[] = [
  {
    tier: 'FREE',
    name: 'Free',
    tagline: 'Try every tool — no card needed',
    monthlyPrice: 0,
    yearlyPrice: 0,
    ramsPerMonth: '1 RAMS / month',
    aiUses: '1 AI document / month',
    features: [
      'Access to all 35+ AI tools',
      '1 AI document per month',
      '1 RAMS document per month',
      '1 toolbox talk download / month',
      '1 free template download / month',
      '2 RAMS formats (5×5 & H/M/L)',
    ],
    highlighted: false,
    cta: 'Get Started Free',
  },
  {
    tier: 'STARTER',
    name: 'Starter',
    tagline: 'For site teams producing regular documents',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    ramsPerMonth: '5 RAMS / month',
    aiUses: '30 AI documents / month',
    badge: 'Most Popular',
    features: [
      'All 35+ AI construction tools',
      '30 AI documents per month',
      '5 RAMS documents per month',
      'All 10 RAMS formats',
      'Company logo on documents',
      '10 toolbox talk downloads / month',
      '10 free template downloads / month',
      'Priority AI generation',
      'Email support',
      '14-day money-back guarantee',
    ],
    highlighted: true,
    cta: 'Start Starter Plan',
  },
  {
    tier: 'PROFESSIONAL',
    name: 'Professional',
    tagline: 'For busy project teams and contractors',
    monthlyPrice: 24.99,
    yearlyPrice: 249.99,
    ramsPerMonth: '15 RAMS / month',
    aiUses: '150 AI documents / month',
    features: [
      'Everything in Starter',
      '150 AI documents per month',
      '15 RAMS documents per month',
      '20 toolbox talk downloads / month',
      '30 free template downloads / month',
      'Highest generation priority',
      'Priority email & chat support',
      'Bulk generation queue',
      '14-day money-back guarantee',
    ],
    highlighted: false,
    cta: 'Start Professional Plan',
  },
  {
    tier: 'UNLIMITED',
    name: 'Unlimited',
    tagline: 'For H&S managers and consultancies',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    ramsPerMonth: 'Unlimited RAMS',
    aiUses: 'Unlimited AI documents',
    features: [
      'Everything in Professional',
      'Unlimited AI documents',
      'Unlimited RAMS documents',
      'Unlimited toolbox talk downloads',
      'Unlimited template downloads',
      'Dedicated priority queue',
      'Priority email & chat support',
      '14-day money-back guarantee',
    ],
    highlighted: false,
    cta: 'Start Unlimited Plan',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What happens when I cancel?',
    a: 'Your access continues until the end of your current billing period, then your account reverts to the free tier. No partial refunds for remaining time.',
  },
  {
    q: 'Can I get a refund?',
    a: 'We offer a 14-day money-back guarantee from the date of your first subscription purchase. After 14 days, no refunds are available.',
  },
  {
    q: 'Do unused allowances roll over?',
    a: 'No. Unused AI documents, RAMS documents, and download allowances reset at the start of each billing period.',
  },
  {
    q: 'What AI tools are included?',
    a: 'All plans — including Free — have access to every AI tool: COSHH assessments, safety alerts, RFIs, incident reports, toolbox talk generator, permit to dig, lift plans, and many more. The difference is how many documents you can generate per month.',
  },
  {
    q: 'Can I upload my company logo?',
    a: 'Yes — on Starter, Professional, and Unlimited plans your company logo appears in document headers. Upload it once in your account settings and it applies to all future documents.',
  },
  {
    q: 'How long are download links available?',
    a: 'Download links expire after 24 hours. We also email you the link, so check your inbox if you need it later.',
  },
  {
    q: 'What counts as an "AI document"?',
    a: 'Each time you complete the AI interview and generate a downloadable document (COSHH, lift plan, incident report, etc.), that counts as one AI document use. Chat rounds during the interview do not count — only the final generation.',
  },
];

const COMPARISON_ROWS: {
  label: string;
  free: string | boolean;
  starter: string | boolean;
  professional: string | boolean;
  unlimited: string | boolean;
}[] = [
  { label: 'AI documents / month', free: '1', starter: '30', professional: '150', unlimited: 'Unlimited' },
  { label: 'AI tools available', free: '35+', starter: '35+', professional: '35+', unlimited: '35+' },
  { label: 'RAMS documents / month', free: '1', starter: '5', professional: '15', unlimited: 'Unlimited' },
  { label: 'RAMS formats', free: '2', starter: '11', professional: '11', unlimited: '11' },
  { label: 'Toolbox talk downloads / month', free: '1', starter: '10', professional: '20', unlimited: 'Unlimited' },
  { label: 'Free template downloads / month', free: '1', starter: '10', professional: '30', unlimited: 'Unlimited' },
  { label: 'AI-generated content', free: true, starter: true, professional: true, unlimited: true },
  { label: 'DOCX download', free: true, starter: true, professional: true, unlimited: true },
  { label: 'Company logo on docs', free: false, starter: true, professional: true, unlimited: true },
  { label: 'Priority generation', free: false, starter: true, professional: true, unlimited: true },
  { label: 'Bulk generation queue', free: false, starter: false, professional: true, unlimited: true },
  { label: 'Email support', free: false, starter: true, professional: true, unlimited: true },
  { label: 'Chat support', free: false, starter: false, professional: true, unlimited: true },
  { label: '14-day money-back guarantee', free: false, starter: true, professional: true, unlimited: true },
];

const SOCIAL_PROOF = [
  { value: '2,400+', label: 'RAMS generated' },
  { value: '620+', label: 'Active users' },
  { value: '4.8/5', label: 'Average rating' },
  { value: '< 3 min', label: 'Average generation time' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  return price === 0 ? '0' : price.toFixed(2);
}

function yearlySaving(monthly: number, yearly: number): string {
  const saved = monthly * 12 - yearly;
  return saved > 0 ? `Save £${saved.toFixed(2)}` : '';
}

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE SVG ICONS
   ═══════════════════════════════════════════════════════════════════════════ */

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3.333 8h9.334M8.667 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── FAQ accordion ── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left group"
      >
        <span
          className="text-[0.95rem] font-semibold pr-6 group-hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
        >
          {question}
        </span>
        <ChevronDown
          className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-48 pb-5' : 'max-h-0'}`}>
        <p className="text-[0.875rem] leading-relaxed" style={{ color: 'var(--color-text-light)' }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

/* ── Pricing card ── */
function PricingCard({
  data,
  billingPeriod,
  isCurrentPlan,
}: {
  data: TierData;
  billingPeriod: BillingPeriod;
  isCurrentPlan: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { data: session } = useSession();

  const price = billingPeriod === 'monthly' ? data.monthlyPrice : data.yearlyPrice;
  const saving = yearlySaving(data.monthlyPrice, data.yearlyPrice);
  const planKey =
    data.tier === 'FREE'
      ? null
      : `${data.tier}_${billingPeriod === 'monthly' ? 'MONTHLY' : 'YEARLY'}`;

  const handleUpgrade = async () => {
    if (data.tier === 'FREE' || isCurrentPlan || !planKey) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to create subscription'}`);
        setIsLoading(false);
        return;
      }
      const { approvalUrl } = (await res.json()) as { approvalUrl: string };
      window.location.href = approvalUrl;
    } catch {
      alert('Failed to create subscription. Please try again.');
      setIsLoading(false);
    }
  };

  const ctaLabel = isCurrentPlan
    ? 'Current Plan'
    : data.tier === 'FREE'
    ? session
      ? 'Start Generating'
      : data.cta
    : data.cta;

  const isDisabled = isCurrentPlan || isLoading;

  return (
    <div
      className="relative flex flex-col rounded-2xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: data.highlighted
          ? 'linear-gradient(180deg, #FFFFFF 0%, var(--color-primary-light) 100%)'
          : 'var(--color-white)',
        border: data.highlighted
          ? '2px solid var(--color-primary)'
          : '1px solid var(--color-border)',
        boxShadow: data.highlighted
          ? '0 12px 40px rgba(27, 91, 80, 0.12)'
          : isHovered
          ? 'var(--shadow-md)'
          : 'var(--shadow-sm)',
        transform: data.highlighted ? 'scale(1.02)' : undefined,
      }}
    >
      {data.badge && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 rounded-full text-[0.7rem] font-bold tracking-wider uppercase"
          style={{ background: 'var(--color-primary)', color: '#FFFFFF' }}
        >
          {data.badge}
        </div>
      )}

      <div className="p-6 sm:p-7 flex flex-col flex-1">
        {/* Tier name + tagline */}
        <div className="mb-4">
          <h3
            className="text-[1.05rem] font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-dark)' }}
          >
            {data.name}
          </h3>
          <p className="text-[0.78rem]" style={{ color: 'var(--color-text-muted)' }}>
            {data.tagline}
          </p>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>£</span>
            <span
              className="text-[2.2rem] leading-none font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
            >
              {formatPrice(price)}
            </span>
            <span className="text-sm font-medium ml-1" style={{ color: 'var(--color-text-muted)' }}>
              /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
          {billingPeriod === 'yearly' && saving && (
            <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-gold)' }}>
              {saving}
            </p>
          )}
          {billingPeriod === 'yearly' && data.tier !== 'FREE' && (
            <p className="text-[0.72rem] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              £{(data.yearlyPrice / 12).toFixed(2)}/mo billed annually
            </p>
          )}
        </div>

        {/* Allowance pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
          >
            {data.ramsPerMonth}
          </span>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold"
            style={{ background: 'var(--color-gold-light)', color: '#9A7B38' }}
          >
            {data.aiUses}
          </span>
        </div>

        {/* Feature list */}
        <ul className="space-y-2.5 mb-7 flex-1">
          {data.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }}>
                <CheckIcon />
              </span>
              <span className="text-[0.8rem]" style={{ color: 'var(--color-text-light)' }}>
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {data.tier === 'FREE' && !isCurrentPlan ? (
          <Link
            href={session ? '/tools' : '/auth/register'}
            className="block w-full py-3 text-center text-[0.85rem] font-semibold rounded-lg border-2 transition-all duration-200 hover:shadow-md"
            style={{
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            onClick={
              data.tier !== 'FREE' && !session
                ? () => { window.location.href = '/auth/register'; }
                : handleUpgrade
            }
            disabled={isDisabled}
            className={`w-full py-3 text-[0.85rem] font-semibold rounded-lg transition-all duration-200 ${
              isCurrentPlan ? 'cursor-default' : 'hover:shadow-md active:scale-[0.98]'
            }`}
            style={{
              background: isCurrentPlan ? 'var(--color-off-white)' : 'var(--color-primary)',
              color: isCurrentPlan ? 'var(--color-text-muted)' : '#FFFFFF',
              border: isCurrentPlan ? '1px solid var(--color-border)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isCurrentPlan) e.currentTarget.style.background = 'var(--color-primary-dark)';
            }}
            onMouseLeave={(e) => {
              if (!isCurrentPlan) e.currentTarget.style.background = 'var(--color-primary)';
            }}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
                Processing…
              </span>
            ) : (
              ctaLabel
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PRICING PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function PricingClient() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [currentPlan, setCurrentPlan] = useState<Tier | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  // Fetch user's current subscription on mount
  const fetchSubscriptionStatus = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/payments/status');
      if (!res.ok) return;
      const data = (await res.json()) as { tier?: string };
      if (data.tier && data.tier !== 'FREE') {
        setCurrentPlan(data.tier as Tier);
      }
    } catch {
      // Non-critical — pricing page still works, just won't highlight current plan
    }
  }, [session?.user]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // Handle PayPal return: auto-verify subscription when user returns with ?subscribed=true or ?upgraded=true
  useEffect(() => {
    const subscribed = searchParams.get('subscribed');
    const upgraded = searchParams.get('upgraded');
    const subId = searchParams.get('subscription_id');

    if ((subscribed === 'true' || upgraded === 'true') && subId && session?.user) {
      setVerifyMessage('Verifying your subscription…');

      fetch('/api/payments/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subId }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = (await res.json()) as { tier?: string };
            setVerifyMessage(`Subscription confirmed — you're on ${data.tier || 'a paid'} plan!`);
            if (data.tier) setCurrentPlan(data.tier as Tier);
          } else {
            setVerifyMessage('Subscription is being processed. It may take a minute to activate.');
          }
        })
        .catch(() => {
          setVerifyMessage('Subscription is being processed. It may take a minute to activate.');
        })
        .finally(() => {
          // Clear URL params without navigation
          window.history.replaceState({}, '', '/pricing');
          // Clear message after a few seconds
          setTimeout(() => setVerifyMessage(null), 6000);
        });
    }
  }, [searchParams, session?.user]);

  return (
    <div style={{ background: 'var(--color-white)' }}>

      {/* ─── Verification notification ─── */}
      {verifyMessage && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg text-[0.85rem] font-semibold shadow-lg animate-fade-in"
          style={{ background: 'var(--color-primary)', color: '#FFFFFF' }}
        >
          {verifyMessage}
        </div>
      )}

      {/* ─── 1. HERO ─── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(175deg, var(--color-off-white) 0%, var(--color-primary-light) 50%, var(--color-off-white) 100%)',
        }}
      >
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.035]"
          style={{ background: 'var(--color-primary)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[380px] h-[380px] rounded-full opacity-[0.025]"
          style={{ background: 'var(--color-gold)' }}
        />

        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 pt-14 sm:pt-20 pb-10 sm:pb-14 text-center">
          <p
            className="text-[0.8rem] font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'var(--color-primary)' }}
          >
            Ebrora Pricing
          </p>

          <h1
            className="text-[1.8rem] sm:text-[2.2rem] lg:text-[2.6rem] font-bold leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-dark)' }}
          >
            Plans that scale with your project
          </h1>

          <p
            className="text-[0.95rem] sm:text-[1.05rem] leading-relaxed max-w-xl mx-auto mb-10"
            style={{ color: 'var(--color-text-light)' }}
          >
            35+ AI construction tools, RAMS Builder, free templates, and toolbox talks.
            Start free — upgrade when you need more.
          </p>

          {/* Billing period toggle */}
          <div
            className="inline-flex items-center p-1 rounded-full"
            style={{
              background: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <button
              onClick={() => setBillingPeriod('monthly')}
              className="px-5 py-2.5 rounded-full text-[0.85rem] font-semibold transition-all duration-300"
              style={{
                background: billingPeriod === 'monthly' ? 'var(--color-primary)' : 'transparent',
                color: billingPeriod === 'monthly' ? '#FFFFFF' : 'var(--color-text-light)',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[0.85rem] font-semibold transition-all duration-300"
              style={{
                background: billingPeriod === 'yearly' ? 'var(--color-primary)' : 'transparent',
                color: billingPeriod === 'yearly' ? '#FFFFFF' : 'var(--color-text-light)',
              }}
            >
              Yearly
              <span
                className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider"
                style={{
                  background: billingPeriod === 'yearly' ? 'rgba(255,255,255,0.2)' : 'var(--color-gold-light)',
                  color: billingPeriod === 'yearly' ? '#FFFFFF' : 'var(--color-gold)',
                }}
              >
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 2. PRICING CARDS ─── */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 -mt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 items-start">
          {TIERS.map((tier) => (
            <PricingCard
              key={tier.tier}
              data={tier}
              billingPeriod={billingPeriod}
              isCurrentPlan={currentPlan === tier.tier}
            />
          ))}
        </div>
      </section>

      {/* ─── 3. SOCIAL PROOF BAR ─── */}
      <section className="max-w-5xl mx-auto px-6 sm:px-8 mt-14">
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8 px-6 rounded-xl"
          style={{ background: 'var(--color-off-white)', border: '1px solid var(--color-border)' }}
        >
          {SOCIAL_PROOF.map((stat, i) => (
            <div key={i} className="text-center">
              <p
                className="text-xl sm:text-2xl font-bold mb-0.5"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
              >
                {stat.value}
              </p>
              <p className="text-[0.75rem] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. FEATURE COMPARISON TABLE ─── */}
      <section className="max-w-5xl mx-auto px-6 sm:px-8 mt-20">
        <div className="text-center mb-10">
          <h2
            className="text-[1.5rem] sm:text-[1.8rem] font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-dark)' }}
          >
            Compare plans in detail
          </h2>
          <p className="text-[0.85rem]" style={{ color: 'var(--color-text-muted)' }}>
            Everything you get with each plan at a glance.
          </p>
        </div>

        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <div className="min-w-[640px] px-6 sm:px-0">
            <table className="w-full text-[0.82rem]">
              <thead>
                <tr className="border-b-2" style={{ borderColor: 'var(--color-primary)' }}>
                  <th className="text-left py-4 pr-3 font-semibold" style={{ color: 'var(--color-text)', width: '32%' }}>
                    Feature
                  </th>
                  <th className="text-center py-4 px-2 font-semibold" style={{ color: 'var(--color-text)' }}>
                    Free
                  </th>
                  <th
                    className="text-center py-4 px-2 font-semibold rounded-t-lg"
                    style={{ color: 'var(--color-primary-dark)', background: 'var(--color-primary-light)' }}
                  >
                    Starter
                  </th>
                  <th className="text-center py-4 px-2 font-semibold" style={{ color: 'var(--color-text)' }}>
                    Professional
                  </th>
                  <th className="text-center py-4 px-2 font-semibold" style={{ color: 'var(--color-text)' }}>
                    Unlimited
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="py-3 pr-3" style={{ color: 'var(--color-text-light)' }}>
                      {row.label}
                    </td>
                    {(['free', 'starter', 'professional', 'unlimited'] as const).map((col) => {
                      const val = row[col];
                      return (
                        <td
                          key={col}
                          className="text-center py-3 px-2"
                          style={{
                            background: col === 'starter' ? 'var(--color-primary-light)' : undefined,
                          }}
                        >
                          {typeof val === 'boolean' ? (
                            val ? (
                              <span style={{ color: 'var(--color-primary)' }}>
                                <CheckIcon className="inline-block" />
                              </span>
                            ) : (
                              <CrossIcon className="inline-block opacity-20" />
                            )
                          ) : (
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                              {val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── 5. TRUST BADGES ─── */}
      <section className="mt-20 py-12" style={{ background: 'var(--color-off-white)' }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 2L4 5.5V10.5C4 15.5 7 19.5 11 21C15 19.5 18 15.5 18 10.5V5.5L11 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 11L10 13L14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: '14-day money-back guarantee',
                desc: 'Not satisfied? Full refund within 14 days — no questions asked.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="6" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 10h16" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="7" cy="14" r="1" fill="currentColor" />
                  </svg>
                ),
                title: 'Secure payments via PayPal',
                desc: 'Your payment details are encrypted and never stored on our servers.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M11 7v4l3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Cancel anytime',
                desc: 'No lock-in contracts. Downgrade or cancel whenever you need to.',
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  {item.icon}
                </div>
                <h4 className="text-[0.85rem] font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                  {item.title}
                </h4>
                <p className="text-[0.78rem] leading-relaxed max-w-[240px]" style={{ color: 'var(--color-text-muted)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. FAQ ─── */}
      <section className="max-w-2xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
        <div className="text-center mb-10">
          <h2
            className="text-[1.5rem] sm:text-[1.8rem] font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-dark)' }}
          >
            Frequently asked questions
          </h2>
          <p className="text-[0.85rem]" style={{ color: 'var(--color-text-muted)' }}>
            Can&rsquo;t find what you need?{' '}
            <a
              href="mailto:hello@ebrora.com"
              className="font-semibold underline underline-offset-2"
              style={{ color: 'var(--color-primary)' }}
            >
              Get in touch
            </a>
          </p>
        </div>
        <div>
          {FAQ_ITEMS.map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      {/* ─── 7. BOTTOM CTA ─── */}
      <section className="py-14" style={{ background: 'var(--color-primary-light)' }}>
        <div className="max-w-xl mx-auto px-6 sm:px-8 text-center">
          <h2
            className="text-[1.4rem] sm:text-[1.7rem] font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-dark)' }}
          >
            Ready to streamline your site paperwork?
          </h2>
          <p className="text-[0.9rem] mb-7" style={{ color: 'var(--color-text-light)' }}>
            Join site teams across the UK generating professional construction documents
            in minutes, not hours.
          </p>
          <Link
            href={session ? '/tools' : '/auth/register'}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-[0.9rem] font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            style={{ background: 'var(--color-primary)', color: '#FFFFFF' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-dark)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
          >
            {session ? 'Explore AI Tools' : 'Get Started Free'}
            <ArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
