'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ConversationQuestion,
  ConversationAnswer,
  ConversationRound,
  TemplateSlug,
} from '@/lib/rams/types';
import { TEMPLATE_CONFIGS } from '@/lib/rams/template-config';

interface ConversationClientProps {
  templateSlug: TemplateSlug;
  description: string;
  /** First batch of questions (round 1) — passed in from the parent */
  initialQuestions: ConversationQuestion[];
  initialGenerationId: string;
  /** Total questions from round 1 */
  initialTotalAsked: number;
  onComplete: (rounds: ConversationRound[], generationId: string) => void;
  onBack: () => void;
}

const MAX_WORDS_PER_ANSWER = 100;

export default function ConversationClient({
  templateSlug,
  description,
  initialQuestions,
  initialGenerationId,
  initialTotalAsked,
  onComplete,
  onBack,
}: ConversationClientProps) {
  // Conversation state
  const [rounds, setRounds] = useState<ConversationRound[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<ConversationQuestion[]>(initialQuestions);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [totalAsked, setTotalAsked] = useState(initialTotalAsked);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readyMessage, setReadyMessage] = useState<string | null>(null);
  const [generationId] = useState(initialGenerationId);

  const bottomRef = useRef<HTMLDivElement>(null);
  const config = TEMPLATE_CONFIGS[templateSlug];

  // Initialise answers for current questions
  useEffect(() => {
    const init: Record<string, string> = {};
    currentQuestions.forEach((q) => {
      init[q.id] = answers[q.id] || '';
    });
    setAnswers((prev) => ({ ...prev, ...init }));
  }, [currentQuestions]);

  // Scroll to bottom when new questions arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentQuestions, rounds]);

  const getWordCount = (text: string): number => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const currentAnswersValid = currentQuestions.every((q) => {
    const answer = answers[q.id]?.trim();
    if (!answer) return false;
    return getWordCount(answer) <= MAX_WORDS_PER_ANSWER;
  });

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  // Submit current round and get next questions (or "ready" signal)
  const handleSubmitRound = useCallback(async () => {
    if (!currentAnswersValid) return;
    setIsLoading(true);
    setError(null);

    // Build the completed round
    const completedRound: ConversationRound = {
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
      const res = await fetch('/api/rams/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateSlug,
          description,
          rounds: allRounds,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to get next questions' }));
        throw new Error(data.error || 'Failed to get next questions');
      }

      const data = await res.json();

      // Update rounds history
      setRounds(allRounds);

      if (data.status === 'ready') {
        // AI says it has enough info
        setReadyMessage(data.message || 'I have enough information to generate your RAMS.');
        setCurrentQuestions([]);
      } else {
        // More questions to ask
        setCurrentQuestions(data.questions);
        setCurrentRoundNumber(data.roundNumber);
        setTotalAsked(data.totalQuestionsAsked);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentAnswersValid, currentQuestions, answers, rounds, currentRoundNumber, templateSlug, description]);

  // User confirms they're ready to generate
  const handleGenerate = useCallback(() => {
    onComplete(rounds, generationId);
  }, [rounds, generationId, onComplete]);

  // User wants to provide more info even though AI said "ready"
  const handleAddMore = useCallback(async () => {
    setReadyMessage(null);
    setIsLoading(true);
    setError(null);

    try {
      // Ask for one more round explicitly
      const res = await fetch('/api/rams/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateSlug,
          description,
          rounds: [...rounds, {
            roundNumber: currentRoundNumber,
            questions: [{ id: 'override', question: 'User requested additional questions', context: '' }],
            answers: [{ id: 'override', question: '', answer: 'I want to provide more detail. Please ask me additional questions about any sections you think could benefit from more information.' }],
          }],
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get additional questions');
      }

      const data = await res.json();

      if (data.status === 'ready' || !data.questions?.length) {
        setReadyMessage('I have all the information I need. Let\'s generate your RAMS.');
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
  }, [rounds, currentRoundNumber, templateSlug, description]);

  return (
    <div className="questionnaire">
      <div className="questionnaire-header">
        <button className="rams-back-btn" onClick={onBack}>
          ← Back to Description
        </button>
        <div className="questionnaire-info">
          <h2>RAMS Interview</h2>
          <p>
            I&apos;m asking you targeted questions about your{' '}
            <strong>{config.displayName}</strong> RAMS. Answer each question with
            as much detail as you can — the quality of your document depends on it.
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="questionnaire-page-indicator">
        <span>
          Round {currentRoundNumber} · {totalAsked} questions asked so far
        </span>
      </div>

      {/* Previous rounds (read-only, collapsed) */}
      {rounds.length > 0 && (
        <div className="conversation-history">
          {rounds.map((round) => (
            <div key={round.roundNumber} className="conversation-round-summary">
              <div className="conversation-round-header">
                <span className="conversation-round-badge">Round {round.roundNumber}</span>
                <span className="conversation-round-count">
                  {round.questions.length} question{round.questions.length !== 1 ? 's' : ''} answered ✓
                </span>
              </div>
              <div className="conversation-round-qa">
                {round.questions.map((q, idx) => (
                  <div key={q.id} className="conversation-qa-pair">
                    <div className="conversation-q">
                      <span className="conversation-q-label">Q:</span> {q.question}
                    </div>
                    <div className="conversation-a">
                      <span className="conversation-a-label">A:</span>{' '}
                      {round.answers[idx]?.answer || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current round questions */}
      {currentQuestions.length > 0 && (
        <div className="questionnaire-questions">
          {currentQuestions.map((q) => {
            const wordCount = getWordCount(answers[q.id] || '');
            const isOverLimit = wordCount > MAX_WORDS_PER_ANSWER;
            const isNearLimit = wordCount >= 80;

            return (
              <div key={q.id} className="questionnaire-item">
                <label className="questionnaire-label">
                  <span className="questionnaire-number">
                    {q.id.replace(/^r\d+q/, '')}
                  </span>
                  <span className="questionnaire-question-text">{q.question}</span>
                </label>
                {q.context && (
                  <p className="questionnaire-context">{q.context}</p>
                )}
                <div className="questionnaire-input-wrap">
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    className={isOverLimit ? 'over-limit' : ''}
                  />
                  <div
                    className={`questionnaire-counter ${
                      isOverLimit ? 'over-limit' : isNearLimit ? 'near-limit' : ''
                    }`}
                  >
                    {wordCount} / {MAX_WORDS_PER_ANSWER} words
                  </div>
                </div>
                {isOverLimit && (
                  <p className="questionnaire-warning">
                    Please keep your answer under {MAX_WORDS_PER_ANSWER} words.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI "ready" message */}
      {readyMessage && (
        <div className="conversation-ready">
          <div className="conversation-ready-icon">✓</div>
          <p className="conversation-ready-message">{readyMessage}</p>
          <div className="conversation-ready-actions">
            <button className="rams-primary-btn" onClick={handleGenerate}>
              Generate My RAMS →
            </button>
            <button className="rams-secondary-btn" onClick={handleAddMore}>
              I want to add more detail
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rams-error" style={{ marginTop: '1rem' }}>
          <span className="rams-error-icon">⚠</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="rams-error-close">
            ×
          </button>
        </div>
      )}

      {/* Navigation */}
      {!readyMessage && currentQuestions.length > 0 && (
        <div className="questionnaire-nav">
          <div />
          <button
            className="rams-primary-btn"
            onClick={handleSubmitRound}
            disabled={!currentAnswersValid || isLoading}
          >
            {isLoading ? (
              <>
                <span className="rams-spinner" /> Getting next questions...
              </>
            ) : (
              'Submit Answers →'
            )}
          </button>
        </div>
      )}

      {/* Loading state between rounds */}
      {isLoading && currentQuestions.length === 0 && (
        <div className="conversation-loading">
          <span className="rams-spinner" />
          <p>Analysing your answers and preparing follow-up questions...</p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
