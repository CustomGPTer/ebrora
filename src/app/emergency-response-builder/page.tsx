import type { Metadata } from 'next';
import ErpBuilderClient from './components/ErpBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Emergency Response Plan Generator | 4 Templates | Ebrora' },
  description: 'AI-powered emergency response plan generator with 4 professional templates. Fire, medical, environmental, and site-specific scenarios — CDM compliant.',
  alternates: { canonical: 'https://www.ebrora.com/emergency-response-builder' },
  openGraph: {
    title: 'AI Emergency Response Plan Generator | 4 Templates | Ebrora',
    description: 'AI-powered ERP with 4 templates: standard, quick reference, role-based, and multi-scenario flowcharts.',
    url: 'https://www.ebrora.com/emergency-response-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() { return <ErpBuilderClient />; }
