import { MetadataRoute } from 'next';
import { PRODUCTS } from '@/data/products';
import { POSTS } from '@/data/posts';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
      const baseUrl = 'https://www.ebrora.com';

  const staticPages: MetadataRoute.Sitemap = [
      {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 1.0,
      },
      {
                url: `${baseUrl}/blog`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
      },
      {
                url: `${baseUrl}/faq`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.7,
      },
      {
                url: `${baseUrl}/rams-builder`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.9,
      },
      {
                url: `${baseUrl}/toolbox-talks`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
      },
      {
                url: `${baseUrl}/tools`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.7,
      },
      {
                url: `${baseUrl}/free-templates`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.7,
      },
      {
                url: `${baseUrl}/privacy-policy`,
                lastModified: new Date(),
                changeFrequency: 'yearly',
                priority: 0.3,
      },
      {
                url: `${baseUrl}/terms-of-service`,
                lastModified: new Date(),
                changeFrequency: 'yearly',
                priority: 0.3,
      },
      {
                url: `${baseUrl}/refund-policy`,
                lastModified: new Date(),
                changeFrequency: 'yearly',
                priority: 0.3,
      },
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

  // Toolbox talks – fetched from DB
  let toolboxCategoryPages: MetadataRoute.Sitemap = [];
      let toolboxTalkPages: MetadataRoute.Sitemap = [];

  try {
    const categories = await prisma.toolboxCategory.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { order: 'asc' },
    });

    toolboxCategoryPages = categories.map((cat) => ({
      url: `${baseUrl}/toolbox-talks/${cat.slug}`,
      lastModified: cat.updatedAt ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const talks = await prisma.toolboxTalk.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
    });

    toolboxTalkPages = talks.map((talk) => ({
      url: `${baseUrl}/toolbox-talks/${talk.category.slug}/${talk.slug}`,
      lastModified: talk.updatedAt ?? new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (err) {
    console.error('Sitemap: DB unavailable, falling back to static TBT data', err);

    // Fall back to static structure from tbt-structure.ts
    const { TBT_CATEGORIES } = await import('@/data/tbt-structure');

    toolboxCategoryPages = TBT_CATEGORIES.map((cat) => ({
      url: `${baseUrl}/toolbox-talks/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    toolboxTalkPages = TBT_CATEGORIES.flatMap((cat) =>
      cat.subfolders.flatMap((sub) =>
        sub.talks.map((talk) => ({
          url: `${baseUrl}/toolbox-talks/${cat.slug}/${talk.slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      )
    );
  }

  return [
          ...staticPages,
          ...productPages,
          ...blogPages,
          ...toolboxCategoryPages,
          ...toolboxTalkPages,
        ];
}
