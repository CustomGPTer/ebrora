import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { EmailCapturesClient } from '@/components/admin/EmailCapturesClient';

export const metadata = { title: 'Registered Emails – Admin' };

interface PageProps {
  searchParams: Promise<{ page?: string; source?: string; search?: string }>;
}

export default async function EmailCapturesPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1'));
  const source = params.source || 'ALL';
  const search = params.search || '';
  const pageSize = 30;
  const skip = (page - 1) * pageSize;

  // Build user filter
  const filter: any = {};

  if (search) {
    filter.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Source filtering: map to subscription tiers
  if (source !== 'ALL') {
    if (source === 'no-subscription') {
      filter.subscription = { is: null };
    } else {
      filter.subscription = { tier: source };
    }
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: filter,
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
      include: {
        subscription: { select: { tier: true, status: true } },
      },
    }),
    prisma.user.count({ where: filter }),
  ]);

  // Count by subscription tier for source filter
  const [freeCount, standardCount, professionalCount, noSubCount] = await Promise.all([
    prisma.user.count({ where: { subscription: { tier: 'FREE' } } }),
    prisma.user.count({ where: { subscription: { tier: 'STANDARD' } } }),
    prisma.user.count({ where: { subscription: { tier: 'PROFESSIONAL' } } }),
    prisma.user.count({ where: { subscription: { is: null } } }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const capturesData = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name || '',
    source: u.subscription?.tier || 'no-subscription',
    sourceId: u.subscription?.status || '',
    createdAt: u.created_at.toISOString(),
  }));

  const sourceCounts = [
    { source: 'FREE', count: freeCount },
    { source: 'STANDARD', count: standardCount },
    { source: 'PROFESSIONAL', count: professionalCount },
    { source: 'no-subscription', count: noSubCount },
  ].filter((s) => s.count > 0);

  return (
    <EmailCapturesClient
      captures={capturesData}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      currentSource={source}
      currentSearch={search}
      sourceCounts={sourceCounts}
    />
  );
}
