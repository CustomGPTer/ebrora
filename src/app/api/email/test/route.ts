import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send-email';
import { welcomeEmail } from '@/lib/email/templates';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const { to } = await request.json();

    if (!to || typeof to !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid email address' },
        { status: 400 }
      );
    }

    const { subject, html } = welcomeEmail('Test User');
    const success = await sendEmail(to, subject, html);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        to,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send email',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
