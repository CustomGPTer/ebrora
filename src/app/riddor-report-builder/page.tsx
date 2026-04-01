import type { Metadata } from 'next';
import RiddorBuilderClient from './components/RiddorBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI RIDDOR Report Builder | 3 Templates | Ebrora' },
  description: 'AI-powered RIDDOR report builder. Compliant with RIDDOR 2013. Covers specified injuries, dangerous occurrences, root cause analysis. 3 professional templates.',
  alternates: { canonical: 'https://www.ebrora.com/riddor-report-builder' },
  openGraph: { title: 'AI RIDDOR Report Builder | Ebrora', description: 'RIDDOR 2013 compliant incident reports with root cause analysis and 3 templates.', url: 'https://www.ebrora.com/riddor-report-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};

export default function Page() { return <RiddorBuilderClient />; }
