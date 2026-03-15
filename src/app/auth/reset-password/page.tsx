'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !allRequirementsMet) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password. Please try again.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login?reset=true');
        }, 2000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="auth-card__title">Password Reset!</h1>
            <p className="auth-card__subtitle">
              Your password has been successfully reset. Redirecting you to login...
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
          <h1 className="auth-card__title">Reset Password</h1>
          <p className="auth-card__subtitle">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-card__form">
          {error && (
            <div className="alert alert--error">
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="password-requirements">
            <p className="password-requirements__title">Password must have:</p>
            <ul className="password-requirements__list">
              <li className={`password-requirements__item ${passwordRequirements.length ? 'met' : ''}`}>
                At least 8 characters
              </li>
              <li className={`password-requirements__item ${passwordRequirements.uppercase ? 'met' : ''}`}>
                One uppercase letter
              </li>
              <li className={`password-requirements__item ${passwordRequirements.number ? 'met' : ''}`}>
                One number
              </li>
              <li className={`password-requirements__item ${passwordRequirements.match ? 'met' : ''}`}>
                Passwords match
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || !allRequirementsMet || !token}
            className="btn btn--primary btn--large btn--block"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-card__footer">
          <p>
            <Link href="/auth/forgot-password" className="link link--primary">
              Request new reset link
            </Link>
          </p>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card">Loading...</div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
