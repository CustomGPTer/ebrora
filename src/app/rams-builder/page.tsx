import type { Metadata } from 'next';
import RamsLandingClient from './components/RamsLandingClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: {
    absolute: 'RAMS Builder for Construction Projects | Ebrora',
  },
  description:
    'Generate professional RAMS documents for construction projects. AI-powered risk assessments and method statements. CDM 2015 compliant, ready for site use.',
  alternates: {
    canonical: 'https://www.ebrora.com/rams-builder',
  },
  openGraph: {
    title: 'RAMS Builder for Construction Projects | Ebrora',
    description:
      'Generate professional RAMS documents for construction. AI-powered risk assessments and method statements.',
    url: 'https://www.ebrora.com/rams-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAMS Builder for Construction Projects | Ebrora',
    description:
      'AI-powered RAMS document generator for construction. CDM 2015 compliant risk assessments and method statements.',
    images: ['https://www.ebrora.com/og-image.jpg'],
  },
};

const ramsBuilderSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora RAMS Builder',
  applicationCategory: 'BusinessApplication',
  description:
    'AI-powered RAMS document generator for UK construction projects. Produces CDM 2015 compliant risk assessments and method statements.',
  url: 'https://www.ebrora.com/rams-builder',
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

export default function RamsBuilderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ramsBuilderSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "RAMS", href: "/products" }, { label: "RAMS Builder" }]} />
      </div>
      <RamsLandingClient />
    </>
  );
}
