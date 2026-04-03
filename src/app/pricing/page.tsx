import type { Metadata } from 'next';
import PricingClient from '@/components/rams/PricingClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pricing — Ebrora',
  description:
    'Choose a plan for Ebrora. Free, Starter, Professional, or Unlimited. 35+ AI construction tools, RAMS Builder, free templates, and toolbox talks.',
  alternates: {
    canonical: 'https://www.ebrora.com/pricing',
  },
  openGraph: {
    title: 'Pricing — Ebrora',
    description:
      'Choose a plan for Ebrora. Free, Starter, Professional, or Unlimited. 35+ AI construction tools, RAMS Builder, free templates, and toolbox talks.',
    url: 'https://www.ebrora.com/pricing',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Ebrora',
    description:
      '35+ AI construction tools, RAMS Builder, free templates, and toolbox talks. Choose from Free, Starter, Professional, or Unlimited.',
    images: ['/og-image.jpg'],
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
