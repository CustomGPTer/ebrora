import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import '@/styles/globals.css';
import { NavBar } from '@/components/navigation/NavBar';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { BackToTop } from '@/components/BackToTop';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import AuthProvider from '@/components/auth/AuthProvider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ebrora.com'),
  title: {
    default: 'AI Construction Document Generators & Excel Templates | Ebrora',
    template: '%s | Ebrora',
  },
  description:
    'AI-powered document generators and professional Excel templates for UK construction. 35+ AI tools, RAMS Builder, 750+ templates, 1,500+ free toolbox talks. Built by site teams, for site teams.',
  openGraph: {
    title: 'AI Construction Document Generators & Excel Templates | Ebrora',
    description:
      'AI-powered document generators and professional Excel templates for UK construction. 35+ AI tools, RAMS Builder, 750+ templates, 1,500+ toolbox talks.',
    url: 'https://www.ebrora.com',
    siteName: 'Ebrora',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Construction Document Generators & Excel Templates | Ebrora',
    description:
      'AI-powered document generators and professional Excel templates for UK construction. 35+ AI tools, RAMS Builder, 750+ templates, 1,500+ toolbox talks.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      {
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  alternates: { canonical: 'https://www.ebrora.com' },
};

// Schema.org JSON-LD for Organization + WebSite
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Ebrora',
  url: 'https://www.ebrora.com',
  logo: 'https://www.ebrora.com/og-image.jpg',
  description:
    'AI-powered construction document generators and professional Excel templates for UK site teams. 35+ AI tools including RAMS Builder, COSHH, RIDDOR, and Working at Height — plus 750+ downloadable templates and 1,500+ free toolbox talks.',
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
  url: 'https://www.ebrora.com',
  description:
    'AI-powered construction document generators, professional Excel templates, and 1,500+ free toolbox talks for UK construction professionals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className={`${dmSans.variable} ${playfairDisplay.variable}`}>
      <head>
        {/* Sitemap */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <GoogleAnalytics />
          <NavBar />
          <main>{children}</main>
          <Footer />
          <BackToTop />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
