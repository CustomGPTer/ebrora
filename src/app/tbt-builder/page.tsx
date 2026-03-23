import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: {
    absolute: 'AI Toolbox Talk Generator | Ebrora',
  },
  description: 'AI-powered toolbox talk generator for UK construction sites. Generate site-specific safety briefings for any activity or hazard.',
  alternates: {
    canonical: 'https://www.ebrora.com/tbt-builder',
  },
  openGraph: {
    title: 'AI Toolbox Talk Generator | Ebrora',
    description: 'AI-powered toolbox talk generator for UK construction sites. Generate site-specific safety briefings for any activity or hazard.',
    url: 'https://www.ebrora.com/tbt-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Toolbox Talk Generator | Ebrora',
    description: 'AI-powered toolbox talk generator for UK construction sites. Generate site-specific safety briefings for any activity or hazard.',
    images: ['https://www.ebrora.com/og-image.jpg'],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Toolbox Talk Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered toolbox talk generator for UK construction sites. Site-specific safety briefings.',
  url: 'https://www.ebrora.com/tbt-builder',
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
  const toolConfig = AI_TOOL_CONFIGS['tbt-generator'];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <AiToolBuilderClient toolConfig={toolConfig} />
    </>
  );
}
