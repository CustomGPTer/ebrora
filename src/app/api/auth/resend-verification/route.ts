import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send-email';
import { welcomeEmail } from '@/lib/email/templates';

// HEAD requests (from email security scanners like Microsoft Safe Links)
// must return 200 without consuming the token.
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// GET requests redirect to the confirmation page.
// This handles users who have old-format links or direct API hits.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json(
      { error: 'Verification token is missing' },
      { status: 400 }
    );
  }

  // Redirect to the confirmation page — don't consume the token here
  return NextResponse.redirect(
    new URL(`/auth/verify-email?token=${token}`, request.url)
  );
}

// POST — the actual verification (triggered by the confirmation page button)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is missing' },
        { status: 400 }
      );
    }

    // Hash the token to match what's stored in database
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: tokenHash,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: tokenHash,
          },
        },
      });

      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new verification link.' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user email verification
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        email_verified_at: new Date(),
      },
    });

    // Delete used verification token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: tokenHash,
        },
      },
    });

    // Send welcome email (non-blocking)
    try {
      const { subject, html } = welcomeEmail(user.name || 'there');
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
}
