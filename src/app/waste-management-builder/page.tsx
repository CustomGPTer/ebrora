import type { Metadata } from 'next';
import WasteBuilderClient from './components/WasteBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';
export const metadata: Metadata = { title: { absolute: 'AI Waste Management Plan Builder | Ebrora' }, description: 'AI-powered waste management plan builder for UK construction.', alternates: { canonical: 'https://www.ebrora.com/waste-management-builder' }, openGraph: { title: 'AI Waste Management Plan Builder | Ebrora', description: 'Professional waste management plan documents.', url: 'https://www.ebrora.com/waste-management-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] } };

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Waste Management Plan Builder',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered waste management plan builder for UK construction.',
  url: 'https://www.ebrora.com/waste-management-builder',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Health & Safety", href: "/products" }, { label: "Waste Management Plan Builder" }]} />
      </div>
      <WasteBuilderClient />
    </>
  ); }
