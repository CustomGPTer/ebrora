import type { Metadata } from 'next';
import DelayBuilderClient from './components/DelayBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Delay Notification Builder | 3 Templates | Ebrora' },
  description: 'AI-powered delay notification builder with 3 professional templates for UK construction.',
  alternates: { canonical: 'https://www.ebrora.com/delay-notification-builder' },
  openGraph: { title: 'AI Delay Notification Builder | Ebrora', description: 'Delay Notification with 3 templates.', url: 'https://www.ebrora.com/delay-notification-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};

export default function Page() { return <DelayBuilderClient />; }
