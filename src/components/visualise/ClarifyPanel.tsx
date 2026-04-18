'use client';

// =============================================================================
// ClarifyPanel (Batch CQ)
//
// UI for the clarifying-questions flow. Sits between the user's paste and
// the actual /api/visualise/generate call.
//
// Flow:
//   1. Mount with `text` + empty priorAnswers → POST /api/visualise/clarify
//   2. If response.done → call onComplete(priorAnswers) immediately
//   3. Otherwise render the nextQuestion (chips OR free-text textarea)
//   4. On answer → append to priorAnswers → POST /api/visualise/clarify again
//   5. Loop until done. User may bypass at any point with "Generate anyway".
//
// Session-scoped: priorAnswers live only in this component's state. On
// unmount (navigation away or user choosing "start over") they're discarded.
// No localStorage, no sessionStorage — per BATCH-CQ-SCOPE.md decision 5.
//
// 40-word cap is enforced at entry time for free-text answers (textarea
// maxLength + live word counter + disabled submit when over). The server
// also truncates as a safety net but the UX gate is here.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  CLARIFY_MAX_ANSWER_WORDS,
  CLARIFY_MAX_ROUNDS,
  countWords,
  type ClarifyAnswer,
  type ClarifyChip,
  type ClarifyQuestion,
  type ClarifyResponse,
  type ClarifyTopic,
} from '@/lib/visualise/ai/clarify/types';

interface Props {
  text: string;
  /** Called when clarify is done (either completed naturally or user bypassed). */
  onComplete: (answers: ClarifyAnswer[]) => void;
  /** Called when the user clicks "Start over" to edit their original text. */
  onCancel: () => void;
}

