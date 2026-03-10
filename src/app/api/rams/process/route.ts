import { NextRequest, NextResponse } from 'next/server';
import { generationQueue } from '@/lib/queue/queue-manager';

/**
 * POST /api/rams/process
 *
 * Triggers the background processing of a RAMS generation job.
 * This endpoint enqueues the job and returns immediately.
 * Actual processing happens asynchronously in the background.
 *
 * Request body:
 * {
 *   "generationId": "string - UUID of the generation record"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { generationId } = body as { generationId?: string };

    // Validate input
    if (!generationId || typeof generationId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid generationId' },
        { status: 400 }
      );
    }

    // Validate UUID format (basic check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(generationId)) {
      return NextResponse.json(
        { error: 'Invalid generation ID format' },
        { status: 400 }
      );
    }

    // Enqueue the generation job
    // This runs asynchronously in the background
    generationQueue.enqueue(generationId).catch((error) => {
      console.error(`[API] Error enqueuing generation ${generationId}:`, error);
    });

    // Return immediately with processing status
    return NextResponse.json(
      {
        status: 'processing',
        generationId,
        message: 'RAMS generation has been queued for processing',
      },
      { status: 202 } // 202 Accepted
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
