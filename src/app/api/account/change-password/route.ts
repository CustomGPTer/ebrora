import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validatedData = changePasswordSchema.parse(body);

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password_hash: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { message: 'User password not set' },
        { status: 400 }
      );
    }

    // Verify current password
    const passwordMatch = await bcryptjs.compare(validatedData.currentPassword, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(validatedData.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password_hash: hashedPassword },
    });

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error changing password:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
