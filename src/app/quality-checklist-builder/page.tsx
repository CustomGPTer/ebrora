import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Quality Inspection Checklist Generator | Ebrora' },
  description: 'AI-powered quality inspection checklist generator. Activity-specific with hold points, acceptance criteria, and standards.',
  alternates: { canonical: 'https://www.ebrora.com/quality-checklist-builder' },
  openGraph: {
    title: 'AI Quality Inspection Checklist Generator | Ebrora',
    description: 'AI-powered quality inspection checklist generator. Activity-specific with hold points, acceptance criteria, and standards.',
    url: 'https://www.ebrora.com/quality-checklist-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['quality-checklist'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
