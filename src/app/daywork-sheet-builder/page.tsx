import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Daywork Sheet Generator | Ebrora' },
  description: 'Generate CECA Schedule of Dayworks 2011 compliant daywork sheets. Labour, plant, materials, supervision, and overheads formatted for Tier 1 acceptance.',
  alternates: { canonical: 'https://www.ebrora.com/daywork-sheet-builder' },
  openGraph: {
    title: 'AI Daywork Sheet Generator | Ebrora',
    description: 'CECA-compliant daywork sheets with labour, plant, materials, and overheads — structured for Tier 1 acceptance and countersignature.',
    url: 'https://www.ebrora.com/daywork-sheet-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['daywork-sheet'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
