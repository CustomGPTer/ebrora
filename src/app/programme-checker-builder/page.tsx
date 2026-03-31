import type { Metadata } from 'next';
import ProgrammeCheckerBuilderClient from './components/ProgrammeCheckerBuilderClient';

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

export default function Page() {
  return <ProgrammeCheckerBuilderClient />;
}
