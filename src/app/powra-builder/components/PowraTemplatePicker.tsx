'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { POWRA_TEMPLATE_CONFIGS } from '@/lib/powra/template-config';
import { POWRA_TEMPLATE_ORDER, POWRA_FREE_TEMPLATES, PowraTemplateSlug } from '@/lib/powra/types';
import PowraTemplatePreviewModal from './PowraTemplatePreviewModal';

interface Props { onSelect: (slug: PowraTemplateSlug) => void; }

export default function PowraTemplatePicker({ onSelect }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [previewSlug, setPreviewSlug] = useState<PowraTemplateSlug | null>(null);
  const isAuthenticated = status === 'authenticated';
  const userPlan = (session?.user as { subscriptionTier?: string })?.subscriptionTier || 'FREE';
  const isPaid = userPlan === 'STANDARD' || userPlan === 'PROFESSIONAL';
  const canAccess = (slug: PowraTemplateSlug): boolean => { if (!isAuthenticated) return false; if (isPaid) return true; return POWRA_FREE_TEMPLATES.includes(slug); };
  const getStatus = (slug: PowraTemplateSlug): 'available' | 'locked-auth' | 'locked-upgrade' => { if (!isAuthenticated) return 'locked-auth'; if (canAccess(slug)) return 'available'; return 'locked-upgrade'; };
  const handleClick = (slug: PowraTemplateSlug) => { const s = getStatus(slug); if (s === 'locked-auth') { router.push('/auth/login?callbackUrl=/powra-builder'); return; } if (s === 'locked-upgrade') { router.push('/pricing'); return; } onSelect(slug); };

  return (
    <div className="template-picker-section">
      <div className="template-picker-header">
        <h2>Choose a POWRA Template</h2>
        {!isAuthenticated && <p>Sign in to access templates and generate point of work risk assessments</p>}
        {isAuthenticated && !isPaid && <p>2 free templates available &middot; Upgrade for all 4 &middot; <a href="/pricing" className="template-picker-upgrade-link">View plans</a></p>}
        {isAuthenticated && isPaid && <p>All 4 templates available on your plan</p>}
      </div>
      <div className="template-grid-5">
        {POWRA_TEMPLATE_ORDER.map((slug) => {
          const tpl = POWRA_TEMPLATE_CONFIGS[slug]; const st = getStatus(slug); const locked = st !== 'available'; const isFree = POWRA_FREE_TEMPLATES.includes(slug);
          return (
            <button key={slug} type="button" className={`tpl-card ${locked ? 'tpl-card--locked' : ''}`} onClick={() => handleClick(slug)}>
              <div className="tpl-card-thumb">
                <Image src={tpl.thumbnailPath} alt={`${tpl.displayName} preview`} fill sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw" style={{ objectFit: 'cover', objectPosition: 'top' }} />
                <span className="tpl-card-preview-pill" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setPreviewSlug(slug); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setPreviewSlug(slug); } }} title={`Preview all ${tpl.pageCount} pages`}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>{tpl.pageCount} pages</span>
                {isFree && <span className="tpl-card-badge tpl-card-badge--free">Free</span>}
                {locked && (<div className="tpl-card-lock-overlay"><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="tpl-card-lock-icon"><path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 0 1 2 2c0 .738-.405 1.376-1 1.723V17h-2v-2.277A1.993 1.993 0 0 1 10 13a2 2 0 0 1 2-2z"/></svg><span className="tpl-card-lock-label">{st === 'locked-auth' ? 'Sign In' : 'Upgrade'}</span></div>)}
              </div>
              <div className="tpl-card-body"><h3 className="tpl-card-title">{tpl.displayName}</h3><p className="tpl-card-desc">{tpl.description}</p></div>
              <div className="tpl-card-footer">{st === 'available' && <span className="tpl-card-cta">Use Template &rarr;</span>}{st === 'locked-auth' && <span className="tpl-card-cta tpl-card-cta--locked">Sign In to Access</span>}{st === 'locked-upgrade' && <span className="tpl-card-cta tpl-card-cta--upgrade">Upgrade Plan</span>}</div>
            </button>
          );
        })}
      </div>
      {previewSlug && <PowraTemplatePreviewModal template={POWRA_TEMPLATE_CONFIGS[previewSlug]} onClose={() => setPreviewSlug(null)} />}
    </div>
  );
}
