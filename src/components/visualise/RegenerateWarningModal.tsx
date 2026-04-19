'use client';

// =============================================================================
// RegenerateWarningModal — confirm before regenerating a single visual.
//
// Batch 3a — adds a "source" radio group so the user can pick between:
//   - "Start over from my original text" (legacy behaviour): AI uses the
//     document's stored sourceText and produces a fresh visual.
//   - "Tidy up what's here now": AI uses the CURRENT visual's labels /
//     details / title / caption as the source and returns a refined
//     version. Useful when the user has edited labels in the canvas and
//     wants the AI to normalise + expand without wiping their work.
//
// Also — new in 3a — a line noting that `templateLocked` on the visual
// will be honoured by the server regardless of which source the user picks.
//
// Defaults to "original" to match pre-3a behaviour so muscle-memory users
// don't get surprised. Returns the choice via onConfirm(source) — the
// caller threads it into the server generate request.
// =============================================================================

import { useEffect, useState } from 'react';

export type RegenerateSource = 'original' | 'current-content';

interface Props {
  open: boolean;
  templateLocked?: boolean;
  onClose: () => void;
  onConfirm: (source: RegenerateSource) => void;
}

export default function RegenerateWarningModal({
  open,
  templateLocked,
  onClose,
  onConfirm,
}: Props) {
  const [source, setSource] = useState<RegenerateSource>('original');
  const [preserveEdits, setPreserveEdits] = useState(true);

  useEffect(() => {
    if (!open) return;
    setSource('original');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-[#1B5B50] mb-2">Regenerate this visual?</h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          This will replace the current visual. It costs <strong>1 use</strong> from your monthly quota.
        </p>

        <fieldset className="mt-4 space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            What should the AI use as the source?
          </legend>

          <label className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
            <input
              type="radio"
              name="regenerate-source"
              value="original"
              checked={source === 'original'}
              onChange={() => setSource('original')}
              className="mt-0.5 text-[#1B5B50] focus:ring-[#1B5B50]"
            />
            <span className="text-sm text-gray-700 flex-1">
              <span className="font-semibold text-gray-900 block">
                Start over from my original text
              </span>
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                AI reads your original pasted source text and builds a fresh visual. Any manual
                edits inside this visual are replaced.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
            <input
              type="radio"
              name="regenerate-source"
              value="current-content"
              checked={source === 'current-content'}
              onChange={() => setSource('current-content')}
              className="mt-0.5 text-[#1B5B50] focus:ring-[#1B5B50]"
            />
            <span className="text-sm text-gray-700 flex-1">
              <span className="font-semibold text-gray-900 block">Tidy up what&apos;s here now</span>
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                AI reads THIS visual&apos;s current labels and details, then returns a refined version.
                Good for polishing edits you&apos;ve just made.
              </span>
            </span>
          </label>
        </fieldset>

        <label className="flex items-start gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={preserveEdits}
            onChange={(e) => setPreserveEdits(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#1B5B50] focus:ring-[#1B5B50]"
          />
          <span className="text-sm text-gray-700">
            Preserve my label edits where possible
            <span className="block text-[11px] text-gray-500 mt-0.5">
              Kept when the AI picks a preset in the same family (flow → flow). Dropped when the
              family changes (flow → chart).
            </span>
          </span>
        </label>

        {templateLocked ? (
          <div className="mt-3 text-xs text-[#1B5B50] bg-[#E6F0EE] rounded-md px-3 py-2 flex items-start gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <span>
              Template is locked — the AI will keep the current preset regardless of source.
            </span>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(source)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1B5B50] text-white hover:bg-[#144840]"
          >
            Yes, regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
