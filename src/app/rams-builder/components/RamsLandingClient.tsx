'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TemplateSlug, ConversationRound, ConversationQuestion } from '@/lib/rams/types';
import { TEMPLATE_CONFIGS, TEMPLATE_ORDER } from '@/lib/rams/template-config';
import TemplatePicker from './TemplatePicker';
import ScopeInput from './ScopeInput';
import ConversationClient from './ConversationClient';
import GeneratingClient from './GeneratingClient';
import DownloadClient from './DownloadClient';

type BuilderStep = 'pick-template' | 'describe-work' | 'conversation' | 'generating' | 'download';

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

  // Conversation state
  const [initialQuestions, setInitialQuestions] = useState<ConversationQuestion[]>([]);
  const [initialTotalAsked, setInitialTotalAsked] = useState(0);

  const [downloadData, setDownloadData] = useState<{
    downloadUrl: string;
    filename: string;
    expiresAt: string;
    generationId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  // Verify subscription on return from payment provider
  useEffect(() => {
    const subscriptionId = searchParams.get('subscription_id');
    const stripeSessionId = searchParams.get('stripe_session_id');

    const verifyBody = stripeSessionId
      ? { stripeSessionId }
      : subscriptionId
      ? { subscriptionId }
      : null;

    if (!verifyBody) return;

    fetch('/api/payments/verify-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyBody),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.location.href = '/rams-builder';
        }
      })
      .catch((err) => console.error('Subscription verification failed:', err));
  }, [searchParams]);

  // Step 1: Template selected
  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplate(templateId as TemplateSlug);
    setStep('describe-work');
    setError(null);
  }, []);

  // Step 2: Description submitted → start conversation (AI Call 1, Round 1)
  const handleDescriptionSubmit = useCallback(async (desc: string) => {
    if (!selectedTemplate) return;
    setDescription(desc);
    setError(null);
    setStep('generating');

    try {
      const res = await fetch('/api/rams/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateSlug: selectedTemplate,
          description: desc,
          rounds: [], // first round — no previous conversation
        }),
      });

      if (!res.ok) {
        const data = await safeJsonParse(res, 'Failed to start conversation. Please sign in.');
        throw new Error(data.error || 'Failed to start conversation');
      }

      const data = await res.json();

      if (data.generationId) {
        setGenerationId(data.generationId);
      }

      setInitialQuestions(data.questions || []);
      setInitialTotalAsked(data.totalQuestionsAsked || 0);
      setStep('conversation');
    } catch (err: any) {
      setError(err.message);
      setStep('describe-work');
    }
  }, [selectedTemplate]);

  // Step 3: Conversation complete → generate document (AI Call 2)
  const handleConversationComplete = useCallback(async (rounds: ConversationRound[], convGenerationId: string) => {
    const genId = convGenerationId || generationId;
    if (!genId || !selectedTemplate) return;
    setError(null);
    setStep('generating');

    try {
      // Flatten all Q&A from all rounds into the answers format expected by the generate route
      let answerNumber = 0;
      const allAnswers = rounds.flatMap((round) =>
        round.answers.map((a) => ({
          number: ++answerNumber,
          question: a.question,
          answer: a.answer,
        }))
      );

      const res = await fetch('/api/rams/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId: genId,
          answers: allAnswers,
          description,
        }),
      });

      if (!res.ok) {
        const data = await safeJsonParse(res, 'Failed to generate document. Please sign in.');
        throw new Error(data.error || 'Failed to generate document');
      }

      const data = await res.json();

      // Fetch the download URL through the auth-gated download endpoint
      // so the raw blob URL is never exposed in the generate response
      const dlRes = await fetch(`/api/rams/download/${data.generationId}`);
      if (!dlRes.ok) {
        const dlData = await safeJsonParse(dlRes, 'Failed to retrieve download link.');
        throw new Error(dlData.error || 'Failed to retrieve download link');
      }
      const dlData = await dlRes.json();

      setDownloadData({
        downloadUrl: dlData.downloadUrl,
        filename: dlData.filename || data.filename,
        expiresAt: dlData.expiresAt || data.expiresAt,
        generationId: data.generationId,
      });
      setStep('download');
    } catch (err: any) {
      setError(err.message);
      setStep('conversation');
    }
  }, [generationId, selectedTemplate, description]);

  // Back navigation
  const handleBack = useCallback(() => {
    if (step === 'describe-work') {
      setStep('pick-template');
      setSelectedTemplate(null);
    } else if (step === 'conversation') {
      setStep('describe-work');
    }
  }, [step]);

  // Start over
  const handleStartOver = useCallback(() => {
    setStep('pick-template');
    setSelectedTemplate(null);
    setDescription('');
    setGenerationId(null);
    setInitialQuestions([]);
    setInitialTotalAsked(0);
    setDownloadData(null);
    setError(null);
  }, []);

  // Progress indicator
  const stepNumber =
    step === 'pick-template' ? 1 :
    step === 'describe-work' ? 2 :
    step === 'conversation' ? 3 :
    step === 'generating' ? 3 : 4;

  return (
    <div className="rams-builder">
      {/* Progress Bar */}
      <div className="rams-progress">
        <div className="rams-progress-bar">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`rams-progress-step ${n <= stepNumber ? 'active' : ''} ${
                n < stepNumber ? 'completed' : ''
              }`}
            >
              <div className="rams-progress-dot">
                {n < stepNumber ? '\u2713' : n}
              </div>
              <span className="rams-progress-label">
                {n === 1
                  ? 'Choose Template'
                  : n === 2
                  ? 'Describe Work'
                  : n === 3
                  ? 'Interview'
                  : 'Download'}
              </span>
            </div>
          ))}
          <div className="rams-progress-line">
            <div
              className="rams-progress-line-fill"
              style={{ width: `${((stepNumber - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rams-error">
          <span className="rams-error-icon">{'\u26A0'}</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="rams-error-close">
            {'\u00D7'}
          </button>
        </div>
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

      {step === 'conversation' && selectedTemplate && initialQuestions.length > 0 && (
        <ConversationClient
          templateSlug={selectedTemplate}
          description={description}
          initialQuestions={initialQuestions}
          initialGenerationId={generationId || ''}
          initialTotalAsked={initialTotalAsked}
          onComplete={handleConversationComplete}
          onBack={handleBack}
        />
      )}

      {step === 'generating' && (
        <GeneratingClient
          phase={generationId && initialQuestions.length > 0 ? 'document' : 'questions'}
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
    </div>
  );
}
