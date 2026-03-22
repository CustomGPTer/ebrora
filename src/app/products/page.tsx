import type { Metadata } from 'next';
import { SearchProvider } from '@/contexts/SearchContext';
import HeroSection from '@/components/home/HeroSection';
import TrustBar from '@/components/home/TrustBar';
import ProductSection from '@/components/home/ProductSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import { PRODUCTS, CATEGORIES } from '@/data/products';

export const metadata: Metadata = {
  title: 'Premium Construction Excel Templates | Browse All | Ebrora',
  description:
    'Browse our full range of professional Excel templates for UK construction and civil engineering. RAMS, COSHH, Gantt charts, inspection registers and more. CDM 2015 compliant, instant download.',
  alternates: {
    canonical: 'https://www.ebrora.com/products',
  },
  openGraph: {
    title: 'Premium Construction Excel Templates | Ebrora',
    description:
      'Professional Excel templates for UK construction. RAMS, COSHH, Gantt charts, inspection registers. CDM 2015 compliant, instant download.',
    url: 'https://www.ebrora.com/products',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Premium Construction Excel Templates | Ebrora',
    description:
      'Professional Excel templates for UK construction. CDM 2015 compliant, instant download, no signup required.',
    images: ['/og-image.jpg'],
  },
};

export default function ProductsPage() {
  return (
    <SearchProvider>
      <HeroSection products={PRODUCTS} />
      <TrustBar />
      <ProductSection products={PRODUCTS} categories={CATEGORIES} />
      <FeaturesSection />
    </SearchProvider>
  );
}
