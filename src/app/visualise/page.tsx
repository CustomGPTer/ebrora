// =============================================================================
// /visualise — server component
// Auth + tier gate. Logged-out or FREE users see LandingLocked; paid tiers see
// the full VisualiseClient app shell.
//
// AMENDMENT (Batch 9): OG image now points at the Visualise-specific
// /og-image-visualise.jpg (1200x630, Ebrora-branded) rather than the generic
// site-wide /og-image.jpg. Same `twitter` card image added for link previews.
// =============================================================================

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { resolveEffectiveTier } from '@/lib/payments/resolve-tier';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

import LandingLocked from '@/components/visualise/LandingLocked';
import VisualiseClient from '@/components/visualise/VisualiseClient';

export const metadata: Metadata = {
  title: 'Visualise — AI Visual Document Creator for UK Construction | Ebrora',
  description:
    'Turn text into professional construction diagrams in seconds. Flowcharts, timelines, org charts, risk matrices, CDM hierarchies, and more. AI-powered. Dozens of presets. Fully editable canvas.',
  alternates: { canonical: 'https://www.ebrora.com/visualise' },
  openGraph: {
    title: 'Visualise | Ebrora',
    description:
      'AI visual document creator for construction. A growing library of diagram presets, editable canvas, PNG / SVG / PDF export.',
    url: 'https://www.ebrora.com/visualise',
    type: 'website',
    images: [
      { url: 'https://www.ebrora.com/og-image-visualise.jpg', width: 1200, height: 630 },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Visualise | Ebrora',
    description:
      'AI visual document creator for construction. A growing library of diagram presets, editable canvas, PNG / SVG / PDF export.',
    images: ['https://www.ebrora.com/og-image-visualise.jpg'],
  },
};

const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Visualise',
  description: 'AI-powered visual document creator for UK construction with a growing library of diagram presets.',
  url: 'https://www.ebrora.com/visualise',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '9.99', priceCurrency: 'GBP' },
  publisher: { '@type': 'Organization', name: 'Ebrora', url: 'https://www.ebrora.com' },
};

export default async function VisualisePage() {
  const session = await getServerSession(authOptions);

  // Logged-out → landing with sign-up CTA.
  if (!session?.user?.id) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
        />
        <LandingLocked mode="signed-out" />
      </>
    );
  }

  // Resolve tier — FREE gets the same landing but with "Upgrade" CTA.
  const subscription = await prisma.subscription.findUnique({
    where: { user_id: session.user.id },
  });
  const tier = resolveEffectiveTier(subscription);

  if (tier === 'FREE') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
        />
        <LandingLocked mode="free-tier" />
      </>
    );
  }

  // Paid tier → full app shell.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <BreadcrumbNav items={[{ label: 'Visualise' }]} />
        </div>
        <VisualiseClient tier={tier} />
      </div>
    </>
  );
}
