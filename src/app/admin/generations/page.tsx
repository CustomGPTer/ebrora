import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { GenerationsClient } from '@/components/admin/GenerationsClient';

export const metadata = {
  title: 'Generation Monitoring - Admin',
};

interface SearchParams {
  page?: string;
  status?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function GenerationsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1'));
  const status = params.status || 'ALL';

  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  // Build filter
  const filter: any = {};
  if (status !== 'ALL') {
    filter.status = status;
  }

  // Fetch generations with pagination
  const [generations, totalCount] = await Promise.all([
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
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const generationsData = generations.map((gen) => ({
    id: gen.id,
    userId: gen.user_id,
    userName: gen.user?.name || 'Unknown',
    userEmail: gen.user?.email || '',
    formatName: gen.rams_format?.name || 'Unknown',
    status: gen.status,
    createdAt: gen.created_at,
    completedAt: gen.completed_at,
    estimatedDurationSeconds: 0,
    errorMessage: gen.error_message,
    answers: gen.answers,
  }));

  return (
    <GenerationsClient
      generations={generationsData}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      currentStatus={status}
    />
  );
}
