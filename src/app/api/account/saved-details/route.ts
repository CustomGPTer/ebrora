import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

const savedDetailsSchema = z.object({
  company_name: z.string().min(1).max(255).optional().nullable(),
  site_address: z.string().max(1000).optional().nullable(),
  supervisor: z.string().max(255).optional().nullable(),
  principal_contractor: z.string().max(255).optional().nullable(),
});

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { saved_details: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.saved_details || {});
  } catch (error) {
    console.error('Error fetching saved details:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validatedData = savedDetailsSchema.parse(body);

    // Upsert saved details
    const savedDetails = await prisma.savedDetails.upsert({
      where: { user_id: session.user.id },
      update: validatedData,
      create: {
        user_id: session.user.id,
        ...validatedData,
      },
    });

    return NextResponse.json(
      {
        message: 'Saved details updated successfully',
        data: savedDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating saved details:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
