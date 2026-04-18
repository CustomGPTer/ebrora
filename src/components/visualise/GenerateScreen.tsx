'use client';

// =============================================================================
// GenerateScreen — empty state with textarea and advanced options.
// Word count enforced 3 ≤ n ≤ 200. Advanced panel hidden by default.
//
// Batch CQ: two-phase flow.
//   Phase 1 ("input")   — textarea + advanced options + "Continue" button.
//   Phase 2 ("clarify") — mount ClarifyPanel which handles the clarifying
//                         questions loop and calls back with answers.
//
// The Continue button replaces the old Generate button — same pre-conditions
// (word-count bounds, quota) but transitions to the clarify phase instead
// of firing onGenerate directly. onGenerate fires only after clarify is done
// (either the decide function said "done" or the user hit "Generate anyway").
// =============================================================================

import { useMemo, useState } from 'react';
import type { AccessResponse, VisualCountPreference } from '@/lib/visualise/types';
import { VISUALISE_TEXT_MIN_WORDS, VISUALISE_TEXT_MAX_WORDS } from '@/lib/visualise/constants';
import { getAllPresets } from '@/lib/visualise/presets';
import type { ClarifyAnswer } from '@/lib/visualise/ai/clarify/types';
import ClarifyPanel from './ClarifyPanel';

interface Props {
  access: AccessResponse | null;
  isGenerating: boolean;
  tier: string;
  onGenerate: (
    text: string,
    forcePresetId?: string,
    visualCountPreference?: VisualCountPreference,
    clarifyAnswers?: ClarifyAnswer[],
  ) => void;
}

export default function GenerateScreen({ access, isGenerating, onGenerate }: Props) {
  const [text, setText] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [forcePresetId, setForcePresetId] = useState<string>('');
  const [visualCount, setVisualCount] = useState<VisualCountPreference>('any');

  // Batch CQ phase state. 'input' = text/advanced-options form visible;
  // 'clarify' = ClarifyPanel mounted with user's text. Cancelling clarify
  // returns to 'input' without discarding the text (user can tweak and retry).
  const [phase, setPhase] = useState<'input' | 'clarify'>('input');

  const wordCount = useMemo(() => {
    const t = text.trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
  }, [text]);

  const tooShort = wordCount > 0 && wordCount < VISUALISE_TEXT_MIN_WORDS;
  const tooLong = wordCount > VISUALISE_TEXT_MAX_WORDS;
  const canContinue =
    !isGenerating &&
    wordCount >= VISUALISE_TEXT_MIN_WORDS &&
    wordCount <= VISUALISE_TEXT_MAX_WORDS &&
    (access?.allowed ?? false);

  const presets = getAllPresets();

  const quotaMessage = (() => {
    if (!access) return null;
    if (access.limit === 0) return 'Visualise is not available on your current plan.';
    if (access.remaining === 0) return `You've used all ${access.limit} generations this month.`;
    return null;
  })();

  // ── Clarify phase ──────────────────────────────────────────────────────────
  // ClarifyPanel calls onComplete with the final answers array (possibly
  // empty if the decide function skipped all questions or the user bypassed
  // immediately). We forward those to the parent's onGenerate.
  if (phase === 'clarify') {
    return (
      <ClarifyPanel
        text={text.trim()}
        onComplete={(answers) => {
          onGenerate(
            text.trim(),
            forcePresetId || undefined,
            visualCount,
            answers.length > 0 ? answers : undefined,
          );
          // Leave phase as 'clarify' — VisualiseClient will flip the view to
          // 'document' once the generate response comes back. If generation
          // fails, returning to input phase is handled by the parent via
          // error state + re-mount of this component on new-draft click.
        }}
        onCancel={() => setPhase('input')}
      />
    );
  }

  // ── Input phase (default) ──────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-[#1B5B50] mb-1">Describe the work</h2>
      <p className="text-sm text-gray-600 mb-5">
        Paste up to {VISUALISE_TEXT_MAX_WORDS} words describing your process, phase, or concept.
        Visualise will pick up to 3 presets and populate them with labels from your text.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isGenerating}
        placeholder="e.g. The RAMS approval workflow: subcontractor submits, PC reviews within 5 working days, if approved the document is issued to site; if returned, subcontractor has 3 working days to rework and resubmit. Approved RAMS are briefed via toolbox talk before work starts."
        rows={8}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B5B50] focus:ring-2 focus:ring-[#E6F0EE] resize-y"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <div className="text-xs text-gray-500">
          <span className={`font-semibold tabular-nums ${tooShort ? 'text-amber-600' : tooLong ? 'text-red-600' : 'text-[#1B5B50]'}`}>
            {wordCount}
          </span>
          {' / '}
          {VISUALISE_TEXT_MAX_WORDS} words
          {tooShort ? <span className="ml-2 text-amber-600">(minimum {VISUALISE_TEXT_MIN_WORDS})</span> : null}
          {tooLong ? <span className="ml-2 text-red-600">(over limit)</span> : null}
        </div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="text-xs font-semibold text-[#1B5B50] hover:underline"
        >
          {advancedOpen ? 'Hide advanced options' : 'Show advanced options'}
        </button>
      </div>

      {/* Advanced panel */}
      {advancedOpen ? (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg grid sm:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Force preset</span>
            <select
              value={forcePresetId}
              onChange={(e) => setForcePresetId(e.target.value)}
              disabled={isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-[#1B5B50]"
            >
              <option value="">Let AI choose (recommended)</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">
              Pin the AI to a specific preset. Still populates data from your text.
            </p>
          </label>

          <label className="text-sm">
            <span className="block font-medium text-gray-700 mb-1">Visual count</span>
            <select
              value={visualCount}
              onChange={(e) => setVisualCount(e.target.value as VisualCountPreference)}
              disabled={isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-[#1B5B50]"
            >
              <option value="any">Any (AI decides)</option>
              <option value={1}>1 visual</option>
              <option value={2}>2 visuals</option>
              <option value={3}>3 visuals</option>
            </select>
            <p className="mt-1 text-[11px] text-gray-500">Cap or target number of visuals returned.</p>
          </label>
        </div>
      ) : null}

      {/* Quota warning */}
      {quotaMessage ? (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-sm text-amber-800">{quotaMessage}</p>
        </div>
      ) : null}

      {/* Continue button — replaces the old Generate button. Opens the
          clarify phase; the actual generate call fires from ClarifyPanel's
          onComplete callback. */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setPhase('clarify')}
          disabled={!canContinue}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
            canContinue
              ? 'bg-[#1B5B50] text-white hover:bg-[#144840]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            'Continue'
          )}
        </button>
        <p className="text-xs text-gray-500">
          Next: a couple of quick questions to pick the right shape.
        </p>
      </div>
    </div>
  );
}
