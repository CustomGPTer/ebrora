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
    const allMet = Object.values(passwordRequirements).every(Boolean);

  useEffect(() => {
        if (!token) setError('Invalid or missing reset token. Please request a new password reset.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allMet) return;
        setError('');
        setIsLoading(true);
        try {
                const res = await fetch('/api/auth/reset-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ token, password }),
                });
                const data = await res.json();
                if (!res.ok) {
                          setError(data.error || 'Something went wrong');
                } else {
                          setSuccess(true);
                          setTimeout(() => router.push('/auth/login?reset=true'), 3000);
                }
        } catch {
                setError('An unexpected error occurred');
        } finally {
                setIsLoading(false);
        }
  };

  if (success) {
        return (
                <div className="auth-page">
                        <div className="auth-card">
                                  <div className="auth-card__header">
                                              <h1 className="page-header">Password Reset!</h1>h1>
                                  </div>div>
                                  <div className="alert alert--success">
                                              <p>Your password has been reset successfully.</p>p>
                                              <p className="text--small">Redirecting you to sign in...</p>p>
                                  </div>div>
                                  <div className="auth-card__footer">
                                              <p><Link href="/auth/login" className="link link--primary">Sign In Now</Link>Link></p>p>
                                  </div>div>
                        </div>div>
                </div>div>
              );
  }
  
    return (
          <div className="auth-page">
                <div className="auth-card">
                        <div className="auth-card__header">
                                  <h1 className="page-header">Reset Password</h1>h1>
                                  <p>Enter your new password below.</p>p>
                        </div>div>
                  {error && <div className="alert alert--error">{error}</div>div>}
                  {!error && token && (
                      <form onSubmit={handleSubmit} className="form">
                                  <div className="form-group">
                                                <label htmlFor="password">New Password</label>label>
                                                <input
                                                                  id="password"
                                                                  type="password"
                                                                  placeholder="••••••••"
                                                                  value={password}
                                                                  onChange={e => setPassword(e.target.value)}
                                                                  disabled={isLoading}
                                                                  required
                                                                />
                                  </div>div>
                                  <div className="form-group">
                                                <label htmlFor="confirmPassword">Confirm New Password</label>label>
                                                <input
                                                                  id="confirmPassword"
                                                                  type="password"
                                                                  placeholder="••••••••"
                                                                  value={confirmPassword}
                                                                  onChange={e => setConfirmPassword(e.target.value)}
                                                                  disabled={isLoading}
                                                                  required
                                                                />
                                  </div>div>
                                  <div className="password-requirements">
                                                <p className="text--small">Password requirements:</p>p>
                                                <ul className="requirements-list">
                                                                <li className={passwordRequirements.length ? 'requirement--met' : ''}>
                                                                  {passwordRequirements.length ? '✓' : '○'} At least 8 characters
                                                                </li>li>
                                                                <li className={passwordRequirements.uppercase ? 'requirement--met' : ''}>
                                                                  {passwordRequirements.uppercase ? '✓' : '○'} One uppercase letter
                                                                </li>li>
                                                                <li className={passwordRequirements.number ? 'requirement--met' : ''}>
                                                                  {passwordRequirements.number ? '✓' : '○'} One number
                                                                </li>li>
                                                                <li className={passwordRequirements.match ? 'requirement--met' : ''}>
                                                                  {passwordRequirements.match ? '✓' : '○'} Passwords match
                                                                </li>li>
                                                </ul>ul>
                                  </div>div>
                                  <button
                                                  type="submit"
                                                  disabled={isLoading || !allMet}
                                                  className="btn btn--primary btn--large btn--block"
                                                >
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                  </button>button>
                      </form>form>
                        )}
                        <div className="auth-card__footer">
                                  <p><Link href="/auth/forgot-password" className="link link--primary">Request new reset link</Link>Link></p>p>
                                  <p><Link href="/auth/login" className="link link--primary">Back to Sign In</Link>Link></p>p>
                        </div>div>
                </div>div>
          </div>div>
        );
}

export default function ResetPasswordPage() {
    return (
          <Suspense fallback={<div className="auth-page"><div className="auth-card"><p>Loading...</p>p></div>div></div>div>}>
                <ResetPasswordForm />
          </Suspense>Suspense>
        );
}</div>
