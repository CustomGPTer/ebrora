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

/** Map tier to display-friendly name */
function formatTierName(tier: string): string {
  switch (tier) {
    case 'UNLIMITED': return 'Unlimited';
    case 'PROFESSIONAL': return 'Professional';
    case 'STARTER': return 'Starter';
    case 'STANDARD': return 'Starter'; // legacy
    default: return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  }
}

/** Map tier to monthly price */
function getTierPrice(tier: string): string {
  switch (tier) {
    case 'UNLIMITED': return '£49.99';
    case 'PROFESSIONAL': return '£24.99';
    case 'STARTER': return '£9.99';
    case 'STANDARD': return '£9.99'; // legacy
    default: return '£0.00';
  }
}

export async function sendSubscriptionConfirmationEmail(
    email: string,
    tier: string,
    name?: string
  ): Promise<boolean> {
    const amount = getTierPrice(tier);
    const displayTier = formatTierName(tier);
    const { subject, html } = subscriptionConfirmEmail(name || 'there', displayTier, amount);
    return sendEmail(email, subject, html);
}
