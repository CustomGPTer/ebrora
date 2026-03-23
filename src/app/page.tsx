import type { Metadata } from 'next';
import '@/styles/homepage.css';
import HomepageClient from '@/components/home/HomepageClient';
import { PRODUCTS, CATEGORIES, REVIEWS } from '@/data/products';
import { POSTS } from '@/data/posts';
import { TOOLBOX_CATEGORIES } from '@/data/toolbox-categories';
import { TOOL_DEFINITIONS } from '@/data/tool-definitions';

export const metadata: Metadata = {
  title: 'Ebrora | AI Construction Document Generators, Templates & Toolbox Talks for UK Sites',
  description:
    'The UK construction industry\'s most powerful AI toolkit. 8 AI document generators including RAMS, COSHH, ITP, DSE & more — plus 55+ Excel templates and 1,500+ free toolbox talks. Built by site teams, for site teams.',
  alternates: {
    canonical: 'https://www.ebrora.com',
  },
  openGraph: {
    title: 'Ebrora | AI-Powered Construction Document Generators',
    description:
      '8 AI document generators, 55+ Excel templates, 1,500+ free toolbox talks. Enterprise-grade tools at a fraction of the cost — built for UK construction professionals.',
    url: 'https://www.ebrora.com',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ebrora | AI-Powered Construction Document Generators',
    description:
      '8 AI document generators, 55+ Excel templates, 1,500+ free toolbox talks. Enterprise-grade tools for UK construction professionals.',
    images: ['/og-image.jpg'],
  },
};

const homepageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Ebrora',
  url: 'https://www.ebrora.com',
  description:
    'The UK construction industry\'s most powerful AI toolkit. 8 AI document generators including RAMS, COSHH, ITP, DSE and more — plus premium Excel templates and 1,500+ free toolbox talks.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.ebrora.com/products?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Ebrora',
  url: 'https://www.ebrora.com',
  logo: 'https://www.ebrora.com/og-image.jpg',
  description:
    'AI-powered construction document generators and professional templates built by UK site teams for site teams. RAMS, COSHH, ITP, DSE, and more — covering health and safety, project management, MEICA, wastewater, and more.',
  email: 'hello@ebrora.com',
  address: { '@type': 'PostalAddress', addressCountry: 'GB' },
  sameAs: [
    'https://www.linkedin.com/in/ebrora/',
    'https://x.com/EbroraSheets',
    'https://www.youtube.com/channel/UCQy-rQ3Ye1kIPpT19A1c0lg',
  ],
};

export default function HomePage() {
  const templateCount = PRODUCTS.length;
  const categoryCount = Object.keys(CATEGORIES).length;
  const latestPosts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  const genericCompanies = [
    'Infrastructure Ltd', 'Civils Group', 'Site Solutions UK',
    'Meridian Contractors', 'Northway Engineering', 'Alliance Construction',
  ];
  const genericRoles = [
    'Site Manager', 'Senior Engineer', 'General Foreman',
    'Project Manager', 'Section Engineer', 'Construction Manager',
  ];

  const anonymisedReviews = REVIEWS.slice(0, 6).map((review, idx) => ({
    ...review,
    author: review.author.split(' ')[0][0] + '. ' + (review.author.split(' ')[1]?.[0] || 'S') + '.',
    role: `${genericRoles[idx % genericRoles.length]}, ${genericCompanies[idx % genericCompanies.length]}`,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <HomepageClient
        templateCount={templateCount}
        categoryCount={categoryCount}
        reviews={anonymisedReviews}
        latestPosts={latestPosts}
        searchItems={[
          ...PRODUCTS.map((p) => ({
            label: p.title,
            type: 'Template' as const,
            href: `/products#${p.id}`,
            meta: p.price,
          })),
          ...TOOLBOX_CATEGORIES.map((c) => ({
            label: c.name,
            type: 'Toolbox Talks' as const,
            href: `/toolbox-talks/${c.slug}`,
            meta: '',
          })),
          ...TOOL_DEFINITIONS.map((t) => ({
            label: t.name,
            type: 'Free Tool' as const,
            href: t.route,
            meta: 'Free',
          })),
          ...[...POSTS].sort((a, b) => b.date.localeCompare(a.date)).map((p) => ({
            label: p.title,
            type: 'Blog' as const,
            href: `/blog/${p.id}`,
            meta: '',
          })),
        ]}
      />
    </>
  );
}
