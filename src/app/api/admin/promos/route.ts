import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreatePromoSchema = z.object({
  code: z.string().min(1).max(50),
  discountPercent: z.number().min(0).max(100),
  maxUses: z.number().min(1),
  expiresAt: z.string().datetime().nullable().optional(),
});

const UpdatePromoSchema = z.object({
  id: z.string(),
  active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const promos = await prisma.promoCode.findMany({
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(promos);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { code, discountPercent, maxUses, expiresAt } = CreatePromoSchema.parse(body);

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      );
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discount_type: 'PERCENTAGE',
        discount_value: discountPercent,
        usage_limit: maxUses,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        active: true,
      },
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create promo' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { id, active } = UpdatePromoSchema.parse(body);

    const promo = await prisma.promoCode.update({
      where: { id },
      data: { active: active !== undefined ? active : undefined },
    });

    return NextResponse.json(promo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update promo' }, { status: 500 });
  }
}
