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
// ebrora.com (non-www) is flagged by Google Safe Browsing as deceptive;
// www.ebrora.com is clean. Any request arriving on the bare domain
// is permanently redirected to www before any auth logic runs.
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

      // Check admin routes
      if (req.nextUrl.pathname.startsWith('/admin')) {
              const token = req.nextauth.token as JWT & { role?: string } | null;
              if (!token || token.role !== 'ADMIN') {
                        return NextResponse.redirect(new URL('/', req.url));
              }
      }

      // Check protected RAMS builder routes
      const protectedRamsRoutes = [
              '/rams-builder/generate',
              '/rams-builder/generating',
              '/rams-builder/download',
            ];
          const isProtectedRamsRoute = protectedRamsRoutes.some(
                  (route) => req.nextUrl.pathname === route
                );
          if (isProtectedRamsRoute && !req.nextauth.token) {
                  return NextResponse.redirect(new URL('/auth/signin', req.url));
          }

      // Check account routes
      if (req.nextUrl.pathname.startsWith('/account') && !req.nextauth.token) {
              return NextResponse.redirect(new URL('/auth/signin', req.url));
      }

      // Add security headers
      const response = NextResponse.next();
          response.headers.set('X-Frame-Options', 'DENY');
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
                              '/contact',
                            ];

                  const pathname = req.nextUrl.pathname;

                  // Top-level routes that require auth (not product pages)
                  const protectedTopLevelPrefixes = ['/admin', '/account', '/api', '/auth'];

                  // Check if this is a product page (top-level slug like /gantt-chart-project-planner)
                  const isProductPage =
                              /^\/[a-z0-9][a-z0-9-]*$/.test(pathname) &&
                              !publicPaths.includes(pathname) &&
                              !protectedTopLevelPrefixes.some((prefix) => pathname.startsWith(prefix));

                  // Check if path is public
                  const isPublic =
                              publicPaths.includes(pathname) ||
                              isProductPage ||
                              pathname.startsWith('/blog/') ||
                              pathname.startsWith('/api/auth') ||
                              pathname.startsWith('/api/payments/webhook') ||
                              pathname.startsWith('/api/public/') ||
                              pathname.startsWith('/api/rams/generate-questions') ||
                              pathname.startsWith('/auth/') ||
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
