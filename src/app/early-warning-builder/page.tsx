import type { Metadata } from 'next';
import EarlyWarningBuilderClient from './components/EarlyWarningBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Early Warning Notice Builder | 8 NEC Templates | Ebrora' },
  description: 'AI-powered NEC early warning notice builder with 8 professional templates. Contractor → PM, PM → Contractor, Subcontractor, Health & Safety, Design, Weather — NEC3/NEC4 Clause 15 compliant.',
  alternates: { canonical: 'https://www.ebrora.com/early-warning-builder' },
  openGraph: {
    title: 'AI Early Warning Notice Builder | 8 NEC Templates | Ebrora',
    description: 'AI-powered NEC early warning notice builder with 8 professional templates. All contract directions, risk categories, and detail levels — NEC3/NEC4 compliant.',
    url: 'https://www.ebrora.com/early-warning-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  return <EarlyWarningBuilderClient />;
}
