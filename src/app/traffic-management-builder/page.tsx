import type { Metadata } from 'next';
import TrafficBuilderClient from './components/TrafficBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';
export const metadata: Metadata = { title: { absolute: 'AI Traffic Management Plan Builder | Ebrora' }, description: 'AI-powered traffic management plan builder for UK construction.', alternates: { canonical: 'https://www.ebrora.com/traffic-management-builder' }, openGraph: { title: 'AI Traffic Management Plan Builder | Ebrora', description: 'Professional traffic management plan documents.', url: 'https://www.ebrora.com/traffic-management-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] } };

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Traffic Management Plan Builder',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered traffic management plan builder for UK construction.',
  url: 'https://www.ebrora.com/traffic-management-builder',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Health & Safety", href: "/products" }, { label: "Traffic Management Plan Builder" }]} />
      </div>
      <TrafficBuilderClient />
    </>
  ); }
