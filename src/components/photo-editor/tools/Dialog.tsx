// src/components/photo-editor/tools/Dialog.tsx
//
// Compact centred-modal primitive — small dialog box with backdrop,
// header (title + X), content slot, and an optional footer slot.
//
// Batch G — Apr 2026.
//
// Why this exists alongside ToolModal:
//   ToolModal is a full-screen takeover with opaque dark backdrop —
//   right surface for Crop, Erase, Effects, etc. where the canvas
//   is fully obscured and the working area benefits from full-screen
//   real estate.
//
//   Dialog is a small centred card with semi-transparent backdrop —
//   right surface for low-density actions like canvas resize, rename,
//   single-input prompts. The backdrop fades the canvas behind but
//   doesn't obscure it; the dialog floats over.
//
//   Visual contract mirrors `projects/SaveProjectDialog` (which
//   pre-dates this primitive). SaveProjectDialog hand-rolled the
//   chrome; Dialog formalises it for reuse. SaveProjectDialog isn't
//   migrated to use Dialog in this batch (deferred — it works
//   identically and the diff would be cosmetic).
//
// z-index:
//   200/210 — PanelDrawer side panels and their backdrops
//   1100   — ToolModal full-screen takeovers (Crop/Erase/Effects etc.)
//   1100   — Dialog (this) — same level so it sits above everything
//            including the bottom dock and BottomEditDrawer (z-[231]),
//            but matches ToolModal's tier so a Dialog opened from
//            inside a takeover would composit cleanly. In practice
//            we never nest Dialog inside ToolModal — both are
//            top-level surfaces.
//
// Behaviour:
//   • Click backdrop → cancel (calls onCancel)
//   • Escape → cancel
//   • Header X button → cancel
//   • Returns null when closed (no DOM)
//   • Header + footer borders honour `--pe-border` token
//   • Card surface honours `--pe-surface` so dark mode / light mode
//     match the rest of the editor

"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  /** Header title text. */
  title: string;
  /** Body content. */
  children: ReactNode;
  /** Called when the user dismisses the dialog (X / backdrop / Escape).
   *  The Dialog itself doesn't apply state — wire onCancel to whatever
   *  state-change closes the parent's `open` prop. */
  onCancel: () => void;
  /** Optional footer slot — typically Cancel / Apply buttons. When
   *  omitted, no footer renders (useful for dialogs whose content
   *  has its own commit row). */
  footer?: ReactNode;
  /** Optional max-width override. Default `max-w-sm` (~384px) which
   *  fits a single-input form. Resize-style dialogs with multi-row
   *  content benefit from `max-w-md` (~448px). */
  maxWidthClass?: string;
  /** ARIA label for the dialog (defaults to `title`). */
  ariaLabel?: string;
}

export function Dialog({
  open,
  title,
  children,
  onCancel,
  footer,
  maxWidthClass = "max-w-sm",
  ariaLabel,
}: DialogProps) {
  // Escape closes the dialog. Mirrors SaveProjectDialog.
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

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center px-4"
      style={{
        background: "rgba(0,0,0,0.45)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      onMouseDown={(e) => {
        // Backdrop-click closes; dialog-card clicks don't bubble through
        // because the inner div doesn't propagate (currentTarget guard).
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={`w-full ${maxWidthClass} rounded-2xl shadow-xl flex flex-col`}
        style={{
          background: "var(--pe-surface)",
          border: "1px solid var(--pe-border)",
          maxHeight: "calc(100vh - 64px)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
      >
        {/* Header: title + close ─────────────────────────── */}
        <div
          className="flex-none flex items-center justify-between px-4 py-3"
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
            className="w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--pe-text-muted)" }}
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Body — scrollable when content overflows ───────── */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer — optional ──────────────────────────────── */}
        {footer ? (
          <div
            className="flex-none flex justify-end gap-2 px-4 py-3"
            style={{ borderTop: "1px solid var(--pe-border)" }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Footer button helpers ─────────────────────────────────────
//
// Standard Cancel / Apply buttons that match the SaveProjectDialog
// look-and-feel. Consumers can either drop these into the `footer`
// slot or build their own buttons — Dialog imposes no contract.

export function DialogCancelButton({
  onClick,
  children = "Cancel",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 px-4 rounded-lg text-sm font-medium transition-colors"
      style={{
        background: "transparent",
        color: "var(--pe-text)",
        border: "1px solid var(--pe-border-strong)",
      }}
    >
      {children}
    </button>
  );
}

export function DialogApplyButton({
  onClick,
  disabled = false,
  children = "Apply",
}: {
  onClick: () => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-9 px-4 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      style={{
        background: "var(--pe-accent)",
        color: "#FFFFFF",
      }}
    >
      {children}
    </button>
  );
}
