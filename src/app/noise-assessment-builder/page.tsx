import type { Metadata } from 'next';
import NoiseAssessmentBuilderClient from './components/NoiseAssessmentBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Noise Assessment Generator | 4 Templates | Ebrora' },
  description: 'AI-powered BS 5228 construction noise assessment with 4 templates. Full assessment, Section 61 application, monitoring report, and resident communication.',
  alternates: { canonical: 'https://www.ebrora.com/noise-assessment-builder' },
  openGraph: {
    title: 'AI Noise Assessment Generator | 4 Templates | Ebrora',
    description: 'BS 5228 noise assessment with 4 templates: comprehensive, Section 61, monitoring report, resident communication.',
    url: 'https://www.ebrora.com/noise-assessment-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Noise Assessment Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered BS 5228 construction noise assessment with 4 templates. Full assessment, Section 61 application, monitoring report, and resident communication.',
  url: 'https://www.ebrora.com/noise-assessment-builder',
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
export default function Page() { return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Health & Safety" }, { label: "Noise Assessment Generator" }]} />
      </div>
      <NoiseAssessmentBuilderClient />
    </>
  ); }
