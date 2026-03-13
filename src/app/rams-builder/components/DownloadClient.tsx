'use client';

import { useState, useCallback } from 'react';

interface DownloadClientProps {
  downloadUrl: string;
  filename: string;
  expiresAt: string;
  generationId: string;
  onStartOver: () => void;
}

export default function DownloadClient({
  downloadUrl,
  filename,
  expiresAt,
  generationId,
  onStartOver,
}: DownloadClientProps) {
  const [copied, setCopied] = useState(false);

  const expiryDate = new Date(expiresAt);
  const expiryFormatted = expiryDate.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Hours remaining
  const hoursRemaining = Math.max(0, Math.round((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60)));

  // Shareable download page URL
  const downloadPageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/rams-builder/download/${generationId}`
    : '';

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for mobile
      const input = document.createElement('input');
      input.value = downloadUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [downloadUrl]);

  return (
    <div className="download">
      <div className="download-content">
        {/* Success icon */}
        <div className="download-success-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#1B5745" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2>Your RAMS Is Ready</h2>
        <p className="download-filename">{filename}</p>

        {/* Download button */}
        <a href={downloadUrl} download={filename} className="rams-primary-btn download-btn">
          Download RAMS Document
        </a>

        {/* URL section */}
        <div className="download-url-section">
          <p className="download-url-label">Download link (copy and save this):</p>
          <div className="download-url-box">
            <input
              type="text"
              value={downloadUrl}
              readOnly
              className="download-url-input"
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button className="download-copy-btn" onClick={handleCopyUrl}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Expiry notice */}
        <div className="download-expiry">
          <div className="download-expiry-icon">⏱</div>
          <div>
            <p className="download-expiry-text">
              This download link expires in <strong>{hoursRemaining} hours</strong>
            </p>
            <p className="download-expiry-date">
              Available until {expiryFormatted}
            </p>
            <p className="download-expiry-note">
              Download your document now or save the link above. After expiry, the file will be permanently deleted.
            </p>
          </div>
        </div>

        {/* Start over */}
        <button className="rams-secondary-btn download-start-over" onClick={onStartOver}>
          Generate Another RAMS
        </button>
      </div>
    </div>
  );
}
