import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Carbon Reduction Plan Generator | Ebrora' },
  description: 'PPN 06/21 compliant Carbon Reduction Plans for public sector and Tier 1 framework bids. Baseline emissions, net zero targets, reduction measures, and board sign-off.',
  alternates: { canonical: 'https://www.ebrora.com/carbon-reduction-plan-builder' },
  openGraph: {
    title: 'AI Carbon Reduction Plan Generator | Ebrora',
    description: 'PPN 06/21 compliant Carbon Reduction Plans — baseline, targets, reduction measures, and reporting commitments for public sector bids.',
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
  description: 'PPN 06/21 compliant Carbon Reduction Plans for public sector and Tier 1 framework bids. Baseline emissions, net zero targets, reduction measures, and board sign-off.',
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
  const toolConfig = AI_TOOL_CONFIGS['carbon-reduction-plan'];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Programme", href: "/products" }, { label: "Carbon Reduction Plan" }]} />
      </div>
      <AiToolBuilderClient toolConfig={toolConfig} />
    </>
  );
}
