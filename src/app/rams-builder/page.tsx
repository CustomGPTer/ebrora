import type { Metadata } from 'next';
import RamsLandingClient from './components/RamsLandingClient';

export const metadata: Metadata = {
      title: 'RAMS Builder for Construction Projects',
      description:
              'Generate professional RAMS documents for construction projects. AI-powered risk assessments and method statements. CDM 2015 compliant, ready for site use.',
      alternates: {
              canonical: 'https://ebrora.com/rams-builder',
      },
      openGraph: {
              title: 'RAMS Builder for Construction Projects | Ebrora',
              description:
                        'Generate professional RAMS documents for construction. AI-powered risk assessments and method statements.',
              url: 'https://ebrora.com/rams-builder',
              type: 'website',
              images: [{ url: 'https://ebrora.com/og-image.jpg', width: 1200, height: 630 }],
      },
      twitter: {
              card: 'summary_large_image',
              title: 'RAMS Builder for Construction Projects | Ebrora',
              description:
                        'AI-powered RAMS document generator for construction. CDM 2015 compliant risk assessments and method statements.',
              images: ['https://ebrora.com/og-image.jpg'],
      },
};

export default function RamsBuilderPage() {
      return <RamsLandingClient />;
}
