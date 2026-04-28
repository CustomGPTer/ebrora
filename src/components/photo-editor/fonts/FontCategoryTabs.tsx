// src/components/photo-editor/fonts/FontCategoryTabs.tsx
//
// Horizontal scrollable tab strip at the top of the FontPanel.
// Tabs: All / Sans / Serif / Display / Handwriting / Monospace / Custom / Glyph.
// Active tab is the one currently selected; tapping any tab fires onChange.
//
// Each tab's label renders in a representative font for its category
// — Sans in Roboto, Serif in Playfair Display, Display in Lobster,
// Handwriting in Caveat, Monospace in Roboto Mono — so a glance at
// the tab strip communicates what kind of fonts live behind each
// tab. Loading: when the catalogue is supplied (the FontPanel passes
// it once its lazy fetch resolves), we look up each representative,
// pick its regular variant, and kick off loadGoogleFont. The in-memory
// font-store fires a re-render via useIsVariantLoaded the moment the
// font becomes paintable, so the tab swaps from its CSS generic
// fallback (sans-serif / serif / cursive / monospace) to the actual
// Google Font without any flicker on subsequent panel opens — the
// browser's HTTP cache holds the .woff2 for a year.

"use client";

import { useEffect } from "react";
import {
  FONT_PANEL_TAB_LABELS,
  FONT_PANEL_TAB_ORDER,
  pickVariant,
  type FontPanelTab,
  type GoogleFontFamily,
} from "@/lib/photo-editor/fonts/catalogue";
import {
  CATEGORY_FALLBACK_FAMILY,
  CATEGORY_REPRESENTATIVE_FAMILY,
} from "@/lib/photo-editor/fonts/category-representatives";
import { loadGoogleFont } from "@/lib/photo-editor/fonts/load-google-font";
import { useIsVariantLoaded } from "@/lib/photo-editor/fonts/font-store";

interface FontCategoryTabsProps {
  active: FontPanelTab;
  onChange: (tab: FontPanelTab) => void;
  /** Catalogue passed down from FontPanel once its lazy fetch
   *  resolves. When undefined, the tabs render in their CSS generic
   *  fallback family (no Google Fonts are loaded yet). */
  catalogue?: GoogleFontFamily[] | null;
}

export function FontCategoryTabs({
  active,
  onChange,
  catalogue,
}: FontCategoryTabsProps) {
  // Kick off representative-font loads as soon as the catalogue is
  // available. Each loadGoogleFont call is idempotent and dedupes
  // in-flight requests, so re-running this effect across re-renders
  // costs nothing extra.
  useEffect(() => {
    if (!catalogue) return;
    for (const familyName of Object.values(CATEGORY_REPRESENTATIVE_FAMILY)) {
      if (!familyName) continue;
      const entry = catalogue.find((f) => f.family === familyName);
      if (!entry) continue;
      const variant = pickVariant(entry, 400, "normal") ?? "regular";
      void loadGoogleFont(entry, variant);
    }
  }, [catalogue]);

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
      {FONT_PANEL_TAB_ORDER.map((tab) => (
        <CategoryTabButton
          key={tab}
          tab={tab}
          isActive={tab === active}
          onClick={() => onChange(tab)}
        />
      ))}
    </div>
  );
}

interface CategoryTabButtonProps {
  tab: FontPanelTab;
  isActive: boolean;
  onClick: () => void;
}

function CategoryTabButton({ tab, isActive, onClick }: CategoryTabButtonProps) {
  // Resolve the font-family this tab's label should render in.
  // Once the representative variant has loaded (per font-store),
  // promote from the CSS generic fallback to the actual family name.
  const representative = CATEGORY_REPRESENTATIVE_FAMILY[tab] ?? null;
  const isRepLoaded = useIsVariantLoaded(representative ?? "", "regular");
  const fallback = CATEGORY_FALLBACK_FAMILY[tab];
  const fontFamily =
    representative && isRepLoaded
      ? `"${representative}", ${fallback}`
      : fallback;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className="flex-none px-3 inline-flex items-center text-[15px] transition-colors"
      style={{
        borderBottom: isActive
          ? "2px solid var(--pe-accent)"
          : "2px solid transparent",
        color: isActive ? "var(--pe-accent)" : "var(--pe-text-muted)",
        // Keep the active state visually distinct via colour rather
        // than weight — bumping weight can swap to a different
        // glyph set in some display/handwriting faces and looks off.
        fontWeight: 500,
        fontFamily,
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
}
