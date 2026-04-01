import type { Metadata } from 'next';
import WahBuilderClient from './components/WahBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Working at Height Assessment Builder | 4 Templates | Ebrora' },
  description: 'AI-powered working at height risk assessment builder. WAH Regs 2005 compliant with hierarchy of control, rescue plan, and competency matrix. 4 professional templates.',
  alternates: { canonical: 'https://www.ebrora.com/wah-assessment-builder' },
  openGraph: { title: 'AI Working at Height Assessment Builder | Ebrora', description: 'WAH Regs 2005 compliant risk assessments with 4 professional templates.', url: 'https://www.ebrora.com/wah-assessment-builder', type: 'website', images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }] },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Working at Height Assessment Builder',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered working at height risk assessment builder. WAH Regs 2005 compliant with hierarchy of control, rescue plan, and competency matrix. 4 professional templates.',
  url: 'https://www.ebrora.com/wah-assessment-builder',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Health & Safety" }, { label: "Working at Height Assessment Builder" }]} />
      </div>
      <WahBuilderClient />
    </>
  ); }
