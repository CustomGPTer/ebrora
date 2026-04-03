import type { Metadata } from 'next';
import ErpBuilderClient from './components/ErpBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Emergency Response Plan Generator | 4 Templates | Ebrora' },
  description: 'AI-powered emergency response plan generator with 4 professional templates. Fire, medical, environmental, and site-specific scenarios — CDM compliant.',
  alternates: { canonical: 'https://www.ebrora.com/emergency-response-builder' },
  openGraph: {
    title: 'AI Emergency Response Plan Generator | 4 Templates | Ebrora',
    description: 'AI-powered ERP with 4 templates: standard, quick reference, role-based, and multi-scenario flowcharts.',
    url: 'https://www.ebrora.com/emergency-response-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Emergency Response Plan Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered emergency response plan generator with 4 professional templates. Fire, medical, environmental, and site-specific scenarios — CDM compliant.',
  url: 'https://www.ebrora.com/emergency-response-builder',
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
    title: 'AI Emergency Response Plan Generator | 4 Templates | Ebrora',
    description: 'AI-powered ERP with 4 templates: standard, quick reference, role-based, and multi-scenario flowcharts.',
    images: ['/og-image.jpg'],
  },
};
export default function Page() { return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Health & Safety" }, { label: "Emergency Response Plan Generator" }]} />
      </div>
      <ErpBuilderClient />
    </>
  ); }
