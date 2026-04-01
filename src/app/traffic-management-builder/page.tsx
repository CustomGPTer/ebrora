import type { Metadata } from 'next';
import TrafficBuilderClient from './components/TrafficBuilderClient';
export const metadata: Metadata = { title: { absolute: 'AI Traffic Management Plan Builder | Ebrora' }, description: 'AI-powered traffic management plan builder for UK construction.', alternates: { canonical: 'https://www.ebrora.com/traffic-management-builder' }, openGraph: { title: 'AI Traffic Management Plan Builder | Ebrora', description: 'Professional traffic management plan documents.', url: 'https://www.ebrora.com/traffic-management-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] } };
export default function Page() { return <TrafficBuilderClient />; }
