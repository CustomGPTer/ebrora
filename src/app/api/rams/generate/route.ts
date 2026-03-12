import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const generateSchema = z.object({
  formatSlug: z.string().min(1),
  answers: z.record(z.string()),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { formatSlug, answers } = generateSchema.parse(body);

    // Find format in database
    const format = await prisma.ramsFormat.findUnique({
      where: { slug: formatSlug },
    });
    if (!format || !format.enabled) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Check user subscription and format access
    const subscription = await prisma.subscription.findFirst({
      where: { user_id: session.user.id, status: 'ACTIVE' },
    });
    const tier = subscription?.tier || 'FREE';

    if (!format.is_free && tier === 'FREE') {
      return NextResponse.json(
        { error: 'This format requires a paid subscription' },
        { status: 403 }
      );
    }

    // Check monthly usage limits
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const generationsThisMonth = await prisma.generation.count({
      where: {
        user_id: session.user.id,
        created_at: { gte: monthStart },
        status: { not: 'FAILED' },
      },
    });

    const limits: Record<string, number> = {
      FREE: 1,
      STANDARD: 10,
      PROFESSIONAL: 25,
    };
    const monthlyLimit = limits[tier] || 1;

    if (generationsThisMonth >= monthlyLimit) {
      return NextResponse.json(
        {
          error: 'Monthly RAMS limit reached',
          limit: monthlyLimit,
          used: generationsThisMonth,
        },
        { status: 403 }
      );
    }

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        user_id: session.user.id,
        format_id: format.id,
        status: 'QUEUED',
        activity_category: answers.q2 || null,
        answers: answers,
        file_expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      },
    });

    return NextResponse.json({
      generationId: generation.id,
      status: 'queued',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
