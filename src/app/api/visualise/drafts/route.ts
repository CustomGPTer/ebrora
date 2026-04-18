// =============================================================================
// API: GET /api/visualise/drafts
//
// Returns the user's saved drafts as a plain DraftSummary[] array
// (shape dictated by src/components/visualise/DraftList.tsx which reads
//  `await res.json() as DraftSummary[]`).
//
// Ordering: last_saved_at DESC. Limit: VISUALISE_DRAFT_CAP (3).
// daysUntilExpiry is computed server-side so the client doesn't have to
// re-derive it on every dropdown render.
//
// Response: 200 DraftSummary[] | 401
// =============================================================================

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { VISUALISE_DRAFT_CAP } from '@/lib/visualise/constants';
import type { DraftSummary } from '@/lib/visualise/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    const userId = session.user.id;

    const rows = await prisma.visualiseDocument.findMany({
      where: { user_id: userId },
      orderBy: { last_saved_at: 'desc' },
      take: VISUALISE_DRAFT_CAP,
      select: {
        id: true,
        title: true,
        visual_count: true,
        last_saved_at: true,
        expires_at: true,
      },
    });

    const now = Date.now();
    const summaries: DraftSummary[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      visualCount: r.visual_count,
      lastSavedAt: r.last_saved_at.toISOString(),
      expiresAt: r.expires_at.toISOString(),
      daysUntilExpiry: Math.max(0, Math.ceil((r.expires_at.getTime() - now) / MS_PER_DAY)),
    }));

    return NextResponse.json(summaries);
  } catch (error) {
    console.error('[visualise.drafts] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list drafts' },
      { status: 500 },
    );
  }
}
