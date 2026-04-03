import type { Metadata } from 'next';
import IncidentReportBuilderClient from './components/IncidentReportBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Incident Report Generator | 4 Templates | Ebrora' },
  description: 'AI-powered incident investigation report generator with 4 professional templates. Root cause analysis, 5 Whys, RIDDOR assessment, near miss reporting — for UK construction sites.',
  alternates: { canonical: 'https://www.ebrora.com/incident-report-builder' },
  openGraph: {
    title: 'AI Incident Report Generator | 4 Templates | Ebrora',
    description: 'AI-powered incident report with 4 templates: standard, RIDDOR focused, root cause analysis, and near miss/observation.',
    url: 'https://www.ebrora.com/incident-report-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Incident Report Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered incident investigation report generator with 4 professional templates. Root cause analysis, 5 Whys, RIDDOR assessment, near miss reporting — for UK construction sites.',
  url: 'https://www.ebrora.com/incident-report-builder',
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
    title: 'AI Incident Report Generator | 4 Templates | Ebrora',
    description: 'AI-powered incident report with 4 templates: standard, RIDDOR focused, root cause analysis, and near miss/observation.',
    images: ['/og-image.jpg'],
  },
};
export default function Page() { return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Health & Safety" }, { label: "Incident Report Generator" }]} />
      </div>
      <IncidentReportBuilderClient />
    </>
  ); }
