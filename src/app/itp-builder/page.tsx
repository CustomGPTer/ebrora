import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: {
    absolute: 'ITP Generator – Inspection & Test Plans | Ebrora',
  },
  description: 'AI-powered inspection and test plan generator for UK construction. Hold points, witness points, sign-off matrices, and quality verification.',
  alternates: {
    canonical: 'https://www.ebrora.com/itp-builder',
  },
  openGraph: {
    title: 'ITP Generator – Inspection & Test Plans | Ebrora',
    description: 'AI-powered inspection and test plan generator for UK construction. Hold points, witness points, sign-off matrices, and quality verification.',
    url: 'https://www.ebrora.com/itp-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ITP Generator – Inspection & Test Plans | Ebrora',
    description: 'AI-powered inspection and test plan generator for UK construction. Hold points, witness points, sign-off matrices, and quality verification.',
    images: ['https://www.ebrora.com/og-image.jpg'],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora ITP Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered inspection and test plan generator for UK construction. Hold points, witness points, and sign-off matrices.',
  url: 'https://www.ebrora.com/itp-builder',
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
  const toolConfig = AI_TOOL_CONFIGS['itp'];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Quality", href: "/products" }, { label: "ITP Builder" }]} />
      </div>
      <AiToolBuilderClient toolConfig={toolConfig} />
    </>
  );
}
