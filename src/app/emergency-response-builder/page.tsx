import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Emergency Response Plan Generator | Ebrora' },
  description: 'AI-powered emergency response plan generator for UK construction sites. Fire, first aid, spills, evacuation — site-specific and CDM compliant.',
  alternates: { canonical: 'https://www.ebrora.com/emergency-response-builder' },
  openGraph: {
    title: 'AI Emergency Response Plan Generator | Ebrora',
    description: 'AI-powered emergency response plan generator for UK construction sites. Fire, first aid, spills, evacuation — site-specific and CDM compliant.',
    url: 'https://www.ebrora.com/emergency-response-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['emergency-response'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
