import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { AnalyticsClient } from '@/components/admin/AnalyticsClient';

export const metadata = { title: 'Analytics – Admin' };

export default async function AnalyticsPage() {
  await requireAdmin();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // AI Tool usage by tool slug
  const [aiToolsBySlug, monthlyAiTools, lastMonthAiTools, ramsFormatUsage, topUsers, downloadsByType] = await Promise.all([
    prisma.aiToolGeneration.groupBy({
      by: ['tool_slug'],
      _count: { tool_slug: true },
      orderBy: { _count: { tool_slug: 'desc' } },
    }),
    prisma.aiToolGeneration.count({ where: { created_at: { gte: monthStart } } }),
    prisma.aiToolGeneration.count({ where: { created_at: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.generation.groupBy({
      by: ['format_id'],
      _count: { format_id: true },
      orderBy: { _count: { format_id: 'desc' } },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { ai_tool_generations: { _count: 'desc' } },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { generations: true, ai_tool_generations: true } },
      },
    }),
    prisma.contentDownload.groupBy({
      by: ['contentType'],
      _count: { contentType: true },
      orderBy: { _count: { contentType: 'desc' } },
    }).catch(() => []),
  ]);

  // Get format names for RAMS usage
  const formatIds = ramsFormatUsage.map((r) => r.format_id);
  const formats = await prisma.ramsFormat.findMany({
    where: { id: { in: formatIds } },
    select: { id: true, name: true },
  });
  const formatMap = Object.fromEntries(formats.map((f) => [f.id, f.name]));

  const data = {
    aiToolsBySlug: aiToolsBySlug.map((t) => ({
      slug: t.tool_slug,
      label: t.tool_slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      count: t._count.tool_slug,
    })),
    monthlyAiTools,
    lastMonthAiTools,
    ramsFormatUsage: ramsFormatUsage.map((r) => ({
      formatId: r.format_id,
      formatName: formatMap[r.format_id] || 'Unknown',
      count: r._count.format_id,
    })),
    topUsers: topUsers.map((u) => ({
      id: u.id,
      name: u.name || '',
      email: u.email,
      ramsCount: u._count.generations,
      aiToolCount: u._count.ai_tool_generations,
      total: u._count.generations + u._count.ai_tool_generations,
    })),
    downloadsByType: (downloadsByType as any[]).map((d: any) => ({
      type: d.contentType || 'unknown',
      count: d._count.contentType,
    })),
  };

  return <AnalyticsClient data={data} />;
}
