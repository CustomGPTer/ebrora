'use client';

import { useState } from 'react';

export interface PoliteMessageProps {
  type: 'info' | 'warning' | 'success' | 'upgrade';
  title?: string;
  message: string;
  actionText?: string;
  actionHref?: string;
  onDismiss?: () => void;
  isDismissible?: boolean;
}

export function PoliteMessage({
  type,
  title,
  message,
  actionText,
  actionHref,
  onDismiss,
  isDismissible = true,
}: PoliteMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  const typeClass = `polite-message--${type}`;

  return (
    <div className={`polite-message ${typeClass}`} role="alert">
      <div className="polite-message__content">
        {title && <h3 className="polite-message__title">{title}</h3>}
        <p className="polite-message__message">{message}</p>

        {actionText && actionHref && (
          <a href={actionHref} className="polite-message__action">
            {actionText}
          </a>
        )}
      </div>

      {isDismissible && (
        <button
          className="polite-message__dismiss"
          onClick={handleDismiss}
          aria-label="Close message"
        >
          ✕
        </button>
      )}
    </div>
  );
}
