'use client';

import { useState } from 'react';
import { TemplateSlug } from '@/lib/rams/types';
import { TEMPLATE_CONFIGS } from '@/lib/rams/template-config';

interface ScopeInputProps {
  templateSlug: TemplateSlug;
  onSubmit: (description: string) => void;
  onBack: () => void;
  initialValue?: string;
}

export default function ScopeInput({ templateSlug, onSubmit, onBack, initialValue = '' }: ScopeInputProps) {
  const [text, setText] = useState(initialValue);
  const config = TEMPLATE_CONFIGS[templateSlug];

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > 200;
  const isUnderMinimum = wordCount < 10;

  const handleSubmit = () => {
    if (!isOverLimit && !isUnderMinimum && text.trim()) {
      onSubmit(text.trim());
    }
  };

  return (
    <div className="scope-input">
      <div className="scope-input-header">
        <button className="rams-back-btn" onClick={onBack}>← Back to Templates</button>
        <div className="scope-input-template">
          <img src={config.thumbnailPath} alt={config.displayName} className="scope-input-thumb" />
          <div>
            <h3>{config.displayName}</h3>
            <p>{config.pageCount} pages • {config.scoringMethod === 'L_x_S' ? 'L×S' : config.scoringMethod === 'HML' ? 'H/M/L' : config.scoringMethod === 'L_x_S_x_D' ? 'RPN' : 'Integrated'} scoring</p>
          </div>
        </div>
      </div>

      <div className="scope-input-body">
        <h2>Describe the Work You Need a RAMS For</h2>
        <p className="scope-input-hint">
          Explain in detail what the work involves. Explain in detail what the work involves. <strong>The more detail you provide, the better your RAMS document will be.</strong>{' '}
          Include the type of work, location details, any specific hazards you&apos;re aware of, and the scale of the job.
        </p>

        <div className="scope-input-field">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Example: Installation of a new 150mm MDPE gas main along a 200m residential street in Manchester. Works include open-cut trenching to 900mm depth through mixed ground with existing BT and water services crossing the route. Two road crossings required using trenchless techniques. Works to be carried out in a live traffic environment with temporary traffic management."
            rows={6}
            className={isOverLimit ? 'over-limit' : ''}
            autoFocus
          />
          <div className={`scope-input-counter ${isOverLimit ? 'over-limit' : wordCount >= 180 ? 'near-limit' : ''}`}>
            {wordCount} / 200 words
          </div>
        </div>

        {isUnderMinimum && text.trim() && (
          <p className="scope-input-warning">Please provide at least 10 words to describe the work.</p>
        )}
        {isOverLimit && (
          <p className="scope-input-warning">Please keep your description under 100 words.</p>
        )}

        <button
          className="rams-primary-btn"
          onClick={handleSubmit}
          disabled={isOverLimit || isUnderMinimum || !text.trim()}
        >
          Generate My Questions →
        </button>
      </div>
    </div>
  );
}
