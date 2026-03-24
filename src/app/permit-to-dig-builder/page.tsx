import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Permit to Dig Generator | Ebrora' },
  description: 'AI-powered permit to dig generator. Utility searches, CAT and Genny, hand-dig zones, safe digging methods — HSG47 compliant.',
  alternates: { canonical: 'https://www.ebrora.com/permit-to-dig-builder' },
  openGraph: {
    title: 'AI Permit to Dig Generator | Ebrora',
    description: 'AI-powered permit to dig generator. Utility searches, CAT and Genny, hand-dig zones, safe digging methods — HSG47 compliant.',
    url: 'https://www.ebrora.com/permit-to-dig-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['permit-to-dig'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
