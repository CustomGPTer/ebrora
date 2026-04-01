'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RIDDOR_TEMPLATE_CONFIGS, RIDDOR_TEMPLATE_ORDER } from '@/lib/riddor/template-config';
import type { RiddorTemplateSlug } from '@/lib/riddor/types';
import RiddorTemplatePreviewModal from './RiddorTemplatePreviewModal';

interface Props { onSelect: (slug: RiddorTemplateSlug) => void; }

export default function RiddorTemplatePicker({ onSelect }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [previewSlug, setPreviewSlug] = useState<RiddorTemplateSlug | null>(null);
  const isAuthenticated = status === 'authenticated';
  const userPlan = (session?.user as { subscriptionTier?: string })?.subscriptionTier || 'FREE';
  const isPaid = userPlan === 'STANDARD' || userPlan === 'PROFESSIONAL';

  const getStatus = (): 'available' | 'locked-auth' | 'locked-upgrade' => {
    if (!isAuthenticated) return 'locked-auth';
    if (isPaid) return 'available';
    return 'locked-upgrade';
  };

  const handleClick = (slug: RiddorTemplateSlug) => {
    const s = getStatus();
    if (s === 'locked-auth') { router.push('/auth/login?callbackUrl=/riddor-report-builder'); return; }
    if (s === 'locked-upgrade') { router.push('/pricing'); return; }
    onSelect(slug);
  };

  const templateStatus = getStatus();
  const isLocked = templateStatus !== 'available';

  return (
    <div className="template-picker-section">
      <div className="template-picker-header">
        <h2>Choose a RIDDOR Report Template</h2>
        {!isAuthenticated && <p>Sign in to access templates and start generating documents</p>}
        {isAuthenticated && !isPaid && <p>RIDDOR Report is available on paid plans &middot; <a href="/pricing" className="template-picker-upgrade-link">Upgrade to access</a></p>}
        {isAuthenticated && isPaid && <p>All templates available on your plan</p>}
      </div>
      <div className="template-grid-3">
        {RIDDOR_TEMPLATE_ORDER.map((slug) => {
          const template = RIDDOR_TEMPLATE_CONFIGS[slug];
          return (
            <button key={slug} type="button" className={`tpl-card ${isLocked ? 'tpl-card--locked' : ''}`} onClick={() => handleClick(slug)}>
              <div className="tpl-card-thumb">
                <Image src={template.thumbnailPath} alt={`${template.displayName} preview`} fill sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw" style={{ objectFit: 'cover', objectPosition: 'top' }} />
                <span className="tpl-card-detail-badge" style={{ backgroundColor: `#${template.accentColor}` }}>{template.detailLevel}</span>
                <span className="tpl-card-preview-pill" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setPreviewSlug(slug); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setPreviewSlug(slug); } }} title={`Preview ${template.displayName}`}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  Preview
                </span>
                {isLocked && (<div className="tpl-card-lock-overlay"><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="tpl-card-lock-icon"><path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 0 1 2 2c0 .738-.405 1.376-1 1.723V17h-2v-2.277A1.993 1.993 0 0 1 10 13a2 2 0 0 1 2-2z"/></svg><span className="tpl-card-lock-label">{templateStatus === 'locked-auth' ? 'Sign In' : 'Upgrade'}</span></div>)}
              </div>
              <div className="tpl-card-body">
                <h3 className="tpl-card-title">{template.displayName}</h3>
                <p className="tpl-card-tagline" style={{ fontWeight: 600, fontSize: '0.8rem', color: `#${template.accentColor}`, marginBottom: '0.3rem' }}>{template.tagline}</p>
                <p className="tpl-card-desc">{template.description}</p>
              </div>
              <div className="tpl-card-footer">
                {templateStatus === 'available' && <span className="tpl-card-cta">Use Template &rarr;</span>}
                {templateStatus === 'locked-auth' && <span className="tpl-card-cta tpl-card-cta--locked">Sign In to Access</span>}
                {templateStatus === 'locked-upgrade' && <span className="tpl-card-cta tpl-card-cta--upgrade">Upgrade Plan</span>}
              </div>
            </button>
          );
        })}
      </div>
      {previewSlug && <RiddorTemplatePreviewModal template={RIDDOR_TEMPLATE_CONFIGS[previewSlug]} onClose={() => setPreviewSlug(null)} />}
    </div>
  );
}
