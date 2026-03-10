'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent cookie already exists
    const match = document.cookie.match(/(^| )ebrora_cookie_consent=([^;]+)/);
    if (!match) {
      setIsVisible(true);
    }
  }, []);

  const setCookie = (value: string) => {
    const date = new Date();
    date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
    document.cookie = `ebrora_cookie_consent=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
  };

  const handleAccept = () => {
    setCookie('accepted');
    setIsVisible(false);
    // Dispatch custom event so GoogleAnalytics component can load GA4
    document.dispatchEvent(new CustomEvent('cookieConsentGranted'));
  };

  const handleDecline = () => {
    setCookie('declined');
    setIsVisible(false);
  };

  return (
    <div className={`cookie-consent${isVisible ? ' visible' : ''}`} id="cookieConsent">
      <div className="container">
        <div className="cookie-consent__inner">
          <p className="cookie-consent__text">
            This site uses Google Analytics cookies to anonymously analyse site traffic and improve
            your experience, in accordance with UK GDPR and PECR. No personal data is collected. By
            clicking &ldquo;Accept&rdquo;, you consent to these analytics cookies. By clicking
            &ldquo;Decline&rdquo;, no analytics cookies will be set.{' '}
            <Link href="/privacy-policy">Privacy Policy</Link>
          </p>
          <div className="cookie-consent__buttons">
            <button className="btn btn--outline" onClick={handleDecline}>
              Decline
            </button>
            <button className="btn btn--primary" onClick={handleAccept}>
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
