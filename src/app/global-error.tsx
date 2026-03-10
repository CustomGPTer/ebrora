'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <div className="global-error-page">
          <div className="global-error-page__container">
            <h1 className="global-error-page__title">Critical Error</h1>
            <p className="global-error-page__message">
              A critical error has occurred. Our team has been notified. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <>
                <pre className="global-error-page__details">{error.message}</pre>
                {error.digest && (
                  <p className="global-error-page__digest">Error ID: {error.digest}</p>
                )}
              </>
            )}
            <div className="global-error-page__actions">
              <button onClick={reset} className="global-error-page__retry-btn">
                Try again
              </button>
              <a href="/" className="global-error-page__home-link">
                Go to homepage
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
