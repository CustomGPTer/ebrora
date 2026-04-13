import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { UsersClient } from '@/components/admin/UsersClient';

export const metadata = { title: 'User Management – Admin' };

interface PageProps {
  searchParams: Promise<{ page?: string; tier?: string; search?: string; verified?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1'));
  const tier = params.tier || 'ALL';
  const search = params.search || '';
  const verified = params.verified || 'ALL';
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const filter: any = {};
  if (tier !== 'ALL') {
    filter.subscription = { tier };
  }
  if (verified === 'YES') {
    filter.email_verified = true;
  } else if (verified === 'NO') {
    filter.email_verified = false;
  }
  if (search) {
    filter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: filter,
      include: {
        subscription: { select: { tier: true, status: true, paypal_subscription_id: true, stripe_subscription_id: true, payment_provider: true } },
        _count: { select: { generations: true, ai_tool_generations: true } },
        accounts: { select: { provider: true } },
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
    name: user.name || '',
    email: user.email,
    role: user.role,
    tier: user.subscription?.tier || 'FREE',
    status: user.subscription?.status || 'ACTIVE',
    paypalId: user.subscription?.paypal_subscription_id || null,
    stripeId: user.subscription?.stripe_subscription_id || null,
    paymentProvider: user.subscription?.payment_provider || 'PAYPAL',
    ramsCount: user._count.generations,
    aiToolCount: user._count.ai_tool_generations,
    authMethod: user.google_id ? 'Google' : user.accounts.length > 0 ? user.accounts[0].provider : 'Email',
    emailVerified: user.email_verified,
    createdAt: user.created_at.toISOString(),
  }));

  return (
    <UsersClient
      users={usersData}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      currentTier={tier}
      currentSearch={search}
      currentVerified={verified}
    />
  );
}
