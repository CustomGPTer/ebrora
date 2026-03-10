'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const GA_ID = 'G-ZVPRYV7LNX';

export function GoogleAnalytics() {
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    // Check if consent cookie exists on mount
    const cookieConsent = document.cookie
      .split('; ')
      .find((row) => row.startsWith('ebrora_cookie_consent='));

    if (cookieConsent?.includes('accepted')) {
      setConsentGranted(true);
    }

    // Listen for custom event
    const handleConsentGranted = () => {
      setConsentGranted(true);
    };

    document.addEventListener('cookieConsentGranted', handleConsentGranted);
    return () => document.removeEventListener('cookieConsentGranted', handleConsentGranted);
  }, []);

  if (!consentGranted) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
