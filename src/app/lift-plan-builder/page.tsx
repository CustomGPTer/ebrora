import type { Metadata } from 'next';
import LiftPlanBuilderClient from './components/LiftPlanBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Lift Plan Generator | 4 Templates | Ebrora' },
  description: 'AI-powered lift plan generator with 4 professional templates. Load details, crane specification, exclusion zones, tandem lifts — BS 7121 and LOLER 1998 compliant.',
  alternates: { canonical: 'https://www.ebrora.com/lift-plan-builder' },
  openGraph: {
    title: 'AI Lift Plan Generator | 4 Templates | Ebrora',
    description: 'AI-powered lift plan with 4 templates: comprehensive, crane operator brief, tandem/complex lift, and LOLER compliance.',
    url: 'https://www.ebrora.com/lift-plan-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() { return <LiftPlanBuilderClient />; }
