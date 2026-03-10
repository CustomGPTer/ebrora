import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { PromosClient } from '@/components/admin/PromosClient';

export const metadata = {
  title: 'Promo Codes - Admin',
};

export default async function PromosPage() {
  await requireAdmin();

  const promos = await prisma.promoCode.findMany({
    include: {
      _count: { select: { usageRecords: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const promosData = promos.map((promo) => ({
    id: promo.id,
    code: promo.code,
    discountPercent: promo.discountPercent,
    maxUses: promo.maxUses,
    usageCount: promo._count.usageRecords,
    expiresAt: promo.expiresAt,
    active: promo.active,
    createdAt: promo.createdAt,
  }));

  return <PromosClient promos={promosData} />;
}
