import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { EmailCapturesClient } from '@/components/admin/EmailCapturesClient';

export const metadata = { title: 'Email Captures – Admin' };

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

  const filter: any = {};
  if (source !== 'ALL') filter.source = source;
  if (search) {
    filter.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [captures, totalCount, sources] = await Promise.all([
    prisma.emailCapture.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.emailCapture.count({ where: filter }),
    prisma.emailCapture.groupBy({
      by: ['source'],
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const capturesData = captures.map((c) => ({
    id: c.id,
    email: c.email,
    name: c.name || '',
    source: c.source || 'unknown',
    sourceId: c.sourceId || '',
    createdAt: c.createdAt.toISOString(),
  }));

  const sourceCounts = sources.map((s) => ({
    source: s.source || 'unknown',
    count: s._count.source,
  }));

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
