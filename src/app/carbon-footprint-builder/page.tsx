import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Construction Carbon Footprint Generator | Ebrora' },
  description: 'Activity-based carbon footprint assessments for construction works using ICE v3.2 emission factors. Materials, plant, transport, waste, and reduction opportunities.',
  alternates: { canonical: 'https://www.ebrora.com/carbon-footprint-builder' },
  openGraph: {
    title: 'AI Construction Carbon Footprint Generator | Ebrora',
    description: 'ICE v3.2 carbon footprint assessments for UK construction — materials, plant, transport, waste quantified with reduction opportunities identified.',
    url: 'https://www.ebrora.com/carbon-footprint-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['carbon-footprint'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
