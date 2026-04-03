import nodemailer from 'nodemailer';
import { buildUnsubscribeUrl } from './unsubscribe-token';

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

/**
 * Send an email with automatic retry on transient failures.
 *
 * - Replaces `{{UNSUBSCRIBE_URL}}` placeholders with a signed unsubscribe link.
 * - Retries up to 2 additional times with exponential back-off (1 s, 2 s).
 */
export async function sendEmail(
    to: string,
    subject: string,
    html: string,
    maxRetries: number = 2
): Promise<boolean> {
    // Build signed unsubscribe URL for this recipient
    const unsubscribeUrl = buildUnsubscribeUrl(to);

    // Replace template placeholder with the real signed URL
    const finalHtml = html.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            await transporter.sendMail({
                from: `"Ebrora" <${process.env.SMTP_FROM || 'noreply@ebrora.com'}>`,
                to,
                subject,
                html: finalHtml,
                headers: {
                    'List-Unsubscribe': `<${unsubscribeUrl}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
            });
            return true;
        } catch (error) {
            const isLastAttempt = attempt === maxRetries;
            if (isLastAttempt) {
                console.error(`Email send failed after ${maxRetries + 1} attempts:`, error);
                return false;
            }
            // Exponential back-off: 1 s, 2 s
            const delayMs = 1000 * Math.pow(2, attempt);
            console.warn(
                `Email send attempt ${attempt + 1} failed, retrying in ${delayMs}ms…`,
                error instanceof Error ? error.message : error
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return false;
}
