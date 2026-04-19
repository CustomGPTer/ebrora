'use client';

// =============================================================================
// ApplyTemplateModal — Batch 1b
//
// Gatekeeper shown when a user picks a preset from the sidebar gallery whose
// dataSchema doesn't accept the current visual's data. Pre-Batch-1b, the
// gallery would silently swap to defaultData and surface an amber "Click
// Regenerate to re-map your original text" banner — with the Regenerate
// button living on an entirely different screen. Net effect: the user got
// dropped into a preset full of placeholder content with no obvious path
// forward.
//
// New flow:
//   1. User clicks an incompatible preset tile.
//   2. PresetGallery bubbles an onApplyIntent(presetId) to CanvasEditor.
//   3. CanvasEditor opens this modal, shows the target preset's name, warns
//      the re-map uses one AI credit, offers Cancel / Apply.
//   4. On Apply, CanvasEditor fires onGalleryPickVisual(visualId, presetId) —
//      the existing silent auto-remap server path. No more defaultData.
//
// Compatible presets (safeParse passes) still swap silently, no modal.
//
// Keep the copy short — this is a confirm dialog, not a wizard. The user has
// already committed enough intent by clicking a preset tile; we're just making
// sure they know a credit will be spent and the AI re-maps rather than
// mangling.
// =============================================================================

import { useEffect } from 'react';

interface Props {
  open: boolean;
  /** Human-readable preset name, e.g. "SIPOC — Suppliers, Inputs, Process, Outputs, Customers". */
  targetPresetName: string;
  /** Whether the server-side regenerate is currently in flight — disables Apply button. */
  isGenerating: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ApplyTemplateModal({
  open,
  targetPresetName,
  isGenerating,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, isGenerating]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4"
      onClick={() => {
        if (!isGenerating) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-template-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="apply-template-title" className="text-lg font-bold text-[#1B5B50] mb-2">
          Apply this template?
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          Your current content doesn&apos;t map cleanly onto{' '}
          <strong className="text-gray-900">{targetPresetName}</strong>. Applying it will ask the
          AI to re-map your original source text into the template&apos;s shape.
        </p>
        <p className="text-xs text-gray-500 mt-3">
          Cost: <strong>1 use</strong> from your monthly quota. Edits you&apos;ve made to node
          positions or colours are kept where possible; text labels get refreshed from the
          re-mapped content.
        </p>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1B5B50] text-white hover:bg-[#144840] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
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
                Re-mapping…
              </>
            ) : (
              'Apply template'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
