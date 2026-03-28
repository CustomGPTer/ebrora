import type { Metadata } from 'next';
import IncidentReportBuilderClient from './components/IncidentReportBuilderClient';

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

export default function Page() { return <IncidentReportBuilderClient />; }
