import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Variation Confirmation Letter Generator | Ebrora' },
  description: 'Confirm verbal variation instructions in writing. Contract references, cost and time impact, and request for formal written instruction — protecting subcontractor entitlement.',
  alternates: { canonical: 'https://www.ebrora.com/variation-confirmation-builder' },
  openGraph: {
    title: 'AI Variation Confirmation Letter Generator | Ebrora',
    description: 'Formally confirm verbal variation instructions with contract references, cost and time impact, and entitlement protection.',
    url: 'https://www.ebrora.com/variation-confirmation-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['variation-confirmation'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
