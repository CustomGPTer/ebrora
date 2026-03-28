'use client';

import { useState } from 'react';
import { AI_TOOL_CONFIGS } from '@/lib/ai-tools/tool-config';
import { PermitToDigTemplateSlug } from '@/lib/permit-to-dig/types';
import { PERMIT_TO_DIG_TEMPLATE_CONFIGS } from '@/lib/permit-to-dig/template-config';
import PermitToDigTemplatePicker from './PermitToDigTemplatePicker';
import AiToolBuilderClient from '@/components/ai-tools/AiToolBuilderClient';

export default function PermitToDigBuilderClient() {
  const [selectedTemplate, setSelectedTemplate] = useState<PermitToDigTemplateSlug | null>(null);
  const toolConfig = AI_TOOL_CONFIGS['permit-to-dig'];

  if (!selectedTemplate) {
    return (
      <div className="rams-builder">
        <div className="rams-progress">
          <div className="rams-progress-bar">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`rams-progress-step ${n <= 1 ? 'active' : ''}`}>
                <div className="rams-progress-dot">{n}</div>
                <span className="rams-progress-label">{n === 1 ? 'Choose Template' : n === 2 ? 'Describe Site' : n === 3 ? 'Interview' : 'Download'}</span>
              </div>
            ))}
            <div className="rams-progress-line"><div className="rams-progress-line-fill" style={{ width: '0%' }} /></div>
          </div>
        </div>
        <PermitToDigTemplatePicker onSelect={setSelectedTemplate} />
      </div>
    );
  }

  const templateConfig = PERMIT_TO_DIG_TEMPLATE_CONFIGS[selectedTemplate];
  return (
    <div>
      <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #eee' }}>
        <button onClick={() => setSelectedTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#1B5745', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          &larr; Change template
          <span style={{ color: '#888', fontWeight: 400, marginLeft: '0.5rem' }}>Currently: {templateConfig.displayName}</span>
        </button>
      </div>
      <AiToolBuilderClient toolConfig={toolConfig} permitToDigTemplateSlug={selectedTemplate} />
    </div>
  );
}
