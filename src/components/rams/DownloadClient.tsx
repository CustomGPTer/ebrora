'use client';

import { useState } from 'react';

interface DownloadClientProps {
  generationId: string;
  formatName: string;
  status: string;
  fileUrl: string | null;
  isExpired: boolean;
  createdAt: string;
}

export default function DownloadClient({
  generationId,
  formatName,
  status,
  fileUrl,
  isExpired,
  createdAt,
}: DownloadClientProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/rams/download/${generationId}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      // The API route will redirect to the file URL
      window.location.href = `/api/rams/download/${generationId}`;
    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
    }
  };

  if (status !== 'COMPLETED') {
    return (
      <div className="download">
        <div className="download__card">
          <div className="download__title">Document Not Ready</div>
          <div className="download__meta">
            Your document is still being generated. Redirecting you back...
          </div>
          <a href={`/rams-builder/generating/${generationId}`} className="btn btn--primary">
            Check Status
          </a>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="download">
        <div className="download__card">
          <div className="download__title">Download Expired</div>
          <div className="download__meta">
            This download link has expired. Please generate a new RAMS document.
          </div>
          <a href="/rams-builder/generate" className="btn btn--primary">
            Generate Again
          </a>
        </div>
      </div>
    );
  }

  const generationDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="download">
      <div className="download__card">
        <div className="download__icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="32" cy="32" r="30" stroke="#1B5B50" strokeWidth="2" />
            <path
              d="M21 32L29 40L43 26"
              stroke="#1B5B50"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="download__title">Your RAMS is Ready!</div>

        <div className="download__meta">
          <p>Format: <strong>{formatName}</strong></p>
          <p>Generated: <strong>{generationDate}</strong></p>
        </div>

        <div className="download__actions">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn--primary btn--large"
            style={{ cursor: isDownloading ? 'not-allowed' : 'pointer' }}
          >
            {isDownloading ? 'Downloading...' : 'Download .docx'}
          </button>

          <a href="/rams-builder/generate" className="btn btn--outline">
            Generate Another
          </a>
        </div>

        <div className="download__expiry">
          This download link expires 12 hours after generation.
        </div>

        <div className="download__cross-sell">
          <p>Need Excel templates for your project?</p>
          <a href="/#products">Browse Templates</a>
        </div>
      </div>
    </div>
  );
}
