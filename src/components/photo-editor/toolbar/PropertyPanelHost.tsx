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
//
// Mobile-fixes batch 5 (May 2026):
//   The host is now `flex-1` and its body is `flex-1 min-h-0` so it
//   FILLS the available space in the height-locked mobile dock
//   (BottomDock outer is `max-lg:h-[192px]`). The TabStrip below the
//   host stays at its natural height; the host takes everything else.
//   This means a Color tab with 100 px of natural content and a
//   Position tab with 200 px of natural content both render at the
//   exact same outer height (locked - tabstrip) — eliminating the
//   tab-switch jump. Tall content scrolls within the body via
//   overflow-y-auto. Desktop (lg+) preserves the legacy max-height
//   behaviour (`min(40vh, 320px)`) since it isn't height-locked.

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
  /** Optional max body height (px or any CSS length). Used as a
   *  CAP on desktop only — on mobile the body fills the locked
   *  dock height regardless. Defaults to `min(40vh, 320px)`. */
  maxBodyHeight?: string | number;
}

export function PropertyPanelHost({
  onReset,
  children,
  maxBodyHeight = "min(40vh, 320px)",
}: PropertyPanelHostProps) {
  return (
    <div
      className="flex-1 min-h-0 flex flex-col"
      style={{
        background: "var(--pe-toolbar-bg)",
        borderTop: "1px solid var(--pe-toolbar-border)",
      }}
    >
      {onReset ? (
        <div
          className="flex-none flex items-center justify-between px-3 pt-2 pb-1"
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
        className="flex-1 min-h-0 overflow-y-auto lg:flex-none"
        style={{
          // Desktop only — caps the body so it doesn't push the tab
          // strip off-screen on landscape phones with no height lock.
          // On mobile the flex-1 above already constrains the body to
          // the locked dock's available space, so this cap is moot.
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
