// =============================================================================
// API: /api/cron/cleanup-tokens
// Deletes expired verification and password reset tokens from the database.
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/cleanup-tokens", "schedule": "0 3 * * *" }] }
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    // Verify cron secret (Vercel sets this automatically for cron jobs)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    try {
        const result = await prisma.verificationToken.deleteMany({
            where: {
                expires: { lt: new Date() },
            },
        });

        console.log(`[cleanup-tokens] Deleted ${result.count} expired tokens`);

        return NextResponse.json({
            success: true,
            deleted: result.count,
        });
    } catch (error) {
        console.error('[cleanup-tokens] Error:', error);
        return NextResponse.json(
            { error: 'Failed to clean up tokens' },
            { status: 500 }
        );
    }
}
