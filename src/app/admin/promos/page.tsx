import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { PromosClient } from '@/components/admin/PromosClient';

export const metadata = {
  title: 'Promo Codes - Admin',
};

export default async function PromosPage() {
  await requireAdmin();

  const promos = await prisma.promoCode.findMany({
    orderBy: { created_at: 'desc' },
  });

  const promosData = promos.map((promo) => ({
    id: promo.id,
    code: promo.code,
    discountPercent: promo.discount_value,
    maxUses: promo.usage_limit,
    usageCount: promo.times_used,
    expiresAt: promo.expires_at,
    active: promo.active,
    createdAt: promo.created_at,
  }));

  return <PromosClient promos={promosData} />;
}
