'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const verified = searchParams.get('verified');
  const reset = searchParams.get('reset');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowResendVerification(false);
    setResendMessage('');
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check if error contains verification message
        if (result.error.toLowerCase().includes('verify your email') || 
            result.error.toLowerCase().includes('verification')) {
          setError('Please verify your email address before logging in.');
          setShowResendVerification(true);
        } else {
          setError('Invalid email or password. Please try again.');
        }
      } else {
        router.push('/rams-builder');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage('Please enter your email address above first.');
      return;
    }
    
    setResendLoading(true);
    setResendMessage('');
    
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResendMessage('Verification email sent! Please check your inbox and spam folder.');
      } else {
        setResendMessage(data.error || 'Failed to resend verification email. Please try again.');
      }
    } catch {
      setResendMessage('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn('google', { callbackUrl: '/rams-builder' });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Welcome Back</h1>
          <p className="auth-card__subtitle">Sign in to your Ebrora account</p>
        </div>

        {verified && (
          <div className="alert alert--success">
            <p>Email verified successfully! You can now log in.</p>
          </div>
        )}

        {reset && (
          <div className="alert alert--success">
            <p>Password reset successfully! Please log in with your new password.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-card__form">
          {error && (
            <div className="alert alert--error">
              <p>{error}</p>
            </div>
          )}

          {showResendVerification && (
            <div style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="link link--primary"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: 0,
                  cursor: resendLoading ? 'wait' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </button>
              {resendMessage && (
                <p style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.875rem',
                  color: resendMessage.includes('sent') ? '#16a34a' : '#dc2626',
                }}>
                  {resendMessage}
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your password"
              required
            />
            <div className="form-group__footer">
              <Link href="/auth/forgot-password" className="link link--small">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn--primary btn--large btn--block"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-card__divider">
          <span>or</span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="btn btn--large btn--block"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backgroundColor: '#fff',
            border: '1px solid #dadce0',
            color: '#3c4043',
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-card__footer">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="link link--primary">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
