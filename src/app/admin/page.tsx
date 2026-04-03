import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { DashboardClient } from '@/components/admin/DashboardClient';

export default async function AdminDashboard() {
  await requireAdmin();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // ── Core Stats ──
  const [
    totalUsers,
    todaySignups,
    monthSignups,
    lastMonthSignups,
    activeSubscriptions,
    todayGenerations,
    monthGenerations,
    todayAiToolUses,
    monthAiToolUses,
    totalEmailCaptures,
    todayEmailCaptures,
    monthEmailCaptures,
    todayDownloads,
    monthDownloads,
    todayFreeTemplateDownloads,
    monthFreeTemplateDownloads,
    totalFreeTemplateDownloads,
    failedGenerations,
    pastDueSubscriptions,
    usersWithPaidSubs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { created_at: { gte: todayStart } } }),
    prisma.user.count({ where: { created_at: { gte: monthStart } } }),
    prisma.user.count({ where: { created_at: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.subscription.findMany({ where: { status: 'ACTIVE' } }),
    prisma.generation.count({ where: { created_at: { gte: todayStart } } }),
    prisma.generation.count({ where: { created_at: { gte: monthStart } } }),
    prisma.aiToolGeneration.count({ where: { created_at: { gte: todayStart } } }).catch(() => 0),
    prisma.aiToolGeneration.count({ where: { created_at: { gte: monthStart } } }).catch(() => 0),
    prisma.user.count(),
    prisma.user.count({ where: { created_at: { gte: todayStart } } }),
    prisma.user.count({ where: { created_at: { gte: monthStart } } }),
    prisma.contentDownload.count({ where: { downloadedAt: { gte: todayStart } } }).catch(() => 0),
    prisma.contentDownload.count({ where: { downloadedAt: { gte: monthStart } } }).catch(() => 0),
    // Free template downloads specifically
    prisma.contentDownload.count({ where: { contentType: 'FREE_TEMPLATE', downloadedAt: { gte: todayStart } } }).catch(() => 0),
    prisma.contentDownload.count({ where: { contentType: 'FREE_TEMPLATE', downloadedAt: { gte: monthStart } } }).catch(() => 0),
    prisma.contentDownload.count({ where: { contentType: 'FREE_TEMPLATE' } }).catch(() => 0),
    prisma.generation.count({ where: { status: 'FAILED', created_at: { gte: monthStart } } }),
    prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
    // Count users with paid subscriptions (active)
    prisma.subscription.count({ where: { status: 'ACTIVE', tier: { in: ['STARTER', 'STANDARD', 'PROFESSIONAL', 'UNLIMITED'] } } }).catch(() => 0),
  ]);

  // ── Subscription Breakdown ──
  // Count each tier from active subscriptions for consistency
  const freeCount = activeSubscriptions.filter((s) => s.tier === 'FREE').length;
  const paidStarter = activeSubscriptions.filter((s) => s.tier === 'STARTER' || s.tier === 'STANDARD').length;
  const paidProfessional = activeSubscriptions.filter((s) => s.tier === 'PROFESSIONAL').length;
  const paidUnlimited = activeSubscriptions.filter((s) => s.tier === 'UNLIMITED').length;
  
  // Also count users without any subscription (treat as FREE)
  const usersWithSubscriptions = await prisma.subscription.count();
  const usersWithoutSubscription = totalUsers - usersWithSubscriptions;

  const tierBreakdown = {
    FREE: freeCount + usersWithoutSubscription,
    STARTER: paidStarter,
    STANDARD: 0, // Legacy — all migrated to STARTER
    PROFESSIONAL: paidProfessional,
    UNLIMITED: paidUnlimited,
  };

  const pricing: Record<string, number> = { FREE: 0, STARTER: 9.99, STANDARD: 9.99, PROFESSIONAL: 24.99, UNLIMITED: 49.99 };
  const estimatedRevenue = activeSubscriptions.reduce((sum, sub) => sum + (pricing[sub.tier] || 0), 0);

  // ── Signups over last 30 days (for chart) ──
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentUsers = await prisma.user.findMany({
    where: { created_at: { gte: thirtyDaysAgo } },
    select: { created_at: true },
    orderBy: { created_at: 'asc' },
  });

  const signupsByDay: Record<string, number> = {};
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split('T')[0];
    signupsByDay[key] = 0;
  }
  recentUsers.forEach((u) => {
    const key = u.created_at.toISOString().split('T')[0];
    if (signupsByDay[key] !== undefined) signupsByDay[key]++;
  });

  const signupChartData = Object.entries(signupsByDay).map(([date, count]) => ({
    date,
    label: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    count,
  }));

  // ── Recent Activity: All types ──
  const [recentSignups, recentGens, recentAiTools, recentDownloadsData] = await Promise.all([
    prisma.user.findMany({
      take: 15,
      orderBy: { created_at: 'desc' },
      select: { id: true, name: true, email: true, created_at: true },
    }),
    prisma.generation.findMany({
      take: 15,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        rams_format: { select: { name: true } },
      },
    }),
    prisma.aiToolGeneration.findMany({
      take: 15,
      orderBy: { created_at: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }).catch(() => []),
    prisma.contentDownload.findMany({
      take: 15,
      orderBy: { downloadedAt: 'desc' },
      select: { id: true, contentType: true, email: true, downloadedAt: true },
    }).catch(() => []),
  ]);

  // Merge into unified activity feed
  type ActivityItem = {
    id: string;
    type: 'signup' | 'generation' | 'ai_tool' | 'download';
    text: string;
    subtext: string;
    time: string;
  };

  const allActivity: ActivityItem[] = [
    ...recentSignups.map((u) => ({
      id: `signup-${u.id}`,
      type: 'signup' as const,
      text: `${u.name || 'New user'} signed up`,
      subtext: u.email,
      time: u.created_at.toISOString(),
    })),
    ...recentGens.map((g) => ({
      id: `gen-${g.id}`,
      type: 'generation' as const,
      text: `${g.user?.name || 'User'} generated ${g.rams_format?.name || 'RAMS'}`,
      subtext: `Status: ${g.status}`,
      time: g.created_at.toISOString(),
    })),
    ...recentAiTools.map((t) => ({
      id: `ai-${t.id}`,
      type: 'ai_tool' as const,
      text: `${t.user?.name || 'User'} used ${t.tool_slug} builder`,
      subtext: t.user?.email || '',
      time: t.created_at.toISOString(),
    })),
    ...(recentDownloadsData as any[]).map((d: any) => ({
      id: `dl-${d.id}`,
      type: 'download' as const,
      text: `${d.email || 'User'} downloaded content`,
      subtext: d.contentType || '',
      time: d.downloadedAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 25);

  // RAMS-only activity
  const ramsActivity: ActivityItem[] = recentGens.map((g) => ({
    id: `gen-${g.id}`,
    type: 'generation' as const,
    text: `${g.user?.name || 'User'} generated ${g.rams_format?.name || 'RAMS'}`,
    subtext: `Status: ${g.status}`,
    time: g.created_at.toISOString(),
  }));

  // ── Alerts ──
  type AlertItem = { id: string; type: 'warning' | 'danger' | 'info'; text: string };
  const alerts: AlertItem[] = [];

  if (pastDueSubscriptions > 0) {
    alerts.push({
      id: 'past-due',
      type: 'warning',
      text: `${pastDueSubscriptions} subscription${pastDueSubscriptions > 1 ? 's' : ''} past due`,
    });
  }

  if (failedGenerations > 0) {
    alerts.push({
      id: 'failed-gens',
      type: 'danger',
      text: `${failedGenerations} failed generation${failedGenerations > 1 ? 's' : ''} this month`,
    });
  }

  const dashboardData = {
    totalUsers,
    todaySignups,
    monthSignups,
    lastMonthSignups,
    activeSubscriptions: activeSubscriptions.length,
    estimatedRevenue,
    tierBreakdown,
    todayGenerations,
    monthGenerations,
    todayAiToolUses,
    monthAiToolUses,
    totalEmailCaptures,
    todayEmailCaptures,
    monthEmailCaptures,
    todayDownloads,
    monthDownloads,
    todayFreeTemplateDownloads,
    monthFreeTemplateDownloads,
    totalFreeTemplateDownloads,
    signupChartData,
    allActivity,
    ramsActivity,
    alerts,
  };

  return <DashboardClient data={dashboardData} />;
}
