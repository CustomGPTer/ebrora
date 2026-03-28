import type { Metadata } from 'next';
import PowraBuilderClient from './components/PowraBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI POWRA Generator | 4 Templates | Point of Work Risk Assessment | Ebrora' },
  description: 'AI-powered POWRA generator with 4 professional templates. Hazard matrix, RAG rating, stop conditions, team sign-on — MHSW 1999 compliant.',
  alternates: { canonical: 'https://www.ebrora.com/powra-builder' },
  openGraph: {
    title: 'AI POWRA Generator | 4 Templates | Ebrora',
    description: 'AI-powered POWRA with 4 templates: comprehensive, quick card, task-specific, and supervisor review.',
    url: 'https://www.ebrora.com/powra-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() { return <PowraBuilderClient />; }
