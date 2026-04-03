import type { Metadata } from 'next';
import PermitToDigBuilderClient from './components/PermitToDigBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Permit to Dig Generator | 4 Templates | Ebrora' },
  description: 'AI-powered permit to dig generator with 4 professional templates. HSG47 compliant — statutory searches, CAT & Genny, hand-dig zones, emergency strike procedures.',
  alternates: { canonical: 'https://www.ebrora.com/permit-to-dig-builder' },
  openGraph: {
    title: 'AI Permit to Dig Generator | 4 Templates | Ebrora',
    description: 'AI-powered permit to dig with 4 templates: comprehensive HSG47, daily shift card, utility strike response, and avoidance plan.',
    url: 'https://www.ebrora.com/permit-to-dig-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Permit to Dig Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered permit to dig generator with 4 professional templates. HSG47 compliant — statutory searches, CAT & Genny, hand-dig zones, emergency strike procedures.',
  url: 'https://www.ebrora.com/permit-to-dig-builder',
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
    title: 'AI Permit to Dig Generator | 4 Templates | Ebrora',
    description: 'AI-powered permit to dig with 4 templates: comprehensive HSG47, daily shift card, utility strike response, and avoidance plan.',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Health & Safety" }, { label: "Permit to Dig Generator" }]} />
      </div>
      <PermitToDigBuilderClient />
    </>
  ); }
