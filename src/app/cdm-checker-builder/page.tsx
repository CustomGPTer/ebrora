import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI CDM 2015 Compliance Checker | Ebrora' },
  description: 'AI-powered CDM 2015 compliance checker. Gap analysis across all duty holder responsibilities — Client, PD, PC, Designer, and Contractor. HSE L153 aligned.',
  alternates: { canonical: 'https://www.ebrora.com/cdm-checker-builder' },
  openGraph: {
    title: 'AI CDM 2015 Compliance Checker | Ebrora',
    description: 'AI-powered CDM 2015 compliance gap analysis. Duty holder responsibilities assessed against the Construction (Design and Management) Regulations 2015.',
    url: 'https://www.ebrora.com/cdm-checker-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['cdm-checker'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
