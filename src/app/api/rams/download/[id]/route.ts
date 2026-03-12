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
  });

  if (!generation || generation.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (generation.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Document not ready' }, { status: 400 });
  }

  if (generation.file_expires_at && new Date(generation.file_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Download link expired' }, { status: 410 });
  }

  if (!generation.file_path) {
    return NextResponse.json({ error: 'File not available' }, { status: 404 });
  }

  // Redirect to the file URL (stored in cloud storage)
  return NextResponse.redirect(generation.file_path);
}
