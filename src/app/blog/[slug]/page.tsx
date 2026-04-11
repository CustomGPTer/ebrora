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
    title: {
      absolute: `${post.title} | Ebrora Blog`,
    },
    description: post.excerpt,
    alternates: {
      canonical: `https://www.ebrora.com/blog/${post.id}`,
    },
    openGraph: {
      title: `${post.title} | Ebrora Blog`,
      description: post.excerpt,
      url: `https://www.ebrora.com/blog/${post.id}`,
      type: 'article',
      publishedTime: post.date,
      images: post.featuredImage
        ? [{ url: `https://www.ebrora.com/${post.featuredImage}`, width: 1200, height: 630, alt: post.title }]
        : [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | Ebrora Blog`,
      description: post.excerpt,
      images: post.featuredImage
        ? [`https://www.ebrora.com/${post.featuredImage}`]
        : ['https://www.ebrora.com/og-image.jpg'],
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

  const relatedProducts = post.relatedProducts
    ?.map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean) || [];

  const relatedPosts = POSTS.filter(
    (p) => p.id !== post.id && p.category === post.category
  ).slice(0, 3);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Ebrora',
      url: 'https://www.ebrora.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.ebrora.com/og-image.jpg',
      },
    },
    description: post.excerpt,
    image: post.featuredImage
      ? `https://www.ebrora.com/${post.featuredImage}`
      : 'https://www.ebrora.com/og-image.jpg',
    url: `https://www.ebrora.com/blog/${post.id}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.ebrora.com/blog/${post.id}`,
    },
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
        relatedLinks={post.relatedLinks || []}
      />
    </>
  );
}
