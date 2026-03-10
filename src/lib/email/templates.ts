export function welcomeEmail(userName: string): { subject: string; html: string } {
  const subject = 'Welcome to Ebrora - Your RAMS Builder Awaits';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr style="background-color: #1B5B50;">
                  <td style="padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">E Ebrora</h1>
                    <p style="color: #D4A44C; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">RISK ASSESSMENT MANAGEMENT</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1B5B50; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${escapeHtml(userName)}!</h2>

                    <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                      Your Ebrora account is ready. We're excited to help you generate professional RAMS documents in minutes.
                    </p>

                    <div style="background-color: #f9f9f9; border-left: 4px solid #D4A44C; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #1B5B50; margin: 0 0 15px 0; font-weight: 600; font-size: 14px;">What You Can Do Now:</p>
                      <ul style="color: #333333; margin: 0; padding-left: 20px; font-size: 14px;">
                        <li style="margin-bottom: 8px;">✓ Choose from 10 professional RAMS formats</li>
                        <li style="margin-bottom: 8px;">✓ Answer guided questions for your project</li>
                        <li style="margin-bottom: 8px;">✓ Generate and download instantly</li>
                        <li style="margin-bottom: 8px;">✓ UK HSE compliant documents</li>
                      </ul>
                    </div>

                    <p style="color: #333333; margin: 0 0 20px 0; font-size: 14px;">
                      Get started now and create your first RAMS in just a few minutes.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <a href="https://ebrora.com/rams-builder" style="background-color: #1B5B50; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">
                      Start Building RAMS
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr style="background-color: #f5f5f5; border-top: 1px solid #e0e0e0;">
                  <td style="padding: 20px 30px; text-align: center;">
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 12px;">
                      © 2026 Ebrora. All rights reserved.
                    </p>
                    <p style="color: #999999; margin: 0; font-size: 11px;">
                      <a href="https://ebrora.com/unsubscribe?email=${encodeURIComponent('EMAIL_PLACEHOLDER')}" style="color: #666666; text-decoration: none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  return { subject, html };
}

export function verificationEmail(userName: string, verifyUrl: string): { subject: string; html: string } {
  const subject = 'Verify Your Ebrora Account';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr style="background-color: #1B5B50;">
                  <td style="padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">E Ebrora</h1>
                    <p style="color: #D4A44C; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">ACCOUNT VERIFICATION</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1B5B50; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email</h2>

                    <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                      Hi ${escapeHtml(userName)},
                    </p>

                    <p style="color: #333333; margin: 0 0 30px 0; font-size: 14px; line-height: 1.6;">
                      Click the button below to verify your email address and activate your Ebrora account. This link expires in 24 hours.
                    </p>

                    <div style="text-align: center; margin: 40px 0;">
                      <a href="${escapeHtml(verifyUrl)}" style="background-color: #1B5B50; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">
                        Verify Email Address
                      </a>
                    </div>

                    <p style="color: #666666; margin: 30px 0 0 0; font-size: 12px; line-height: 1.6;">
                      Or copy this link: <br>
                      <span style="word-break: break-all; color: #1B5B50;">${escapeHtml(verifyUrl)}</span>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr style="background-color: #f5f5f5; border-top: 1px solid #e0e0e0;">
                  <td style="padding: 20px 30px; text-align: center;">
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 12px;">
                      © 2026 Ebrora. All rights reserved.
                    </p>
                    <p style="color: #999999; margin: 0; font-size: 11px;">
                      <a href="https://ebrora.com/unsubscribe?email=${encodeURIComponent('EMAIL_PLACEHOLDER')}" style="color: #666666; text-decoration: none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  return { subject, html };
}

