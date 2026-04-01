import type { Metadata } from 'next';
import ProgrammeCheckerBuilderClient from './components/ProgrammeCheckerBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Construction Programme Checker | 4 Report Templates | Ebrora' },
  description:
    'Upload your construction programme for an AI-powered review. Choose from 4 report templates — Scoring, Email Summary, RAG Report, or Comprehensive. Logic, sequencing, WBS, critical path, and contractual compliance.',
  alternates: { canonical: 'https://www.ebrora.com/programme-checker-builder' },
  openGraph: {
    title: 'AI Construction Programme Checker | 4 Report Templates | Ebrora',
    description:
      'Upload your programme (PDF, XLSX, XER/XML) and choose a report template. Scoring, Email, RAG, or Comprehensive — AI-powered programme review.',
    url: 'https://www.ebrora.com/programme-checker-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Construction Programme Checker',
  applicationCategory: 'BusinessApplication',
  description: 'Upload your construction programme for an AI-powered review. Choose from 4 report templates — Scoring, Email Summary, RAG Report, or Comprehensive. Logic, sequencing, WBS, critical path, and contractual compliance.',
  url: 'https://www.ebrora.com/programme-checker-builder',
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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Programme" }, { label: "Construction Programme Checker" }]} />
      </div>
      <ProgrammeCheckerBuilderClient />
    </>
  );
}
