import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: {
    absolute: 'Manual Handling Risk Assessment Generator | Ebrora',
  },
  description: 'AI-powered manual handling risk assessment generator using TILE methodology for UK construction activities.',
  alternates: {
    canonical: 'https://www.ebrora.com/manual-handling-builder',
  },
  openGraph: {
    title: 'Manual Handling Risk Assessment Generator | Ebrora',
    description: 'AI-powered manual handling risk assessment generator using TILE methodology for UK construction activities.',
    url: 'https://www.ebrora.com/manual-handling-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manual Handling Risk Assessment Generator | Ebrora',
    description: 'AI-powered manual handling risk assessment generator using TILE methodology for UK construction activities.',
    images: ['https://www.ebrora.com/og-image.jpg'],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora Manual Handling Risk Assessment Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered manual handling risk assessment generator using TILE methodology for UK construction.',
  url: 'https://www.ebrora.com/manual-handling-builder',
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
  const toolConfig = AI_TOOL_CONFIGS['manual-handling'];

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
