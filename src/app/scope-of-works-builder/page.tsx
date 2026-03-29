import type { Metadata } from 'next';
import ScopeBuilderClient from './components/ScopeBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Scope of Works Builder | 3 Templates | Ebrora' },
  description:
    'AI-powered scope of works generator with 3 professional templates. 23-section documents covering inclusions, exclusions, interfaces, commercial terms, payment mechanism, variation procedure, and back-to-back obligations.',
  alternates: { canonical: 'https://www.ebrora.com/scope-of-works-builder' },
  openGraph: {
    title: 'AI Scope of Works Builder | 3 Templates | Ebrora',
    description:
      'AI-powered scope of works generator with 3 professional templates for UK construction subcontracts.',
    url: 'https://www.ebrora.com/scope-of-works-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Scope of Works Builder',
  applicationCategory: 'BusinessApplication',
  description:
    'AI-powered scope of works generator with 3 professional templates for UK construction subcontracts. Generates 23-section documents with full commercial protection.',
  url: 'https://www.ebrora.com/scope-of-works-builder',
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
      <ScopeBuilderClient />
    </>
  );
}
