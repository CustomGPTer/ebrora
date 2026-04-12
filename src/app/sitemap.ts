import { MetadataRoute } from 'next';
import { PRODUCTS } from '@/data/products';
import { POSTS } from '@/data/posts';
import { prisma } from '@/lib/prisma';
import { scanAllTemplates } from '@/lib/free-templates';
import fs from 'fs';
import path from 'path';

// Auto-discover all *-builder directories under src/app/
function discoverBuilderPages(): string[] {
  try {
    const appDir = path.join(process.cwd(), 'src', 'app');
    const entries = fs.readdirSync(appDir, { withFileTypes: true });
    return entries
      .filter(
        (e) =>
          e.isDirectory() &&
          e.name.endsWith('-builder') &&
          fs.existsSync(path.join(appDir, e.name, 'page.tsx'))
      )
      .map((e) => e.name)
      .sort();
  } catch {
    console.warn('Sitemap: could not auto-discover builder pages');
    return [];
  }
}

// Auto-discover all individual tool pages under src/app/tools/
function discoverToolPages(): string[] {
  try {
    const toolsDir = path.join(process.cwd(), 'src', 'app', 'tools');
    const entries = fs.readdirSync(toolsDir, { withFileTypes: true });
    return entries
      .filter(
        (e) =>
          e.isDirectory() &&
          e.name !== '[slug]' &&
          fs.existsSync(path.join(toolsDir, e.name, 'page.tsx'))
      )
      .map((e) => e.name)
      .sort();
  } catch {
    console.warn('Sitemap: could not auto-discover tool pages');
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
      const baseUrl = 'https://www.ebrora.com';

  // Auto-discovered builder pages
  const builderSlugs = discoverBuilderPages();
  const builderPages: MetadataRoute.Sitemap = builderSlugs.map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date('2025-06-01'),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  // Auto-discovered individual tool pages
  const toolSlugs = discoverToolPages();
  const toolPages: MetadataRoute.Sitemap = toolSlugs.map((slug) => ({
    url: `${baseUrl}/tools/${slug}`,
    lastModified: new Date('2025-06-01'),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

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
                lastModified: new Date('2025-06-01'),
                changeFrequency: 'monthly',
                priority: 0.7,
      },
      {
                url: `${baseUrl}/products`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
      },
      {
                url: `${baseUrl}/pricing`,
                lastModified: new Date('2025-06-01'),
                changeFrequency: 'monthly',
                priority: 0.8,
      },
      {
                url: `${baseUrl}/toolbox-talks`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
      },
      {
                url: `${baseUrl}/tools`,
                lastModified: new Date('2025-06-01'),
                changeFrequency: 'monthly',
                priority: 0.7,
      },
      {
                url: `${baseUrl}/free-templates`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
      },
      {
                url: `${baseUrl}/construction-sign-maker`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.7,
      },
      {
                url: `${baseUrl}/privacy-policy`,
                lastModified: new Date('2025-01-01'),
                changeFrequency: 'yearly',
                priority: 0.3,
      },
      {
                url: `${baseUrl}/terms-of-service`,
                lastModified: new Date('2025-01-01'),
                changeFrequency: 'yearly',
                priority: 0.3,
      },
      {
                url: `${baseUrl}/refund-policy`,
                lastModified: new Date('2025-01-01'),
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

  // ── Free Templates — scanned from /public/free-templates/ ──
  const ftCategories = scanAllTemplates();

  const freeTemplateCategoryPages: MetadataRoute.Sitemap = ftCategories.map((cat) => ({
    url: `${baseUrl}/free-templates/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const freeTemplateSubcategoryPages: MetadataRoute.Sitemap = ftCategories.flatMap((cat) =>
    cat.subcategories
      .filter((sc) => sc.templates.length > 0)
      .map((sc) => ({
        url: `${baseUrl}/free-templates/${cat.slug}/${sc.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  );

  const freeTemplatePages: MetadataRoute.Sitemap = ftCategories.flatMap((cat) =>
    cat.subcategories.flatMap((sc) =>
      sc.templates.map((tpl) => ({
        url: `${baseUrl}${tpl.href}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    )
  );

  // ── Toolbox talks — fetched from DB with fallback ──
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
          ...builderPages,
          ...toolPages,
          ...productPages,
          ...blogPages,
          ...freeTemplateCategoryPages,
          ...freeTemplateSubcategoryPages,
          ...freeTemplatePages,
          ...toolboxCategoryPages,
          ...toolboxTalkPages,
        ];
}
