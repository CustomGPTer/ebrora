import type { Metadata } from 'next';
import ConfinedSpacesBuilderClient from './components/ConfinedSpacesBuilderClient';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

export const metadata: Metadata = {
  title: { absolute: 'AI Confined Space Assessment Builder | 4 Templates | Ebrora' },
  description: 'AI-powered confined space risk assessment with 4 professional templates. 22-section assessments covering atmospheric monitoring, rescue plans, SIMOPS, and permit-to-enter formats.',
  alternates: { canonical: 'https://www.ebrora.com/confined-spaces-builder' },
  openGraph: {
    title: 'AI Confined Space Assessment Builder | 4 Templates | Ebrora',
    description: 'AI-powered confined space assessment with 4 templates including permit-style and rescue-focused formats.',
    url: 'https://www.ebrora.com/confined-spaces-builder',
    type: 'website',
    images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

const toolSchema = {
  '@context': 'https://schema.org', '@type': 'SoftwareApplication',
  name: 'Ebrora AI Confined Space Assessment Builder', applicationCategory: 'BusinessApplication',
  description: 'AI-powered confined space assessment with 4 professional templates.',
  url: 'https://www.ebrora.com/confined-spaces-builder', operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  publisher: { '@type': 'Organization', name: 'Ebrora', url: 'https://www.ebrora.com' },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <div className="max-w-[1200px] mx-auto px-6 pt-4">
        <BreadcrumbNav items={[{ label: "AI Tools", href: "/products" }, { label: "Health & Safety", href: "/products" }, { label: "Confined Space Assessment" }]} />
      </div>
      <ConfinedSpacesBuilderClient />
    </>
  );
}
