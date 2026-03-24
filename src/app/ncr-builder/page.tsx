import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Non-Conformance Report Generator | Ebrora' },
  description: 'AI-powered NCR generator. Defect description, root cause analysis, corrective actions, disposition — ISO 9001 aligned.',
  alternates: { canonical: 'https://www.ebrora.com/ncr-builder' },
  openGraph: {
    title: 'AI Non-Conformance Report Generator | Ebrora',
    description: 'AI-powered NCR generator. Defect description, root cause analysis, corrective actions, disposition — ISO 9001 aligned.',
    url: 'https://www.ebrora.com/ncr-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['ncr'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
