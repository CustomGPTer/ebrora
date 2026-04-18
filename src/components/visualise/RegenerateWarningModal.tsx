'use client';

// =============================================================================
// RegenerateWarningModal — confirm before regenerating a single visual.
// Copy matches spec §5 Q72: warns that the current visual and edits will be
// replaced. "Preserve my label edits where possible" checkbox is cosmetic for
// now — the generate route already preserves labels when the preset family
// matches (Batch 3 behaviour) and re-maps otherwise.
// =============================================================================

import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RegenerateWarningModal({ open, onClose, onConfirm }: Props) {
  const [preserveEdits, setPreserveEdits] = useState(true);

  useEffect(() => {
    if (!open) return;
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
          This will replace your current visual and any edits you&apos;ve made to it. It costs{' '}
          <strong>1 use</strong> from your monthly quota.
        </p>

        <label className="flex items-start gap-2 mt-4 cursor-pointer">
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
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1B5B50] text-white hover:bg-[#144840]"
          >
            Yes, regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
