'use client';

// =============================================================================
// EntryChooser — Batch 3b
//
// Shown as the first screen when a user arrives at /visualise without a
// draft open. Presents two equal-weight choices:
//
//   1. Start with AI (the pre-3b default path) — user pastes a paragraph of
//      source text, AI picks presets + populates data. Suits users who have
//      content but no strong layout preference.
//
//   2. Start from a template (new in 3b) — user picks a template visually
//      first, then pastes their content knowing exactly what shape it'll
//      land in. Suits users who already know "I want a SIPOC" or "I want a
//      4-step flow" and want complete preset control.
//
// Both paths converge on the same POST /api/visualise/generate endpoint.
// Template-first flows set forcePresetId in the generate body so the AI
// skips preset selection.
//
// Designed to be skippable for power users — the parent VisualiseClient
// remembers the last chosen mode in session state so repeat generations
// don't re-show this chooser.
// =============================================================================

interface Props {
  onChooseAi: () => void;
  onChooseTemplate: () => void;
}

export default function EntryChooser({ onChooseAi, onChooseTemplate }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#1B5B50] mb-2">Create a visual document</h1>
      <p className="text-sm text-gray-600 mb-8">
        Pick how you want to start. Both paths produce the same kind of document — you can edit,
        recolour, and regenerate from either one.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Mode 1: AI-first ──────────────────────────────────────────── */}
        <button
          type="button"
          onClick={onChooseAi}
          className="group text-left rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-[#1B5B50] hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#1B5B50] focus:ring-offset-2"
          aria-label="Start with AI — paste your text first, let the AI pick templates"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#E6F0EE] text-[#1B5B50] flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="m16.24 16.24 2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="m16.24 7.76 2.83-2.83" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#1B5B50]">
              Start with AI
            </h2>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Paste a paragraph about your topic. The AI reads it, picks suitable templates, and fills
            them in. Good when you have content but don&apos;t know what layout you want.
          </p>
          <p className="text-xs text-gray-500">
            Best for: briefings, meeting notes, scope summaries, explainers
          </p>
        </button>

        {/* ── Mode 2: Template-first ────────────────────────────────────── */}
        <button
          type="button"
          onClick={onChooseTemplate}
          className="group text-left rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-[#1B5B50] hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#1B5B50] focus:ring-offset-2"
          aria-label="Start from a template — pick a layout first, then write content for it"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#FDF6E8] text-[#D4A44C] flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#1B5B50]">
              Start from a template
            </h2>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Browse all templates first, pick the exact layout you want (SIPOC, 4-step flow, RACI,
            risk matrix…), then paste content for it. Good when you know what shape you need.
          </p>
          <p className="text-xs text-gray-500">
            Best for: method statements, formal reports, submissions, repeated document types
          </p>
        </button>
      </div>
    </div>
  );
}
