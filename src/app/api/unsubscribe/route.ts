// =============================================================================
// API: POST /api/unsubscribe
// Validates a signed token and records the unsubscribe in the database.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const schema = z.object({
    email: z.string().email('Invalid email address'),
    token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
    try {
        // Rate limit: 10 unsubscribe requests per IP per hour
        const ip = getClientIp(request);
        const { allowed } = rateLimit(ip, 'unsubscribe', 10);
        if (!allowed) {
            // Still return success to avoid leaking info
            return NextResponse.json({ success: true });
        }

        const body = await request.json();
        const { email, token } = schema.parse(body);

        const normalisedEmail = email.toLowerCase().trim();

        // Verify the HMAC token
        if (!verifyUnsubscribeToken(normalisedEmail, token)) {
            return NextResponse.json(
                { error: 'Invalid unsubscribe link. Please use the link from your email.' },
                { status: 403 }
            );
        }

        // Upsert into MarketingUnsubscribe table
        await prisma.marketingUnsubscribe.upsert({
            where: { email: normalisedEmail },
            update: {}, // Already unsubscribed — no-op
            create: { email: normalisedEmail },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0]?.message || 'Invalid input' },
                { status: 400 }
            );
        }
        console.error('Unsubscribe error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
