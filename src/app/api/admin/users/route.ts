import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const tier = req.nextUrl.searchParams.get('tier') || 'ALL';
    const search = req.nextUrl.searchParams.get('search') || '';
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (tier !== 'ALL') filter.subscription = { tier };
    if (search) {
      filter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: filter,
        include: {
          subscription: { select: { tier: true, status: true } },
          _count: { select: { generations: true, ai_tool_generations: true } },
        },
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where: filter }),
    ]);

    return NextResponse.json({ users, total, page });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { userId, name, role, tier, verifyEmail } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Update user fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role && ['USER', 'ADMIN'].includes(role)) updateData.role = role;
    
    // Handle email verification
    if (verifyEmail === true) {
      updateData.email_verified = true;
      updateData.email_verified_at = new Date();
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({ where: { id: userId }, data: updateData });
    }

    // Update subscription tier if provided
    if (tier && ['FREE', 'STARTER', 'STANDARD', 'PROFESSIONAL', 'UNLIMITED'].includes(tier)) {
      await prisma.subscription.upsert({
        where: { user_id: userId },
        update: { tier: tier as any },
        create: { user_id: userId, tier: tier as any, status: 'ACTIVE' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Cascade delete handled by Prisma schema relations
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
