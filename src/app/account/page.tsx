import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth-utils';
import { getAllAiToolUsage } from '@/lib/ai-tools/usage-tracker';
import { getGlobalAiLimitByTier } from '@/lib/ai-tools/constants';
import { getRamsUsageThisMonth } from '@/lib/rams/usage';
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

  const generationCount = await getRamsUsageThisMonth(session.user.id);

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

  // AI tool usage — per-tool counts + global total (shared cap across all tools)
  const tier = subscription?.plan || 'FREE';
  const aiToolGlobalLimit = getGlobalAiLimitByTier(tier);

  let aiToolUsage: Record<string, number> = {};
  let aiToolGlobalUsed = 0;

  try {
    const raw = await getAllAiToolUsage(session.user.id);
    for (const [slug, data] of Object.entries(raw)) {
      const used = data?.used ?? 0;
      aiToolUsage[slug] = used;
      aiToolGlobalUsed += used;
    }
  } catch (err) {
    console.error('[account] Failed to load AI tool usage:', err);
    // Fallback: empty usage, 0 global used
  }

  const aiToolGlobalUsage = { used: aiToolGlobalUsed, limit: aiToolGlobalLimit };

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
        aiToolGlobalUsage={aiToolGlobalUsage}
      />
    </main>
  );
}
