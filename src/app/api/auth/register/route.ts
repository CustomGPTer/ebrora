import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send-email';
import { verificationEmail } from '@/lib/email/templates';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
    try {
          const body = await request.json();
          const validatedData = registerSchema.parse(body);
          const { name, email, password } = validatedData;

      const existingUser = await prisma.user.findUnique({
              where: { email: email.toLowerCase() },
      });

      if (existingUser) {
              return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
                      );
      }

      const salt = await bcrypt.genSalt(12);
          const passwordHash = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
              data: {
                        name,
                        email: email.toLowerCase(),
                        password_hash: passwordHash,
                        email_verified: false,
              },
      });

      // Generate verification token
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
      const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;
          const { subject, html } = verificationEmail(name, verifyUrl);
          await sendEmail(email.toLowerCase(), subject, html);

      return NextResponse.json(
        {
                  success: true,
                  message: 'Registration successful. Please check your email to verify your account.',
                  userId: user.id,
        },
        { status: 201 }
            );
    } catch (error) {
          if (error instanceof z.ZodError) {
                  return NextResponse.json(
                    { error: error.errors[0]?.message || 'Validation error' },
                    { status: 400 }
                          );
          }
          console.error('Registration error:', error);
          return NextResponse.json(
            { error: 'An error occurred during registration' },
            { status: 500 }
                );
    }
}
