// src/components/photo-editor/projects/SaveProjectDialog.tsx
//
// Inline name-prompt dialog used for first-save and Save-As (Session 7).
//
// The dialog is a small centred modal — not a full side panel — to
// match Add Text's inline rename UX. It auto-focuses the input on
// mount and submits on Enter; Escape cancels.

"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface SaveProjectDialogProps {
  open: boolean;
  /** Pre-fill value (e.g. current project name). */
  initialName: string;
  /** Title shown in the header — "Save project" vs "Save as new project". */
  title: string;
  /** Submit button label — "Save" or "Save as new". */
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}

export function SaveProjectDialog({
  open,
  initialName,
  title,
  submitLabel,
  onCancel,
  onSubmit,
}: SaveProjectDialogProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the form whenever the dialog re-opens.
  useEffect(() => {
    if (open) {
      setName(initialName);
      // Auto-focus + select-all so the user can start typing
      // immediately without manually clearing.
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [open, initialName]);

  // Escape closes the dialog.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    onSubmit(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-xl"
        style={{
          background: "var(--pe-surface)",
          border: "1px solid var(--pe-border)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--pe-border)" }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--pe-text)" }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full"
            style={{ color: "var(--pe-text-muted)" }}
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="px-4 py-4">
          <label
            className="block text-sm mb-2"
            style={{ color: "var(--pe-text-muted)" }}
            htmlFor="save-project-name"
          >
            Project name
          </label>
          <input
            ref={inputRef}
            id="save-project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Untitled"
            maxLength={120}
            className="w-full h-11 px-3 rounded-lg text-sm"
            style={{
              background: "var(--pe-surface-2)",
              color: "var(--pe-text)",
              border: "1px solid var(--pe-border-strong)",
            }}
          />
        </div>

        <div
          className="flex justify-end gap-2 px-4 py-3"
          style={{ borderTop: "1px solid var(--pe-border)" }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 rounded-lg text-sm font-medium"
            style={{
              background: "transparent",
              color: "var(--pe-text)",
              border: "1px solid var(--pe-border-strong)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={name.trim().length === 0}
            className="h-9 px-4 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--pe-accent)",
              color: "var(--pe-accent-fg)",
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
