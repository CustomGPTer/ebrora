// src/components/photo-editor/tools/ToolModal.tsx
//
// Shared primitive for full-screen tool modals (Crop, Flip/Rotate,
// Resize, Effects). Mirrors the visual contract of the EraseTool
// modal but extracted so we don't keep four copies of the same
// 30 lines.
//
// Chrome contract:
//   • Backdrop: opaque dark (#000 at 92%) — gives the working area
//     maximum contrast against the photo.
//   • Top bar: X button (left), title (centre), ✓ apply (right). The
//     X button always cancels and dismisses; the ✓ button calls
//     onApply.
//   • Bottom bar: optional `bottom` slot for tool-specific controls.
//
// Z-index — Batch 7:
//   The Batch 5 implementation used z-[300]. The site's NavBar is
//   z-[500] and the Batch 7 editor wrapper is z-[1000], so 300 was
//   actually behind both. Modals were having their X / ✓ chrome
//   chopped off by the site's fixed nav at the top of the viewport.
//   z-[1100] now sits cleanly above everything: site chrome, the
//   editor wrapper, the bottom dock, and the BottomEditDrawer
//   (z-[231]).

"use client";

import { useEffect, type ReactNode } from "react";
import { Check, X } from "lucide-react";

interface ToolModalProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
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
      className="fixed inset-0 z-[1100] flex flex-col"
      style={{
        background: "rgba(0,0,0,0.92)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
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

      <div className="flex-1 relative overflow-hidden">{children}</div>

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
