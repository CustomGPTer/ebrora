import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI POWRA Generator — Point of Work Risk Assessment | Ebrora' },
  description: 'AI-powered POWRA generator. Quick field-level risk assessments with hazards, controls, stop conditions, and team sign-on.',
  alternates: { canonical: 'https://www.ebrora.com/powra-builder' },
  openGraph: {
    title: 'AI POWRA Generator — Point of Work Risk Assessment | Ebrora',
    description: 'AI-powered POWRA generator. Quick field-level risk assessments with hazards, controls, stop conditions, and team sign-on.',
    url: 'https://www.ebrora.com/powra-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['powra'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
