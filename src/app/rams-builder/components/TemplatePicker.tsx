'use client';

import { useState } from 'react';
import { TemplateSlug } from '@/lib/rams/types';
import { TEMPLATE_CONFIGS, TEMPLATE_ORDER } from '@/lib/rams/template-config';

interface TemplatePickerProps {
  onSelect: (slug: TemplateSlug) => void;
}

export default function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [previewSlug, setPreviewSlug] = useState<TemplateSlug | null>(null);

  const previewConfig = previewSlug ? TEMPLATE_CONFIGS[previewSlug] : null;

  return (
    <div className="template-picker">
      <div className="template-picker-header">
        <h2>Choose Your RAMS Template</h2>
        <p>Select a template layout that suits your project. Click a card to preview, or hit &quot;Use This Template&quot; to get started.</p>
      </div>

      <div className="template-grid">
        {TEMPLATE_ORDER.map(slug => {
          const config = TEMPLATE_CONFIGS[slug];
          return (
            <div key={slug} className="template-card" onClick={() => setPreviewSlug(slug)}>
              <div className="template-card-thumb">
                <img
                  src={config.thumbnailPath}
                  alt={config.displayName}
                  loading="lazy"
                />
                <div className="template-card-pages">{config.pageCount} pages</div>
              </div>
              <div className="template-card-body">
                <h3>{config.displayName}</h3>
                <p>{config.description}</p>
                <div className="template-card-tags">
                  {config.keySections.slice(0, 3).map(s => (
                    <span key={s} className="template-tag">{s}</span>
                  ))}
                  {config.keySections.length > 3 && (
                    <span className="template-tag template-tag-more">+{config.keySections.length - 3} more</span>
                  )}
                </div>
                <button
                  className="template-card-btn"
                  onClick={(e) => { e.stopPropagation(); onSelect(slug); }}
                >
                  Use This Template
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Preview Modal */}
      {previewSlug && previewConfig && (
        <div className="template-lightbox" onClick={() => setPreviewSlug(null)}>
          <div className="template-lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="template-lightbox-close" onClick={() => setPreviewSlug(null)}>×</button>
            <div className="template-lightbox-header">
              <h2>{previewConfig.displayName}</h2>
              <p>{previewConfig.description}</p>
              <div className="template-lightbox-meta">
                <span>{previewConfig.pageCount} pages</span>
                <span>•</span>
                <span>{previewConfig.scoringMethod === 'L_x_S' ? 'L×S Scoring' : previewConfig.scoringMethod === 'HML' ? 'H/M/L Rating' : previewConfig.scoringMethod === 'L_x_S_x_D' ? 'RPN Scoring' : 'Integrated'}</span>
              </div>
            </div>
            <div className="template-lightbox-previews">
              {previewConfig.previewPaths.map((path, idx) => (
                <img
                  key={idx}
                  src={path}
                  alt={`${previewConfig.displayName} page ${idx + 1}`}
                  className="template-lightbox-page"
                />
              ))}
            </div>
            <div className="template-lightbox-sections">
              <h3>Key Sections</h3>
              <div className="template-lightbox-tags">
                {previewConfig.keySections.map(s => (
                  <span key={s} className="template-tag">{s}</span>
                ))}
              </div>
            </div>
            <button className="template-lightbox-use" onClick={() => { setPreviewSlug(null); onSelect(previewSlug); }}>
              Use This Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
