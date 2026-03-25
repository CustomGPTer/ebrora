import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Safety Alert Generator for Construction | Ebrora' },
  description: 'Turn incident descriptions and near misses into professional safety alert bulletins — structured, clear, and ready for site distribution.',
  alternates: { canonical: 'https://www.ebrora.com/safety-alert-builder' },
  openGraph: {
    title: 'AI Safety Alert Generator for Construction | Ebrora',
    description: 'Generate professional safety alert bulletins from incidents and near misses. Lessons learned, preventive actions, and distribution record.',
    url: 'https://www.ebrora.com/safety-alert-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['safety-alert'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
