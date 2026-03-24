import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Compensation Event Notification Generator | Ebrora' },
  description: 'AI-powered NEC compensation event notification generator. Clause references, impact assessment, entitlement argument.',
  alternates: { canonical: 'https://www.ebrora.com/ce-notification-builder' },
  openGraph: {
    title: 'AI Compensation Event Notification Generator | Ebrora',
    description: 'AI-powered NEC compensation event notification generator. Clause references, impact assessment, entitlement argument.',
    url: 'https://www.ebrora.com/ce-notification-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['ce-notification'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
