import nodemailer from 'nodemailer';

const port = parseInt(process.env.SMTP_PORT || '465');
const secure = port === 465; // SSL for port 465, STARTTLS for 587

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port,
    secure,
    auth: {
          user: process.env.SMTP_USER || 'resend',
          pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
          await transporter.sendMail({
                  from: `"Ebrora" <${process.env.SMTP_FROM || 'noreply@ebrora.com'}>`,
                  to,
                  subject,
                  html,
          });
          return true;
    } catch (error) {
          console.error('Email send error:', error);
          return false;
    }
}
