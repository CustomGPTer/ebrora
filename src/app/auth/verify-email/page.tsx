'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="page-header">Invalid Link</h1>
          </div>
          <div className="verify-message">
            <p>This verification link is invalid or incomplete. Please check your email and try again.</p>
          </div>
          <div className="auth-card__footer">
            <p>
              <Link href="/auth/login" className="link link--primary">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleVerify = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed. The link may have expired.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login?verified=true');
      }, 2000);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="page-header">Email Verified</h1>
          </div>
          <div className="verify-message">
            <p>Your email has been verified successfully. Redirecting you to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="page-header">Verify Your Email</h1>
          <p>One last step to activate your account</p>
        </div>

        <div className="verify-message">
          <p>Click the button below to verify your email address and activate your Ebrora account.</p>
        </div>

        {error && (
          <div className="auth-error" style={{ color: '#d32f2f', fontSize: '14px', margin: '16px 0', padding: '12px', background: '#fef2f2', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <button
            onClick={handleVerify}
            disabled={isLoading}
            className="btn btn--primary"
            style={{
              padding: '14px 40px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Verifying...' : 'Verify Email Address'}
          </button>
        </div>

        <div className="auth-card__footer">
          <p>
            <Link href="/auth/login" className="link link--primary">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
