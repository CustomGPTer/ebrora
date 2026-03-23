import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: {
    absolute: 'COSHH Assessment Generator | Ebrora',
  },
  description: 'AI-powered COSHH assessment generator for UK construction. Covers hazardous substances, exposure routes, control measures, PPE, and emergency procedures.',
  alternates: {
    canonical: 'https://www.ebrora.com/coshh-builder',
  },
  openGraph: {
    title: 'COSHH Assessment Generator | Ebrora',
    description: 'AI-powered COSHH assessment generator for UK construction. Covers hazardous substances, exposure routes, control measures, PPE, and emergency procedures.',
    url: 'https://www.ebrora.com/coshh-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COSHH Assessment Generator | Ebrora',
    description: 'AI-powered COSHH assessment generator for UK construction. Covers hazardous substances, exposure routes, control measures, PPE, and emergency procedures.',
    images: ['https://www.ebrora.com/og-image.jpg'],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora COSHH Assessment Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered COSHH assessment generator for UK construction projects. Produces regulation-compliant assessments covering hazardous substances, control measures, and PPE requirements.',
  url: 'https://www.ebrora.com/coshh-builder',
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
  const toolConfig = AI_TOOL_CONFIGS['coshh'];

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
