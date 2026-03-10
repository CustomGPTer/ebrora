import type { Metadata } from 'next';
import { POSTS, BLOG_CATEGORIES } from '@/data/posts';
import BlogListingClient from '@/components/blog/BlogListingClient';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Excel tips for UK construction, site management guides, and step-by-step template tutorials. Free advice from construction industry professionals at Ebrora.',
  openGraph: {
    title: 'Blog — Ebrora | Excel Tips & Construction Guides',
    description: 'Excel tips for UK construction, site management guides, and step-by-step template tutorials from the Ebrora team.',
    url: 'https://ebrora.com/blog',
  },
};

export default function BlogPage() {
  return <BlogListingClient posts={POSTS} categories={BLOG_CATEGORIES} />;
}
