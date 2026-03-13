// =============================================================================
// API: /api/rams/download/[id]
// Serves the download URL with 24-hour expiry validation
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

    const generation = await prisma.generation.findUnique({
      where: { id: params.id },
    });

    if (!generation || generation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (generation.status !== 'COMPLETE') {
      return NextResponse.json({ error: 'Document not ready' }, { status: 400 });
    }

    if (!generation.blobUrl) {
      return NextResponse.json({ error: 'No download available' }, { status: 404 });
    }

    // Check 24-hour expiry
    if (generation.expiresAt && new Date() > generation.expiresAt) {
      return NextResponse.json({
        error: 'This download has expired. RAMS documents are available for 24 hours after generation.',
        expired: true,
      }, { status: 410 });
    }

    return NextResponse.json({
      downloadUrl: generation.blobUrl,
      filename: generation.filename || 'RAMS-Document.docx',
      expiresAt: generation.expiresAt?.toISOString(),
      templateSlug: generation.templateSlug,
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve download' },
      { status: 500 }
    );
  }
}
