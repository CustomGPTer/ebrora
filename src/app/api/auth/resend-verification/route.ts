import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send-email';
import { verificationEmail } from '@/lib/email/templates';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { validateOrigin } from '@/lib/csrf';

const schema = z.object({
    email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
    try {
        // CSRF origin validation
        if (!validateOrigin(request)) {
            return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
        }

        // Rate limit: 3 resend requests per IP per hour
        const ip = getClientIp(request);
        const { allowed } = rateLimit(ip, 'resend-verification', RATE_LIMITS.resendVerification);
        if (!allowed) {
            // Return success to prevent email enumeration
            return NextResponse.json({
                success: true,
                message: 'If an unverified account exists for that email, a new verification link has been sent.',
            });
        }

        const body = await request.json();
        const { email } = schema.parse(body);

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Always return success to prevent email enumeration
        if (!user || user.email_verified) {
            return NextResponse.json({
                success: true,
                message: 'If an unverified account exists for that email, a new verification link has been sent.',
            });
        }

        // Delete any existing verification tokens for this user
        await prisma.verificationToken.deleteMany({
            where: { identifier: email.toLowerCase() },
        });

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.create({
            data: {
                identifier: email.toLowerCase(),
                token: tokenHash,
                expires: expiresAt,
            },
        });

        // Send verification email
        const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;
        const { subject, html } = verificationEmail(user.name || 'there', verifyUrl);
        const emailSent = await sendEmail(email.toLowerCase(), subject, html);

        if (!emailSent) {
            console.error(`Failed to resend verification email to ${email.toLowerCase()}`);
            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again later.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Verification email sent! Please check your inbox and spam folder.',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0]?.message || 'Invalid email' },
                { status: 400 }
            );
        }
        console.error('Resend verification error:', error);
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
