'use client';

import { useState } from 'react';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import type { RfiTemplateSlug } from '@/lib/rfi/types';
import { RFI_TEMPLATE_CONFIGS } from '@/lib/rfi/template-config';
import RfiTemplatePicker from './RfiTemplatePicker';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';

export default function RfiBuilderClient() {
  const [selectedTemplate, setSelectedTemplate] = useState<RfiTemplateSlug | null>(null);
  const toolConfig = AI_TOOL_CONFIGS['rfi-generator'];

  const handleTemplateSelect = (slug: RfiTemplateSlug) => {
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
                    ? 'Describe the Query'
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

        <RfiTemplatePicker onSelect={handleTemplateSelect} />
      </div>
    );
  }

  // Step 2+: Template selected → show the AI builder with back button
  const templateConfig = RFI_TEMPLATE_CONFIGS[selectedTemplate];

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
        rfiTemplateSlug={selectedTemplate}
      />
    </div>
  );
}
