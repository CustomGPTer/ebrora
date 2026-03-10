import type { Metadata } from 'next';
import PricingClient from '@/components/rams/PricingClient';

export const metadata: Metadata = {
  title: 'RAMS Builder Pricing — Ebrora',
  description: 'Choose a plan for the RAMS Builder. Free, Standard, or Premium.',
};

export default function PricingPage() {
  return <PricingClient />;
}
