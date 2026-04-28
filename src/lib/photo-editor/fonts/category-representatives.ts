// src/lib/photo-editor/fonts/category-representatives.ts
//
// One representative Google Font per category, used by the FontPanel's
// category tabs so each tab label renders in a font that visually
// communicates its category at a glance — Sans tab in a clean sans,
// Serif tab in a serif, Display in a decorative display face, etc.
//
// We deliberately use the FULL regular variant (not the menu subset)
// because the tab labels — "Sans", "Serif", "Display", "Handwriting",
// "Monospace" — share almost no glyphs with any one family's name, so
// the menu subset wouldn't cover them.
//
// Each font loads exactly once per device for the lifetime of the app:
// the FontFace API → document.fonts → browser cache pipeline already
// in place caches the .woff2/.ttf files for a year via Google's
// Cache-Control headers, and the in-memory font-store dedupes within
// the session. Loading 5 representatives adds roughly 100–200KB of
// one-time download cost on first visit and zero on subsequent visits.

import type { FontPanelTab } from "./catalogue";

/** Family-name strings for the representative fonts. These MUST match
 *  the `family` field exactly as it appears in google-fonts.json so
 *  the catalogue lookup resolves them. */
export const CATEGORY_REPRESENTATIVE_FAMILY: Partial<
  Record<FontPanelTab, string>
> = {
  "sans-serif": "Roboto",
  serif: "Playfair Display",
  display: "Lobster",
  handwriting: "Caveat",
  monospace: "Roboto Mono",
};

/** All representatives in load order. Iterated by FontCategoryTabs to
 *  kick off the loads as soon as the catalogue is available. */
export const CATEGORY_REPRESENTATIVE_FAMILIES: ReadonlyArray<string> =
  Object.values(CATEGORY_REPRESENTATIVE_FAMILY).filter(
    (s): s is string => typeof s === "string",
  );

/** CSS generic family fallback for each tab. Used until the Google
 *  Font has loaded, so the tab still hints at its category from the
 *  first paint (Sans renders in the system sans-serif, Handwriting in
 *  the system cursive face if the OS supplies one, etc).
 *
 *  Tabs that don't represent a single category (All / Custom / Glyph)
 *  return the project's default UI font stack — no styling change. */
export const CATEGORY_FALLBACK_FAMILY: Record<FontPanelTab, string> = {
  all: "var(--pe-fallback-font, system-ui, sans-serif)",
  "sans-serif": "sans-serif",
  serif: "serif",
  display: "var(--pe-fallback-font, system-ui, sans-serif)",
  handwriting: "cursive",
  monospace: "monospace",
  custom: "var(--pe-fallback-font, system-ui, sans-serif)",
  glyph: "var(--pe-fallback-font, system-ui, sans-serif)",
};
