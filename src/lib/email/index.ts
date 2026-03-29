export { sendEmail } from './send-email';
export {
    welcomeEmail,
    verificationEmail,
    ramsCompleteEmail,
    ramsFailedEmail,
    subscriptionConfirmEmail,
    usageLimitWarningEmail,
    passwordResetEmail,
} from './templates';

import { sendEmail } from './send-email';
import { subscriptionConfirmEmail } from './templates';

export async function sendSubscriptionConfirmationEmail(
    email: string,
    tier: string,
    name?: string
  ): Promise<boolean> {
    const amount = tier === 'PROFESSIONAL' ? '£19.99' : tier === 'STANDARD' ? '£9.99' : '£0.00';
    const { subject, html } = subscriptionConfirmEmail(name || 'there', tier, amount);
    return sendEmail(email, subject, html);
}