export function ramsCompleteEmail(userName: string, formatName: string, downloadUrl: string, expiresIn: string): { subject: string; html: string } {
  const subject = `Your ${escapeHtml(formatName)} RAMS is Ready!`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr style="background-color: #1B5B50;">
                  <td style="padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">E Ebrora</h1>
                    <p style="color: #D4A44C; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">GENERATION COMPLETE</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1B5B50; margin: 0 0 20px 0; font-size: 24px;">Your RAMS is Ready!</h2>

                    <p style="color: #333333; margin: 0 0 10px 0; font-size: 16px; line-height: 1.6;">
                      Hi ${escapeHtml(userName)},
                    </p>

                    <p style="color: #333333; margin: 0 0 30px 0; font-size: 14px; line-height: 1.6;">
                      Your ${escapeHtml(formatName)} RAMS document has been generated successfully and is ready for download.
                    </p>

                    <div style="background-color: #f0f8f6; border-left: 4px solid #D4A44C; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #1B5B50; margin: 0 0 10px 0; font-weight: 600; font-size: 14px;">Document Details:</p>
                      <p style="color: #333333; margin: 0; font-size: 14px;">
                        Format: <strong>${escapeHtml(formatName)}</strong><br>
                        Download expires in: <strong>${escapeHtml(expiresIn)}</strong>
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <a href="${escapeHtml(downloadUrl)}" style="background-color: #1B5B50; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">
                      Download RAMS
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr style="background-color: #f5f5f5; border-top: 1px solid #e0e0e0;">
                  <td style="padding: 20px 30px; text-align: center;">
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 12px;">
                      © 2026 Ebrora. All rights reserved.
                    </p>
                    <p style="color: #999999; margin: 0; font-size: 11px;">
                      <a href="https://ebrora.com/unsubscribe?email=${encodeURIComponent('EMAIL_PLACEHOLDER')}" style="color: #666666; text-decoration: none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  return { subject, html };
}

