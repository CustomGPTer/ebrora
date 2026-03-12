import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ListGenerationsSchema = z.object({
  page: z.string().optional(),
  status: z.string().optional(),
});

const RetryGenerationSchema = z.object({
  generationId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const status = req.nextUrl.searchParams.get('status') || 'ALL';

    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (status !== 'ALL') {
      filter.status = status;
    }

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where: filter,
        include: {
          user: { select: { name: true, email: true } },
          rams_format: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.generation.count({ where: filter }),
    ]);

    return NextResponse.json({ generations, total, page });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { generationId } = RetryGenerationSchema.parse(body);

    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
    });

    if (!generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Reset generation status to QUEUED for retry
    const updated = await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'QUEUED',
        error_message: null,
        completed_at: null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to retry generation' },
      { status: 500 }
    );
  }
}
