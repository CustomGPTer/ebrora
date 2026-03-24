import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Incident Report Generator for Construction | Ebrora' },
  description: 'AI-powered incident investigation report generator. Root cause analysis, 5 Whys, RIDDOR assessment, corrective actions — for UK construction sites.',
  alternates: { canonical: 'https://www.ebrora.com/incident-report-builder' },
  openGraph: {
    title: 'AI Incident Report Generator for Construction | Ebrora',
    description: 'AI-powered incident investigation report generator. Root cause analysis, 5 Whys, RIDDOR assessment, corrective actions — for UK construction sites.',
    url: 'https://www.ebrora.com/incident-report-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['incident-report'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
