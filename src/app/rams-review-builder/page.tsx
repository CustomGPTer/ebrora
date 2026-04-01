import type { Metadata } from 'next';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
// PHASE 4: AiUploadToolClient will be built in Phase 4 (Upload API).
// Until then this page will render the upload placeholder UI.
import AiUploadToolClient from '@/components/ai-tools/AiUploadToolClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI RAMS Review Tool | Ebrora' },
  description:
    'Upload your RAMS document for a thorough AI review against HSE guidance, CDM 2015, and industry best practice. Gaps identified, improvements suggested. PDF, DOCX, and XLSX accepted.',
  alternates: { canonical: 'https://www.ebrora.com/rams-review-builder' },
  openGraph: {
    title: 'AI RAMS Review Tool | Ebrora',
    description:
      'AI-powered RAMS review — upload your risk assessment and method statement for a gap analysis against HSE guidance and CDM 2015.',
    url: 'https://www.ebrora.com/rams-review-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI RAMS Review Tool',
  applicationCategory: 'BusinessApplication',
  description: 'Upload your RAMS document for a thorough AI review against HSE guidance, CDM 2015, and industry best practice. Gaps identified, improvements suggested. PDF, DOCX, and XLSX accepted.',
  url: 'https://www.ebrora.com/rams-review-builder',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'GBP',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Ebrora',
    url: 'https://www.ebrora.com',
  },
};
export default function Page() {
  const toolConfig = AI_TOOL_CONFIGS['rams-review'];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Health & Safety" }, { label: "RAMS Review Tool" }]} />
      </div>
      <AiUploadToolClient toolConfig={toolConfig} />
    </>
  );
}
