import type { Metadata } from 'next';
import CrpBuilderClient from './components/CrpBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Carbon Reduction Plan Generator | 4 Templates | Ebrora' },
  description: 'PPN 06/21, SBTi, ISO 14064 & GHG Protocol compliant Carbon Reduction Plans. 4 professional templates with baseline emissions, net zero targets, reduction measures, and board sign-off.',
  alternates: { canonical: 'https://www.ebrora.com/carbon-reduction-plan-builder' },
  openGraph: {
    title: 'AI Carbon Reduction Plan Generator | 4 Templates | Ebrora',
    description: 'AI-powered Carbon Reduction Plan builder with 4 regulatory templates — PPN 06/21, SBTi, ISO 14064, GHG Protocol. Professional documents for public sector and framework bids.',
    url: 'https://www.ebrora.com/carbon-reduction-plan-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Carbon Reduction Plan Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered Carbon Reduction Plan generator with 4 regulatory templates — PPN 06/21, SBTi Aligned, ISO 14064, GHG Protocol Corporate. Generates baseline emissions, reduction targets, and board sign-off for UK construction.',
  url: 'https://www.ebrora.com/carbon-reduction-plan-builder',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Programme" }, { label: "Carbon Reduction Plan" }]} />
      </div>
      <CrpBuilderClient />
    </>
  );
}
