// =============================================================================
// API: /api/ai-tools/download/[id]
// Serves the download URL with 24-hour expiry validation
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAiToolConfig, isValidAiToolSlug } from '@/lib/ai-tools';
import type { AiToolSlug } from '@/lib/ai-tools';

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
    });

    if (!generation || generation.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (generation.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Document not ready' }, { status: 400 });
    }

    // Check 24-hour expiry
    if (generation.expires_at && new Date() > generation.expires_at) {
      const toolSlug = generation.tool_slug as AiToolSlug;
      const label = isValidAiToolSlug(toolSlug)
        ? getAiToolConfig(toolSlug).documentLabel
        : 'Document';

      return NextResponse.json({
        error: `This download has expired. ${label} documents are available for 24 hours after generation.`,
        expired: true,
      }, { status: 410 });
    }

    return NextResponse.json({
      downloadUrl: generation.blob_url,
      filename: generation.filename || 'Document.docx',
      expiresAt: generation.expires_at?.toISOString(),
    });
  } catch (error: any) {
    console.error('[AI Tools Download]', error);
    return NextResponse.json(
      { error: 'Failed to retrieve download' },
      { status: 500 }
    );
  }
}
