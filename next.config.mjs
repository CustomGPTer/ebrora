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
    domains: ['ebrora.com', 'cdn.ebrora.com'],
  },

  // MDX support
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // No rewrites needed — product pages use a dynamic catch-all route
  // at src/app/[slug]/page.tsx which serves URLs like /gantt-chart-project-planner
  // directly without /products/ prefix, preserving existing SEO URLs.

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

  // 301 redirects — strip .html extensions for SEO preservation
  async redirects() {
    return [
      // Redirect any .html URLs to clean URLs (preserves Google rankings)
      {
        source: '/:slug((?!api|_next).*)\\.html',
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
    optimizePackageImports: ['@prisma/client'],
  },

  // Environment variables that should be available in the browser (must be prefixed with NEXT_PUBLIC_)
  env: {
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://ebrora.com',
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
