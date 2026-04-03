/** @type {import('next').NextConfig} */
import withMDX from '@next/mdx';

const mdxConfig = withMDX({
    extension: /\.mdx?$/,
    options: {
          remarkPlugins: [],
          rehypePlugins: [],
    },
});

const nextConfig = {
    // React strict mode for development
    reactStrictMode: true,

    // Images optimization
    images: {
          formats: ['image/avif', 'image/webp'],
          remotePatterns: [
            { protocol: 'https', hostname: 'ebrora.com' },
            { protocol: 'https', hostname: 'www.ebrora.com' },
            { protocol: 'https', hostname: 'cdn.ebrora.com' },
          ],
    },

    // MDX support
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

    // No rewrites needed — product pages use a dynamic catch-all route
    // at src/app/[slug]/page.tsx which serves URLs like /gantt-chart-project-planner
    // directly without /products/ prefix, preserving existing SEO URLs.

    // Bundle @sparticuz/chromium correctly for Vercel serverless (TBT PDF generation)
        serverExternalPackages: ['@sparticuz/chromium', '@prisma/client', '.prisma/client'],

    // Security headers
    async headers() {
          return [
            {
                      source: '/:path*',
                      headers: [
                        {
                                      key: 'X-Content-Type-Options',
                                      value: 'nosniff',
                        },
                        {
                                      key: 'X-Frame-Options',
                                      value: 'SAMEORIGIN',
                        },
                        {
                                      key: 'X-XSS-Protection',
                                      value: '1; mode=block',
                        },
                        {
                                      key: 'Referrer-Policy',
                                      value: 'strict-origin-when-cross-origin',
                        },
                        {
                                      key: 'Permissions-Policy',
                                      value: 'camera=(), microphone=(), geolocation=()',
                        },
                        {
                                      key: 'Strict-Transport-Security',
                                      value: 'max-age=63072000; includeSubDomains; preload',
                        },
                        {
                                      key: 'Content-Security-Policy',
                                      value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.ebrora.com https://cdn.ebrora.com https://www.google-analytics.com; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://api.openai.com https://*.paypal.com https://*.vercel-insights.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
                        },
                                ],
            },
                  // Cache static assets for 1 year
            {
                      source: '/static/:path*',
                      headers: [
                        {
                                      key: 'Cache-Control',
                                      value: 'public, max-age=31536000, immutable',
                        },
                                ],
            },
                ];
    },

    // 301 redirects
    async redirects() {
          return [
                  // Redirect non-www to www (canonical domain — www is the Safe Browsing-clean version)
            {
                      source: '/:path*',
                      has: [{ type: 'host', value: 'ebrora.com' }],
                      destination: 'https://www.ebrora.com/:path*',
                      permanent: true,
            },
                  // Redirect any .html URLs to clean URLs (preserves Google rankings)
                  // Excludes /toolbox-talks/ where static HTML TBT files are served
            {
                      source: '/:slug((?!api|_next|toolbox-talks).*)\\.html',
                      destination: '/:slug',
                      permanent: true,
            },
                  // Redirect index.html to root
            {
                      source: '/index.html',
                      destination: '/',
                      permanent: true,
            },
                ];
    },

    // Vercel-specific optimizations
    experimental: {
                  optimizePackageImports: [],
                  outputFileTracingIncludes: {
                        '/api/download/template/[...path]': ['./data/free-templates/**/*'],
                        '/free-templates/[category]': ['./data/free-templates/**/*'],
                        '/free-templates/[category]/[subcategory]': ['./data/free-templates/**/*'],
                        '/free-templates/[category]/[subcategory]/[template]': ['./data/free-templates/**/*'],
                  },
    },

    // Environment variables that should be available in the browser (must be prefixed with NEXT_PUBLIC_)
    env: {
          NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,
          NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ebrora.com',
    },

    // Logging
    logging: {
          fetches: {
                  fullUrl: true,
          },
    },

    // Disable static optimization for dynamic pages if needed
    staticPageGenerationTimeout: 120,
};

export default mdxConfig(nextConfig);
