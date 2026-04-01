'use client';

import { useState } from 'react';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import type { DelayTemplateSlug } from '@/lib/delay/types';
import { DELAY_TEMPLATE_CONFIGS } from '@/lib/delay/template-config';
import DelayTemplatePicker from './DelayTemplatePicker';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';

export default function DelayBuilderClient() {
  const [selectedTemplate, setSelectedTemplate] = useState<DelayTemplateSlug | null>(null);
  const toolConfig = AI_TOOL_CONFIGS['delay-notification'];

  const handleTemplateSelect = (slug: DelayTemplateSlug) => {
    setSelectedTemplate(slug);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
  };

  // Step 1: Pick a template
  if (!selectedTemplate) {
    return (
      <div className="rams-builder">
        {/* Progress Bar — step 1 of 4 */}
        <div className="rams-progress">
          <div className="rams-progress-bar">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`rams-progress-step ${n <= 1 ? 'active' : ''}`}
              >
                <div className="rams-progress-dot">{n}</div>
                <span className="rams-progress-label">
                  {n === 1
                    ? 'Choose Template'
                    : n === 2
                    ? 'Describe the Delay'
                    : n === 3
                    ? 'Interview'
                    : 'Download'}
                </span>
              </div>
            ))}
            <div className="rams-progress-line">
              <div className="rams-progress-line-fill" style={{ width: '0%' }} />
            </div>
          </div>
        </div>

        <DelayTemplatePicker onSelect={handleTemplateSelect} />
      </div>
    );
  }

  // Step 2+: Template selected → show the AI builder with back button
  const templateConfig = DELAY_TEMPLATE_CONFIGS[selectedTemplate];

  return (
    <div>
      {/* Back to template picker */}
      <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #eee' }}>
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            color: '#1B5745',
            fontWeight: 600,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          &larr; Change template
          <span style={{ color: '#888', fontWeight: 400, marginLeft: '0.5rem' }}>
            Currently: {templateConfig.displayName}
          </span>
        </button>
      </div>

      <AiToolBuilderClient
        toolConfig={toolConfig}
        delayTemplateSlug={selectedTemplate}
      />
    </div>
  );
}