export default function ClarifyPanel({ text, onComplete, onCancel }: Props) {
  const [priorAnswers, setPriorAnswers] = useState<ClarifyAnswer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<ClarifyQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [freeTextValue, setFreeTextValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Call /api/visualise/clarify with the current text + priorAnswers.
  // Stable across renders — takes the answers array explicitly rather than
  // closing over state, so callers can pass the just-appended array without
  // waiting for a re-render.
  const askServer = useCallback(
    async (answersToSend: ClarifyAnswer[]) => {
      setIsLoading(true);
      setError(null);
      setFreeTextValue('');
      try {
        const res = await fetch('/api/visualise/clarify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, priorAnswers: answersToSend }),
        });
        if (!res.ok) {
          // On server error just proceed to generate with what we have.
          // Failing closed would trap the user; failing open preserves
          // the pre-CQ UX.
          onComplete(answersToSend);
          return;
        }
        const payload = (await res.json()) as ClarifyResponse;
        if (payload.done) {
          onComplete(answersToSend);
          return;
        }
        if (!payload.nextQuestion) {
          // Server said not done but gave no question — treat as done.
          onComplete(answersToSend);
          return;
        }
        setCurrentQuestion(payload.nextQuestion);
      } catch {
        setError('Could not reach the server. You can still generate with what we have.');
      } finally {
        setIsLoading(false);
      }
    },
    [text, onComplete],
  );

  // Fire the first clarify call on mount. Dependency on askServer is fine
  // because askServer is stable (text + onComplete are stable across the
  // panel's lifetime).
  useEffect(() => {
    askServer([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChipClick = useCallback(
    (chip: ClarifyChip) => {
      if (!currentQuestion) return;
      const answer: ClarifyAnswer = { topic: currentQuestion.topic, value: chip.value };
      const next = [...priorAnswers, answer];
      setPriorAnswers(next);
      askServer(next);
    },
    [currentQuestion, priorAnswers, askServer],
  );

  const handleFreeTextSubmit = useCallback(() => {
    if (!currentQuestion) return;
    const trimmed = freeTextValue.trim();
    if (!trimmed) return;
    const answer: ClarifyAnswer = { topic: currentQuestion.topic, value: trimmed };
    const next = [...priorAnswers, answer];
    setPriorAnswers(next);
    askServer(next);
  }, [currentQuestion, freeTextValue, priorAnswers, askServer]);

  const handleSkipQuestion = useCallback(() => {
    if (!currentQuestion) return;
    // Record an explicit "unknown" so the server moves on to the next topic.
    const answer: ClarifyAnswer = { topic: currentQuestion.topic, value: 'unknown' };
    const next = [...priorAnswers, answer];
    setPriorAnswers(next);
    askServer(next);
  }, [currentQuestion, priorAnswers, askServer]);

  const handleGenerateAnyway = useCallback(() => {
    onComplete(priorAnswers);
  }, [onComplete, priorAnswers]);

  const freeTextWordCount = countWords(freeTextValue);
  const freeTextOverCap = freeTextWordCount > CLARIFY_MAX_ANSWER_WORDS;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-[#1B5B50] mb-1">Quick check before we build</h2>
      <p className="text-sm text-gray-600 mb-5">
        A couple of quick questions help us pick the right shape. You can skip any
        question or hit <span className="font-semibold">Generate anyway</span> to proceed
        with your best-guess answers.
      </p>

      {/* Answer history — shows chips already chosen, with a "start over" escape */}
      {priorAnswers.length > 0 ? (
        <ClarifyAnswerHistory answers={priorAnswers} />
      ) : null}

      {/* Current question or loading state */}
      <div className="mt-5 min-h-[120px]">
        {isLoading ? (
          <div className="flex items-center gap-3 text-gray-500 text-sm">
            <span className="w-4 h-4 border-2 border-[#1B5B50] border-t-transparent rounded-full animate-spin" />
            Thinking…
          </div>
        ) : error ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : currentQuestion ? (
          <div>
            <p className="text-base font-semibold text-gray-900 mb-3">
              {currentQuestion.prompt}
              <span className="ml-2 text-xs font-normal text-gray-500">
                Round {(currentQuestion.round ?? priorAnswers.length) + 1} of {CLARIFY_MAX_ROUNDS}
              </span>
            </p>

            {currentQuestion.chips ? (
              <ChipGrid chips={currentQuestion.chips} onClick={handleChipClick} />
            ) : (
              <FreeTextAnswer
                placeholder={currentQuestion.placeholder ?? 'Short answer'}
                value={freeTextValue}
                onChange={setFreeTextValue}
                wordCount={freeTextWordCount}
                overCap={freeTextOverCap}
                canSubmit={freeTextWordCount > 0 && !freeTextOverCap}
                onSubmit={handleFreeTextSubmit}
                onSkip={handleSkipQuestion}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* Footer controls */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Start over
        </button>
        <button
          type="button"
          onClick={handleGenerateAnyway}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-[#1B5B50] text-white text-sm font-semibold hover:bg-[#144840] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Generate anyway
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components

function ChipGrid({
  chips,
  onClick,
}: {
  chips: ClarifyChip[];
  onClick: (chip: ClarifyChip) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          onClick={() => onClick(chip)}
          className="px-4 py-2 rounded-full bg-[#E6F0EE] hover:bg-[#D4E5E1] text-sm font-medium text-[#1B5B50] transition-colors"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

function FreeTextAnswer({
  placeholder,
  value,
  onChange,
  wordCount,
  overCap,
  canSubmit,
  onSubmit,
  onSkip,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  wordCount: number;
  overCap: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E6F0EE] resize-y ${
          overCap ? 'border-red-400' : 'border-gray-300 focus:border-[#1B5B50]'
        }`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
        <div className="text-xs text-gray-500">
          <span className={`font-semibold tabular-nums ${overCap ? 'text-red-600' : 'text-[#1B5B50]'}`}>
            {wordCount}
          </span>
          {' / '}
          {CLARIFY_MAX_ANSWER_WORDS} words
          {overCap ? <span className="ml-2 text-red-600">(over limit)</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-gray-600 hover:underline"
          >
            Skip this question
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              canSubmit
                ? 'bg-[#1B5B50] text-white hover:bg-[#144840]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Answer
          </button>
        </div>
      </div>
    </div>
  );
}

function ClarifyAnswerHistory({ answers }: { answers: ClarifyAnswer[] }) {
  const topicLabel: Record<ClarifyTopic, string> = {
    family: 'Shape',
    preset: 'Preset',
    count: 'Count',
    palette: 'Style',
    data: 'Data',
  };
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {answers.map((a, i) => (
        <span
          key={`${a.topic}-${i}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
        >
          <span className="font-semibold text-[#1B5B50]">{topicLabel[a.topic]}:</span>
          <span>{a.value === 'unknown' ? 'not sure' : a.value}</span>
        </span>
      ))}
    </div>
  );
}
