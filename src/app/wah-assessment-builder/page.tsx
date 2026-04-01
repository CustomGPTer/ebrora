import type { Metadata } from 'next';
import WahBuilderClient from './components/WahBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Working at Height Assessment Builder | 4 Templates | Ebrora' },
  description: 'AI-powered working at height risk assessment builder. WAH Regs 2005 compliant with hierarchy of control, rescue plan, and competency matrix. 4 professional templates.',
  alternates: { canonical: 'https://www.ebrora.com/wah-assessment-builder' },
  openGraph: { title: 'AI Working at Height Assessment Builder | Ebrora', description: 'WAH Regs 2005 compliant risk assessments with 4 professional templates.', url: 'https://www.ebrora.com/wah-assessment-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};

export default function Page() { return <WahBuilderClient />; }
