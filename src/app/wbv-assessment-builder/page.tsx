import type { Metadata } from 'next';
import WbvBuilderClient from './components/WbvBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Whole Body Vibration Assessment Builder | 3 Templates | Ebrora' },
  description: 'AI-powered WBV assessment builder. Control of Vibration at Work Regs 2005 compliant with A(8) exposure calculations, EAV/ELV thresholds. 3 professional templates.',
  alternates: { canonical: 'https://www.ebrora.com/wbv-assessment-builder' },
  openGraph: { title: 'AI WBV Assessment Builder | Ebrora', description: 'Vibration Regs 2005 compliant assessments with A(8) calculations and 3 templates.', url: 'https://www.ebrora.com/wbv-assessment-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Whole Body Vibration Assessment Builder',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered WBV assessment builder. Control of Vibration at Work Regs 2005 compliant with A(8) exposure calculations, EAV/ELV thresholds. 3 professional templates.',
  url: 'https://www.ebrora.com/wbv-assessment-builder',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Health & Safety", href: "/products" }, { label: "Whole Body Vibration Assessment Builder" }]} />
      </div>
      <WbvBuilderClient />
    </>
  ); }
