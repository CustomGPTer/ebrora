import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateFormatSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  scoringType: z.string().optional(),
  isFree: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const formats = await prisma.ramsFormat.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(formats);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { id, ...updateData } = UpdateFormatSchema.parse(body);

    const format = await prisma.ramsFormat.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(format);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update format' }, { status: 500 });
  }
}
