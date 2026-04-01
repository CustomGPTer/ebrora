import type { Metadata } from 'next';
import InvasiveBuilderClient from './components/InvasiveBuilderClient';
export const metadata: Metadata = { title: { absolute: 'AI Invasive Species Management Plan Builder | Ebrora' }, description: 'AI-powered invasive species management plan builder for UK construction.', alternates: { canonical: 'https://www.ebrora.com/invasive-species-builder' }, openGraph: { title: 'AI Invasive Species Management Plan Builder | Ebrora', description: 'Professional invasive species management plan documents.', url: 'https://www.ebrora.com/invasive-species-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] } };
export default function Page() { return <InvasiveBuilderClient />; }
