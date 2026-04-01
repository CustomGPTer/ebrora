import type { Metadata } from 'next';
import TbtBuilderClient from './components/TbtBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: {
    absolute: 'AI Toolbox Talk Builder | 9 Templates | Ebrora',
  },
  description: 'AI-powered toolbox talk generator with 9 professional templates for UK construction sites. Choose your style, answer a few questions, download a ready-to-brief document.',
  alternates: {
    canonical: 'https://www.ebrora.com/tbt-builder',
  },
  openGraph: {
    title: 'AI Toolbox Talk Builder | 9 Templates | Ebrora',
    description: 'AI-powered toolbox talk generator with 9 professional templates for UK construction sites.',
    url: 'https://www.ebrora.com/tbt-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Toolbox Talk Builder | 9 Templates | Ebrora',
    description: 'AI-powered toolbox talk generator with 9 professional templates for UK construction sites.',
    images: ['https://www.ebrora.com/og-image.jpg'],
  },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ebrora AI Toolbox Talk Builder',
  applicationCategory: 'BusinessApplication',
  description: 'AI-powered toolbox talk generator with 9 professional templates for UK construction sites.',
  url: 'https://www.ebrora.com/tbt-builder',
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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Health & Safety", href: "/products" }, { label: "Toolbox Talk Generator" }]} />
      </div>
      <TbtBuilderClient />
    </>
  );
}
