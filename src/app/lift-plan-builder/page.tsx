import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Lift Plan Generator for Construction | Ebrora' },
  description: 'AI-powered lift plan generator. Load details, crane specification, exclusion zones, appointed persons — BS 7121 compliant.',
  alternates: { canonical: 'https://www.ebrora.com/lift-plan-builder' },
  openGraph: {
    title: 'AI Lift Plan Generator for Construction | Ebrora',
    description: 'AI-powered lift plan generator. Load details, crane specification, exclusion zones, appointed persons — BS 7121 compliant.',
    url: 'https://www.ebrora.com/lift-plan-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['lift-plan'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
