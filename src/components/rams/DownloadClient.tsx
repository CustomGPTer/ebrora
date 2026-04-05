'use client';

import { useState, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Unified DownloadClient
// Mode 1 (Inline): pass `downloadUrl` + `filename` + `expiresAt` + `onStartOver`
// Mode 2 (Standalone): pass `generationId` + `formatName` + `status` + `isExpired` + `createdAt`
// ---------------------------------------------------------------------------

interface InlineProps {
  downloadUrl: string;
  filename: string;
  expiresAt: string;
  generationId: string;
  onStartOver: () => void;
  // Standalone props not provided
  formatName?: undefined;
  status?: undefined;
  isExpired?: undefined;
  createdAt?: undefined;
}

interface StandaloneProps {
  generationId: string;
  formatName: string;
  status: string;
  isExpired: boolean;
  createdAt: string;
  // Inline props not provided
  downloadUrl?: undefined;
  filename?: undefined;
  expiresAt?: undefined;
  onStartOver?: undefined;
}

type DownloadClientProps = InlineProps | StandaloneProps;

export default function DownloadClient(props: DownloadClientProps) {
  const isInline = props.downloadUrl !== undefined;

  if (isInline) {
    return (
      <InlineDownload
        downloadUrl={props.downloadUrl}
        filename={props.filename}
        expiresAt={props.expiresAt}
        generationId={props.generationId}
        onStartOver={props.onStartOver}
      />
    );
  }

  return (
    <StandaloneDownload
      generationId={props.generationId}
      formatName={props.formatName}
      status={props.status}
      isExpired={props.isExpired}
      createdAt={props.createdAt}
    />
  );
}

// ---------------------------------------------------------------------------
// Inline mode — URL + expiry already known from parent
// ---------------------------------------------------------------------------
function InlineDownload({
  downloadUrl,
  filename,
  expiresAt,
  generationId,
  onStartOver,
}: {
  downloadUrl: string;
  filename: string;
  expiresAt: string;
  generationId: string;
  onStartOver: () => void;
}) {
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

  const hoursRemaining = Math.max(0, Math.round((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60)));

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
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

        {/* Disclaimer */}
        <p style={{
          marginTop: '2rem',
          fontSize: '0.75rem',
          color: '#6B7280',
          maxWidth: '400px',
          textAlign: 'center',
          lineHeight: '1.5',
          margin: '2rem auto 0',
        }}>
          Ebrora can make mistakes. Always review AI-generated documents before use and verify compliance with current regulations and site-specific requirements.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Standalone mode — fetches download URL from API
// ---------------------------------------------------------------------------
function StandaloneDownload({
  generationId,
  formatName,
  status,
  isExpired,
  createdAt,
}: {
  generationId: string;
  formatName: string;
  status: string;
  isExpired: boolean;
  createdAt: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch the download details from the API on mount
  useEffect(() => {
    if (status !== 'COMPLETED' || isExpired) return;

    async function fetchDownloadDetails() {
      try {
        const res = await fetch(`/api/rams/download/${generationId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to fetch download details');
        }
        const data = await res.json();
        setDownloadUrl(data.downloadUrl);
        setFilename(data.filename);
        setExpiresAt(data.expiresAt);
      } catch (err: any) {
        setFetchError(err.message);
      }
    }

    fetchDownloadDetails();
  }, [generationId, status, isExpired]);

  if (status !== 'COMPLETED') {
    return (
      <div className="download">
        <div className="download-content">
          <h2>Document Not Ready</h2>
          <p className="download-filename">
            Your document is still being generated.
          </p>
          <a href={`/rams-builder/generating/${generationId}`} className="rams-primary-btn">
            Check Status
          </a>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="download">
        <div className="download-content">
          <h2>Download Expired</h2>
          <p className="download-filename">
            This download link has expired. RAMS documents are available for 24 hours after generation.
          </p>
          <a href="/rams-builder" className="rams-primary-btn">
            Generate Again
          </a>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="download">
        <div className="download-content">
          <h2>Download Error</h2>
          <p className="download-filename">{fetchError}</p>
          <a href="/rams-builder" className="rams-primary-btn">
            Generate Again
          </a>
        </div>
      </div>
    );
  }

  const generationDate = new Date(createdAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownload = async () => {
    if (!downloadUrl) return;
    setIsDownloading(true);
    try {
      window.location.href = downloadUrl;
    } catch {
      setIsDownloading(false);
    }
  };

  const hoursRemaining = expiresAt
    ? Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;

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

        <p className="download-filename">{formatName}</p>
        <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
          Generated {generationDate}
        </p>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading || !downloadUrl}
          className="rams-primary-btn download-btn"
          style={{ cursor: isDownloading || !downloadUrl ? 'not-allowed' : 'pointer' }}
        >
          {!downloadUrl ? 'Loading...' : isDownloading ? 'Downloading...' : 'Download .docx'}
        </button>

        {/* Expiry notice */}
        {hoursRemaining !== null && (
          <div className="download-expiry">
            <div className="download-expiry-icon">⏱</div>
            <div>
              <p className="download-expiry-text">
                This download link expires in <strong>{hoursRemaining} hours</strong>
              </p>
              <p className="download-expiry-note">
                Download your document now. After expiry, the file will be permanently deleted.
              </p>
            </div>
          </div>
        )}

        {/* Cross-sell */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>Need Excel templates for your project?</p>
          <a href="/products" style={{ fontSize: '0.85rem', color: '#1B5745', fontWeight: 600 }}>Browse Templates</a>
        </div>

        {/* Generate another */}
        <a href="/rams-builder" className="rams-secondary-btn download-start-over" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Generate Another RAMS
        </a>

        {/* Disclaimer */}
        <p style={{
          marginTop: '2rem',
          fontSize: '0.75rem',
          color: '#6B7280',
          maxWidth: '400px',
          textAlign: 'center',
          lineHeight: '1.5',
          margin: '2rem auto 0',
        }}>
          Ebrora can make mistakes. Always review AI-generated documents before use and verify compliance with current regulations and site-specific requirements.
        </p>
      </div>
    </div>
  );
}
