import type { Metadata } from 'next';
import PricingClient from '@/components/rams/PricingClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pricing — Ebrora',
  description: 'Choose a plan for Ebrora. Free, Starter, Professional, or Unlimited. 35+ AI construction tools, RAMS Builder, free templates, and toolbox talks.',
};

export default function PricingPage() {
  return <PricingClient />;
}
