'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const allRequirementsMet =
    passwordRequirements.length &&
    passwordRequirements.uppercase &&
    passwordRequirements.number &&
    passwordRequirements.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      setShowVerificationMessage(true);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { redirect: true, callbackUrl: '/dashboard' });
    } catch (err) {
      setError('Failed to sign up with Google');
      console.error('Google sign-up error:', err);
      setIsLoading(false);
    }
  };

  if (showVerificationMessage) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="page-header">Check Your Email</h1>
            <p>We've sent a verification link to</p>
            <p className="text--bold">{email}</p>
          </div>

          <div className="alert alert--info">
            <p>Please click the verification link in the email to confirm your account.</p>
            <p className="text--small">The link will expire in 24 hours.</p>
          </div>

          <div className="auth-card__footer">
            <p>
              <button
                onClick={() => setShowVerificationMessage(false)}
                className="link link--primary"
                type="button"
              >
                Back to registration
              </button>
            </p>
          </div>

          <div className="auth-card__footer">
            <p>
              Already have an account?{' '}
              <Link href="/auth/login" className="link link--primary">
                Sign in
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
          <h1 className="page-header">Create Account</h1>
          <p>Get started with Ebrora RAMS Builder</p>
        </div>

        {error && (
          <div className="alert alert--error">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="auth-card__google btn btn--large btn--outline"
          type="button"
        >
          <svg className="btn__icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <div className="auth-card__divider">or sign up with email</div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="password-requirements">
            <p className="text--small">Password requirements:</p>
            <ul className="requirements-list">
              <li className={passwordRequirements.length ? 'requirement--met' : ''}>
                <span className="requirement__icon">
                  {passwordRequirements.length ? '✓' : '○'}
                </span>
                At least 8 characters
              </li>
              <li className={passwordRequirements.uppercase ? 'requirement--met' : ''}>
                <span className="requirement__icon">
                  {passwordRequirements.uppercase ? '✓' : '○'}
                </span>
                One uppercase letter
              </li>
              <li className={passwordRequirements.number ? 'requirement--met' : ''}>
                <span className="requirement__icon">
                  {passwordRequirements.number ? '✓' : '○'}
                </span>
                One number
              </li>
              <li className={passwordRequirements.match ? 'requirement--met' : ''}>
                <span className="requirement__icon">
                  {passwordRequirements.match ? '✓' : '○'}
                </span>
                Passwords match
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || !allRequirementsMet}
            className="btn btn--primary btn--large btn--block"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-card__footer">
          <p>
            Already have an account?{' '}
            <Link href="/auth/login" className="link link--primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
