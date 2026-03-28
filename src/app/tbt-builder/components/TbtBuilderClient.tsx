'use client';

import { useState } from 'react';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import { TbtTemplateSlug } from '@/lib/tbt/tbt-types';
import { TBT_TEMPLATE_CONFIGS } from '@/lib/tbt/tbt-template-config';
import TbtTemplatePicker from './TbtTemplatePicker';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';

export default function TbtBuilderClient() {
  const [selectedTemplate, setSelectedTemplate] = useState<TbtTemplateSlug | null>(null);
  const toolConfig = AI_TOOL_CONFIGS['tbt-generator'];

  const handleTemplateSelect = (slug: TbtTemplateSlug) => {
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
                    ? 'Describe Topic'
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

        <TbtTemplatePicker onSelect={handleTemplateSelect} />
      </div>
    );
  }

  // Step 2+: Template selected → show the AI builder with back button
  const templateConfig = TBT_TEMPLATE_CONFIGS[selectedTemplate];

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
          ← Change template
          <span style={{ color: '#888', fontWeight: 400, marginLeft: '0.5rem' }}>
            Currently: {templateConfig.displayName}
          </span>
        </button>
      </div>

      <AiToolBuilderClient
        toolConfig={toolConfig}
        tbtTemplateSlug={selectedTemplate}
      />
    </div>
  );
}
