import type { Metadata } from 'next';
import CdmCheckerBuilderClient from './components/CdmCheckerBuilderClient';

export const metadata: Metadata = {
  title: { absolute: 'AI CDM 2015 Compliance Checker | 4 Templates | Ebrora' },
  description: 'AI-powered CDM 2015 compliance gap analysis with 4 professional templates. Duty holder assessments, compliance matrix, audit trail, and executive summary formats.',
  alternates: { canonical: 'https://www.ebrora.com/cdm-checker-builder' },
  openGraph: {
    title: 'AI CDM 2015 Compliance Checker | 4 Templates | Ebrora',
    description: 'AI-powered CDM 2015 compliance gap analysis with 4 professional templates.',
    url: 'https://www.ebrora.com/cdm-checker-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

const toolSchema = {
  '@context': 'https://schema.org', '@type': 'SoftwareApplication',
  name: 'Ebrora AI CDM 2015 Compliance Checker', applicationCategory: 'BusinessApplication',
  description: 'AI-powered CDM 2015 compliance gap analysis with 4 professional templates.',
  url: 'https://www.ebrora.com/cdm-checker-builder', operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  publisher: { '@type': 'Organization', name: 'Ebrora', url: 'https://www.ebrora.com' },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <CdmCheckerBuilderClient />
    </>
  );
}
