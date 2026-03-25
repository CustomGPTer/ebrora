import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Subcontractor Quotation Generator | Ebrora' },
  description: 'Generate professional subcontractor quotations for Tier 1 main contractors. BoQ breakdown, inclusions, exclusions, programme, and commercial terms — submission ready.',
  alternates: { canonical: 'https://www.ebrora.com/quote-generator-builder' },
  openGraph: {
    title: 'AI Subcontractor Quotation Generator | Ebrora',
    description: 'Professional subcontractor quotations with BoQ, inclusions, exclusions, and commercial terms formatted to Tier 1 standards.',
    url: 'https://www.ebrora.com/quote-generator-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['quote-generator'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
