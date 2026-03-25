import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Construction Noise Assessment Generator | Ebrora' },
  description: 'AI-powered BS 5228-1:2009+A1:2014 compliant construction noise assessment. Plant noise levels, receptor predictions, impact ratings, and mitigation measures.',
  alternates: { canonical: 'https://www.ebrora.com/noise-assessment-builder' },
  openGraph: {
    title: 'AI Construction Noise Assessment Generator | Ebrora',
    description: 'BS 5228 compliant construction noise assessments — plant levels, receptor distances, impact criteria, and mitigation measures.',
    url: 'https://www.ebrora.com/noise-assessment-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['noise-assessment'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
