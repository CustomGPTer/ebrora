'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [submitted, setSubmitted] = useState(false);

  const handleUnsubscribe = async () => {
    // For now, just acknowledge — all current Ebrora emails are transactional.
    // When marketing emails are added, wire this to an API route that sets
    // a user preference flag in the database.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="page-header">Unsubscribed</h1>
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

        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <button
            onClick={handleUnsubscribe}
            className="btn btn--primary"
            style={{
              padding: '14px 40px',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            Unsubscribe
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
            <h1 className="page-header">Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
