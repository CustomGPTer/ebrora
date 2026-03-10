import { NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required')
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // TODO: Replace with actual email sending (nodemailer) when SMTP configured
    // For now, log and return success
    console.log('Contact form submission:', data);

    // Placeholder for nodemailer integration:
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: process.env.SMTP_SECURE === 'true',
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });
    //
    // await transporter.sendMail({
    //   from: process.env.SMTP_FROM,
    //   to: 'hello@ebrora.com',
    //   subject: `[Ebrora Contact] ${data.subject}`,
    //   html: `<p><strong>Name:</strong> ${data.name}</p>
    //          <p><strong>Email:</strong> ${data.email}</p>
    //          <p><strong>Subject:</strong> ${data.subject}</p>
    //          <p><strong>Message:</strong></p>
    //          <p>${data.message.replace(/\n/g, '<br>')}</p>`,
    //   replyTo: data.email,
    // });

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
