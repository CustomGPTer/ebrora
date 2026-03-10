import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

const savedDetailsSchema = z.object({
  companyName: z.string().min(1).max(255).optional().nullable(),
  companyAddress: z.string().max(1000).optional().nullable(),
  defaultSupervisor: z.string().max(255).optional().nullable(),
  defaultPrincipalContractor: z.string().max(255).optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
});

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { savedDetails: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.savedDetails || {});
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
    const savedDetails = await prisma.userSavedDetails.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
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
