'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { CdmCheckerTemplateConfig } from '@/lib/cdm-checker/types';

interface Props { template: CdmCheckerTemplateConfig; onClose: () => void; }

const LAYOUT_LABEL: Record<string, string> = { standard: 'Standard Layout', matrix: 'Compliance Matrix', audit: 'Audit Trail Layout', executive: 'Executive Summary' };

export default function CdmCheckerTemplatePreviewModal({ template, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const totalPages = template.pageCount;
  const realPreviews = template.previewPaths;
  const pages: { src: string | null; label: string; isPlaceholder: boolean }[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (i < realPreviews.length) pages.push({ src: realPreviews[i], label: `Page ${i + 1}`, isPlaceholder: false });
    else pages.push({ src: null, label: `Page ${i + 1}`, isPlaceholder: true });
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') setActiveIndex(prev => Math.max(0, prev - 1));
    if (e.key === 'ArrowRight') setActiveIndex(prev => Math.min(pages.length - 1, prev + 1));
  }, [onClose, pages.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; };
  }, [handleKeyDown]);

  return (
    <div className="tpm-overlay" onClick={onClose}>
      <div className="tpm-container" onClick={(e) => e.stopPropagation()}>
        <button className="tpm-close" onClick={onClose} aria-label="Close preview">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div className="tpm-layout">
          <div className="tpm-viewer">
            <div className="tpm-main-image">
              {activeIndex > 0 && <button className="tpm-nav tpm-nav--left" onClick={() => setActiveIndex(prev => prev - 1)} aria-label="Previous page"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg></button>}
              {pages[activeIndex].isPlaceholder ? (
                <div className="tpm-placeholder"><div className="tpm-placeholder-icon"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="16" x2="13" y2="16" /></svg></div><span className="tpm-placeholder-label">{pages[activeIndex].label}</span><span className="tpm-placeholder-sub">Preview not yet available</span></div>
              ) : (
                <Image src={pages[activeIndex].src!} alt={`${template.displayName} — ${pages[activeIndex].label}`} fill sizes="(max-width: 768px) 100vw, 60vw" style={{ objectFit: 'contain' }} priority={activeIndex === 0} />
              )}
              {activeIndex < pages.length - 1 && <button className="tpm-nav tpm-nav--right" onClick={() => setActiveIndex(prev => prev + 1)} aria-label="Next page"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></button>}
              <span className="tpm-page-counter">{activeIndex + 1} / {totalPages}</span>
            </div>
            {pages.length > 1 && (
              <div className="tpm-thumbstrip">
                {pages.map((page, i) => (
                  <button key={i} className={`tpm-thumb ${i === activeIndex ? 'tpm-thumb--active' : ''}`} onClick={() => setActiveIndex(i)} aria-label={page.label}>
                    {page.isPlaceholder ? <div className="tpm-thumb-placeholder"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="7" y1="9" x2="17" y2="9" /><line x1="7" y1="13" x2="17" y2="13" /></svg></div> : <Image src={page.src!} alt={page.label} fill sizes="80px" style={{ objectFit: 'cover', objectPosition: 'top' }} />}
                    <span className="tpm-thumb-num">{i + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="tpm-details">
            <h2 className="tpm-details-title">{template.displayName}</h2>
            <p className="tpm-details-desc">{template.description}</p>
            <div className="tpm-meta">
              <span className="tpm-meta-pill"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="16" x2="13" y2="16" /></svg>{template.pageCount} {template.pageCount === 1 ? 'page' : 'pages'}</span>
              <span className="tpm-meta-pill"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 3v18" /></svg>{LAYOUT_LABEL[template.layout] || template.layout}</span>
            </div>
            <div className="tpm-sections"><h3 className="tpm-sections-title">What&apos;s included</h3><ul className="tpm-sections-list">{template.keySections.map((section, i) => <li key={i} className="tpm-sections-item"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>{section}</li>)}</ul></div>
            {pages.length > 1 && <div className="tpm-hint"><span className="tpm-hint-key">&larr;</span><span className="tpm-hint-key">&rarr;</span><span className="tpm-hint-text">to navigate</span><span className="tpm-hint-key">Esc</span><span className="tpm-hint-text">to close</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
