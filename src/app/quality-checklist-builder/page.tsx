import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Quality Inspection Checklist Generator | Ebrora' },
  description: 'AI-powered quality inspection checklist generator. Activity-specific with hold points, acceptance criteria, and standards.',
  alternates: { canonical: 'https://www.ebrora.com/quality-checklist-builder' },
  openGraph: {
    title: 'AI Quality Inspection Checklist Generator | Ebrora',
    description: 'AI-powered quality inspection checklist generator. Activity-specific with hold points, acceptance criteria, and standards.',
    url: 'https://www.ebrora.com/quality-checklist-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Quality Inspection Checklist Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered quality inspection checklist generator. Activity-specific with hold points, acceptance criteria, and standards.',
  url: 'https://www.ebrora.com/quality-checklist-builder',
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
  const toolConfig = AI_TOOL_CONFIGS['quality-checklist'];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Quality" }, { label: "Quality Inspection Checklist" }]} />
      </div>
      <AiToolBuilderClient toolConfig={toolConfig} />
    </>
  );
}
