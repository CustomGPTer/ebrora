'use client';

// =============================================================================
// TemplateFirstScreen — Batch 3b
//
// Two-step screen for the "Start from a template" entry path:
//
//   Step A: Browse. User sees a category-tabbed grid of every registered
//           preset. Clicking a tile selects it (doesn't advance) — confirm-
//           on-click would be too aggressive for a screen where "I clicked
//           the wrong one" is easy. A "Continue" button advances when a
//           preset is selected.
//
//   Step B: Compose. The chosen preset's thumbnail + name is shown at the
//           top; below it is a textarea for source text + a Generate
//           button. "Change template" link goes back to step A without
//           losing the text.
//
// Both steps share the same container, so navigation between them is
// in-component state only — no route changes, no lost text.
//
// On Generate, calls the parent's onGenerate(text, forcePresetId) using
// the same signature as GenerateScreen so VisualiseClient can reuse its
// existing handleGenerate. The `visualCountPreference` is implicitly 1
// for the template-first flow — if the user picked a specific preset
// they want a single visual of that preset, not multiple.
//
// No clarifying-questions flow here. Template-first users have chosen
// their layout; clarifying questions about "did you mean a process or a
// timeline" become irrelevant.
// =============================================================================

import { useMemo, useState } from 'react';
import type { AccessResponse, VisualCountPreference } from '@/lib/visualise/types';
import { VISUALISE_TEXT_MIN_WORDS, VISUALISE_TEXT_MAX_WORDS } from '@/lib/visualise/constants';
import { getAllPresets, getPresetById } from '@/lib/visualise/presets';
import type { PresetCategory } from '@/lib/visualise/presets/types';
import {
  getCategoryTileBg,
  getCategoryTileBgHover,
} from '@/lib/visualise/categoryColors';
import type { ClarifyAnswer } from '@/lib/visualise/ai/clarify/types';

interface Props {
  access: AccessResponse | null;
  isGenerating: boolean;
  onGenerate: (
    text: string,
    forcePresetId?: string,
    visualCountPreference?: VisualCountPreference,
    clarifyAnswers?: ClarifyAnswer[],
  ) => void;
  /** Back to the entry chooser. */
  onBack: () => void;
  generateError?: string | null;
}

const CATEGORY_ORDER: Array<{ id: 'all' | PresetCategory; label: string }> = [
  { id: 'all', label: 'All templates' },
  { id: 'flow', label: 'Flow' },
  { id: 'process', label: 'Process' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'hierarchy', label: 'Hierarchy' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'positioning', label: 'Positioning' },
  { id: 'funnel-pyramid', label: 'Funnel / Pyramid' },
  { id: 'cycle', label: 'Cycle' },
  { id: 'charts', label: 'Charts' },
  { id: 'construction', label: 'Construction' },
];

