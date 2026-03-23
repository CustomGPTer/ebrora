import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: {
    absolute: 'Confined Space Risk Assessment Generator | Ebrora',
  },
  description: 'AI-powered confined space risk assessment generator. Atmospheric hazards, entry procedures, rescue plans, and monitoring for UK construction.',
  alternates: {
    canonical: 'https://www.ebrora.com/confined-spaces-builder',
  },
  openGraph: {
    title: 'Confined Space Risk Assessment Generator | Ebrora',
    description: 'AI-powered confined space risk assessment generator. Atmospheric hazards, entry procedures, rescue plans, and monitoring for UK construction.',
    url: 'https://www.ebrora.com/confined-spaces-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Confined Space Risk Assessment Generator | Ebrora',
    description: 'AI-powered confined space risk assessment generator. Atmospheric hazards, entry procedures, rescue plans, and monitoring for UK construction.',
    images: ['https://www.ebrora.com/og-image.jpg'],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora Confined Space Risk Assessment Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered confined space risk assessment generator for UK construction projects.',
  url: 'https://www.ebrora.com/confined-spaces-builder',
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
  const toolConfig = AI_TOOL_CONFIGS['confined-spaces'];

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
