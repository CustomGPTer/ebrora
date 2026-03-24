import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Scope of Works Writer for Construction | Ebrora' },
  description: 'AI-powered scope of works generator. Inclusions, exclusions, interfaces, deliverables — professionally structured.',
  alternates: { canonical: 'https://www.ebrora.com/scope-of-works-builder' },
  openGraph: {
    title: 'AI Scope of Works Writer for Construction | Ebrora',
    description: 'AI-powered scope of works generator. Inclusions, exclusions, interfaces, deliverables — professionally structured.',
    url: 'https://www.ebrora.com/scope-of-works-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['scope-of-works'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
