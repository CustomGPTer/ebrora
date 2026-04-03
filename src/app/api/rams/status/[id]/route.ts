import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const generation = await prisma.generation.findUnique({
    where: { id: params.id },
    select: { status: true, blobUrl: true, error_message: true, user_id: true },
  });

  if (!generation || generation.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: generation.status,
    fileUrl: generation.blobUrl,
    error: generation.error_message,
  });
}
