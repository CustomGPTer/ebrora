// src/components/photo-editor/panels/PanelDrawer.tsx
//
// Shared right-side drawer primitive — backdrop, slide-in transform,
// fixed positioning, max-width, header with title + close button, and
// close-on-Escape behaviour. Identical visual contract to the inline
// shells in LayersPanel and FontPanel (Sessions 3 + 4); extracted in
// Session 5 because the six text-tool panels Batch C lands on this
// primitive plus the two stickers / shapes stubs in Batch A would
// otherwise duplicate ~30 lines of shell code apiece.
//
// Batch 7 — fix for the persistent grey edge running down the right
// side of the editor. The closed-state panel sits at translate-x-full
// (its left edge parked exactly at the viewport's right edge). A
// box-shadow on that panel extends LEFTWARD from its left edge, so
// every applied shadow leaks back into the visible viewport. With
// nine PanelDrawer-based panels stacked off-screen plus LayersPanel
// and FontPanel doing the same trick inline, the leaked shadows
// multiply into the multi-band grey strip Jon was seeing. Fix is one
// line per file: gate the box-shadow on `open`. The shadow appears
// when the panel slides in and disappears when it slides out, which
// matches every other modal in the editor.
//
// LayersPanel and FontPanel are NOT migrated to this primitive in
// Session 5 — they ship as-is from Sessions 3 + 4 to keep the diff
// surface minimal. New panels use this; existing panels stay put.
//
// Usage:
//   <PanelDrawer
//     open={open}
//     onClose={onClose}
//     icon={<Smile className="w-5 h-5" strokeWidth={1.75} />}
//     title="Stickers"
//     ariaLabel="Stickers"
//     footer={<span>{n} stickers</span>}
//   >
//     {body}
//   </PanelDrawer>
//
// All right-side drawers in the editor (LayersPanel, FontPanel, this
// primitive's consumers) share the same z-index ordering — backdrop
// 200, panel 210 — so EditorShell's mutual-exclusion via activePanel
// reads cleanly. Don't change these without auditing the others.

"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface PanelDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Optional leading icon for the header. */
  icon?: ReactNode;
  /** Header title text. */
  title: string;
  /** ARIA label for the dialog (defaults to `title`). */
  ariaLabel?: string;
  /** Optional footer slot — typically the row count or a hint. */
  footer?: ReactNode;
  children: ReactNode;
}

export function PanelDrawer({
  open,
  onClose,
  icon,
  title,
  ariaLabel,
  footer,
  children,
}: PanelDrawerProps) {
  // Close on Escape — same convention as FontPanel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[200] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "var(--pe-overlay)" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-[210] h-full w-[88vw] max-w-[360px] flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "var(--pe-surface)",
          borderLeft: "1px solid var(--pe-border)",
          boxShadow: open ? "var(--pe-shadow-lg)" : "none",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
      >
        {/* Header */}
        <div
          className="flex-none flex items-center justify-between px-4"
          style={{
            height: 52,
            borderBottom: "1px solid var(--pe-border)",
          }}
        >
          <div
            className="flex items-center gap-2"
            style={{ color: "var(--pe-text)" }}
          >
            {icon}
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title.toLowerCase()} panel`}
            className="w-9 h-9 inline-flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--pe-tool-icon)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--pe-surface-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        {children}

        {/* Footer (optional) */}
        {footer ? (
          <div
            className="flex-none px-4 py-3 text-xs"
            style={{
              borderTop: "1px solid var(--pe-border)",
              color: "var(--pe-text-subtle)",
            }}
          >
            {footer}
          </div>
        ) : null}
      </aside>
    </>
  );
}