export function ramsFailedEmail(userName: string, formatName: string): { subject: string; html: string } {
  const subject = `RAMS Generation Issue - ${escapeHtml(formatName)}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr style="background-color: #1B5B50;">
                  <td style="padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">E Ebrora</h1>
                    <p style="color: #D4A44C; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">GENERATION FAILED</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #d32f2f; margin: 0 0 20px 0; font-size: 24px;">We Encountered an Issue</h2>

                    <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                      Hi ${escapeHtml(userName)},
                    </p>

                    <p style="color: #333333; margin: 0 0 30px 0; font-size: 14px; line-height: 1.6;">
                      We encountered an error while generating your ${escapeHtml(formatName)} RAMS document. Our team has been notified and is investigating the issue.
                    </p>

                    <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #e65100; margin: 0; font-size: 14px;">
                        Please try again in a few moments. If the problem persists, contact our support team.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <a href="https://ebrora.com/support" style="background-color: #1B5B50; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">
                      Contact Support
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr style="background-color: #f5f5f5; border-top: 1px solid #e0e0e0;">
                  <td style="padding: 20px 30px; text-align: center;">
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 12px;">
                      © 2026 Ebrora. All rights reserved.
                    </p>
                    <p style="color: #999999; margin: 0; font-size: 11px;">
                      <a href="https://ebrora.com/unsubscribe?email=${encodeURIComponent('EMAIL_PLACEHOLDER')}" style="color: #666666; text-decoration: none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  return { subject, html };
}

export function subscriptionConfirmEmail(userName: string, tier: string, amount: string): { subject: string; html: string } {
  const subject = `Welcome to Ebrora ${escapeHtml(tier)} - Subscription Confirmed`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr style="background-color: #1B5B50;">
                  <td style="padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">E Ebrora</h1>
                    <p style="color: #D4A44C; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">SUBSCRIPTION CONFIRMED</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1B5B50; margin: 0 0 20px 0; font-size: 24px;">Your Subscription is Active</h2>

                    <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                      Hi ${escapeHtml(userName)},
                    </p>

                    <p style="color: #333333; margin: 0 0 30px 0; font-size: 14px; line-height: 1.6;">
                      Thank you for upgrading to Ebrora ${escapeHtml(tier)}. Your subscription is now active and you have access to all premium features.
                    </p>

                    <div style="background-color: #f0f8f6; border-left: 4px solid #D4A44C; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #1B5B50; margin: 0 0 10px 0; font-weight: 600; font-size: 14px;">Subscription Details:</p>
                      <p style="color: #333333; margin: 0; font-size: 14px;">
                        Plan: <strong>${escapeHtml(tier)}</strong><br>
                        Amount: <strong>${escapeHtml(amount)}</strong>/month<br>
                        Status: <strong style="color: #2e7d6e;">Active</strong>
                      </p>
                    </div>

                    <p style="color: #333333; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
                      You can now access all formats and generate unlimited RAMS documents. Start building now!
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <a href="https://ebrora.com/rams-builder" style="background-color: #1B5B50; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">
                      Back to RAMS Builder
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr style="background-color: #f5f5f5; border-top: 1px solid #e0e0e0;">
                  <td style="padding: 20px 30px; text-align: center;">
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 12px;">
                      © 2026 Ebrora. All rights reserved.
                    </p>
                    <p style="color: #999999; margin: 0; font-size: 11px;">
                      <a href="https://ebrora.com/unsubscribe?email=${encodeURIComponent('EMAIL_PLACEHOLDER')}" style="color: #666666; text-decoration: none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  return { subject, html };
}

export function usageLimitWarningEmail(userName: string, used: number, limit: number): { subject: string; html: string } {
  const subject = 'Your Ebrora Monthly Usage Limit Warning';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr style="background-color: #1B5B50;">
                  <td style="padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">E Ebrora</h1>
                    <p style="color: #D4A44C; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">USAGE ALERT</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1B5B50; margin: 0 0 20px 0; font-size: 24px;">Monthly Limit Alert</h2>

                    <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                      Hi ${escapeHtml(userName)},
                    </p>

                    <p style="color: #333333; margin: 0 0 30px 0; font-size: 14px; line-height: 1.6;">
                      You've used ${used} of ${limit} RAMS generations this month. You're approaching your monthly limit.
                    </p>

                    <div style="background-color: #fff8e1; border-left: 4px solid #D4A44C; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #f57f17; margin: 0; font-size: 14px;">
                        Upgrade your plan to get unlimited generations and access all formats.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <a href="https://ebrora.com/rams-builder#pricing" style="background-color: #1B5B50; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">
                      View Upgrade Options
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr style="background-color: #f5f5f5; border-top: 1px solid #e0e0e0;">
                  <td style="padding: 20px 30px; text-align: center;">
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 12px;">
                      © 2026 Ebrora. All rights reserved.
                    </p>
                    <p style="color: #999999; margin: 0; font-size: 11px;">
                      <a href="https://ebrora.com/unsubscribe?email=${encodeURIComponent('EMAIL_PLACEHOLDER')}" style="color: #666666; text-decoration: none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  return { subject, html };
}

export function passwordResetEmail(userName: string, resetUrl: string): { subject: string; html: string } {
  const subject = 'Reset Your Ebrora Password';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr style="background-color: #1B5B50;">
                  <td style="padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">E Ebrora</h1>
                    <p style="color: #D4A44C; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">PASSWORD RESET</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1B5B50; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>

                    <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                      Hi ${escapeHtml(userName)},
                    </p>

                    <p style="color: #333333; margin: 0 0 30px 0; font-size: 14px; line-height: 1.6;">
                      We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.
                    </p>

                    <div style="text-align: center; margin: 40px 0;">
                      <a href="${escapeHtml(resetUrl)}" style="background-color: #1B5B50; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">
                        Reset Password
                      </a>
                    </div>

                    <p style="color: #666666; margin: 30px 0 20px 0; font-size: 12px; line-height: 1.6;">
                      Or copy this link: <br>
                      <span style="word-break: break-all; color: #1B5B50;">${escapeHtml(resetUrl)}</span>
                    </p>

                    <p style="color: #999999; margin: 0; font-size: 12px;">
                      If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr style="background-color: #f5f5f5; border-top: 1px solid #e0e0e0;">
                  <td style="padding: 20px 30px; text-align: center;">
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 12px;">
                      © 2026 Ebrora. All rights reserved.
                    </p>
                    <p style="color: #999999; margin: 0; font-size: 11px;">
                      <a href="https://ebrora.com/unsubscribe?email=${encodeURIComponent('EMAIL_PLACEHOLDER')}" style="color: #666666; text-decoration: none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  return { subject, html };
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
