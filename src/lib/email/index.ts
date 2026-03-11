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
    tier: string
  ): Promise<boolean> {
    const { subject, html } = subscriptionConfirmEmail('Customer', tier, '');
    return sendEmail(email, subject, html);
}
