'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TemplateSlug } from '@/lib/rams/types';
import { TEMPLATE_CONFIGS, TEMPLATE_ORDER } from '@/lib/rams/template-config';

// First 2 templates are accessible on free tier (signed in)
const FREE_TEMPLATES: TemplateSlug[] = ['standard-5x5', 'simple-hml'];

interface TemplatePickerProps {
    onSelect: (slug: TemplateSlug) => void;
}

export default function TemplatePicker({ onSelect }: TemplatePickerProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [previewSlug, setPreviewSlug] = useState<TemplateSlug | null>(null);
    const [showLockNotice, setShowLockNotice] = useState<'signin' | 'upgrade' | null>(null);

  const isLoggedIn = status === 'authenticated' && !!session?.user;
    const isPaid = isLoggedIn && (session.user as any)?.subscriptionTier &&
          (session.user as any).subscriptionTier !== 'FREE';

  function getAccessState(slug: TemplateSlug): 'open' | 'signin' | 'upgrade' {
        if (!isLoggedIn) return 'signin';           // not signed in: all locked
      if (isPaid) return 'open';                   // paid: all open
      if (FREE_TEMPLATES.includes(slug)) return 'open'; // free + first 2: open
      return 'upgrade';                            // free + other 8: upgrade needed
  }

  function handleCardClick(slug: TemplateSlug) {
        const access = getAccessState(slug);
        if (access === 'open') {
                setPreviewSlug(slug);
        } else {
                setShowLockNotice(access);
        }
  }

  function handleUseTemplate(slug: TemplateSlug, e: React.MouseEvent) {
        e.stopPropagation();
        const access = getAccessState(slug);
        if (access === 'open') {
                onSelect(slug);
        } else {
                setShowLockNotice(access);
        }
  }

  const previewConfig = previewSlug ? TEMPLATE_CONFIGS[previewSlug] : null;

  return (
        <div className="template-picker">
              <div className="template-picker-header">
                      <h2>Choose Your RAMS Template</h2>h2>
                      <p>Select a template layout that suits your project. Click a card to preview, or hit &quot;Use This Template&quot; to get started.</p>p>
                {!isLoggedIn && (
                    <div className="template-access-notice">
                                <span>🔒 <Link href="/auth/login" className="link link--primary">Sign in</Link>Link> or <Link href="/auth/register" className="link link--primary">create a free account</Link>Link> to access templates.</span>span>
                    </div>div>
                      )}
                {isLoggedIn && !isPaid && (
                    <div className="template-access-notice template-access-notice--free">
                                <span>✓ Free plan: 2 templates, 1 RAMS/month — <Link href="/rams-builder#pricing" className="link link--primary">Upgrade</Link>Link> for all 10 templates</span>span>
                    </div>div>
                      )}
              </div>div>
        
          {/* Lock notice modal */}
          {showLockNotice && (
                  <div className="template-lock-overlay" onClick={() => setShowLockNotice(null)}>
                            <div className="template-lock-modal" onClick={e => e.stopPropagation()}>
                                        <button className="template-lock-close" onClick={() => setShowLockNotice(null)}>×</button>button>
                              {showLockNotice === 'signin' ? (
                                  <>
                                                  <div className="template-lock-icon">🔒</div>div>
                                                  <h3>Sign in to access templates</h3>h3>
                                                  <p>Create a free account to access the first 2 RAMS templates and generate 1 document per month.</p>p>
                                                  <div className="template-lock-actions">
                                                                    <Link href="/auth/login" className="btn btn--primary">Sign In</Link>Link>
                                                                    <Link href="/auth/register" className="btn btn--outline">Create Free Account</Link>Link>
                                                  </div>div>
                                  </>>
                                ) : (
                                  <>
                                                  <div className="template-lock-icon">⭐</div>div>
                                                  <h3>Upgrade to unlock all templates</h3>h3>
                                                  <p>This template is available on paid plans. Upgrade to access all 10 RAMS templates and generate more documents each month.</p>p>
                                                  <div className="template-lock-actions">
                                                                    <Link href="/rams-builder#pricing" className="btn btn--primary">View Pricing</Link>Link>
                                                                    <button className="btn btn--outline" onClick={() => setShowLockNotice(null)}>Maybe Later</button>button>
                                                  </div>div>
                                  </>>
                                )}
                            </div>div>
                  </div>div>
              )}
        
              <div className="template-grid">
                {TEMPLATE_ORDER.map((slug, index) => {
                    const config = TEMPLATE_CONFIGS[slug];
                    const access = getAccessState(slug);
                    const isLocked = access !== 'open';
          
                    return (
                                  <div
                                                  key={slug}
                                                  className={`template-card ${isLocked ? 'template-card--locked' : ''}`}
                                                  onClick={() => handleCardClick(slug)}
                                                >
                                                <div className="template-card-thumb">
                                                                <img src={config.thumbnailPath} alt={config.displayName} loading="lazy" />
                                                                <div className="template-card-pages">{config.pageCount} pages</div>div>
                                                  {isLocked && (
                                                                    <div className="template-card-lock-badge">
                                                                      {access === 'signin' ? '🔒 Sign in' : '⭐ Upgrade'}
                                                                    </div>div>
                                                                )}
                                                  {!isLocked && index < 2 && isLoggedIn && !isPaid && (
                                                                    <div className="template-card-free-badge">✓ Free</div>div>
                                                                )}
                                                </div>div>
                                                <div className="template-card-body">
                                                                <h3>{config.displayName}</h3>h3>
                                                                <p>{config.description}</p>p>
                                                                <div className="template-card-tags">
                                                                  {config.keySections.slice(0, 3).map(s => (
                                                                      <span key={s} className="template-tag">{s}</span>span>
                                                                    ))}
                                                                  {config.keySections.length > 3 && (
                                                                      <span className="template-tag template-tag-more">+{config.keySections.length - 3} more</span>span>
                                                                                  )}
                                                                </div>div>
                                                                <button
                                                                                    className={`template-card-btn ${isLocked ? 'template-card-btn--locked' : ''}`}
                                                                                    onClick={(e) => handleUseTemplate(slug, e)}
                                                                                  >
                                                                  {isLocked
                                                                                        ? (access === 'signin' ? 'Sign In to Use' : 'Upgrade to Use')
                                                                                        : 'Use This Template'}
                                                                </button>button>
                                                </div>div>
                                  </div>div>
                                );
        })}
              </div>div>
        
          {/* Lightbox Preview Modal */}
          {previewSlug && previewConfig && (
                  <div className="template-lightbox" onClick={() => setPreviewSlug(null)}>
                            <div className="template-lightbox-content" onClick={e => e.stopPropagation()}>
                                        <button className="template-lightbox-close" onClick={() => setPreviewSlug(null)}>×</button>button>
                                        <div className="template-lightbox-header">
                                                      <h2>{previewConfig.displayName}</h2>h2>
                                                      <p>{previewConfig.description}</p>p>
                                                      <div className="template-lightbox-meta">
                                                                      <span>{previewConfig.pageCount} pages</span>span>
                                                                      <span>•</span>span>
                                                                      <span>{previewConfig.scoringMethod === 'L_x_S' ? 'L×S Scoring' : previewConfig.scoringMethod === 'HML' ? 'H/M/L Rating' : previewConfig.scoringMethod === 'L_x_S_x_D' ? 'RPN Scoring' : 'Integrated'}</span>span>
                                                      </div>div>
                                        </div>div>
                                        <div className="template-lightbox-previews">
                                          {previewConfig.previewPaths.map((path, idx) => (
                                    <img key={idx} src={path} alt={`${previewConfig.displayName} page ${idx + 1}`} className="template-lightbox-page" />
                                  ))}
                                        </div>div>
                                        <div className="template-lightbox-sections">
                                                      <h3>Key Sections</h3>h3>
                                                      <div className="template-lightbox-tags">
                                                        {previewConfig.keySections.map(s => (
                                      <span key={s} className="template-tag">{s}</span>span>
                                    ))}
                                                      </div>div>
                                        </div>div>
                                        <button
                                                        className="template-lightbox-use"
                                                        onClick={() => {
                                                                          setPreviewSlug(null);
                                                                          onSelect(previewSlug);
                                                        }}
                                                      >
                                                      Use This Template
                                        </button>button>
                            </div>div>
                  </div>div>
              )}
        </div>div>
      );
}</></></div>
