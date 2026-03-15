'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

  const handleTemplateSelect = (slug: TemplateSlug) => {
    const templateStatus = getTemplateStatus(slug);
    if (templateStatus === 'locked-auth') {
      router.push('/auth/login?callbackUrl=/rams-builder');
      return;
    }
    if (templateStatus === 'locked-upgrade') {
      router.push('/pricing');
      return;
    }
    onSelect(slug);
  };

  return (
    <div className="template-picker">
      <div className="template-picker__header">
        <h2 className="template-picker__title">Choose a RAMS Template</h2>
        {!isAuthenticated && (
          <p className="template-picker__subtitle">
            Sign in to access templates and create your RAMS documents
          </p>
        )}
        {isAuthenticated && !isPaid && (
          <p className="template-picker__subtitle">
            Free plan: 2 templates available. Upgrade for all 10 templates.
          </p>
        )}
      </div>

      <div className="template-picker__grid">
        {TEMPLATE_ORDER.map((slug) => {
          const template = TEMPLATE_CONFIGS[slug];
          const templateStatus = getTemplateStatus(slug);
          const isLocked = templateStatus !== 'available';
          const isFreeTemplate = FREE_TEMPLATES.includes(slug);

          return (
            <div
              key={slug}
              className={`template-card ${isLocked ? 'template-card--locked' : 'template-card--available'}`}
            >
              <div className="template-card__header">
                <h3 className="template-card__title">{template.displayName}</h3>
                {isLocked && (
                  <span className="template-card__badge">
                    {templateStatus === 'locked-auth' ? 'Sign In' : 'Upgrade'}
                  </span>
                )}
                {!isLocked && isFreeTemplate && (
                  <span className="template-card__badge template-card__badge--free">Free</span>
                )}
              </div>

              <p className="template-card__description">{template.description}</p>

              <div className="template-card__meta">
                <span>{template.pageCount} pages</span>
              </div>

              <div className="template-card__footer">
                {templateStatus === 'available' && (
                  <button
                    className="btn btn--primary btn--small"
                    onClick={() => handleTemplateSelect(slug)}
                  >
                    Use This Template
                  </button>
                )}

                {templateStatus === 'locked-auth' && (
                  <div className="template-card__locked-actions">
                    <div className="template-card__lock-icon">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 0 1 2 2c0 .738-.405 1.376-1 1.723V17h-2v-2.277A1.993 1.993 0 0 1 10 13a2 2 0 0 1 2-2z"/>
                      </svg>
                    </div>
                    <p className="template-card__lock-message">Sign in to access this template</p>
                    <button
                      className="btn btn--primary btn--small"
                      onClick={() => router.push('/auth/login?callbackUrl=/rams-builder')}
                    >
                      Sign In
                    </button>
                    <button
                      className="btn btn--secondary btn--small"
                      onClick={() => router.push('/auth/register')}
                    >
                      Create Account
                    </button>
                  </div>
                )}

                {templateStatus === 'locked-upgrade' && (
                  <div className="template-card__locked-actions">
                    <div className="template-card__lock-icon">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 0 1 2 2c0 .738-.405 1.376-1 1.723V17h-2v-2.277A1.993 1.993 0 0 1 10 13a2 2 0 0 1 2-2z"/>
                      </svg>
                    </div>
                    <p className="template-card__lock-message">Upgrade to access this template</p>
                    <button
                      className="btn btn--primary btn--small"
                      onClick={() => router.push('/pricing')}
                    >
                      Upgrade Plan
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
