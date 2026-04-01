import type { Metadata } from 'next';
import '@/styles/homepage.css';
import HomepageClient from '@/components/home/HomepageClient';
import { PRODUCTS, CATEGORIES } from '@/data/products';
import { POSTS } from '@/data/posts';
import { TOOLBOX_CATEGORIES } from '@/data/toolbox-categories';
import { TOOL_DEFINITIONS } from '@/data/tool-definitions';
import { getAllAvailableTalks } from '@/data/tbt-structure';
import { getAllTemplatesForSearch } from '@/lib/free-templates';

export const metadata: Metadata = {
  title: 'Ebrora | AI Construction Document Generators, Excel Templates & Toolbox Talks for UK Sites',
  description:
    'The UK construction industry\'s most powerful AI toolkit. 35+ AI document generators including RAMS, COSHH, RIDDOR, Working at Height & more — plus 750+ downloadable templates and 1,500+ free toolbox talks. Built by site teams, for site teams.',
  alternates: {
    canonical: 'https://www.ebrora.com',
  },
  openGraph: {
    title: 'Ebrora | AI-Powered Construction Document Generators & Excel Templates',
    description:
      '35+ AI document generators, 750+ professional Excel templates, 1,500+ free toolbox talks. Enterprise-grade tools at a fraction of the cost — built for UK construction professionals.',
    url: 'https://www.ebrora.com',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ebrora | AI-Powered Construction Document Generators & Excel Templates',
    description:
      '35+ AI document generators, 750+ professional Excel templates, 1,500+ free toolbox talks. Enterprise-grade tools for UK construction professionals.',
    images: ['/og-image.jpg'],
  },
};

const homepageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Ebrora',
  url: 'https://www.ebrora.com',
  description:
    'The UK construction industry\'s most powerful AI toolkit. 35+ AI document generators including RAMS, COSHH, RIDDOR, Working at Height and more — plus 750+ professional Excel templates and 1,500+ free toolbox talks.',
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

  // Testimonials covering AI tools, templates, and TBTs
  const homepageReviews = [
    {
      stars: 5,
      text: "The RAMS Builder alone has saved me hours every week. What used to take half a day now takes 10 minutes, and the output is more thorough than anything I've written manually.",
      author: 'M. T.',
      role: `${genericRoles[0]}, ${genericCompanies[0]}`,
    },
    {
      stars: 5,
      text: "We use the toolbox talks library for every site induction and weekly briefing. Over 1,500 talks covering everything from trenching to COSHH. Absolute game-changer.",
      author: 'S. J.',
      role: `${genericRoles[1]}, ${genericCompanies[1]}`,
    },
    {
      stars: 5,
      text: "The COSHH Assessment Builder looked up the SDS data automatically and produced a compliant assessment in minutes. Our HSE advisor was impressed with the quality.",
      author: 'D. C.',
      role: `${genericRoles[2]}, ${genericCompanies[2]}`,
    },
    {
      stars: 5,
      text: "Downloaded the Gantt Chart Pro template and it's miles ahead of anything else I've used. The VBA automation for RAG status and dependencies is brilliant.",
      author: 'R. H.',
      role: `${genericRoles[3]}, ${genericCompanies[3]}`,
    },
    {
      stars: 5,
      text: "The free templates section is incredibly generous — we've downloaded permit to dig forms, plant check sheets, and daily diaries. Premium quality at no cost.",
      author: 'J. O.',
      role: `${genericRoles[4]}, ${genericCompanies[4]}`,
    },
    {
      stars: 5,
      text: "Used the CE Notification Builder for a compensation event and it structured everything perfectly — clause references, programme impact, the lot. Client accepted it first time.",
      author: 'T. R.',
      role: `${genericRoles[5]}, ${genericCompanies[5]}`,
    },
  ];

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
        reviews={homepageReviews}
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
