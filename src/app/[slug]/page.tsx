// src/app/[slug]/page.tsx — Product detail pages
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS, CATEGORIES } from "@/data/products";
import ProductDetailClient from "@/components/product/ProductDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.id === slug);

  if (!product) {
    return { title: "Product Not Found | Ebrora" };
  }

  const title = `${product.title} | Ebrora`;
  const description = product.desc || `Professional ${product.title} Excel template for UK construction.`;
  const image = product.images?.[0]
    ? `https://www.ebrora.com/${product.images[0]}`
    : "https://www.ebrora.com/og-image.jpg";

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `https://www.ebrora.com/${product.id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.ebrora.com/${product.id}`,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: product.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.id === slug);

  if (!product) notFound();

  // Find related products (same category, excluding self)
  const related = PRODUCTS.filter(
    (p) =>
      p.id !== product.id &&
      p.category.some((cat) => product.category.includes(cat))
  ).slice(0, 4);

  // Extract numeric price for JSON-LD
  const numericPrice = product.price.replace(/[^0-9.]/g, "") || "0";

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.desc,
    url: `https://www.ebrora.com/${product.id}`,
    image: product.images?.[0]
      ? `https://www.ebrora.com/${product.images[0]}`
      : undefined,
    brand: {
      "@type": "Organization",
      name: "Ebrora",
      url: "https://www.ebrora.com",
    },
    offers: {
      "@type": "Offer",
      price: numericPrice,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      url: `https://www.ebrora.com/${product.id}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "12",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient
        product={product}
        related={related}
        categories={CATEGORIES}
      />
    </>
  );
}
