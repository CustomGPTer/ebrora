import type { Metadata } from 'next';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
// PHASE 4: AiUploadToolClient will be built in Phase 4 (Upload API).
// Until then this page will render the upload placeholder UI.
import AiUploadToolClient from '@/components/ai-tools/AiUploadToolClient';

export const metadata: Metadata = {
  title: { absolute: 'AI Construction Programme Checker | Ebrora' },
  description:
    'Upload your construction programme for an AI-powered review. Logic errors, sequencing gaps, WBS issues, duration anomalies, and NEC/JCT contractual compliance — RAG-scored report.',
  alternates: { canonical: 'https://www.ebrora.com/programme-checker-builder' },
  openGraph: {
    title: 'AI Construction Programme Checker | Ebrora',
    description:
      'Upload your programme (PDF, XLSX, XER/XML) for a RAG-rated AI review — logic, sequencing, WBS, critical path, and contractual milestone compliance.',
    url: 'https://www.ebrora.com/programme-checker-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['programme-checker'];
  return <AiUploadToolClient toolConfig={toolConfig} />;
}
