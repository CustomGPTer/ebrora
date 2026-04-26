// src/components/photo-editor/fonts/FontCategoryTabs.tsx
//
// Horizontal scrollable tab strip at the top of the FontPanel.
// Tabs: All / Sans / Serif / Display / Handwriting / Monospace / Custom / Glyph.
// Active tab is the one currently selected; tapping any tab fires onChange.

"use client";

import {
  FONT_PANEL_TAB_LABELS,
  FONT_PANEL_TAB_ORDER,
  type FontPanelTab,
} from "@/lib/photo-editor/fonts/catalogue";

interface FontCategoryTabsProps {
  active: FontPanelTab;
  onChange: (tab: FontPanelTab) => void;
}

export function FontCategoryTabs({ active, onChange }: FontCategoryTabsProps) {
  return (
    <div
      className="flex-none flex items-stretch overflow-x-auto"
      style={{
        height: 44,
        borderBottom: "1px solid var(--pe-border)",
        background: "var(--pe-surface)",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      role="tablist"
      aria-label="Font categories"
    >
      {FONT_PANEL_TAB_ORDER.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className="flex-none px-3 inline-flex items-center text-[13px] transition-colors"
            style={{
              borderBottom: isActive
                ? "2px solid var(--pe-accent)"
                : "2px solid transparent",
              color: isActive ? "var(--pe-accent)" : "var(--pe-text-muted)",
              fontWeight: isActive ? 600 : 500,
              background: "transparent",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (isActive) return;
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--pe-text)";
            }}
            onMouseLeave={(e) => {
              if (isActive) return;
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--pe-text-muted)";
            }}
          >
            {FONT_PANEL_TAB_LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}
