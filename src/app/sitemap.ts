import { MetadataRoute } from 'next';
import { PRODUCTS } from '@/data/products';
import { POSTS } from '@/data/posts';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://ebrora.com';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/rams-builder`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/toolbox-talks`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/tools`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/free-templates`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/refund-policy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
      ];

  const productPages: MetadataRoute.Sitemap = PRODUCTS.map((product) => ({
        url: `${baseUrl}/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = POSTS.map((post) => ({
        url: `${baseUrl}/blog/${post.id}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...blogPages];
}
