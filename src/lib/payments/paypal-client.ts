import crypto from 'crypto';

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';

let cachedAccessToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
    const now = Date.now();
    if (cachedAccessToken && tokenExpiry && now < tokenExpiry) {
          return cachedAccessToken;
    }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
  };

  cachedAccessToken = data.access_token;
    tokenExpiry = now + (data.expires_in * 1000) - 60000; // Refresh 1 min before expiry

  return cachedAccessToken;
}

export async function createSubscription(
    planId: string,
    userId: string
  ): Promise<{ subscriptionId: string; approvalUrl: string }> {
    const accessToken = await getAccessToken();

  const response = await fetch(
        `${PAYPAL_BASE}/v1/billing/subscriptions`,
    {
            method: 'POST',
            headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
                      'PayPal-Request-Id': crypto.randomUUID(),
            },
            body: JSON.stringify({
                      plan_id: planId,
                      application_context: {
                                  brand_name: 'Ebrora',
                                  locale: 'en-GB',
                                  user_action: 'SUBSCRIBE_NOW',
                                  return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/rams-builder`,
                                  cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/rams-builder/pricing`,
                      },
                      custom_id: userId,
            }),
    }
      );

  if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create subscription: ${error}`);
  }

  const data = (await response.json()) as {
        id: string;
        links: Array<{ rel: string; href: string }>;
  };

  const approveLink = data.links.find((link) => link.rel === 'approve');

  if (!approveLink) {
        throw new Error('No approval link in PayPal response');
  }

  return {
        subscriptionId: data.id,
        approvalUrl: approveLink.href,
  };
}

export async function getSubscriptionDetails(subscriptionId: string): Promise<any> {
    const accessToken = await getAccessToken();

  const response = await fetch(
        `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`,
    {
            method: 'GET',
            headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
            },
    }
      );

  if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get subscription details: ${error}`);
  }

  return response.json();
}

export async function cancelSubscription(
    subscriptionId: string,
    reason: string
  ): Promise<boolean> {
    const accessToken = await getAccessToken();

  const response = await fetch(
        `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
            method: 'POST',
            headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                      reason_code: 'CUSTOMER_REQUEST',
                      reason: reason,
            }),
    }
      );

  return response.ok;
}

export async function validateWebhookSignature(
    webhookId: string,
    eventBody: string,
    signature: string,
    transmissionId: string,
    transmissionTime: string,
    certUrl: string
  ): Promise<boolean> {
    const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
        },
        body: JSON.stringify({
                transmission_id: transmissionId,
                transmission_time: transmissionTime,
                cert_url: certUrl,
                auth_algo: 'SHA256withRSA',
                transmission_sig: signature,
                webhook_id: webhookId,
                webhook_event: JSON.parse(eventBody),
        }),
  });

  if (!response.ok) {
        return false;
  }

  const data = (await response.json()) as { verification_status: string };
    return data.verification_status === 'SUCCESS';
}
