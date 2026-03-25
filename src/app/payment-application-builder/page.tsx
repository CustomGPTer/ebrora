import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Payment Application Generator | Ebrora' },
  description: 'Structured interim payment applications with BoQ breakdown, variations, retention, and CIS deductions. Formatted to Tier 1 main contractor standards.',
  alternates: { canonical: 'https://www.ebrora.com/payment-application-builder' },
  openGraph: {
    title: 'AI Payment Application Generator | Ebrora',
    description: 'Professional interim payment applications with BoQ, variations, retention, and CIS — formatted to Tier 1 submission standards.',
    url: 'https://www.ebrora.com/payment-application-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['payment-application'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
