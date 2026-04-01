import type { Metadata } from 'next';
import InvasiveBuilderClient from './components/InvasiveBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';
export const metadata: Metadata = { title: { absolute: 'AI Invasive Species Management Plan Builder | Ebrora' }, description: 'AI-powered invasive species management plan builder for UK construction.', alternates: { canonical: 'https://www.ebrora.com/invasive-species-builder' }, openGraph: { title: 'AI Invasive Species Management Plan Builder | Ebrora', description: 'Professional invasive species management plan documents.', url: 'https://www.ebrora.com/invasive-species-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] } };

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Invasive Species Management Plan Builder',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered invasive species management plan builder for UK construction.',
  url: 'https://www.ebrora.com/invasive-species-builder',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Health & Safety" }, { label: "Invasive Species Management Plan Builder" }]} />
      </div>
      <InvasiveBuilderClient />
    </>
  ); }
