'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { TEMPLATE_CONFIGS, TEMPLATE_ORDER } from '@/lib/rams/template-config';
import { TemplateSlug } from '@/lib/rams/types';

// Free tier: first 2 templates only
const FREE_TEMPLATES: TemplateSlug[] = ['standard-5x5', 'simple-hml'];

interface TemplatePickerProps {
  onSelect: (templateId: string) => void;
}

export default function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated';
  const userPlan = (session?.user as { subscriptionTier?: string })?.subscriptionTier || 'FREE';
  const isPaid = userPlan === 'STANDARD' || userPlan === 'PROFESSIONAL';

  const canAccessTemplate = (slug: TemplateSlug): boolean => {
    if (!isAuthenticated) return false;
    if (isPaid) return true;
    return FREE_TEMPLATES.includes(slug);
  };

  const getTemplateStatus = (slug: TemplateSlug): 'available' | 'locked-auth' | 'locked-upgrade' => {
    if (!isAuthenticated) return 'locked-auth';
    if (canAccessTemplate(slug)) return 'available';
    return 'locked-upgrade';
  };

  const handleTemplateClick = (slug: TemplateSlug) => {
    const templateStatus = getTemplateStatus(slug);
    if (templateStatus === 'locked-auth') {
      router.push('/auth/login?callbackUrl=/rams-builder');
      return;
    }
    if (templateStatus === 'locked-upgrade') {
      router.push('/rams-builder/pricing');
      return;
    }
    onSelect(slug);
  };

  return (
    <div className="template-picker-section">
      {/* Header */}
      <div className="template-picker-header">
        <h2>Choose a RAMS Template</h2>
        {!isAuthenticated && (
          <p>Sign in to access templates and start building your RAMS documents</p>
        )}
        {isAuthenticated && !isPaid && (
          <p>Free plan: 2 templates available &middot; <a href="/rams-builder/pricing" className="template-picker-upgrade-link">Upgrade for all 10</a></p>
        )}
        {isAuthenticated && isPaid && (
          <p>All 10 templates available on your plan</p>
        )}
      </div>

      {/* 5-wide grid */}
      <div className="template-grid-5">
        {TEMPLATE_ORDER.map((slug) => {
          const template = TEMPLATE_CONFIGS[slug];
          const templateStatus = getTemplateStatus(slug);
          const isLocked = templateStatus !== 'available';
          const isFreeTemplate = FREE_TEMPLATES.includes(slug);

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

                {/* Page count pill */}
                <span className="tpl-card-pages">{template.pageCount} pages</span>

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
    </div>
  );
}
