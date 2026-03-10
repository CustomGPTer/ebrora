import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const generation = await prisma.generation.findUnique({
    where: { id },
    select: { status: true, fileUrl: true, error: true, userId: true },
  });

  if (!generation || generation.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: generation.status,
    fileUrl: generation.fileUrl,
    error: generation.error,
  });
}
