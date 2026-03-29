'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SCOPE_TEMPLATE_CONFIGS } from '@/lib/scope/template-config';
import { SCOPE_TEMPLATE_ORDER } from '@/lib/scope/template-config';
import type { ScopeTemplateSlug } from '@/lib/scope/types';

interface ScopeTemplatePickerProps {
  onSelect: (slug: ScopeTemplateSlug) => void;
}

export default function ScopeTemplatePicker({ onSelect }: ScopeTemplatePickerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated';
  const userPlan = (session?.user as { subscriptionTier?: string })?.subscriptionTier || 'FREE';
  const isPaid = userPlan === 'STANDARD' || userPlan === 'PROFESSIONAL';

  const getTemplateStatus = (): 'available' | 'locked-auth' | 'locked-upgrade' => {
    if (!isAuthenticated) return 'locked-auth';
    if (isPaid) return 'available';
    return 'locked-upgrade';
  };

  const handleTemplateClick = (slug: ScopeTemplateSlug) => {
    const templateStatus = getTemplateStatus();
    if (templateStatus === 'locked-auth') {
      router.push('/auth/login?callbackUrl=/scope-of-works-builder');
      return;
    }
    if (templateStatus === 'locked-upgrade') {
      router.push('/pricing');
      return;
    }
    onSelect(slug);
  };

  const templateStatus = getTemplateStatus();
  const isLocked = templateStatus !== 'available';

  return (
    <div className="template-picker-section">
      {/* Header */}
      <div className="template-picker-header">
        <h2>Choose a Scope of Works Template</h2>
        {!isAuthenticated && (
          <p>Sign in to access templates and start generating scope documents</p>
        )}
        {isAuthenticated && !isPaid && (
          <p>Scope of Works Builder is available on paid plans &middot; <a href="/pricing" className="template-picker-upgrade-link">Upgrade to access</a></p>
        )}
        {isAuthenticated && isPaid && (
          <p>All 3 templates available on your plan</p>
        )}
      </div>

      {/* Grid */}
      <div className="template-grid-3">
        {SCOPE_TEMPLATE_ORDER.map((slug) => {
          const template = SCOPE_TEMPLATE_CONFIGS[slug];

          return (
            <button
              key={slug}
              type="button"
              className={`tpl-card ${isLocked ? 'tpl-card--locked' : ''}`}
              onClick={() => handleTemplateClick(slug)}
            >
              {/* Colour swatch header */}
              <div
                className="tpl-card-thumb"
                style={{
                  background: `linear-gradient(135deg, #${template.accentColor}, #${template.accentColor}dd)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <span style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, fontFamily: template.font }}>
                  {template.displayName}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
                  {template.font} · {template.pageCount} pages
                </span>

                {/* Lock overlay */}
                {isLocked && (
                  <div className="tpl-card-lock-overlay">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="tpl-card-lock-icon">
                      <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 0 1 2 2c0 .738-.405 1.376-1 1.723V17h-2v-2.277A1.993 1.993 0 0 1 10 13a2 2 0 0 1 2-2z"/>
                    </svg>
                    <span className="tpl-card-lock-label">
                      {templateStatus === 'locked-auth' ? 'Sign In' : 'Upgrade'}
                    </span>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="tpl-card-body">
                <h3 className="tpl-card-title">{template.displayName}</h3>
                <p className="tpl-card-tagline" style={{ fontWeight: 600, fontSize: '0.8rem', color: `#${template.accentColor}`, marginBottom: '0.3rem' }}>
                  {template.tagline}
                </p>
                <p className="tpl-card-desc">{template.description}</p>
              </div>

              {/* Footer */}
              <div className="tpl-card-footer">
                {templateStatus === 'available' && (
                  <span className="tpl-card-cta">Use Template &rarr;</span>
                )}
                {templateStatus === 'locked-auth' && (
                  <span className="tpl-card-cta tpl-card-cta--locked">Sign In to Access</span>
                )}
                {templateStatus === 'locked-upgrade' && (
                  <span className="tpl-card-cta tpl-card-cta--upgrade">Upgrade Plan</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
