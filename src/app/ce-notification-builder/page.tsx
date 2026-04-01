import type { Metadata } from 'next';
import CeBuilderClient from './components/CeBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Compensation Event Notification Builder | 3 Templates | Ebrora' },
  description: 'AI-powered compensation event notification builder with 3 professional templates for UK construction.',
  alternates: { canonical: 'https://www.ebrora.com/ce-notification-builder' },
  openGraph: { title: 'AI Compensation Event Notification Builder | Ebrora', description: 'Compensation Event Notification with 3 templates.', url: 'https://www.ebrora.com/ce-notification-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};

export default function Page() { return <CeBuilderClient />; }