export default function TemplateFirstScreen({
  access,
  isGenerating,
  onGenerate,
  onBack,
  generateError,
}: Props) {
  const [step, setStep] = useState<'browse' | 'compose'>('browse');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [category, setCategory] = useState<'all' | PresetCategory>('all');
  const [search, setSearch] = useState('');
  const [text, setText] = useState('');

  const allPresets = useMemo(() => getAllPresets(), []);
  const selectedPreset = selectedPresetId ? getPresetById(selectedPresetId) : null;

  const filteredPresets = useMemo(() => {
    let list = allPresets;
    if (category !== 'all') list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.id.toLowerCase().includes(needle) ||
          p.aiDescription.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle),
      );
    }
    return list;
  }, [allPresets, category, search]);

  // Word-count validity for the textarea.
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  const canGenerate =
    !isGenerating &&
    !!selectedPresetId &&
    wordCount >= VISUALISE_TEXT_MIN_WORDS &&
    wordCount <= VISUALISE_TEXT_MAX_WORDS &&
    (access?.remaining ?? 0) > 0;

  const wordCountColour =
    wordCount === 0
      ? 'text-gray-500'
      : wordCount < VISUALISE_TEXT_MIN_WORDS
        ? 'text-amber-600'
        : wordCount > VISUALISE_TEXT_MAX_WORDS
          ? 'text-red-600'
          : 'text-green-700';

  const handleSubmit = () => {
    if (!canGenerate || !selectedPresetId) return;
    // Template-first flow always requests a single visual of the chosen preset.
    onGenerate(text, selectedPresetId, 1);
  };

  // ── Step A: browse ───────────────────────────────────────────────────────
  if (step === 'browse') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-semibold text-[#1B5B50] hover:underline mb-2 inline-flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-bold text-[#1B5B50]">Pick a template</h1>
            <p className="text-sm text-gray-600 mt-1">
              Choose the layout you want — you&apos;ll write content for it on the next step.
            </p>
          </div>
        </div>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates…"
          className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#1B5B50] focus:ring-1 focus:ring-[#1B5B50] text-sm mb-3"
        />

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 mb-5 border-b border-gray-200 pb-3">
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                category === c.id
                  ? 'bg-[#1B5B50] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredPresets.length === 0 ? (
          <p className="text-sm text-gray-500 py-10 text-center">
            No templates match that search. Try a different keyword or clear the filter.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredPresets.map((preset) => {
              const active = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPresetId(preset.id)}
                  title={preset.description}
                  className={`flex flex-col items-stretch gap-2 p-3 rounded-lg border-2 text-left transition-colors ${
                    active
                      ? 'border-[#1B5B50] bg-[#E6F0EE]'
                      : `border-gray-200 bg-white hover:border-gray-300 ${getCategoryTileBg(preset.category)} ${getCategoryTileBgHover(preset.category)}`
                  }`}
                  aria-pressed={active}
                >
                  <div
                    className="h-20 flex items-center justify-center overflow-hidden rounded bg-white border border-gray-100"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: preset.thumbnailSvg }}
                  />
                  <span
                    className={`text-xs font-semibold leading-tight ${
                      active ? 'text-[#1B5B50]' : 'text-gray-800'
                    }`}
                  >
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sticky footer — Continue only enabled when a preset is picked */}
        <div className="sticky bottom-0 mt-6 bg-white border-t border-gray-200 pt-4 pb-2 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            {selectedPreset ? (
              <>
                Selected: <strong className="text-gray-900">{selectedPreset.name}</strong>
              </>
            ) : (
              'Pick a template to continue.'
            )}
          </p>
          <button
            type="button"
            onClick={() => setStep('compose')}
            disabled={!selectedPresetId}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              selectedPresetId
                ? 'bg-[#1B5B50] text-white hover:bg-[#144840]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ── Step B: compose ──────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        type="button"
        onClick={() => setStep('browse')}
        className="text-xs font-semibold text-[#1B5B50] hover:underline mb-2 inline-flex items-center gap-1"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Change template
      </button>
      <h1 className="text-2xl font-bold text-[#1B5B50] mb-1">Write content for this template</h1>
      <p className="text-sm text-gray-600 mb-5">
        Paste a paragraph. The AI will fit your content into the shape below.
      </p>

      {/* Selected template preview */}
      {selectedPreset ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#E6F0EE] border border-[#1B5B50]/20 mb-5">
          <div
            className="h-16 w-24 flex-shrink-0 flex items-center justify-center overflow-hidden rounded bg-white border border-gray-100"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: selectedPreset.thumbnailSvg }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1B5B50]">{selectedPreset.name}</p>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{selectedPreset.description}</p>
          </div>
        </div>
      ) : null}

      {/* Textarea */}
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
        Your source text
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a paragraph describing what you want the template to contain. For example, the steps of a process you're documenting, the items in a list, or the phases of a plan."
        rows={8}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#1B5B50] focus:ring-1 focus:ring-[#1B5B50] text-sm resize-y"
      />
      <div className="flex items-center justify-between mt-1 text-xs">
        <span className={wordCountColour}>
          {wordCount} word{wordCount === 1 ? '' : 's'}
          {wordCount > 0 && wordCount < VISUALISE_TEXT_MIN_WORDS
            ? ` — minimum ${VISUALISE_TEXT_MIN_WORDS}`
            : wordCount > VISUALISE_TEXT_MAX_WORDS
              ? ` — maximum ${VISUALISE_TEXT_MAX_WORDS}`
              : ''}
        </span>
        {access ? (
          <span className="text-gray-500">
            {access.remaining}/{access.limit} uses left
          </span>
        ) : null}
      </div>

      {generateError ? (
        <div className="mt-3 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-800">
          {generateError}
        </div>
      ) : null}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canGenerate}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2 ${
            canGenerate
              ? 'bg-[#1B5B50] text-white hover:bg-[#144840]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Generating…
            </>
          ) : (
            'Generate'
          )}
        </button>
      </div>
    </div>
  );
}
