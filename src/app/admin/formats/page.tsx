import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { FormatsClient } from '@/components/admin/FormatsClient';

export const metadata = { title: 'Format Management – Admin' };

export default async function FormatsPage() {
  await requireAdmin();

  const formats = await prisma.ramsFormat.findMany({ orderBy: { order: 'asc' } });

  const formatsData = formats.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    scoringType: f.scoring_type,
    isFree: f.is_free,
    enabled: f.enabled,
    order: f.order,
  }));

  return <FormatsClient formats={formatsData} />;
}
