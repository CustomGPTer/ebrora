import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { FormatsClient } from '@/components/admin/FormatsClient';

export const metadata = {
  title: 'Format Management - Admin',
};

export default async function FormatsPage() {
  await requireAdmin();

  const formats = await prisma.ramsFormat.findMany({
    orderBy: { order: 'asc' },
  });

  const formatsData = formats.map((format) => ({
    id: format.id,
    name: format.name,
    description: format.description,
    scoringType: format.scoringType,
    isFree: format.isFree,
    enabled: format.enabled,
    order: format.order,
  }));

  return <FormatsClient formats={formatsData} />;
}
