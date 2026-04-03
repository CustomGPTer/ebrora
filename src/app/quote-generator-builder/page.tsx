import type { Metadata } from 'next';
import QuoteBuilderClient from './components/QuoteBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Quotation Builder | 4 Templates | Ebrora' },
  description:
    'AI-powered subcontractor quotation builder with 4 professional templates — from full tender submissions to quick budget estimates. BoQ breakdown, inclusions, exclusions, programme, and commercial terms.',
  alternates: { canonical: 'https://www.ebrora.com/quote-generator-builder' },
  openGraph: {
    title: 'AI Quotation Builder | 4 Templates | Ebrora',
    description:
      'Professional subcontractor quotations with 4 template styles. BoQ, inclusions, exclusions, and commercial terms formatted to Tier 1 standards.',
    url: 'https://www.ebrora.com/quote-generator-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Quotation Builder',
  applicationCategory: 'BusinessApplication',
  description:
    'AI-powered subcontractor quotation builder with 4 professional templates for UK construction. Generates tender submissions with BoQ, inclusions, exclusions, programme, and commercial terms.',
  url: 'https://www.ebrora.com/quote-generator-builder',
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
  twitter: {
    card: 'summary_large_image',
    title: 'AI Quotation Builder | 4 Templates | Ebrora',
    description: 'Professional subcontractor quotations with 4 template styles. BoQ, inclusions, exclusions, and commercial terms formatted to Tier 1 standards.',
    images: ['/og-image.jpg'],
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Commercial" }, { label: "Quotation Generator" }]} />
      </div>
      <QuoteBuilderClient />
    </>
  );
}
