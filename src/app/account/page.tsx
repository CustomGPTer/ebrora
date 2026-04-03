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
    const fallbackLimit = tier === 'UNLIMITED' ? 9999 : tier === 'PROFESSIONAL' ? 150 : (tier === 'STARTER' || tier === 'STANDARD') ? 30 : 1;
    const restrictedOnFree = new Set<string>([]); // All tools now accessible on all tiers — global cap is the restriction
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
      'wah-assessment': { used: 0, limit: fl('wah-assessment') },
      'wbv-assessment': { used: 0, limit: fl('wbv-assessment') },
      'riddor-report': { used: 0, limit: fl('riddor-report') },
      'traffic-management': { used: 0, limit: fl('traffic-management') },
      'waste-management': { used: 0, limit: fl('waste-management') },
      'invasive-species': { used: 0, limit: fl('invasive-species') },
    };
  }

  // ── Recent RAMS generations ──
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

  const ramsDocuments = recentGenerations.map((gen) => ({
    id: gen.id,
    formatName: gen.format_id,
    source: 'RAMS' as const,
    toolSlug: null as string | null,
    status: gen.status,
    createdAt: gen.created_at.toISOString(),
    fileUrl: gen.blobUrl,
    isExpired: gen.expiresAt ? new Date() > gen.expiresAt : false,
  }));

  // ── Recent AI tool generations ──
  let aiToolDocuments: typeof ramsDocuments = [];
  try {
    const recentAiGens = await (prisma as any).aiToolGeneration.findMany({
      where: { user_id: session.user.id },
      select: {
        id: true,
        tool_slug: true,
        status: true,
        created_at: true,
        blob_url: true,
        expires_at: true,
        filename: true,
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    aiToolDocuments = recentAiGens.map((gen: any) => ({
      id: gen.id,
      formatName: gen.filename || gen.tool_slug,
      source: 'AI_TOOL' as const,
      toolSlug: gen.tool_slug as string,
      status: gen.status,
      createdAt: gen.created_at.toISOString(),
      fileUrl: gen.blob_url,
      isExpired: gen.expires_at ? new Date() > gen.expires_at : false,
    }));
  } catch {
    // AI tool generation table may not exist yet — graceful fallback
  }

  // Merge and sort by date (newest first), take top 20
  const generations = [...ramsDocuments, ...aiToolDocuments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

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
