import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generationQueue } from '@/lib/queue/queue-manager';

/**
 * POST /api/rams/process
 *
 * Triggers the background processing of a RAMS generation job.
 * Auth required. Verifies the generation belongs to the requesting user.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { generationId } = body as { generationId?: string };

    // Validate input
    if (!generationId || typeof generationId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid generationId' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(generationId)) {
      return NextResponse.json(
        { error: 'Invalid generation ID format' },
        { status: 400 }
      );
    }

    // Ownership check — generation must belong to this user
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
      select: { user_id: true, status: true },
    });

    if (!generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    if (generation.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to process this generation' },
        { status: 403 }
      );
    }

    // Enqueue the generation job
    generationQueue.enqueue(generationId).catch((error) => {
      console.error(`[API] Error enqueuing generation ${generationId}:`, error);
    });

    return NextResponse.json(
      {
        status: 'processing',
        generationId,
        message: 'RAMS generation has been queued for processing',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('[API] Error in /api/rams/process:', error);

    return NextResponse.json(
      {
        error: 'Failed to process generation request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
