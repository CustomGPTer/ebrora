import type { Metadata } from 'next';
import EarlyWarningBuilderClient from './components/EarlyWarningBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Early Warning Notice Builder | 8 NEC Templates | Ebrora' },
  description: 'AI-powered NEC early warning notice builder with 8 professional templates. Contractor → PM, PM → Contractor, Subcontractor, Health & Safety, Design, Weather — NEC3/NEC4 Clause 15 compliant.',
  alternates: { canonical: 'https://www.ebrora.com/early-warning-builder' },
  openGraph: {
    title: 'AI Early Warning Notice Builder | 8 NEC Templates | Ebrora',
    description: 'AI-powered NEC early warning notice builder with 8 professional templates. All contract directions, risk categories, and detail levels — NEC3/NEC4 compliant.',
    url: 'https://www.ebrora.com/early-warning-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Early Warning Notice Builder',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered NEC early warning notice builder with 8 professional templates. Contractor → PM, PM → Contractor, Subcontractor, Health & Safety, Design, Weather — NEC3/NEC4 Clause 15 compliant.',
  url: 'https://www.ebrora.com/early-warning-builder',
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
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Commercial" }, { label: "Early Warning Notice Builder" }]} />
      </div>
      <EarlyWarningBuilderClient />
    </>
  );
}
