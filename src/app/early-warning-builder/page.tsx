import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Early Warning Notice Generator | Ebrora' },
  description: 'AI-powered NEC early warning notice generator. Risk description, impact assessment, mitigation — contract-compliant format.',
  alternates: { canonical: 'https://www.ebrora.com/early-warning-builder' },
  openGraph: {
    title: 'AI Early Warning Notice Generator | Ebrora',
    description: 'AI-powered NEC early warning notice generator. Risk description, impact assessment, mitigation — contract-compliant format.',
    url: 'https://www.ebrora.com/early-warning-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['early-warning'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
