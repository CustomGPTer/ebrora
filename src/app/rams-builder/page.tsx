import type { Metadata } from 'next';
import RamsLandingClient from '@/components/rams/RamsLandingClient';

export const metadata: Metadata = {
  title: 'RAMS Builder — Professional Risk Assessment & Method Statement',
  description: 'Generate compliant, site-specific RAMS documents in minutes. 10 industry formats, CDM 2015 compliant. Built for UK construction professionals.',
  openGraph: {
    title: 'RAMS Builder — Professional Risk Assessment & Method Statement | Ebrora',
    description: 'Generate compliant, site-specific RAMS documents in minutes. 10 industry formats, CDM 2015 compliant.',
    url: 'https://ebrora.com/rams-builder',
    type: 'website',
    images: [{ url: 'https://ebrora.com/og-image.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAMS Builder — Professional Risk Assessment & Method Statement | Ebrora',
    description: 'Generate compliant, site-specific RAMS documents in minutes.',
  },
};

// Schema.org SoftwareApplication
const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora RAMS Builder',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'GBP', description: 'Free tier — 1 RAMS/month' },
    { '@type': 'Offer', price: '9.99', priceCurrency: 'GBP', description: 'Standard — 10 RAMS/month' },
    { '@type': 'Offer', price: '19.99', priceCurrency: 'GBP', description: 'Professional — 25 RAMS/month' },
  ],
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '50' },
};

export default function RamsBuilderPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <RamsLandingClient />
    </>
  );
}
