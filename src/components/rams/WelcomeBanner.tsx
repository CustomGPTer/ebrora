'use client';

import { useState, useEffect } from 'react';

const WELCOME_BANNER_STORAGE_KEY = 'ebrora_welcome_banner_dismissed';

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(WELCOME_BANNER_STORAGE_KEY);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(WELCOME_BANNER_STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="welcome-banner">
      <div className="welcome-banner__content">
        <div className="welcome-banner__text-section">
          <h2 className="welcome-banner__title">Welcome to RAMS Builder!</h2>
          <p className="welcome-banner__subtitle">
            Generate professional risk assessments in minutes.
          </p>

          <div className="welcome-banner__features">
            <ul className="welcome-banner__features-list">
              <li className="welcome-banner__feature-item">
                ✓ Choose from 10 professional formats
              </li>
              <li className="welcome-banner__feature-item">
                ✓ Instant download capability
              </li>
              <li className="welcome-banner__feature-item">
                ✓ UK HSE compliant documents
              </li>
            </ul>
          </div>
        </div>

        <div className="welcome-banner__actions">
          <a href="/rams-builder/generate" className="welcome-banner__button">
            Get Started
          </a>
          <button
            className="welcome-banner__dismiss"
            onClick={handleDismiss}
            aria-label="Close welcome banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
