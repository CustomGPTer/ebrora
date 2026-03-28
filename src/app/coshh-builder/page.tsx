import type { Metadata } from 'next';
import CoshhBuilderClient from './components/CoshhBuilderClient';

export const metadata: Metadata = {
  title: {
    absolute: 'AI COSHH Assessment Builder | 5 Templates | Ebrora',
  },
  description: 'AI-powered COSHH assessment generator with 5 professional templates for UK construction. 18-section assessments covering composition, GHS classification, exposure limits, PPE, health surveillance, and regulatory compliance.',
  alternates: {
    canonical: 'https://www.ebrora.com/coshh-builder',
  },
  openGraph: {
    title: 'AI COSHH Assessment Builder | 5 Templates | Ebrora',
    description: 'AI-powered COSHH assessment generator with 5 professional templates for UK construction.',
    url: 'https://www.ebrora.com/coshh-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI COSHH Assessment Builder | 5 Templates | Ebrora',
    description: 'AI-powered COSHH assessment generator with 5 professional templates for UK construction.',
    images: ['https://www.ebrora.com/og-image.jpg'],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI COSHH Assessment Builder',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered COSHH assessment generator with 5 professional templates for UK construction projects. Produces 18-section regulation-compliant assessments.',
  url: 'https://www.ebrora.com/coshh-builder',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'GBP',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Ebrora',
    url: 'https://www.ebrora.com',
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <CoshhBuilderClient />
    </>
  );
}
