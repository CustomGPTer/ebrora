'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    CredentialsSignin: 'Invalid email or password',
    EmailSignInError: 'Could not sign in with that email',
    OAuthSignin: 'Failed to sign in with OAuth provider',
    OAuthCallback: 'Failed to handle OAuth callback',
    EmailCreateAccount: 'Could not create account with email',
    Callback: 'An error occurred during authentication',
    OAuthAccountNotLinked: 'Email is already registered with a different provider',
    EmailAccountNotLinked: 'Email is already registered',
    NoUserFound: 'No account found with that email',
    ProviderAlreadyLinked: 'This provider is already linked to your account',
    SessionCallback: 'Session error occurred',
    SignOutError: 'Failed to sign out',
  };

  const message = error && errorMessages[error] ? errorMessages[error] : 'An authentication error occurred';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="page-header">Authentication Error</h1>
          <p>Something went wrong during sign in</p>
        </div>

        <div className="alert alert--error">
          <p>{message}</p>
          {error && (
            <p className="text--small">
              Error code: <code>{error}</code>
            </p>
          )}
        </div>

        <div className="error-actions">
          <p>Please try one of the following:</p>
          <ul className="text--small">
            <li>Check that your email address is correct</li>
            <li>Verify your password is correct</li>
            <li>Try signing in with Google OAuth</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>

        <div className="auth-card__footer">
          <p>
            <Link href="/auth/login" className="btn btn--primary btn--large btn--block">
              Try Again
            </Link>
          </p>
          <p className="text--center text--small">
            <Link href="/" className="link link--primary">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
