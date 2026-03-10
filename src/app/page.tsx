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
