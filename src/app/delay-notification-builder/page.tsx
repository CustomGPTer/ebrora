import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Delay Notification Letter Generator | Ebrora' },
  description: 'Contract-compliant delay notification letters for NEC3, NEC4, JCT SBC, and JCT D&B. Clause references, programme impact, mitigation, and entitlement argument.',
  alternates: { canonical: 'https://www.ebrora.com/delay-notification-builder' },
  openGraph: {
    title: 'AI Delay Notification Letter Generator | Ebrora',
    description: 'Formal delay notification letters for NEC and JCT contracts — clause references, programme impact, mitigation measures, and entitlement protection.',
    url: 'https://www.ebrora.com/delay-notification-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['delay-notification'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
