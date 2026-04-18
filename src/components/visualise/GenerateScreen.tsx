'use client';

// =============================================================================
// GenerateScreen — empty state with textarea and advanced options.
// Word count enforced 3 ≤ n ≤ 200. Advanced panel hidden by default.
// =============================================================================

import { useMemo, useState } from 'react';
import type { AccessResponse, VisualCountPreference } from '@/lib/visualise/types';
import { VISUALISE_TEXT_MIN_WORDS, VISUALISE_TEXT_MAX_WORDS } from '@/lib/visualise/constants';
import { getAllPresets } from '@/lib/visualise/presets';

interface Props {
  access: AccessResponse | null;
  isGenerating: boolean;
  tier: string;
  onGenerate: (text: string, forcePresetId?: string, visualCountPreference?: VisualCountPreference) => void;
}

export default function GenerateScreen({ access, isGenerating, onGenerate }: Props) {
  const [text, setText] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [forcePresetId, setForcePresetId] = useState<string>('');
  const [visualCount, setVisualCount] = useState<VisualCountPreference>('any');

  const wordCount = useMemo(() => {
    const t = text.trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
  }, [text]);

  const tooShort = wordCount > 0 && wordCount < VISUALISE_TEXT_MIN_WORDS;
  const tooLong = wordCount > VISUALISE_TEXT_MAX_WORDS;
  const canGenerate =
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

      {/* Generate button */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onGenerate(text.trim(), forcePresetId || undefined, visualCount)}
          disabled={!canGenerate}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
            canGenerate
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
            'Generate'
          )}
        </button>
        <p className="text-xs text-gray-500">
          Costs 1 use. Returns 1–3 visuals.
        </p>
      </div>
    </div>
  );
}
