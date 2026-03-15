'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { RAMS_TEMPLATES, FREE_TEMPLATES, getTemplateAccess } from '@/lib/rams/template-config';

interface TemplatePicker {
  onSelect: (templateId: string) => void;
  monthlyUsage?: number;
  monthlyLimit?: number;
}

export default function TemplatePicker({ onSelect }: TemplatePicker) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated';
  const userPlan = (session?.user as { subscriptionTier?: string })?.subscriptionTier || 'FREE';
  const isPaid = userPlan === 'STANDARD' || userPlan === 'PROFESSIONAL';

  const handleTemplateSelect = (templateId: string) => {
    if (!isAuthenticated) {
      router.push('/auth/login?callbackUrl=/rams-builder');
      return;
    }

    const access = getTemplateAccess(templateId, userPlan);
    if (!access.canAccess) {
      if (access.reason === 'upgrade') {
        router.push('/pricing');
      }
      return;
    }

    onSelect(templateId);
  };

  const getTemplateStatus = (templateId: string) => {
    if (!isAuthenticated) return 'locked-auth';
    const access = getTemplateAccess(templateId, userPlan);
    if (!access.canAccess) return 'locked-upgrade';
    return 'available';
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
            Free plan: 2 templates available. Upgrade for all templates.
          </p>
        )}
      </div>

      <div className="template-picker__grid">
        {RAMS_TEMPLATES.map((template) => {
          const status = getTemplateStatus(template.id);
          const isLocked = status !== 'available';
          const isFreeTemplate = FREE_TEMPLATES.includes(template.id);

          return (
            <div
              key={template.id}
              className={`template-card ${isLocked ? 'template-card--locked' : 'template-card--available'}`}
            >
              <div className="template-card__header">
                <h3 className="template-card__title">{template.name}</h3>
                {isLocked && (
                  <span className="template-card__badge">
                    {status === 'locked-auth' ? 'Sign In' : 'Upgrade'}
                  </span>
                )}
                {!isLocked && isFreeTemplate && (
                  <span className="template-card__badge template-card__badge--free">Free</span>
                )}
              </div>

              <p className="template-card__description">{template.description}</p>

              <div className="template-card__footer">
                {status === 'available' && (
                  <button
                    className="btn btn--primary btn--small"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    Use This Template
                  </button>
                )}

                {status === 'locked-auth' && (
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

                {status === 'locked-upgrade' && (
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
