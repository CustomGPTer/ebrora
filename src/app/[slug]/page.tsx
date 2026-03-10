import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PRODUCTS, CATEGORIES } from '@/data/products';
import type { Product } from '@/lib/types';
import ProductDetailClient from '@/components/product/ProductDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all products
export async function generateStaticParams() {
  return PRODUCTS.map((product) => ({
    slug: product.id,
  }));
}

// Generate metadata for each product
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.id === slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const image = product.images?.[0]
    ? `https://ebrora.com/${product.images[0]}`
    : 'https://ebrora.com/og-image.jpg';

  return {
    title: product.title,
    description: product.desc,
    openGraph: {
      title: `${product.title} — Ebrora`,
      description: product.desc,
      url: `https://ebrora.com/${product.id}`,
      type: 'website',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} — Ebrora`,
      description: product.desc,
      images: [image],
    },
  };
}

// Parse price string to number
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  const num = priceStr.replace(/[^0-9.]/g, '');
  return parseFloat(num) || 0;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.id === slug);

  if (!product) {
    notFound();
  }

  // Find related products (same categories, excluding current, sorted by popularity, max 4)
  const related = PRODUCTS
    .filter((p) => p.id !== product.id && p.category?.some((c) => product.category?.includes(c)))
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 4);

  // Schema.org Product JSON-LD
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.desc,
    image: product.images?.[0] ? `https://ebrora.com/${product.images[0]}` : 'https://ebrora.com/og-image.jpg',
    brand: { '@type': 'Brand', name: 'Ebrora' },
    offers: {
      '@type': 'Offer',
      url: `https://ebrora.com/${product.id}`,
      priceCurrency: 'GBP',
      price: parsePrice(product.price),
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Ebrora' },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '50',
      bestRating: '5',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient product={product} related={related} categories={CATEGORIES} />
    </>
  );
}
