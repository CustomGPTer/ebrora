import type { Metadata } from 'next';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';

export const metadata: Metadata = {
  title: { absolute: 'AI Carbon Reduction Plan Generator | Ebrora' },
  description: 'PPN 06/21 compliant Carbon Reduction Plans for public sector and Tier 1 framework bids. Baseline emissions, net zero targets, reduction measures, and board sign-off.',
  alternates: { canonical: 'https://www.ebrora.com/carbon-reduction-plan-builder' },
  openGraph: {
    title: 'AI Carbon Reduction Plan Generator | Ebrora',
    description: 'PPN 06/21 compliant Carbon Reduction Plans — baseline, targets, reduction measures, and reporting commitments for public sector bids.',
    url: 'https://www.ebrora.com/carbon-reduction-plan-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['carbon-reduction-plan'];
  return <AiToolBuilderClient toolConfig={toolConfig} />;
}
