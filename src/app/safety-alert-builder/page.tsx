import type { Metadata } from 'next';
import SafetyAlertBuilderClient from './components/SafetyAlertBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Safety Alert Generator for Construction | Ebrora' },
  description: 'Turn incident descriptions and near misses into professional safety alert bulletins — structured, clear, and ready for site distribution.',
  alternates: { canonical: 'https://www.ebrora.com/safety-alert-builder' },
  openGraph: {
    title: 'AI Safety Alert Generator for Construction | Ebrora',
    description: 'Generate professional safety alert bulletins from incidents and near misses. Lessons learned, preventive actions, and distribution record.',
    url: 'https://www.ebrora.com/safety-alert-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Safety Alert Generator for Construction',
  applicationCategory: 'BusinessApplication',
  description: 'Turn incident descriptions and near misses into professional safety alert bulletins — structured, clear, and ready for site distribution.',
  url: 'https://www.ebrora.com/safety-alert-builder',
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
    title: 'AI Safety Alert Generator for Construction | Ebrora',
    description: 'Generate professional safety alert bulletins from incidents and near misses. Lessons learned, preventive actions, and distribution record.',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Health & Safety" }, { label: "Safety Alert Generator" }]} />
      </div>
      <SafetyAlertBuilderClient />
    </>
  );
}
