'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for monitoring
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="error-page">
      <div className="error-page__container">
        <h1 className="error-page__title">Something went wrong</h1>
        <p className="error-page__message">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {error.digest && <p className="error-page__digest">Error ID: {error.digest}</p>}
        <div className="error-page__actions">
          <button onClick={reset} className="error-page__retry-btn">
            Try again
          </button>
          <a href="/" className="error-page__home-link">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
