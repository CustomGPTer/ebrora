import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  userId: z.string(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const tier = req.nextUrl.searchParams.get('tier') || 'ALL';
    const search = req.nextUrl.searchParams.get('search') || '';

    const pageSize = 20;
    const skip = (page - 1) * pageSize;

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

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: filter,
        include: { subscription: { select: { tier: true } } },
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where: filter }),
    ]);

    return NextResponse.json({ users, total, page });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { userId, role } = UpdateUserSchema.parse(body);

    const updateData: any = {};
    if (role) updateData.role = role;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { subscription: { select: { tier: true } } },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
