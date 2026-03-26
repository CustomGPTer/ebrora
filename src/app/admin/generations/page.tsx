import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { GenerationsClient } from '@/components/admin/GenerationsClient';

export const metadata = { title: 'RAMS Generations – Admin' };

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function GenerationsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1'));
  const status = params.status || 'ALL';
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const filter: any = {};
  if (status !== 'ALL') filter.status = status;

  const [generations, totalCount, statusCounts] = await Promise.all([
    prisma.generation.findMany({
      where: filter,
      include: {
        user: { select: { name: true, email: true } },
        rams_format: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.generation.count({ where: filter }),
    prisma.generation.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const generationsData = generations.map((gen) => ({
    id: gen.id,
    userId: gen.user_id,
    userName: gen.user?.name || 'Unknown',
    userEmail: gen.user?.email || '',
    formatName: gen.rams_format?.name || 'Unknown',
    status: gen.status,
    createdAt: gen.created_at.toISOString(),
    completedAt: gen.completed_at?.toISOString() || null,
    errorMessage: gen.error_message,
    answers: gen.answers,
  }));

  const statusCountsMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status]));

  return (
    <GenerationsClient
      generations={generationsData}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      currentStatus={status}
      statusCounts={statusCountsMap}
    />
  );
}
