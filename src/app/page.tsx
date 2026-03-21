import type { Metadata } from 'next';
import { SearchProvider } from '@/contexts/SearchContext';
import HeroSection from '@/components/home/HeroSection';
import TrustBar from '@/components/home/TrustBar';
import ProductSection from '@/components/home/ProductSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import AboutSection from '@/components/home/AboutSection';
import ReviewsSection from '@/components/home/ReviewsSection';
import NewsletterSection from '@/components/home/NewsletterSection';
import ContactSection from '@/components/home/ContactSection';
import { PRODUCTS, CATEGORIES, REVIEWS } from '@/data/products';

export const metadata: Metadata = {
  title: 'Construction Excel Templates for UK Sites | Ebrora',
  description:
    'Download professional Excel templates for UK construction and civil engineering. RAMS, COSHH, Gantt charts, inspection registers and more. CDM 2015 compliant, instant download.',
  alternates: {
    canonical: 'https://www.ebrora.com',
  },
  openGraph: {
    title: 'Construction Excel Templates for UK Sites | Ebrora',
    description:
      'Professional Excel templates for UK construction. RAMS, COSHH, Gantt charts, inspection registers. CDM 2015 compliant, instant download.',
    url: 'https://www.ebrora.com',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Construction Excel Templates for UK Sites | Ebrora',
    description:
      'Professional Excel templates for UK construction. CDM 2015 compliant, instant download, no signup required.',
    images: ['/og-image.jpg'],
  },
};

export default function HomePage() {
  return (
    <SearchProvider>
      <HeroSection products={PRODUCTS} />
      <TrustBar />
      <ProductSection products={PRODUCTS} categories={CATEGORIES} />
      <FeaturesSection />
      <AboutSection
        templateCount={PRODUCTS.length}
        categoryCount={Object.keys(CATEGORIES).length}
      />
      <ReviewsSection reviews={REVIEWS} />
      <NewsletterSection />
      <ContactSection />
    </SearchProvider>
  );
}
