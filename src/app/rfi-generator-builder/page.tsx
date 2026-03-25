import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI RFI Generator — Request for Information | Ebrora' },
  description: 'Generate formal Requests for Information with drawing references, clear questions, impact of non-response, and response deadlines. Structured for Tier 1 acceptance.',
  alternates: { canonical: 'https://www.ebrora.com/rfi-generator-builder' },
  openGraph: {
    title: 'AI RFI Generator | Ebrora',
    description: 'Formal RFIs with drawing references, clear questions, non-response impact, and programme implications — structured to Tier 1 standards.',
    url: 'https://www.ebrora.com/rfi-generator-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['rfi-generator'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
