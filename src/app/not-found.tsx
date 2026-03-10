import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="product-404">
        <div className="product-404__icon">🔍</div>
        <h1 className="product-404__title">Page Not Found</h1>
        <p className="product-404__text">
          Sorry, we couldn't find the page you're looking for. It may have been moved or removed.
        </p>
        <Link href="/#products" className="btn btn--primary btn--large">
          Browse All Templates
        </Link>
      </div>
    </div>
  );
}
