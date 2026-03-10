import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { POSTS, BLOG_CATEGORIES } from '@/data/posts';
import { PRODUCTS } from '@/data/products';
import BlogPostClient from '@/components/blog/BlogPostClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.id === slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} — Ebrora Blog`,
      description: post.excerpt,
      url: `https://ebrora.com/blog/${post.id}`,
      type: 'article',
      publishedTime: post.date,
      images: post.featuredImage ? [{ url: `https://ebrora.com/${post.featuredImage}` }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.id === slug);

  if (!post) {
    notFound();
  }

  const category = BLOG_CATEGORIES[post.category];

  // Get related products
  const relatedProducts = post.relatedProducts
    ?.map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean) || [];

  // Get related posts (same category, max 3, excluding current)
  const relatedPosts = POSTS.filter(
    (p) => p.id !== post.id && p.category === post.category
  ).slice(0, 3);

  // Schema.org Article JSON-LD
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'Ebrora', url: 'https://ebrora.com' },
    description: post.excerpt,
    image: post.featuredImage ? `https://ebrora.com/${post.featuredImage}` : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <BlogPostClient
        post={post}
        category={category}
        relatedProducts={relatedProducts}
        relatedPosts={relatedPosts}
      />
    </>
  );
}
