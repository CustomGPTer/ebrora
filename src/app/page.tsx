import type { Metadata } from 'next';
import '@/styles/homepage.css';
import HomepageClient from '@/components/home/HomepageClient';
import { PRODUCTS, CATEGORIES, REVIEWS } from '@/data/products';
import { POSTS } from '@/data/posts';
import { TOOLBOX_CATEGORIES } from '@/data/toolbox-categories';
import { TOOL_DEFINITIONS } from '@/data/tool-definitions';
import { getAllAvailableTalks } from '@/data/tbt-structure';
import { getAllTemplatesForSearch } from '@/lib/free-templates';

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
  const allTalks = getAllAvailableTalks();
  const allFreeTemplates = getAllTemplatesForSearch();

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

  /* ── AI Builder search items (mirrors CATEGORISED_TOOLS in HomepageClient) ── */
  const aiBuilderItems: { label: string; href: string }[] = [
    { label: 'RAMS Builder', href: '/rams-builder' },
    { label: 'COSHH Assessment', href: '/coshh-builder' },
    { label: 'Manual Handling Risk Assessment', href: '/manual-handling-builder' },
    { label: 'DSE Assessment', href: '/dse-builder' },
    { label: 'Toolbox Talk Generator', href: '/tbt-builder' },
    { label: 'Confined Space Risk Assessment', href: '/confined-spaces-builder' },
    { label: 'Incident Report', href: '/incident-report-builder' },
    { label: 'Lift Plan', href: '/lift-plan-builder' },
    { label: 'Emergency Response Plan', href: '/emergency-response-builder' },
    { label: 'Permit to Dig', href: '/permit-to-dig-builder' },
    { label: 'POWRA', href: '/powra-builder' },
    { label: 'CDM Compliance Checker', href: '/cdm-checker-builder' },
    { label: 'Noise Assessment', href: '/noise-assessment-builder' },
    { label: 'Safety Alert Generator', href: '/safety-alert-builder' },
    { label: 'RAMS Review Tool', href: '/rams-review-builder' },
    { label: 'ITP Generator', href: '/itp-builder' },
    { label: 'Quality Checklist', href: '/quality-checklist-builder' },
    { label: 'NCR Generator', href: '/ncr-builder' },
    { label: 'Scope of Works', href: '/scope-of-works-builder' },
    { label: 'Early Warning Notice', href: '/early-warning-builder' },
    { label: 'CE Notification', href: '/ce-notification-builder' },
    { label: 'Quotation Generator', href: '/quote-generator-builder' },
    { label: 'Delay Notification Letter', href: '/delay-notification-builder' },
    { label: 'Variation Confirmation', href: '/variation-confirmation-builder' },
    { label: 'RFI Generator', href: '/rfi-generator-builder' },
    { label: 'Payment Application', href: '/payment-application-builder' },
    { label: 'Daywork Sheet', href: '/daywork-sheet-builder' },
    { label: 'Programme Checker', href: '/programme-checker-builder' },
    { label: 'Carbon Footprint', href: '/carbon-footprint-builder' },
    { label: 'Carbon Reduction Plan', href: '/carbon-reduction-plan-builder' },
  ];

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
          ...aiBuilderItems.map((t) => ({
            label: t.label,
            type: 'AI Builder' as const,
            href: t.href,
            meta: 'AI',
          })),
          ...PRODUCTS.map((p) => ({
            label: p.title,
            type: 'Template' as const,
            href: `/products#${p.id}`,
            meta: p.price,
          })),
          ...allTalks.map((t) => ({
            label: t.title,
            type: 'Toolbox Talk' as const,
            href: `/toolbox-talks/${t.categorySlug}/${t.slug}`,
            meta: t.categoryName,
          })),
          ...allFreeTemplates.map((t) => ({
            label: t.title,
            type: 'Free Template' as const,
            href: t.href,
            meta: t.fileTypeLabel,
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
