import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

// Enforce www canonical domain at middleware level.
// www.ebrora.com is the canonical domain. Any request arriving on the
// bare domain is permanently redirected to www before any auth logic runs.
function wwwRedirect(req: NextRequest): NextResponse | null {
  const host = req.headers.get('host') || '';
  if (host === 'ebrora.com' || host === 'ebrora.com:443') {
    const url = req.nextUrl.clone();
    url.host = 'www.ebrora.com';
    return NextResponse.redirect(url, { status: 301 });
  }
  return null;
}

export default withAuth(
  function middleware(req) {
    // Redirect bare domain to www before anything else
    const wwwResponse = wwwRedirect(req);
    if (wwwResponse) return wwwResponse;

    // Redirect /index.html to / for SEO
    if (req.nextUrl.pathname === '/index.html') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Redirect /login → /auth/login (prevent [slug] catch)
    if (req.nextUrl.pathname === '/login') {
      const url = new URL('/auth/login', req.url);
      // Preserve any query params (e.g. ?callbackUrl=)
      req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
      return NextResponse.redirect(url, { status: 301 });
    }

    // Redirect /register → /auth/register (prevent [slug] catch)
    if (req.nextUrl.pathname === '/register') {
      const url = new URL('/auth/register', req.url);
      req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
      return NextResponse.redirect(url, { status: 301 });
    }

    // Check admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const token = req.nextauth.token as JWT & { role?: string } | null;
      if (!token || token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Check protected RAMS builder sub-routes (NOT the landing page itself)
    const protectedRamsRoutes = [
      '/rams-builder/generating',
      '/rams-builder/download',
    ];
    const isProtectedRamsRoute = protectedRamsRoutes.some(
      (route) => req.nextUrl.pathname.startsWith(route)
    );
    if (isProtectedRamsRoute && !req.nextauth.token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Check account routes
    if (req.nextUrl.pathname.startsWith('/account') && !req.nextauth.token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes that don't need auth
        const publicPaths = [
          '/',
          '/blog',
          '/faq',
          '/privacy-policy',
          '/terms-of-service',
          '/refund-policy',
          '/rams-builder',
          '/pricing',
          '/pricing',
          '/contact',
          '/login',
          '/register',
          '/coshh-builder',
          '/itp-builder',
          '/manual-handling-builder',
          '/dse-builder',
          '/tbt-builder',
          '/confined-spaces-builder',
        ];

        const pathname = req.nextUrl.pathname;

        // Top-level routes that require auth (not product pages)
        const protectedTopLevelPrefixes = ['/admin', '/account', '/api'];

        // Check if this is a product page (top-level slug like /gantt-chart-project-planner)
        const isProductPage =
          /^\/[a-z0-9][a-z0-9-]*$/.test(pathname) &&
          !publicPaths.includes(pathname) &&
          !protectedTopLevelPrefixes.some((prefix) => pathname.startsWith(prefix));

        // Check if path is public
        const isPublic =
          publicPaths.includes(pathname) ||
          isProductPage ||
          /^\/[a-z0-9][a-z0-9-]*-builder$/.test(pathname) ||
          pathname.startsWith('/blog/') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/payments/webhook') ||
          pathname.startsWith('/api/cron/') ||
          pathname.startsWith('/api/public/') ||
          pathname.startsWith('/api/ai-tools/') ||
          pathname.startsWith('/api/rams/generate-questions') ||
          pathname.startsWith('/toolbox-talks') ||
          pathname.startsWith('/api/tbt-download') ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/free-templates') ||
          pathname.startsWith('/tools') ||
          pathname === '/sitemap.xml' ||
          pathname === '/robots.txt' ||
          /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2)$/.test(pathname);

        if (isPublic) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|images|assets|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2)$).*)',
  ],
};
