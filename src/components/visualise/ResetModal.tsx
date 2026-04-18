'use client';

// =============================================================================
// ResetModal — destructive confirm before wiping a draft.
// Copy matches spec §3.9 verbatim.
// =============================================================================

import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetModal({ open, onClose, onConfirm }: Props) {
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
        <h3 className="text-lg font-bold text-red-700 mb-2">Reset this draft?</h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          This permanently deletes the draft and all its visuals. Your monthly usage count will{' '}
          <strong>not</strong> be refunded. This action cannot be undone.
        </p>

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
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
          >
            Yes, reset
          </button>
        </div>
      </div>
    </div>
  );
}
