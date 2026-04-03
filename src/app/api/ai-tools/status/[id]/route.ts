// =============================================================================
// API: /api/ai-tools/status/[id]
// Poll generation status while document is being generated
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const generation = await prisma.aiToolGeneration.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        user_id: true,
        tool_slug: true,
        status: true,
        filename: true,
        blob_url: true,
        expires_at: true,
        error_message: true,
      },
    });

    if (!generation || generation.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: generation.id,
      toolSlug: generation.tool_slug,
      status: generation.status,
      filename: generation.filename,
      downloadUrl: generation.blob_url,
      expiresAt: generation.expires_at?.toISOString(),
      error: generation.error_message,
    });
  } catch (error: any) {
    console.error('[AI Tools Status]', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
