import type { Metadata } from 'next';
import NcrBuilderClient from './components/NcrBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Non-Conformance Report Generator | Ebrora' },
  description: 'AI-powered NCR generator. Defect description, root cause analysis, corrective actions, disposition — ISO 9001 aligned.',
  alternates: { canonical: 'https://www.ebrora.com/ncr-builder' },
  openGraph: {
    title: 'AI Non-Conformance Report Generator | Ebrora',
    description: 'AI-powered NCR generator. Defect description, root cause analysis, corrective actions, disposition — ISO 9001 aligned.',
    url: 'https://www.ebrora.com/ncr-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Non-Conformance Report Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered NCR generator. Defect description, root cause analysis, corrective actions, disposition — ISO 9001 aligned.',
  url: 'https://www.ebrora.com/ncr-builder',
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
  twitter: {
    card: 'summary_large_image',
    title: 'AI Non-Conformance Report Generator | Ebrora',
    description: 'AI-powered NCR generator. Defect description, root cause analysis, corrective actions, disposition — ISO 9001 aligned.',
    images: ['/og-image.jpg'],
  },
};
export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Quality" }, { label: "NCR Generator" }]} />
      </div>
      <NcrBuilderClient />
    </>
  );
}
