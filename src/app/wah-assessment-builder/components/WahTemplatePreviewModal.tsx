'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { WahTemplateConfig } from '@/lib/wah/types';

interface Props { template: WahTemplateConfig; onClose: () => void; }

export default function WahTemplatePreviewModal({ template, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pages = template.previewPaths.map((src, i) => ({ src, label: `Page ${i + 1}` }));

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
              <Image src={pages[activeIndex].src} alt={`${template.displayName} — ${pages[activeIndex].label}`} fill sizes="(max-width: 768px) 100vw, 60vw" style={{ objectFit: 'contain' }} priority={activeIndex === 0} />
              <span className="tpm-page-counter">{activeIndex + 1} / {pages.length}</span>
            </div>
          </div>
          <div className="tpm-details">
            <h2 className="tpm-details-title">{template.displayName}</h2>
            <p className="tpm-details-desc">{template.description}</p>
            <div className="tpm-meta">
              <span className="tpm-meta-pill">{template.pageCount} pages</span>
              <span className="tpm-meta-pill">{template.font} font</span>
              <span className="tpm-meta-pill" style={{ backgroundColor: `#${template.accentColor}10`, color: `#${template.accentColor}` }}>{template.detailLevel} detail</span>
            </div>
            <div className="tpm-sections">
              <h3 className="tpm-sections-title">What&apos;s included</h3>
              <ul className="tpm-sections-list">
                {template.keySections.map((section, i) => (
                  <li key={i} className="tpm-sections-item">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {section}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
