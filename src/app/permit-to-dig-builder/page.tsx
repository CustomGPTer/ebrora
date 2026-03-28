import type { Metadata } from 'next';
import PermitToDigBuilderClient from './components/PermitToDigBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Permit to Dig Generator | 4 Templates | Ebrora' },
  description: 'AI-powered permit to dig generator with 4 professional templates. HSG47 compliant — statutory searches, CAT & Genny, hand-dig zones, emergency strike procedures.',
  alternates: { canonical: 'https://www.ebrora.com/permit-to-dig-builder' },
  openGraph: {
    title: 'AI Permit to Dig Generator | 4 Templates | Ebrora',
    description: 'AI-powered permit to dig with 4 templates: comprehensive HSG47, daily shift card, utility strike response, and avoidance plan.',
    url: 'https://www.ebrora.com/permit-to-dig-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() { return <PermitToDigBuilderClient />; }
