import type { Metadata } from 'next';
import ManualHandlingBuilderClient from './components/ManualHandlingBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Manual Handling Assessment | 4 Templates | Ebrora' },
  description: 'AI-powered manual handling risk assessment with 4 templates. TILE methodology, HSE MAC scoring, RAPP pushing/pulling, and training briefing cards.',
  alternates: { canonical: 'https://www.ebrora.com/manual-handling-builder' },
  openGraph: {
    title: 'AI Manual Handling Assessment | 4 Templates | Ebrora',
    description: 'AI-powered manual handling assessment with 4 templates: TILE methodology, MAC scoring, RAPP assessment, and training card.',
    url: 'https://www.ebrora.com/manual-handling-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() { return <ManualHandlingBuilderClient />; }
