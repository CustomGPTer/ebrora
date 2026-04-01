import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Daywork Sheet Generator | Ebrora' },
  description: 'Generate CECA Schedule of Dayworks 2011 compliant daywork sheets. Labour, plant, materials, supervision, and overheads formatted for Tier 1 acceptance.',
  alternates: { canonical: 'https://www.ebrora.com/daywork-sheet-builder' },
  openGraph: {
    title: 'AI Daywork Sheet Generator | Ebrora',
    description: 'CECA-compliant daywork sheets with labour, plant, materials, and overheads — structured for Tier 1 acceptance and countersignature.',
    url: 'https://www.ebrora.com/daywork-sheet-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Daywork Sheet Generator',
  applicationCategory: 'BusinessApplication',
  description: 'Generate CECA Schedule of Dayworks 2011 compliant daywork sheets. Labour, plant, materials, supervision, and overheads formatted for Tier 1 acceptance.',
  url: 'https://www.ebrora.com/daywork-sheet-builder',
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
  const toolConfig = AI_TOOL_CONFIGS['daywork-sheet'];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Commercial", href: "/products" }, { label: "Daywork Sheet Generator" }]} />
      </div>
      <AiToolBuilderClient toolConfig={toolConfig} />
    </>
  );
}
