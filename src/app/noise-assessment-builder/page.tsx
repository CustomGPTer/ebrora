import type { Metadata } from 'next';
import NoiseAssessmentBuilderClient from './components/NoiseAssessmentBuilderClient';

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

export default function Page() { return <NoiseAssessmentBuilderClient />; }
