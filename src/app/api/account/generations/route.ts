import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const skip = (page - 1) * limit;

    // Fetch total count
    const total = await prisma.generation.count({
      where: { userId: session.user.id },
    });

    // Fetch generations
    const generations = await prisma.generation.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        formatName: true,
        status: true,
        createdAt: true,
        fileUrl: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Transform data
    const data = generations.map((gen) => ({
      id: gen.id,
      formatName: gen.formatName,
      status: gen.status,
      createdAt: gen.createdAt.toISOString(),
      fileUrl: gen.fileUrl,
      isExpired: gen.expiresAt ? new Date() > gen.expiresAt : false,
    }));

    return NextResponse.json(
      {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching generations:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
