// src/components/photo-editor/toolbar/PropertyPanelHost.tsx
//
// Body slot rendered above a TabStrip. Renders the active tab's body
// directly, with overflow scroll on tall content so the tab strip
// below stays on-screen.
//
// History:
//   • The ↻ per-tab Reset button was removed (May 2026) in favour of
//     the universal Undo/Redo in EditorTopBar (which is already global
//     across all tabs/sections, with a 100-entry history). The reset
//     button row took ~32 px of vertical space and was redundant —
//     undo rolls back any tab change, including ones made on a
//     different tab earlier in the session.
//
// Mobile-fixes batch 5 (May 2026):
//   The host is `flex-1` and its body is `flex-1 min-h-0` so it
//   FILLS the available space in the height-locked mobile dock
//   (BottomDock outer is `max-lg:h-[192px]`). The TabStrip below the
//   host stays at its natural height; the host takes everything else.
//   This means a Color tab with 100 px of natural content and a
//   Position tab with 200 px of natural content both render at the
//   exact same outer height — eliminating the tab-switch jump. Tall
//   content scrolls within the body via overflow-y-auto. Desktop (lg+)
//   preserves the legacy max-height behaviour (`min(40vh, 320px)`)
//   since it isn't height-locked.

"use client";

import { type ReactNode } from "react";

interface PropertyPanelHostProps {
  /** Body content — pass an inline-mode panel here. */
  children: ReactNode;
  /** Optional max body height (px or any CSS length). Used as a
   *  CAP on desktop only — on mobile the body fills the locked
   *  dock height regardless. Defaults to `min(40vh, 320px)`. */
  maxBodyHeight?: string | number;
}

export function PropertyPanelHost({
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
