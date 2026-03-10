import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usage reset is handled by checking generation dates in the database
    // This endpoint verifies the system is healthy and cron jobs are working
    // No database modifications needed as usage is calculated based on creation dates

    const timestamp = new Date().toISOString();

    return NextResponse.json(
      {
        status: 'ok',
        timestamp,
        message: 'Cron job executed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Cron job failed:', errorMessage);

    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Allow Vercel cron to access this endpoint
export const dynamic = 'force-dynamic';
