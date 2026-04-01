import type { Metadata } from 'next';
import WasteBuilderClient from './components/WasteBuilderClient';
export const metadata: Metadata = { title: { absolute: 'AI Waste Management Plan Builder | Ebrora' }, description: 'AI-powered waste management plan builder for UK construction.', alternates: { canonical: 'https://www.ebrora.com/waste-management-builder' }, openGraph: { title: 'AI Waste Management Plan Builder | Ebrora', description: 'Professional waste management plan documents.', url: 'https://www.ebrora.com/waste-management-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] } };
export default function Page() { return <WasteBuilderClient />; }
