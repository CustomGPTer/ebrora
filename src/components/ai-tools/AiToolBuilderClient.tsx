'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import type {
  AiToolSlug,
  AiToolConfig,
  AiToolQuestion,
  AiToolAnswer,
  AiToolConversationRound,
  AiToolBuilderStep,
} from '@/lib/ai-tools/types';

interface AiToolBuilderClientProps {
  toolConfig: AiToolConfig;
}

/* ── Helpers ── */
function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

async function safeJsonParse(res: Response, fallback: string) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return { error: fallback };
  try { return await res.json(); } catch { return { error: fallback }; }
}

/* ── Loading steps per phase ── */
const QUESTION_STEPS = [
  'Analysing your work description...',
  'Identifying key considerations...',
  'Tailoring questions to your document...',
  'Generating targeted questions...',
];
const DOCUMENT_STEPS = [
  'Analysing your responses...',
  'Identifying hazards and requirements...',
  'Generating content sections...',
  'Building document structure...',
  'Compiling all sections...',
  'Formatting and finalising...',
];

const MAX_WORDS_DESCRIPTION = 200;
const MIN_WORDS_DESCRIPTION = 3;
const MAX_WORDS_PER_ANSWER = 100;

export default function AiToolBuilderClient({ toolConfig }: AiToolBuilderClientProps) {
  const [step, setStep] = useState<AiToolBuilderStep>('describe-work');
  const [description, setDescription] = useState('');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Conversation state
  const [rounds, setRounds] = useState<AiToolConversationRound[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<AiToolQuestion[]>([]);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [totalAsked, setTotalAsked] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [readyMessage, setReadyMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generating state
  const [generatingPhase, setGeneratingPhase] = useState<'questions' | 'document'>('questions');
  const [generatingStep, setGeneratingStep] = useState(0);

  // Download state
  const [downloadData, setDownloadData] = useState<{
    downloadUrl: string;
    filename: string;
    expiresAt: string;
    generationId: string;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialise answers when questions change
  useEffect(() => {
    if (currentQuestions.length === 0) return;
    const init: Record<string, string> = {};
    currentQuestions.forEach((q) => { init[q.id] = answers[q.id] || ''; });
    setAnswers((prev) => ({ ...prev, ...init }));
  }, [currentQuestions]);

  // Scroll to bottom on new questions
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentQuestions, rounds]);

  // Generating step animation
  useEffect(() => {
    if (step !== 'generating') return;
    const steps = generatingPhase === 'questions' ? QUESTION_STEPS : DOCUMENT_STEPS;
    const interval = generatingPhase === 'questions' ? 800 : 2000;
    setGeneratingStep(0);
    const timer = setInterval(() => {
      setGeneratingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, interval);
    return () => clearInterval(timer);
  }, [step, generatingPhase]);

  // Progress indicator
  const stepNumber =
    step === 'describe-work' ? 1 :
    step === 'conversation' ? 2 :
    step === 'generating' ? 2 : 3;

  /* ── Step 1: Submit description ── */
  const handleDescriptionSubmit = useCallback(async () => {
    const wc = wordCount(description);
    if (wc < MIN_WORDS_DESCRIPTION || wc > MAX_WORDS_DESCRIPTION) return;

    setError(null);
    setStep('generating');
    setGeneratingPhase('questions');

    try {
      const res = await fetch('/api/ai-tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolSlug: toolConfig.slug,
          description,
          rounds: [],
        }),
      });

      if (!res.ok) {
        const data = await safeJsonParse(res, 'Failed to start. Please sign in.');
        throw new Error(data.error || 'Failed to start conversation');
      }

      const data = await res.json();
      if (data.generationId) setGenerationId(data.generationId);
      setCurrentQuestions(data.questions || []);
      setTotalAsked(data.totalQuestionsAsked || 0);
      setCurrentRoundNumber(1);
      setStep('conversation');
    } catch (err: any) {
      setError(err.message);
      setStep('describe-work');
    }
  }, [description, toolConfig.slug]);

  /* ── Step 2: Submit round ── */
  const currentAnswersValid = currentQuestions.every((q) => {
    const a = answers[q.id]?.trim();
    return a && wordCount(a) <= MAX_WORDS_PER_ANSWER;
  });

  const handleSubmitRound = useCallback(async () => {
    if (!currentAnswersValid) return;
    setIsLoading(true);
    setError(null);

    const completedRound: AiToolConversationRound = {
      roundNumber: currentRoundNumber,
      questions: currentQuestions,
      answers: currentQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: answers[q.id].trim(),
      })),
    };

    const allRounds = [...rounds, completedRound];

    try {
      const res = await fetch('/api/ai-tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolSlug: toolConfig.slug,
          description,
          rounds: allRounds,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to get next questions' }));
        throw new Error(data.error || 'Failed to get next questions');
      }

      const data = await res.json();
      setRounds(allRounds);

      if (data.status === 'ready') {
        setReadyMessage(data.message || `I have enough information to generate your ${toolConfig.documentLabel}.`);
        setCurrentQuestions([]);
      } else {
        setCurrentQuestions(data.questions);
        setCurrentRoundNumber(data.roundNumber);
        setTotalAsked(data.totalQuestionsAsked);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentAnswersValid, currentQuestions, answers, rounds, currentRoundNumber, toolConfig, description]);

  /* ── Step 3: Generate document ── */
  const handleGenerate = useCallback(async () => {
    if (!generationId) return;
    setError(null);
    setStep('generating');
    setGeneratingPhase('document');

    try {
      let answerNumber = 0;
      const allAnswers = rounds.flatMap((round) =>
        round.answers.map((a) => ({
          number: ++answerNumber,
          question: a.question,
          answer: a.answer,
        }))
      );

      const res = await fetch('/api/ai-tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId,
          answers: allAnswers,
          description,
        }),
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
      setStep('conversation');
    }
  }, [generationId, rounds, description]);

  /* ── Start over ── */
  const handleStartOver = useCallback(() => {
    setStep('describe-work');
    setDescription('');
    setGenerationId(null);
    setCurrentQuestions([]);
    setRounds([]);
    setTotalAsked(0);
    setCurrentRoundNumber(1);
    setAnswers({});
    setReadyMessage(null);
    setDownloadData(null);
    setError(null);
  }, []);

  const descWc = wordCount(description);
  const descOverLimit = descWc > MAX_WORDS_DESCRIPTION;
  const descUnderMin = descWc > 0 && descWc < MIN_WORDS_DESCRIPTION;

  return (
    <div className="rams-builder">
      {/* ── Progress Bar ── */}
      <div className="rams-progress">
        <div className="rams-progress-bar">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`rams-progress-step ${n <= stepNumber ? 'active' : ''} ${n < stepNumber ? 'completed' : ''}`}
            >
              <div className="rams-progress-dot">
                {n < stepNumber ? '✓' : n}
              </div>
              <span className="rams-progress-label">
                {n === 1 ? 'Describe Work' : n === 2 ? 'Interview' : 'Download'}
              </span>
            </div>
          ))}
          <div className="rams-progress-line">
            <div className="rams-progress-line-fill" style={{ width: `${((stepNumber - 1) / 2) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="rams-error">
          <span className="rams-error-icon">⚠</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="rams-error-close">×</button>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          STEP 1: DESCRIBE WORK
          ════════════════════════════════════════════════ */}
      {step === 'describe-work' && (
        <div className="scope-input">
          <div className="scope-input-body">
            <h2>{toolConfig.descriptionHeading}</h2>
            <p className="scope-input-hint">
              {toolConfig.descriptionHint}
            </p>

            <div className="scope-input-field">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={toolConfig.descriptionPlaceholder}
                rows={6}
                className={descOverLimit ? 'over-limit' : ''}
                autoFocus
              />
              <div className={`scope-input-counter ${descOverLimit ? 'over-limit' : descWc >= 180 ? 'near-limit' : ''}`}>
                {descWc} / {MAX_WORDS_DESCRIPTION} words
              </div>
            </div>

            {descUnderMin && (
              <p className="scope-input-warning">Please provide at least {MIN_WORDS_DESCRIPTION} words to describe the product.</p>
            )}
            {descOverLimit && (
              <p className="scope-input-warning">Please keep your description under {MAX_WORDS_DESCRIPTION} words.</p>
            )}

            <button
              className="rams-primary-btn"
              onClick={handleDescriptionSubmit}
              disabled={descOverLimit || descUnderMin || !description.trim()}
            >
              Start Interview →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          STEP 2: CONVERSATION
          ════════════════════════════════════════════════ */}
      {step === 'conversation' && (
        <div className="questionnaire">
          <div className="questionnaire-header">
            <button className="rams-back-btn" onClick={() => setStep('describe-work')}>
              ← Back to Description
            </button>
            <div className="questionnaire-info">
              <h2>{toolConfig.shortName} Interview</h2>
              <p>
                Answer each question with as much detail as you can — the quality
                of your {toolConfig.documentLabel.toLowerCase()} depends on it.
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="questionnaire-page-indicator">
            <span>Round {currentRoundNumber} · {totalAsked} questions asked so far</span>
          </div>

          {/* Previous rounds (read-only) */}
          {rounds.map((round) => (
            <div key={round.roundNumber} className="conversation-round completed-round">
              <div className="round-label">Round {round.roundNumber} — Completed ✓</div>
              {round.answers.map((a) => (
                <div key={a.id} className="conversation-qa">
                  <div className="conversation-question">
                    <span className="conversation-q-icon">Q</span>
                    <span>{a.question}</span>
                  </div>
                  <div className="conversation-answer-display">
                    <span className="conversation-a-icon">A</span>
                    <span>{a.answer}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Current questions */}
          {currentQuestions.length > 0 && (
            <div className="conversation-round current-round">
              <div className="round-label">Round {currentRoundNumber}</div>
              {currentQuestions.map((q) => {
                const wc = wordCount(answers[q.id] || '');
                const isOver = wc > MAX_WORDS_PER_ANSWER;
                return (
                  <div key={q.id} className="conversation-qa">
                    <div className="conversation-question">
                      <span className="conversation-q-icon">Q</span>
                      <div>
                        <span>{q.question}</span>
                        {q.context && <p className="conversation-context">{q.context}</p>}
                      </div>
                    </div>
                    <div className="conversation-answer-input">
                      <textarea
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Type your answer here..."
                        rows={3}
                        className={isOver ? 'over-limit' : ''}
                        disabled={isLoading}
                      />
                      <div className={`scope-input-counter ${isOver ? 'over-limit' : wc >= 80 ? 'near-limit' : ''}`}>
                        {wc} / {MAX_WORDS_PER_ANSWER}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                className="rams-primary-btn"
                onClick={handleSubmitRound}
                disabled={!currentAnswersValid || isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Answers →'}
              </button>
            </div>
          )}

          {/* Ready message */}
          {readyMessage && (
            <div className="conversation-ready">
              <div className="conversation-ready-icon">✓</div>
              <h3>Ready to Generate</h3>
              <p>{readyMessage}</p>
              <div className="conversation-ready-actions">
                <button className="rams-primary-btn" onClick={handleGenerate}>
                  Generate My {toolConfig.shortName} →
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* ════════════════════════════════════════════════
          GENERATING
          ════════════════════════════════════════════════ */}
      {step === 'generating' && (
        <div className="generating">
          <div className="generating-content">
            <div className="generating-spinner">
              <div className="generating-spinner-ring" />
              <div className="generating-spinner-logo">E</div>
            </div>

            <h2>
              {generatingPhase === 'questions'
                ? 'Preparing Your Questions'
                : `Building Your ${toolConfig.shortName}`
              }
            </h2>

            <p className="generating-template">{toolConfig.documentLabel}</p>

            <div className="generating-steps">
              {(generatingPhase === 'questions' ? QUESTION_STEPS : DOCUMENT_STEPS).map((s, idx) => (
                <div
                  key={idx}
                  className={`generating-step ${idx < generatingStep ? 'completed' : idx === generatingStep ? 'active' : 'pending'}`}
                >
                  <div className="generating-step-icon">
                    {idx < generatingStep ? '✓' : idx === generatingStep ? '•' : '○'}
                  </div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {generatingPhase === 'document' && (
              <p className="generating-note">
                This usually takes 15–30 seconds. Please don&apos;t close this page.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          DOWNLOAD
          ════════════════════════════════════════════════ */}
      {step === 'download' && downloadData && (
        <div className="generating">
          <div className="generating-content">
            <div className="generating-spinner">
              <div className="generating-spinner-logo" style={{ color: '#1B5B50', fontSize: '1.5rem' }}>✓</div>
            </div>

            <h2>Your {toolConfig.shortName} is Ready</h2>
            <p className="generating-template">{downloadData.filename}</p>

            <a
              href={downloadData.downloadUrl}
              download={downloadData.filename}
              className="rams-primary-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download .docx
            </a>

            <p className="generating-note" style={{ marginTop: '1rem' }}>
              This download link expires 24 hours after generation.
            </p>

            <button
              className="rams-back-btn"
              onClick={handleStartOver}
              style={{ marginTop: '1.5rem' }}
            >
              ← Generate Another {toolConfig.shortName}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
