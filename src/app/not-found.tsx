import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 – Page Not Found | Ebrora',
  description: 'Sorry, the page you were looking for could not be found.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '3rem', fontWeight: 700, color: '#1B5745' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a' }}>Page Not Found</h2>
      <p style={{ color: '#666', maxWidth: '420px' }}>
        Sorry, the page you were looking for could not be found. It may have moved or been removed.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#1B5745',
          color: '#fff',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: 600,
          marginTop: '0.5rem',
        }}
      >
        Return to Homepage
      </Link>
    </div>
  );
}
