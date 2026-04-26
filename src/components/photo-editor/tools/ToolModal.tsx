// src/components/photo-editor/tools/ToolModal.tsx
//
// Shared primitive for full-screen tool modals (Crop, Flip/Rotate,
// Resize, future Effects) — the X / title / ✓ top bar plus a working
// area below it. Mirrors the visual contract of the existing EraseTool
// modal but extracted because the Batch 5 tools all share the same
// chrome and we don't want four copies of the same 30 lines.
//
// Usage:
//   <ToolModal
//     open={open}
//     title="Crop"
//     onCancel={onCancel}
//     onApply={handleApply}
//     applyDisabled={!hasValidCrop}
//     bottom={<CropAspectButtons />}
//   >
//     {/* Working area — Konva stage / form / etc */}
//   </ToolModal>
//
// Chrome contract:
//   • Backdrop: opaque dark (#000 at 95%) — same as EraseTool, gives the
//     working area maximum contrast against the photo.
//   • Top bar: X button (left), title (centre), ✓ apply (right). The X
//     button always cancels and dismisses; the ✓ button calls onApply.
//   • Bottom bar: optional `bottom` slot for tool-specific controls.
//   • Z-index: 300, same as EraseTool. Above the panel drawers (200/210).

"use client";

import { useEffect, type ReactNode } from "react";
import { Check, X } from "lucide-react";

interface ToolModalProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
  /** Optional bottom-bar content (aspect-ratio buttons, sliders, etc). */
  bottom?: ReactNode;
  children: ReactNode;
}

const TOP_BAR = 56;

export function ToolModal({
  open,
  title,
  onCancel,
  onApply,
  applyDisabled = false,
  bottom,
  children,
}: ToolModalProps) {
  // Close on Escape — same convention as PanelDrawer / EraseTool.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[300] flex flex-col"
      style={{
        background: "rgba(0,0,0,0.92)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* ── Top bar ───────────────────────────────────────────── */}
      <div
        className="flex-none flex items-center justify-between px-3"
        style={{ height: TOP_BAR }}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label={`Cancel ${title.toLowerCase()}`}
          className="w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors"
          style={{
            color: "#FFFFFF",
            background: "rgba(255,255,255,0.10)",
          }}
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        <div
          className="text-base font-semibold"
          style={{ color: "#FFFFFF" }}
        >
          {title}
        </div>

        <button
          type="button"
          onClick={onApply}
          disabled={applyDisabled}
          aria-label={`Apply ${title.toLowerCase()}`}
          className="w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: "#0F1115",
            background: "#FFFFFF",
          }}
        >
          <Check className="w-5 h-5" strokeWidth={2.25} />
        </button>
      </div>

      {/* ── Working area (children) ───────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">{children}</div>

      {/* ── Bottom bar (optional) ─────────────────────────────── */}
      {bottom && (
        <div
          className="flex-none"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {bottom}
        </div>
      )}
    </div>
  );
}
