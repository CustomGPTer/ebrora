import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { validateOrigin } from '@/lib/csrf';

const schema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().optional(),
}).refine((data) => {
    // If confirmPassword is provided, it must match
    if (data.confirmPassword !== undefined && data.confirmPassword !== data.password) {
        return false;
    }
    return true;
}, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
    try {
          // CSRF origin validation
          if (!validateOrigin(request)) {
                  return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
          }

          // Rate limit: 10 reset attempts per IP per hour
          const ip = getClientIp(request);
          const { allowed, retryAfterMs } = rateLimit(ip, 'reset-password', 10);
          if (!allowed) {
                  return NextResponse.json(
                    { error: 'Too many attempts. Please try again later.' },
                    { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
                  );
          }

          const body = await request.json();
          const { token, password } = schema.parse(body);

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const verificationToken = await prisma.verificationToken.findFirst({
              where: { token: tokenHash },
      });

      if (!verificationToken || !verificationToken.identifier.startsWith('reset:')) {
              return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
      }

      if (verificationToken.expires < new Date()) {
              await prisma.verificationToken.delete({
                        where: { identifier_token: { identifier: verificationToken.identifier, token: tokenHash } },
              });
              return NextResponse.json({ error: 'Reset token has expired. Please request a new one.' }, { status: 400 });
      }

      const email = verificationToken.identifier.replace('reset:', '');
          const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
              return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const salt = await bcrypt.genSalt(12);
          const passwordHash = await bcrypt.hash(password, salt);

      await prisma.user.update({
              where: { id: user.id },
              data: { password_hash: passwordHash },
      });

      await prisma.verificationToken.delete({
              where: { identifier_token: { identifier: verificationToken.identifier, token: tokenHash } },
      });

      return NextResponse.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
    } catch (error) {
          if (error instanceof z.ZodError) {
                  return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
          }
          console.error('Reset password error:', error);
          return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}
