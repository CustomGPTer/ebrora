// src/components/photo-editor/toolbar/TabStrip.tsx
//
// Reusable horizontal tab strip — used by the selected-shape and
// (later) selected-text bottom drawers to switch between property
// tabs (Color / Stroke / Position / Opacity for shapes; the longer
// 16-tab strip for text in Batch D).
//
// Visual contract:
//   • Each tab is icon-over-label (24px icon, 12px label).
//   • Active tab: icon + label coloured `var(--pe-accent)`, with a
//     2px green underline drawn from the tab's bottom edge.
//   • Inactive tab: icon `var(--pe-tool-icon)`, label `var(--pe-text)`.
//   • Edited tab: 8px filled `#EF4444` dot at top-right of the icon
//     box. "Edited" semantics are decided by the caller (see Batch B
//     kickoff Q1A: any non-default value).
//   • Horizontal scroll on overflow with hidden scrollbar; soft
//     edge-fade overlay when content extends past either side.
//
// Hit target: each tab is min 56×52px (≥44 in both axes) — comfortable
// for thumb nav even at 360px viewport widths where 11+ tabs would
// otherwise crowd.

"use client";

import { type ReactNode } from "react";

export interface TabStripItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface TabStripProps {
  tabs: TabStripItem[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Tab IDs whose icons should display the red "edited" dot. The
   *  caller computes this — typically by comparing layer state to
   *  per-tab defaults. */
  editedIds?: Set<string>;
  /** Optional className for the outer container so callers can
   *  control vertical padding. */
  className?: string;
}

export function TabStrip({
  tabs,
  activeId,
  onSelect,
  editedIds,
  className,
}: TabStripProps) {
  return (
    <div
      className={`relative flex-none ${className ?? ""}`}
      style={{
        background: "var(--pe-toolbar-bg)",
        borderTop: "1px solid var(--pe-toolbar-border)",
      }}
    >
      <div
        role="tablist"
        className="flex items-stretch gap-1 px-3 py-1 overflow-x-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          const edited = editedIds?.has(tab.id) ?? false;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
              title={tab.label}
              onClick={() => onSelect(tab.id)}
              className="relative flex-none inline-flex flex-col items-center justify-start gap-1 px-2 py-1 transition-colors"
              style={{
                minWidth: 56,
              }}
            >
              <span
                className="relative inline-flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  color: active
                    ? "var(--pe-tool-icon-active)"
                    : "var(--pe-tool-icon)",
                }}
              >
                {tab.icon}
                {edited ? <EditedDot /> : null}
              </span>
              <span
                className="text-[12px] leading-tight whitespace-nowrap"
                style={{
                  color: active
                    ? "var(--pe-tool-icon-active)"
                    : "var(--pe-text)",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {tab.label}
              </span>
              {active ? (
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    bottom: 0,
                    left: "20%",
                    right: "20%",
                    height: 2,
                    borderRadius: 1,
                    background: "var(--pe-accent)",
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Edge fades — subtle hint that the strip scrolls. Pointer-
          events:none so they don't intercept tab taps. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 left-0"
        style={{
          width: 16,
          background:
            "linear-gradient(to right, var(--pe-toolbar-bg), transparent)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 right-0"
        style={{
          width: 16,
          background:
            "linear-gradient(to left, var(--pe-toolbar-bg), transparent)",
        }}
      />
    </div>
  );
}

function EditedDot() {
  return (
    <span
      aria-hidden
      className="absolute"
      style={{
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#EF4444",
        boxShadow: "0 0 0 1.5px var(--pe-toolbar-bg)",
      }}
    />
  );
}
