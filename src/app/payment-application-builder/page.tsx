import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Payment Application Generator | Ebrora' },
  description: 'Structured interim payment applications with BoQ breakdown, variations, retention, and CIS deductions. Formatted to Tier 1 main contractor standards.',
  alternates: { canonical: 'https://www.ebrora.com/payment-application-builder' },
  openGraph: {
    title: 'AI Payment Application Generator | Ebrora',
    description: 'Professional interim payment applications with BoQ, variations, retention, and CIS — formatted to Tier 1 submission standards.',
    url: 'https://www.ebrora.com/payment-application-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Payment Application Generator',
  applicationCategory: 'BusinessApplication',
  description: 'Structured interim payment applications with BoQ breakdown, variations, retention, and CIS deductions. Formatted to Tier 1 main contractor standards.',
  url: 'https://www.ebrora.com/payment-application-builder',
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
  const toolConfig = AI_TOOL_CONFIGS['payment-application'];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Commercial", href: "/products" }, { label: "Payment Application Generator" }]} />
      </div>
      <AiToolBuilderClient toolConfig={toolConfig} />
    </>
  );
}
