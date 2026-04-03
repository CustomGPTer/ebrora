'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { TBT_TEMPLATE_CONFIGS } from '@/lib/tbt/tbt-template-config';
import { TBT_TEMPLATE_ORDER, TBT_FREE_TEMPLATES, TbtTemplateSlug } from '@/lib/tbt/tbt-types';
import TbtTemplatePreviewModal from './TbtTemplatePreviewModal';

interface TbtTemplatePickerProps {
  onSelect: (templateSlug: TbtTemplateSlug) => void;
}

export default function TbtTemplatePicker({ onSelect }: TbtTemplatePickerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [previewSlug, setPreviewSlug] = useState<TbtTemplateSlug | null>(null);

  const isAuthenticated = status === 'authenticated';
  const userPlan = (session?.user as { subscriptionTier?: string })?.subscriptionTier || 'FREE';
  const isPaid = userPlan !== 'FREE';

  const canAccessTemplate = (slug: TbtTemplateSlug): boolean => {
    if (!isAuthenticated) return false;
    if (isPaid) return true;
    return TBT_FREE_TEMPLATES.includes(slug);
  };

  const getTemplateStatus = (slug: TbtTemplateSlug): 'available' | 'locked-auth' | 'locked-upgrade' => {
    if (!isAuthenticated) return 'locked-auth';
    if (canAccessTemplate(slug)) return 'available';
    return 'locked-upgrade';
  };

  const handleTemplateClick = (slug: TbtTemplateSlug) => {
    const templateStatus = getTemplateStatus(slug);
    if (templateStatus === 'locked-auth') {
      router.push('/auth/login?callbackUrl=/tbt-builder');
      return;
    }
    if (templateStatus === 'locked-upgrade') {
      router.push('/pricing');
      return;
    }
    onSelect(slug);
  };

  const handlePreviewClick = (e: React.MouseEvent, slug: TbtTemplateSlug) => {
    e.stopPropagation();
    setPreviewSlug(slug);
  };

  return (
    <div className="template-picker-section">
      {/* Header */}
      <div className="template-picker-header">
        <h2>Choose a Toolbox Talk Template</h2>
        {!isAuthenticated && (
          <p>Sign in to access templates and start generating toolbox talks</p>
        )}
        {isAuthenticated && !isPaid && (
          <p>Free plan: 2 templates available &middot; <a href="/pricing" className="template-picker-upgrade-link">Upgrade for all 9</a></p>
        )}
        {isAuthenticated && isPaid && (
          <p>All 9 templates available on your plan</p>
        )}
      </div>

      {/* Grid */}
      <div className="template-grid-5">
        {TBT_TEMPLATE_ORDER.map((slug) => {
          const template = TBT_TEMPLATE_CONFIGS[slug];
          const templateStatus = getTemplateStatus(slug);
          const isLocked = templateStatus !== 'available';
          const isFreeTemplate = TBT_FREE_TEMPLATES.includes(slug);

          return (
            <button
              key={slug}
              type="button"
              className={`tpl-card ${isLocked ? 'tpl-card--locked' : ''}`}
              onClick={() => handleTemplateClick(slug)}
            >
              {/* A4 ratio thumbnail */}
              <div className="tpl-card-thumb">
                <Image
                  src={template.thumbnailPath}
                  alt={`${template.displayName} preview`}
                  fill
                  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  style={{ objectFit: 'cover', objectPosition: 'top' }}
                />

                {/* Preview pill */}
                <span
                  className="tpl-card-preview-pill"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handlePreviewClick(e, slug)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePreviewClick(e as unknown as React.MouseEvent, slug);
                    }
                  }}
                  title={`Preview all ${template.pageCount} pages`}
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {template.pageCount} {template.pageCount === 1 ? 'page' : 'pages'}
                </span>

                {/* Free badge */}
                {isFreeTemplate && (
                  <span className="tpl-card-badge tpl-card-badge--free">Free</span>
                )}

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

      {/* Preview modal */}
      {previewSlug && (
        <TbtTemplatePreviewModal
          template={TBT_TEMPLATE_CONFIGS[previewSlug]}
          onClose={() => setPreviewSlug(null)}
        />
      )}
    </div>
  );
}
