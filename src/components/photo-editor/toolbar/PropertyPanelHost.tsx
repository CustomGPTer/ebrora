// src/components/photo-editor/toolbar/PropertyPanelHost.tsx
//
// Body slot rendered above a TabStrip. Provides:
//
//   • Reset (↻) button at top-left, scoped to the active tab only —
//     the caller's `onReset` fires whatever per-tab reset semantics
//     make sense (e.g. zero out stroke width, set opacity=1).
//     Per Batch C kickoff Q2: scope is just the active tab, never
//     the whole layer.
//   • Children render inline beneath the reset button as the active
//     tab's body — caller passes the inline-mode panel directly.
//   • Scroll on overflow so the body never pushes the tab strip
//     off-screen on tall property bodies (e.g. Position with its
//     four sub-sections).
//
// The host is intentionally minimal — no header chrome, no title.
// The active tab's identity is already conveyed by the tab strip's
// active state below, and the reference omits a separate title bar.

"use client";

import { type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

interface PropertyPanelHostProps {
  /** Per-tab reset handler. When omitted, the reset button is
   *  hidden — useful for tabs where "reset" has no sensible
   *  meaning (e.g. Color, since every shape has a fill colour
   *  by definition). */
  onReset?: () => void;
  /** Body content — pass an inline-mode panel here. */
  children: ReactNode;
  /** Optional max body height (px or any CSS length). Defaults to
   *  `min(40vh, 320px)` so the body scrolls before squeezing the
   *  canvas above it on landscape/short viewports. */
  maxBodyHeight?: string | number;
}

export function PropertyPanelHost({
  onReset,
  children,
  maxBodyHeight = "min(40vh, 320px)",
}: PropertyPanelHostProps) {
  return (
    <div
      className="flex-none flex flex-col"
      style={{
        background: "var(--pe-toolbar-bg)",
        borderTop: "1px solid var(--pe-toolbar-border)",
      }}
    >
      {onReset ? (
        <div
          className="flex items-center justify-between px-3 pt-2 pb-1"
          style={{ minHeight: 32 }}
        >
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset this tab to defaults"
            title="Reset"
            className="inline-flex items-center justify-center rounded-full transition-colors"
            style={{
              width: 28,
              height: 28,
              color: "var(--pe-text-muted)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--pe-surface-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      ) : null}

      <div
        className="overflow-y-auto"
        style={{
          maxHeight:
            typeof maxBodyHeight === "number"
              ? `${maxBodyHeight}px`
              : maxBodyHeight,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>
    </div>
  );
}
