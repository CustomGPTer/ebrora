import type { Metadata } from 'next';
import VariationBuilderClient from './components/VariationBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Variation Confirmation Builder | 3 Templates | Ebrora' },
  description: 'AI-powered variation confirmation builder with 3 professional templates for UK construction.',
  alternates: { canonical: 'https://www.ebrora.com/variation-confirmation-builder' },
  openGraph: { title: 'AI Variation Confirmation Builder | Ebrora', description: 'Variation Confirmation with 3 templates.', url: 'https://www.ebrora.com/variation-confirmation-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};

export default function Page() { return <VariationBuilderClient />; }
