'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { InvasiveTemplateConfig } from '@/lib/invasive/types';

interface InvasiveTemplatePreviewModalProps {
  template: InvasiveTemplateConfig;
  onClose: () => void;
}

export default function InvasiveTemplatePreviewModal({ template, onClose }: InvasiveTemplatePreviewModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const pages = template.previewPaths.map((src, i) => ({
    src,
    label: `Page ${i + 1}`,
  }));

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') setActiveIndex(prev => Math.max(0, prev - 1));
    if (e.key === 'ArrowRight') setActiveIndex(prev => Math.min(pages.length - 1, prev + 1));
  }, [onClose, pages.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="tpm-overlay" onClick={onClose}>
      <div className="tpm-container" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="tpm-close" onClick={onClose} aria-label="Close preview">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Main layout: images left, details right */}
        <div className="tpm-layout">

          {/* Left: Image viewer */}
          <div className="tpm-viewer">
            <div className="tpm-main-image">
              {activeIndex > 0 && (
                <button
                  className="tpm-nav tpm-nav--left"
                  onClick={() => setActiveIndex(prev => prev - 1)}
                  aria-label="Previous page"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}

              <Image
                src={pages[activeIndex].src}
                alt={`${template.displayName} — ${pages[activeIndex].label}`}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                style={{ objectFit: 'contain' }}
                priority={activeIndex === 0}
              />

              {activeIndex < pages.length - 1 && (
                <button
                  className="tpm-nav tpm-nav--right"
                  onClick={() => setActiveIndex(prev => prev + 1)}
                  aria-label="Next page"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}

              <span className="tpm-page-counter">
                {activeIndex + 1} / {pages.length}
              </span>
            </div>

            {/* Thumbnail strip */}
            {pages.length > 1 && (
              <div className="tpm-thumbstrip">
                {pages.map((page, i) => (
                  <button
                    key={i}
                    className={`tpm-thumb ${i === activeIndex ? 'tpm-thumb--active' : ''}`}
                    onClick={() => setActiveIndex(i)}
                    aria-label={page.label}
                  >
                    <Image
                      src={page.src}
                      alt={page.label}
                      fill
                      sizes="80px"
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                    />
                    <span className="tpm-thumb-num">{i + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details panel */}
          <div className="tpm-details">
            <h2 className="tpm-details-title">{template.displayName}</h2>
            <p className="tpm-details-desc">{template.description}</p>

            {/* Meta pills */}
            <div className="tpm-meta">
              <span className="tpm-meta-pill">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="16" x2="13" y2="16" />
                </svg>
                {template.pageCount} pages
              </span>
              <span className="tpm-meta-pill">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                {template.font} font
              </span>
            </div>

            {/* Key Sections */}
            <div className="tpm-sections">
              <h3 className="tpm-sections-title">What&apos;s included</h3>
              <ul className="tpm-sections-list">
                {template.keySections.map((section, i) => (
                  <li key={i} className="tpm-sections-item">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {section}
                  </li>
                ))}
              </ul>
            </div>

            {/* Keyboard hint */}
            {pages.length > 1 && (
              <div className="tpm-hint">
                <span className="tpm-hint-key">&larr;</span>
                <span className="tpm-hint-key">&rarr;</span>
                <span className="tpm-hint-text">to navigate</span>
                <span className="tpm-hint-key">Esc</span>
                <span className="tpm-hint-text">to close</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
