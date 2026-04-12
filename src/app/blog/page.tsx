import type { Metadata } from 'next';
import { POSTS, BLOG_CATEGORIES } from '@/data/posts';
import BlogListingClient from '@/components/blog/BlogListingClient';

export const metadata: Metadata = {
    title: {
          absolute: 'Construction Industry Blog | Safety, AI Tools, Site Management & More | Ebrora',
    },
    description:
          'Expert guides on construction safety, AI document tools, site management, plant & equipment, earthworks, temporary works, commercial contracts, and environmental compliance. Practical tips for UK site managers and civil engineers.',
    alternates: {
          canonical: 'https://www.ebrora.com/blog',
    },
    openGraph: {
          title: 'Construction Industry Blog | Safety, AI Tools & Site Management | Ebrora',
          description:
                  'Expert guides on construction safety, AI tools, site management, plant & equipment, earthworks, commercial contracts, and more for UK site teams.',
          url: 'https://www.ebrora.com/blog',
          type: 'website',
          images: [{ url: 'https://www.ebrora.com/og-image.jpg', width: 1200, height: 630 }],
    },
    twitter: {
          card: 'summary_large_image',
          title: 'Construction Industry Blog | Safety, AI Tools & Site Management | Ebrora',
          description:
                  'Expert guides on construction safety, AI tools, site management, plant & equipment, earthworks, commercial contracts, and more for UK site teams.',
          images: ['https://www.ebrora.com/og-image.jpg'],
    },
};

const blogSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Ebrora Blog — Construction Safety & RAMS Guides',
  description:
    'Expert guides on construction safety, RAMS templates, risk assessments and method statements. Practical tips for UK site managers and civil engineers.',
  url: 'https://www.ebrora.com/blog',
  publisher: {
    '@type': 'Organization',
    name: 'Ebrora',
    url: 'https://www.ebrora.com',
  },
};

export default function BlogPage() {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
        />
        <BlogListingClient posts={POSTS} categories={BLOG_CATEGORIES} />
      </>
    );
}
