'use client';

import { useState } from 'react';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import type { WahTemplateSlug } from '@/lib/wah/types';
import { WAH_TEMPLATE_CONFIGS } from '@/lib/wah/template-config';
import WahTemplatePicker from './WahTemplatePicker';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';

export default function WahBuilderClient() {
  const [selectedTemplate, setSelectedTemplate] = useState<WahTemplateSlug | null>(null);
  const toolConfig = AI_TOOL_CONFIGS['wah-assessment'];

  if (!selectedTemplate) {
    return (
      <div className="rams-builder">
        <div className="rams-progress">
          <div className="rams-progress-bar">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`rams-progress-step ${n <= 1 ? 'active' : ''}`}>
                <div className="rams-progress-dot">{n}</div>
                <span className="rams-progress-label">
                  {n === 1 ? 'Choose Template' : n === 2 ? 'Describe the WAH Activity' : n === 3 ? 'Interview' : 'Download'}
                </span>
              </div>
            ))}
            <div className="rams-progress-line">
              <div className="rams-progress-line-fill" style={{ width: '0%' }} />
            </div>
          </div>
        </div>
        <WahTemplatePicker onSelect={(slug) => setSelectedTemplate(slug)} />
      </div>
    );
  }

  const templateConfig = WAH_TEMPLATE_CONFIGS[selectedTemplate];

  return (
    <div>
      <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #eee' }}>
        <button onClick={() => setSelectedTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#1B5745', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          &larr; Change template
          <span style={{ color: '#888', fontWeight: 400, marginLeft: '0.5rem' }}>Currently: {templateConfig.displayName}</span>
        </button>
      </div>
      <AiToolBuilderClient toolConfig={toolConfig} wahTemplateSlug={selectedTemplate} />
    </div>
  );
}
