// src/components/photo-editor/home/RestoreDraftDialog.tsx
//
// Centered "Information" modal shown on the photo editor home view
// when an autosaved draft is found in IndexedDB. Visually mirrors the
// reference Add-Text app's autosave-restore dialog (see screenshot in
// the Session-N spec): white surface, "Information" heading, body
// copy, and a NO / YES button pair with YES emphasised in solid black.
//
// Behaviour:
//   • Yes  → onRestore() — caller loads the draft into the editor
//   • No   → onDiscard() — caller deletes the draft and continues to
//            the home view as normal
//
// The dialog is modal: it traps focus by overlaying a transparent
// backdrop with pointer-events:auto so taps elsewhere on the home page
// don't slip through. We deliberately do NOT close on backdrop tap —
// the user must make an explicit choice, otherwise we'd risk silently
// losing the draft on accidental dismissal.

"use client";

import { useEffect } from "react";

interface RestoreDraftDialogProps {
  open: boolean;
  onRestore: () => void;
  onDiscard: () => void;
}

export function RestoreDraftDialog({
  open,
  onRestore,
  onDiscard,
}: RestoreDraftDialogProps) {
  // Esc = No (discard). The Yes path is opt-in only — pressing Enter
  // on the keyboard wouldn't be a sane default for "destroy work or
  // not", so we don't bind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDiscard();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDiscard]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-draft-title"
      className="fixed inset-0 z-[1100] flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-xl"
        style={{
          background: "var(--pe-surface, #FFFFFF)",
          color: "var(--pe-text, #111827)",
        }}
      >
        <div className="px-6 pt-6 pb-2 text-center">
          <h2
            id="restore-draft-title"
            className="text-xl font-semibold"
          >
            Information
          </h2>
        </div>

        <div className="px-6 pb-6 pt-2 text-center">
          <p className="text-base leading-snug">
            Autosaved project of your last work is available. Do you want
            to open it?
          </p>
        </div>

        <div className="px-4 pb-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onDiscard}
            className="px-5 py-2 text-sm font-semibold uppercase tracking-wide"
            style={{ color: "var(--pe-text, #111827)" }}
          >
            No
          </button>
          <button
            type="button"
            onClick={onRestore}
            className="px-6 py-2 rounded-md text-sm font-semibold uppercase tracking-wide"
            style={{
              background: "var(--pe-text, #111827)",
              color: "var(--pe-bg, #FFFFFF)",
            }}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
