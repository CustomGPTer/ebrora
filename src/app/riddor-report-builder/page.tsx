import type { Metadata } from 'next';
import RiddorBuilderClient from './components/RiddorBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI RIDDOR Report Builder | 3 Templates | Ebrora' },
  description: 'AI-powered RIDDOR report builder. Compliant with RIDDOR 2013. Covers specified injuries, dangerous occurrences, root cause analysis. 3 professional templates.',
  alternates: { canonical: 'https://www.ebrora.com/riddor-report-builder' },
  openGraph: { title: 'AI RIDDOR Report Builder | Ebrora', description: 'RIDDOR 2013 compliant incident reports with root cause analysis and 3 templates.', url: 'https://www.ebrora.com/riddor-report-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI RIDDOR Report Builder',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered RIDDOR report builder. Compliant with RIDDOR 2013. Covers specified injuries, dangerous occurrences, root cause analysis. 3 professional templates.',
  url: 'https://www.ebrora.com/riddor-report-builder',
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
export default function Page() { return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Health & Safety", href: "/products" }, { label: "RIDDOR Report Builder" }]} />
      </div>
      <RiddorBuilderClient />
    </>
  ); }
