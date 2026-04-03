'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnsubscribe = async () => {
    if (!email || !token) {
      setError('Invalid unsubscribe link. Please use the link from your email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to unsubscribe. Please try again.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2 className="page-header">Unsubscribed</h2>
          </div>
          <div className="verify-message">
            <p>
              You have been unsubscribed from Ebrora marketing emails.
              You will still receive essential account emails such as
              email verification, password resets, and subscription confirmations.
            </p>
          </div>
          <div className="auth-card__footer">
            <p>
              <Link href="/" className="link link--primary">
                Back to Ebrora
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="page-header">Unsubscribe</h1>
          <p>Manage your email preferences</p>
        </div>

        <div className="verify-message">
          <p>
            Click the button below to unsubscribe
            {email ? ` ${email}` : ''} from Ebrora marketing emails.
          </p>
          <p className="text--small text--muted" style={{ marginTop: '8px' }}>
            Essential account emails (verification, password resets, and
            subscription confirmations) will not be affected.
          </p>
        </div>

        {error && (
          <div
            style={{
              color: '#d32f2f',
              fontSize: '14px',
              margin: '16px 0',
              padding: '12px',
              background: '#fef2f2',
              borderRadius: '6px',
            }}
          >
            {error}
          </div>
        )}

        {(!email || !token) && !error && (
          <div
            style={{
              color: '#d32f2f',
              fontSize: '14px',
              margin: '16px 0',
              padding: '12px',
              background: '#fef2f2',
              borderRadius: '6px',
            }}
          >
            Invalid unsubscribe link. Please use the link from your email.
          </div>
        )}

        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <button
            onClick={handleUnsubscribe}
            disabled={loading || !email || !token}
            className="btn btn--primary"
            style={{
              padding: '14px 40px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading || !email || !token ? 'not-allowed' : 'pointer',
              opacity: loading || !email || !token ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing…' : 'Unsubscribe'}
          </button>
        </div>

        <div className="auth-card__footer">
          <p>
            <Link href="/" className="link link--primary">
              Back to Ebrora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2 className="page-header">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
