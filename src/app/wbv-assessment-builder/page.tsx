import type { Metadata } from 'next';
import WbvBuilderClient from './components/WbvBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Whole Body Vibration Assessment Builder | 3 Templates | Ebrora' },
  description: 'AI-powered WBV assessment builder. Control of Vibration at Work Regs 2005 compliant with A(8) exposure calculations, EAV/ELV thresholds. 3 professional templates.',
  alternates: { canonical: 'https://www.ebrora.com/wbv-assessment-builder' },
  openGraph: { title: 'AI WBV Assessment Builder | Ebrora', description: 'Vibration Regs 2005 compliant assessments with A(8) calculations and 3 templates.', url: 'https://www.ebrora.com/wbv-assessment-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};

export default function Page() { return <WbvBuilderClient />; }
