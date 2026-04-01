import type { Metadata } from 'next';
import RfiBuilderClient from './components/RfiBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Request for Information Builder | 3 Templates | Ebrora' },
  description: 'AI-powered request for information builder with 3 professional templates for UK construction.',
  alternates: { canonical: 'https://www.ebrora.com/rfi-generator-builder' },
  openGraph: { title: 'AI Request for Information Builder | Ebrora', description: 'Request for Information with 3 templates.', url: 'https://www.ebrora.com/rfi-generator-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Request for Information Builder',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered request for information builder with 3 professional templates for UK construction.',
  url: 'https://www.ebrora.com/rfi-generator-builder',
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
export default function Page() { return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Commercial", href: "/products" }, { label: "Request for Information Builder" }]} />
      </div>
      <RfiBuilderClient />
    </>
  ); }
