import type { Metadata } from 'next';
import PowraBuilderClient from './components/PowraBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI POWRA Generator | 4 Templates | Point of Work Risk Assessment | Ebrora' },
  description: 'AI-powered POWRA generator with 4 professional templates. Hazard matrix, RAG rating, stop conditions, team sign-on — MHSW 1999 compliant.',
  alternates: { canonical: 'https://www.ebrora.com/powra-builder' },
  openGraph: {
    title: 'AI POWRA Generator | 4 Templates | Ebrora',
    description: 'AI-powered POWRA with 4 templates: comprehensive, quick card, task-specific, and supervisor review.',
    url: 'https://www.ebrora.com/powra-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};


const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI POWRA Generator',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered POWRA generator with 4 professional templates. Hazard matrix, RAG rating, stop conditions, team sign-on — MHSW 1999 compliant.',
  url: 'https://www.ebrora.com/powra-builder',
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
  twitter: {
    card: 'summary_large_image',
    title: 'AI POWRA Generator | 4 Templates | Ebrora',
    description: 'AI-powered POWRA with 4 templates: comprehensive, quick card, task-specific, and supervisor review.',
    images: ['/og-image.jpg'],
  },
};
export default function Page() { return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/" }, { label: "Health & Safety" }, { label: "POWRA Generator" }]} />
      </div>
      <PowraBuilderClient />
    </>
  ); }
