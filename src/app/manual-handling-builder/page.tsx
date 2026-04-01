import type { Metadata } from 'next';
import ManualHandlingBuilderClient from './components/ManualHandlingBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Manual Handling Assessment | 4 Templates | Ebrora' },
  description: 'AI-powered manual handling risk assessment with 4 templates. TILE methodology, HSE MAC scoring, RAPP pushing/pulling, and training briefing cards.',
  alternates: { canonical: 'https://www.ebrora.com/manual-handling-builder' },
  openGraph: {
    title: 'AI Manual Handling Assessment | 4 Templates | Ebrora',
    description: 'AI-powered manual handling assessment with 4 templates: TILE methodology, MAC scoring, RAPP assessment, and training card.',
    url: 'https://www.ebrora.com/manual-handling-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Manual Handling Assessment',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered manual handling risk assessment with 4 templates. TILE methodology, HSE MAC scoring, RAPP pushing/pulling, and training briefing cards.',
  url: 'https://www.ebrora.com/manual-handling-builder',
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
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Health & Safety", href: "/products" }, { label: "Manual Handling Assessment" }]} />
      </div>
      <ManualHandlingBuilderClient />
    </>
  ); }
