import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/send-email';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required')
});

// Sanitise user input before embedding in HTML email
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  try {
    // Rate limit: 10 contact submissions per IP per hour
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = rateLimit(ip, 'contact', RATE_LIMITS.contact);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many messages. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json();
    const data = contactSchema.parse(body);

    const html = `
      <h2 style="color:#1B5B50;">New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
    `;

    // Send to both hello@ebrora.com and admin
    const recipients = ['hello@ebrora.com', 'jacksonja21@gmail.com'];
    const results = await Promise.all(
      recipients.map((to) =>
        sendEmail(to, `[Ebrora Contact] ${data.subject}`, html)
      )
    );

    if (results.every((r) => r === false)) {
      console.error('Contact form: all email sends failed');
      return NextResponse.json(
        { success: false, message: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          errors: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Contact form error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
