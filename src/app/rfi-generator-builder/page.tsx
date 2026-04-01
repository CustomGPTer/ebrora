import type { Metadata } from 'next';
import RfiBuilderClient from './components/RfiBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Request for Information Builder | 3 Templates | Ebrora' },
  description: 'AI-powered request for information builder with 3 professional templates for UK construction.',
  alternates: { canonical: 'https://www.ebrora.com/rfi-generator-builder' },
  openGraph: { title: 'AI Request for Information Builder | Ebrora', description: 'Request for Information with 3 templates.', url: 'https://www.ebrora.com/rfi-generator-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};

export default function Page() { return <RfiBuilderClient />; }
