import Link from 'next/link';

export default function VerifyRequestPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="page-header">Check Your Email</h1>
          <p>Verification link sent</p>
        </div>

        <div className="verify-message">
          <p>
            We've sent a verification link to your email address. Please click the link to verify your email and complete your account setup.
          </p>
          <p className="text--small text--muted">
            The link will expire in 24 hours. If you don't see the email, check your spam folder.
          </p>
        </div>

        <div className="verify-actions">
          <p className="text--small">
            Once verified, you'll be able to sign in to your Ebrora RAMS Builder account.
          </p>
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
