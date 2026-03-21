'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TemplateSlug, GeneratedQuestion, AnsweredQuestion } from '@/lib/rams/types';
import { TEMPLATE_CONFIGS, TEMPLATE_ORDER } from '@/lib/rams/template-config';
import TemplatePicker from './TemplatePicker';
import ScopeInput from './ScopeInput';
import QuestionnaireClient from './QuestionnaireClient';
import GeneratingClient from './GeneratingClient';
import DownloadClient from './DownloadClient';

type BuilderStep = 'pick-template' | 'describe-work' | 'questions' | 'generating' | 'download';

// Safely parse JSON from a fetch response; returns fallback error if response is not JSON
async function safeJsonParse(res: Response, fallback: string): Promise<{ error?: string }> {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
          return { error: fallback };
    }
    try {
          return await res.json();
    } catch {
          return { error: fallback };
    }
}

export default function RamsLandingClient() {
    const [step, setStep] = useState<BuilderStep>('pick-template');
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateSlug | null>(null);
    const [description, setDescription] = useState('');
    const [generationId, setGenerationId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [downloadData, setDownloadData] = useState<{
          downloadUrl: string;
          filename: string;
          expiresAt: string;
          generationId: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  // Verify subscription on return from PayPal
  useEffect(() => {
        const subscriptionId = searchParams.get('subscription_id');
        if (!subscriptionId) return;

                // Verify and activate the subscription
                fetch('/api/payments/verify-subscription', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ subscriptionId }),
                })
          .then((res) => res.json())
          .then((data) => {
                    if (data.success) {
                                // Remove query params and reload to refresh session
                      window.location.href = '/rams-builder';
                    }
          })
          .catch((err) => console.error('Subscription verification failed:', err));
  }, [searchParams]);

  // Step 1: Template selected
  const handleTemplateSelect = useCallback((slug: TemplateSlug) => {
        setSelectedTemplate(slug);
        setStep('describe-work');
        setError(null);
  }, []);

  // Step 2: Description submitted -> AI Call 1
  const handleDescriptionSubmit = useCallback(async (desc: string) => {
        if (!selectedTemplate) return;
        setDescription(desc);
        setError(null);
        setStep('generating');

                                                  try {
                                                          const res = await fetch('/api/rams/generate-questions', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ templateSlug: selectedTemplate, description: desc }),
                                                          });

          if (!res.ok) {
                    const data = await safeJsonParse(res, 'Failed to generate questions. Please sign in.');
                    throw new Error(data.error || 'Failed to generate questions');
          }

          const data = await res.json();
                                                          setGenerationId(data.generationId);
                                                          setQuestions(data.questions);
                                                          setStep('questions');
                                                  } catch (err: any) {
                                                          setError(err.message);
                                                          setStep('describe-work');
                                                  }
  }, [selectedTemplate]);

  // Step 3: Questions answered -> AI Call 2
  const handleQuestionsComplete = useCallback(async (answers: AnsweredQuestion[]) => {
        if (!generationId) return;
        setError(null);
        setStep('generating');

                                                  try {
                                                          const res = await fetch('/api/rams/generate', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ generationId, answers }),
                                                          });

          if (!res.ok) {
                    const data = await safeJsonParse(res, 'Failed to generate document. Please sign in.');
                    throw new Error(data.error || 'Failed to generate document');
          }

          const data = await res.json();
                                                          setDownloadData({
                                                                    downloadUrl: data.downloadUrl,
                                                                    filename: data.filename,
                                                                    expiresAt: data.expiresAt,
                                                                    generationId: data.generationId,
                                                          });
                                                          setStep('download');
                                                  } catch (err: any) {
                                                          setError(err.message);
                                                          setStep('questions');
                                                  }
  }, [generationId]);

  // Back navigation
  const handleBack = useCallback(() => {
        if (step === 'describe-work') {
                setStep('pick-template');
                setSelectedTemplate(null);
        } else if (step === 'questions') {
                setStep('describe-work');
        }
  }, [step]);

  // Start over
  const handleStartOver = useCallback(() => {
        setStep('pick-template');
        setSelectedTemplate(null);
        setDescription('');
        setGenerationId(null);
        setQuestions([]);
        setDownloadData(null);
        setError(null);
  }, []);

  // Progress indicator
  const stepNumber =
        step === 'pick-template' ? 1 :
        step === 'describe-work' ? 2 :
    step === 'questions' ? 3 :
        step === 'generating' ? 3 : 4;

  return (
        <div className="rams-builder">
          {/* Progress Bar */}
              <div className="rams-progress">
                      <div className="rams-progress-bar">
                        {[1, 2, 3, 4].map(n => (
                      <div key={n} className={`rams-progress-step ${n <= stepNumber ? 'active' : ''} ${n < stepNumber ? 'completed' : ''}`}>
                                    <div className="rams-progress-dot">{n < stepNumber ? '✓' : n}</div>div>
                                    <span className="rams-progress-label">
                                      {n === 1 ? 'Choose Template' : n === 2 ? 'Describe Work' : n === 3 ? 'Answer Questions' : 'Download'}
                                    </span>span>
                      </div>div>
                    ))}
                                <div className="rams-progress-line">
                                            <div className="rams-progress-line-fill" style={{ width: `${((stepNumber - 1) / 3) * 100}%` }} />
                                </div>div>
                      </div>div>
              </div>div>
        
          {/* Error banner */}
          {error && (
                  <div className="rams-error">
                            <span className="rams-error-icon">&#x26A0;</span>span>
                            <span>{error}</span>span>
                            <button onClick={() => setError(null)} className="rams-error-close">&times;</button>button>
                  </div>div>
              )}
        
          {/* Step content */}
          {step === 'pick-template' && (
                  <TemplatePicker onSelect={handleTemplateSelect} />
                )}
        
          {step === 'describe-work' && selectedTemplate && (
                  <ScopeInput
                              templateSlug={selectedTemplate}
                              onSubmit={handleDescriptionSubmit}
                              onBack={handleBack}
                              initialValue={description}
                            />
                )}
        
          {step === 'questions' && (
                  <QuestionnaireClient
                              questions={questions}
                              onComplete={handleQuestionsComplete}
                              onBack={handleBack}
                              templateSlug={selectedTemplate!}
                            />
                )}
        
          {step === 'generating' && (
                  <GeneratingClient
                              phase={generationId && questions.length > 0 ? 'document' : 'questions'}
                              templateSlug={selectedTemplate!}
                            />
                )}
        
          {step === 'download' && downloadData && (
                  <DownloadClient
                              downloadUrl={downloadData.downloadUrl}
                              filename={downloadData.filename}
                              expiresAt={downloadData.expiresAt}
                              generationId={downloadData.generationId}
                              onStartOver={handleStartOver}
                            />
                )}
        </div>div>
      );
}</div>
