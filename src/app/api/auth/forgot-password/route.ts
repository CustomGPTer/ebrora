import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send-email';
import { passwordResetEmail } from '@/lib/email/templates';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

const schema = z.object({
    email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
    try {
          // Rate limit: 5 reset requests per IP per hour
          const ip = getClientIp(request);
          const { allowed, retryAfterMs } = rateLimit(ip, 'forgot-password', RATE_LIMITS.forgotPassword);
          if (!allowed) {
                  // Still return success to prevent email enumeration
                  return NextResponse.json({ success: true });
          }

          const body = await request.json();
          const { email } = schema.parse(body);

      const user = await prisma.user.findUnique({
              where: { email: email.toLowerCase() },
      });

      // Always return success to prevent email enumeration
      if (!user) {
              return NextResponse.json({ success: true });
      }

      // Delete any existing reset tokens for this user
      await prisma.verificationToken.deleteMany({
              where: { identifier: `reset:${email.toLowerCase()}` },
      });

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
          const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.verificationToken.create({
              data: {
                        identifier: `reset:${email.toLowerCase()}`,
                        token: tokenHash,
                        expires: expiresAt,
              },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
          const { subject, html } = passwordResetEmail(user.name || 'there', resetUrl);
          await sendEmail(email.toLowerCase(), subject, html);

      return NextResponse.json({ success: true });
    } catch (error) {
          if (error instanceof z.ZodError) {
                  return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
          }
          console.error('Forgot password error:', error);
          return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}
