import type { Metadata } from 'next';
import '@/styles/globals.css';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { BackToTop } from '@/components/BackToTop';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

export const metadata: Metadata = {
  metadataBase: new URL('https://ebrora.com'),
  title: {
    default: 'Ebrora — Professional Excel Templates for Construction',
    template: '%s — Ebrora',
  },
  description: 'Download professional Excel templates built specifically for UK construction and civil engineering. CDM 2015 compliant.',
  openGraph: {
    title: 'Ebrora — Professional Excel Templates for Construction & Civil Engineering',
    description: 'Download professional Excel templates built specifically for UK construction and civil engineering. CDM 2015 compliant. Instant download, no signup required.',
    url: 'https://ebrora.com',
    siteName: 'Ebrora',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ebrora — Professional Excel Templates for Construction & Civil Engineering',
    description: 'Download professional Excel templates built specifically for UK construction and civil engineering. CDM 2015 compliant. Instant download, no signup required.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  alternates: { canonical: 'https://ebrora.com' },
  other: { 'google-site-verification': '' },
};

// Schema.org JSON-LD for Organization + WebSite
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Ebrora',
  url: 'https://ebrora.com',
  logo: 'https://ebrora.com/og-image.jpg',
  description: 'Professional Excel templates built specifically for UK construction and civil engineering professionals. CDM 2015 compliant tools for site managers, engineers, and project teams.',
  email: 'hello@ebrora.com',
  address: { '@type': 'PostalAddress', addressCountry: 'GB' },
  sameAs: [
    'https://www.linkedin.com/in/ebrora/',
    'https://x.com/EbroraSheets',
    'https://www.youtube.com/channel/UCQy-rQ3Ye1kIPpT19A1c0lg',
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Ebrora',
  url: 'https://ebrora.com',
  description: 'Professional Excel templates for UK construction and civil engineering. Instant download, no signup required.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://ebrora.com/?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
        {/* Sitemap */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        <NavBar />
        <main>{children}</main>
        <Footer />
        <BackToTop />
        <CookieBanner />
      </body>
    </html>
  );
}
