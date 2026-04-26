// src/lib/photo-editor/fonts/catalogue.ts
//
// Google Fonts catalogue intake. The manifest itself ships at
// /photo-editor/fonts/google-fonts.json (extracted verbatim from the Add
// Text APK's assets/a.json). It's ~1.28 MB so we explicitly do NOT bundle
// it as a TS module — the FontPanel fetches it lazily on first open and
// caches the result for the lifetime of the page.
//
// The manifest is the unmodified Google Fonts API v1 webfontList payload:
// every family has a `category`, a `variants` array (e.g. "regular",
// "italic", "700", "700italic"), a `files` map (variant → .ttf URL on
// fonts.gstatic.com), and a `menu` URL — a subsetted .ttf containing just
// enough glyphs to render the family name in its own font. The picker
// uses `menu` URLs for the per-row preview to avoid downloading the full
// face for 1,806 families on scroll.
//
// Categories: sans-serif, serif, display, handwriting, monospace.
// "Custom" is a local-only seventh category fed by IndexedDB-uploaded
// fonts; it does NOT exist in the manifest.

import type { Tier } from "../types";

/** One family entry from the Google Fonts API manifest. */
export interface GoogleFontFamily {
  family: string;
  category: GoogleFontCategory;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  /** A small subset .ttf containing just the family-name glyphs.
   *  Used for the FontRow's preview text — much cheaper than loading
   *  the full face for every row that scrolls into view. */
  menu: string;
}

/** Category strings as they appear verbatim in the manifest. */
export type GoogleFontCategory =
  | "sans-serif"
  | "serif"
  | "display"
  | "handwriting"
  | "monospace";

/** Top-level shape of /photo-editor/fonts/google-fonts.json. */
export interface FontCatalogue {
  kind: "webfonts#webfontList";
  items: GoogleFontFamily[];
}

/** Tab identifiers shown in the FontPanel. "all" + the five real
 *  categories + "custom" (IndexedDB) + "glyph" (special-character grid). */
export type FontPanelTab =
  | "all"
  | "sans-serif"
  | "serif"
  | "display"
  | "handwriting"
  | "monospace"
  | "custom"
  | "glyph";

export const FONT_PANEL_TAB_ORDER: readonly FontPanelTab[] = [
  "all",
  "sans-serif",
  "serif",
  "display",
  "handwriting",
  "monospace",
  "custom",
  "glyph",
];

/** Human-readable labels for the tabs. */
export const FONT_PANEL_TAB_LABELS: Record<FontPanelTab, string> = {
  all: "All",
  "sans-serif": "Sans",
  serif: "Serif",
  display: "Display",
  handwriting: "Handwriting",
  monospace: "Monospace",
  custom: "Custom",
  glyph: "Glyph",
};

/** URL of the static manifest. Same-origin fetch; covered by the project's
 *  default-src 'self' CSP. */
export const FONT_CATALOGUE_URL = "/photo-editor/fonts/google-fonts.json";

// ─── Catalogue load (memoised across the page lifetime) ─────────

let catalogueCache: FontCatalogue | null = null;
let cataloguePromise: Promise<FontCatalogue> | null = null;

/** Fetch and parse the Google Fonts manifest. Memoised — subsequent
 *  callers within the same page lifetime share the same Promise. */
export function loadCatalogue(): Promise<FontCatalogue> {
  if (catalogueCache) return Promise.resolve(catalogueCache);
  if (cataloguePromise) return cataloguePromise;
  cataloguePromise = fetch(FONT_CATALOGUE_URL, { cache: "force-cache" })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(
          `Failed to load font catalogue (${res.status} ${res.statusText})`,
        );
      }
      const data = (await res.json()) as FontCatalogue;
      // Light shape validation — enough to fail fast if the manifest
      // gets corrupted, not a full schema check.
      if (!data || !Array.isArray(data.items)) {
        throw new Error("Font catalogue: malformed payload");
      }
      catalogueCache = data;
      return data;
    })
    .catch((err) => {
      // Reset the promise so the next call retries instead of
      // resolving with the cached failure.
      cataloguePromise = null;
      throw err;
    });
  return cataloguePromise;
}

/** Synchronous accessor for code paths that already know the catalogue
 *  has been loaded (e.g. inside a component that called loadCatalogue
 *  upstream and is rendering after it resolved). Returns null otherwise. */
export function getCachedCatalogue(): FontCatalogue | null {
  return catalogueCache;
}

// ─── Filtering helpers ──────────────────────────────────────────

/** Return families filtered by tab. "all" returns everything. "custom"
 *  and "glyph" don't filter the Google catalogue and should be handled
 *  by the caller (they show different content). */
export function filterByTab(
  items: GoogleFontFamily[],
  tab: FontPanelTab,
): GoogleFontFamily[] {
  if (tab === "all") return items;
  if (tab === "custom" || tab === "glyph") return [];
  return items.filter((f) => f.category === tab);
}

/** Case-insensitive family-name substring match. Used by the panel's
 *  optional search box. */
export function filterByQuery(
  items: GoogleFontFamily[],
  query: string,
): GoogleFontFamily[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((f) => f.family.toLowerCase().includes(q));
}

// ─── Variant helpers ────────────────────────────────────────────

/** Pick the variant key to load when applying this family to a layer
 *  with the given current weight + style. Returns null if no usable
 *  variant exists in the family — should be vanishingly rare. */
export function pickVariant(
  family: GoogleFontFamily,
  weight: number,
  style: "normal" | "italic",
): string | null {
  const variants = family.variants;
  if (variants.length === 0) return null;

  // Build the candidate variant key from weight + style.
  // Google Fonts uses "regular" and "italic" for 400, and "<weight>" /
  // "<weight>italic" for the rest. We accept any of those spellings.
  const isRegular = weight === 400;
  const candidates: string[] = [];

  if (style === "italic") {
    if (isRegular) candidates.push("italic");
    candidates.push(`${weight}italic`);
  } else {
    if (isRegular) candidates.push("regular");
    candidates.push(`${weight}`);
  }

  for (const c of candidates) {
    if (variants.includes(c)) return c;
  }

  // Fall back to the family's default variant. Prefer regular > 400 >
  // first-listed, in that order.
  if (variants.includes("regular")) return "regular";
  if (variants.includes("400")) return "400";
  return variants[0] ?? null;
}

/** Resolve the gstatic URL for a family + variant. Returns null if the
 *  variant isn't present. */
export function variantUrl(
  family: GoogleFontFamily,
  variant: string,
): string | null {
  return family.files[variant] ?? null;
}

/** Numeric font-weight inferred from a variant key. "regular" → 400,
 *  "italic" → 400, "<n>" / "<n>italic" → n. */
export function weightForVariant(variant: string): number {
  if (variant === "regular" || variant === "italic") return 400;
  const m = variant.match(/^(\d{3})/);
  return m ? parseInt(m[1], 10) : 400;
}

/** Style for a variant key. Anything ending "italic" is italic. */
export function styleForVariant(variant: string): "normal" | "italic" {
  return variant.endsWith("italic") ? "italic" : "normal";
}

// ─── Tier-aware policy helpers ──────────────────────────────────

/** Whether the given tier can upload custom fonts. Free users see the
 *  full Google catalogue but the Custom tab shows an Upgrade CTA. */
export function canUploadCustomFonts(tier: Tier): boolean {
  return tier !== "FREE";
}
