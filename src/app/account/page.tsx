import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth-utils';
import { getAllAiToolUsage } from '@/lib/ai-tools/usage-tracker';
import AccountDashboardClient from '@/components/account/AccountDashboardClient';

export const metadata: Metadata = {
  title: 'My Account - Ebrora',
  description: 'Manage your account, subscription, and settings',
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AccountPage({ searchParams }: PageProps) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const tab = (typeof params.tab === 'string' ? params.tab : 'overview') as string;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      subscription: true,
      logos: true,
      saved_details: true,
    },
  });

  if (!user) {
    redirect('/auth/login');
  }

  const subscription = user.subscription
    ? {
        plan: user.subscription.tier,
        status: user.subscription.status,
        currentPeriodStart: user.subscription.current_period_start,
        currentPeriodEnd: user.subscription.current_period_end,
      }
    : null;

  const generationCount = await prisma.generation.count({
    where: {
      user_id: session.user.id,
      created_at: {
        gte: subscription?.currentPeriodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Download counts for rolling 30-day window
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [tbtDownloadCount, templateDownloadCount] = await Promise.all([
    prisma.contentDownload.count({
      where: {
        userId: session.user.id,
        contentType: 'TOOLBOX_TALK',
        downloadedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.contentDownload.count({
      where: {
        userId: session.user.id,
        contentType: 'FREE_TEMPLATE',
        downloadedAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  // AI tool usage (COSHH, ITP, Manual Handling, TBT Generator, etc.)
  let aiToolUsage: Record<string, { used: number; limit: number }>;
  try {
    aiToolUsage = await getAllAiToolUsage(session.user.id);
  } catch {
    // Fallback if AI tool tables don't exist yet
    const tier = subscription?.plan || 'FREE';
    const fallbackLimit = tier === 'PROFESSIONAL' ? 20 : tier === 'STANDARD' ? 6 : 1;
    const restrictedOnFree = new Set(['itp', 'incident-report', 'lift-plan', 'emergency-response', 'scope-of-works', 'early-warning', 'ncr', 'programme-checker', 'cdm-checker', 'noise-assessment', 'quote-generator', 'safety-alert', 'carbon-footprint', 'rams-review', 'delay-notification', 'variation-confirmation', 'rfi-generator', 'payment-application', 'daywork-sheet', 'carbon-reduction-plan']);
    const fl = (slug: string) => (tier === 'FREE' && restrictedOnFree.has(slug)) ? 0 : fallbackLimit;
    aiToolUsage = {
      'coshh': { used: 0, limit: fl('coshh') },
      'itp': { used: 0, limit: fl('itp') },
      'manual-handling': { used: 0, limit: fl('manual-handling') },
      'dse': { used: 0, limit: fl('dse') },
      'tbt-generator': { used: 0, limit: fl('tbt-generator') },
      'confined-spaces': { used: 0, limit: fl('confined-spaces') },
      'incident-report': { used: 0, limit: fl('incident-report') },
      'lift-plan': { used: 0, limit: fl('lift-plan') },
      'emergency-response': { used: 0, limit: fl('emergency-response') },
      'quality-checklist': { used: 0, limit: fl('quality-checklist') },
      'scope-of-works': { used: 0, limit: fl('scope-of-works') },
      'permit-to-dig': { used: 0, limit: fl('permit-to-dig') },
      'powra': { used: 0, limit: fl('powra') },
      'early-warning': { used: 0, limit: fl('early-warning') },
      'ncr': { used: 0, limit: fl('ncr') },
      'ce-notification': { used: 0, limit: fl('ce-notification') },
      'programme-checker': { used: 0, limit: fl('programme-checker') },
      'cdm-checker': { used: 0, limit: fl('cdm-checker') },
      'noise-assessment': { used: 0, limit: fl('noise-assessment') },
      'quote-generator': { used: 0, limit: fl('quote-generator') },
      'safety-alert': { used: 0, limit: fl('safety-alert') },
      'carbon-footprint': { used: 0, limit: fl('carbon-footprint') },
      'rams-review': { used: 0, limit: fl('rams-review') },
      'delay-notification': { used: 0, limit: fl('delay-notification') },
      'variation-confirmation': { used: 0, limit: fl('variation-confirmation') },
      'rfi-generator': { used: 0, limit: fl('rfi-generator') },
      'payment-application': { used: 0, limit: fl('payment-application') },
      'daywork-sheet': { used: 0, limit: fl('daywork-sheet') },
      'carbon-reduction-plan': { used: 0, limit: fl('carbon-reduction-plan') },
    };
  }

  const recentGenerations = await prisma.generation.findMany({
    where: { user_id: session.user.id },
    select: {
      id: true,
      format_id: true,
      status: true,
      created_at: true,
      blobUrl: true,
      expiresAt: true,
    },
    orderBy: { created_at: 'desc' },
    take: 10,
  });

  const generations = recentGenerations.map((gen) => ({
    id: gen.id,
    formatName: gen.format_id,
    status: gen.status,
    createdAt: gen.created_at.toISOString(),
    fileUrl: gen.blobUrl,
    isExpired: gen.expiresAt ? new Date() > gen.expiresAt : false,
  }));

  const savedDetails = user.saved_details
    ? {
        companyName: user.saved_details.company_name,
        companyAddress: user.saved_details.site_address,
        defaultSupervisor: user.saved_details.supervisor,
        defaultPrincipalContractor: user.saved_details.principal_contractor,
        phoneNumber: null,
        email: null,
      }
    : null;

  const latestLogo = user.logos && user.logos.length > 0 ? user.logos[0] : null;

  return (
    <main className="account">
      <AccountDashboardClient
        user={{
          name: user.name,
          email: user.email,
          logo: latestLogo?.file_path ?? null,
        }}
        subscription={subscription}
        generationCount={generationCount}
        tbtDownloadCount={tbtDownloadCount}
        templateDownloadCount={templateDownloadCount}
        generations={generations}
        savedDetails={savedDetails}
        initialTab={tab}
        aiToolUsage={aiToolUsage}
      />
    </main>
  );
}
