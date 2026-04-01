import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: {
    absolute: 'DSE Assessment Generator | Ebrora',
  },
  description: 'AI-powered DSE workstation assessment generator covering posture, screen setup, lighting, and eye strain for UK workplaces.',
  alternates: {
    canonical: 'https://www.ebrora.com/dse-builder',
  },
  openGraph: {
    title: 'DSE Assessment Generator | Ebrora',
    description: 'AI-powered DSE workstation assessment generator covering posture, screen setup, lighting, and eye strain for UK workplaces.',
    url: 'https://www.ebrora.com/dse-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DSE Assessment Generator | Ebrora',
    description: 'AI-powered DSE workstation assessment generator covering posture, screen setup, lighting, and eye strain for UK workplaces.',
    images: ['https://www.ebrora.com/og-image.jpg'],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora DSE Assessment Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered display screen equipment assessment generator for UK workplaces.',
  url: 'https://www.ebrora.com/dse-builder',
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
  const toolConfig = AI_TOOL_CONFIGS['dse'];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Health & Safety", href: "/products" }, { label: "DSE Assessment" }]} />
      </div>
      <AiToolBuilderClient toolConfig={toolConfig} />
    </>
  );
}
