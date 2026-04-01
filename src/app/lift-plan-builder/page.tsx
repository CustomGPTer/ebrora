import type { Metadata } from 'next';
import LiftPlanBuilderClient from './components/LiftPlanBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Lift Plan Generator | 4 Templates | Ebrora' },
  description: 'AI-powered lift plan generator with 4 professional templates. Load details, crane specification, exclusion zones, tandem lifts — BS 7121 and LOLER 1998 compliant.',
  alternates: { canonical: 'https://www.ebrora.com/lift-plan-builder' },
  openGraph: {
    title: 'AI Lift Plan Generator | 4 Templates | Ebrora',
    description: 'AI-powered lift plan with 4 templates: comprehensive, crane operator brief, tandem/complex lift, and LOLER compliance.',
    url: 'https://www.ebrora.com/lift-plan-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Lift Plan Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered lift plan generator with 4 professional templates. Load details, crane specification, exclusion zones, tandem lifts — BS 7121 and LOLER 1998 compliant.',
  url: 'https://www.ebrora.com/lift-plan-builder',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Health & Safety", href: "/products" }, { label: "Lift Plan Generator" }]} />
      </div>
      <LiftPlanBuilderClient />
    </>
  ); }
