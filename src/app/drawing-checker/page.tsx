import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: {
    absolute: 'AI Drawing Checker for Construction | Ebrora',
  },
  description: 'AI-powered construction drawing checker. Identifies missing details, annotation gaps, and compliance issues. Generates a formal drawing check report.',
  alternates: {
    canonical: 'https://www.ebrora.com/drawing-checker',
  },
  openGraph: {
    title: 'AI Drawing Checker for Construction | Ebrora',
    description: 'AI-powered construction drawing checker. Identifies missing details, annotation gaps, and compliance issues. Generates a formal drawing check report.',
    url: 'https://www.ebrora.com/drawing-checker',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Drawing Checker for Construction | Ebrora',
    description: 'AI-powered construction drawing checker. Identifies missing details, annotation gaps, and compliance issues. Generates a formal drawing check report.',
    images: ['https://www.ebrora.com/og-image.jpg'],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Drawing Checker',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered construction drawing review tool that generates formal drawing check reports.',
  url: 'https://www.ebrora.com/drawing-checker',
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
  const toolConfig = AI_TOOL_CONFIGS['drawing-checker'];

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
