import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { UsersClient } from '@/components/admin/UsersClient';

export const metadata = {
  title: 'User Management - Admin',
};

interface SearchParams {
  page?: string;
  tier?: string;
  search?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1'));
  const tier = params.tier || 'ALL';
  const search = params.search || '';

  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  // Build filter
  const filter: any = {};
  if (tier !== 'ALL') {
    filter.subscription = { tier };
  }
  if (search) {
    filter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Fetch users with pagination
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: filter,
      include: {
        subscription: { select: { tier: true, status: true } },
        _count: { select: { generations: true } },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where: filter }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const usersData = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tier: user.subscription?.tier || 'FREE',
    status: user.subscription?.status || 'ACTIVE',
    generationsCount: user._count.generations,
    createdAt: user.created_at,
    disabled: false,
  }));

  return (
    <UsersClient
      users={usersData}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      currentTier={tier}
      currentSearch={search}
    />
  );
}
