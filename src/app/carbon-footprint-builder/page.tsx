import type { Metadata } from 'next';
import CarbonFootprintBuilderClient from './components/CarbonFootprintBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Construction Carbon Footprint Generator | Ebrora' },
  description: 'Activity-based carbon footprint assessments for construction works using ICE v3.2 emission factors. Materials, plant, transport, waste, and reduction opportunities.',
  alternates: { canonical: 'https://www.ebrora.com/carbon-footprint-builder' },
  openGraph: {
    title: 'AI Construction Carbon Footprint Generator | Ebrora',
    description: 'ICE v3.2 carbon footprint assessments for UK construction — materials, plant, transport, waste quantified with reduction opportunities identified.',
    url: 'https://www.ebrora.com/carbon-footprint-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Construction Carbon Footprint Generator',
  applicationCategory: 'BusinessApplication',
  description: 'Activity-based carbon footprint assessments for construction works using ICE v3.2 emission factors. Materials, plant, transport, waste, and reduction opportunities.',
  url: 'https://www.ebrora.com/carbon-footprint-builder',
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
    title: 'AI Construction Carbon Footprint Generator | Ebrora',
    description: 'ICE v3.2 carbon footprint assessments for UK construction — materials, plant, transport, waste quantified with reduction opportunities identified.',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Programme" }, { label: "Carbon Footprint Generator" }]} />
      </div>
      <CarbonFootprintBuilderClient />
    </>
  );
}
