// src/lib/photo-editor/fonts/load-google-font.ts
//
// FontFace API loader for Google Fonts.
//
// Two distinct load paths:
//
//   1. The "menu" subset — a tiny .ttf containing just the family-name
//      glyphs. Loaded for every visible row in the FontPanel so each
//      row can preview the family in its own font without downloading
//      the full face. We register these under an alias family name
//      (`__pe-menu-<family>`) so the canvas painter never accidentally
//      uses the menu subset for actual text rendering.
//
//   2. The full variant — the regular .ttf file for a specific
//      family + variant combo. Loaded when the user actually picks a
//      font and applies it to a layer. Registered under the real
//      family name so document.fonts.check(family) succeeds and the
//      engine's measureText / fillText calls find it.
//
// Both paths dedupe in-flight loads by key. If two callers ask for the
// same family+variant simultaneously, they share a single FontFace.load
// promise.

import type { GoogleFontFamily } from "./catalogue";
import { variantUrl } from "./catalogue";
import { markMenuLoaded, markVariantLoaded } from "./font-store";

/** Prefix applied to the menu-subset family alias so it can never
 *  collide with a real family name. */
export const MENU_FONT_PREFIX = "__pe-menu-";

/** Build the alias family name for a menu-subset font. */
export function menuFamilyName(family: string): string {
  return `${MENU_FONT_PREFIX}${family}`;
}

// ─── In-flight load deduplication ───────────────────────────────

interface LoadEntry {
  promise: Promise<FontFace | null>;
  status: "loading" | "loaded" | "error";
}

const loadRegistry = new Map<string, LoadEntry>();

function variantKey(family: string, variant: string): string {
  return `${family}::${variant}`;
}

function menuKey(family: string): string {
  return `__menu::${family}`;
}

// ─── Menu-subset loading (for the FontPanel preview) ────────────

/** Load and register the menu-subset font for `family`. Idempotent;
 *  repeated calls for the same family return the same promise. After
 *  the returned promise resolves, the menu font is available in
 *  document.fonts under the alias name from menuFamilyName(family). */
export function loadMenuFont(family: GoogleFontFamily): Promise<FontFace | null> {
  if (typeof document === "undefined") return Promise.resolve(null);

  const key = menuKey(family.family);
  const existing = loadRegistry.get(key);
  if (existing) return existing.promise;

  const url = family.menu;
  if (!url) {
    return Promise.resolve(null);
  }

  const aliasName = menuFamilyName(family.family);

  // If somehow the alias is already loaded (e.g. across hot-reloads in
  // dev), just resolve.
  if (isFontFamilyLoaded(aliasName)) {
    const cached: LoadEntry = {
      promise: Promise.resolve(null),
      status: "loaded",
    };
    loadRegistry.set(key, cached);
    return cached.promise;
  }

  const face = new FontFace(aliasName, `url(${url})`, {
    style: "normal",
    weight: "400",
    display: "swap",
  });

  const promise = face
    .load()
    .then((loaded) => {
      try {
        (document as Document & { fonts: FontFaceSet }).fonts.add(loaded);
      } catch {
        // Some browsers may throw if the same FontFace is added twice
        // — non-fatal.
      }
      const entry = loadRegistry.get(key);
      if (entry) entry.status = "loaded";
      markMenuLoaded(family.family);
      return loaded;
    })
    .catch((err) => {
      const entry = loadRegistry.get(key);
      if (entry) entry.status = "error";
      // Clear the failed entry so a subsequent retry can try again.
      loadRegistry.delete(key);
      // Don't re-throw — a missing menu preview is not fatal; the row
      // will fall back to the system font.
      console.warn(`[photo-editor] menu font load failed: ${family.family}`, err);
      return null;
    });

  loadRegistry.set(key, { promise, status: "loading" });
  return promise;
}

// ─── Full-variant loading (for canvas rendering) ────────────────

export interface LoadGoogleFontResult {
  family: string;
  variant: string;
  /** Resolved FontFace, or null if loading failed and we fell back. */
  face: FontFace | null;
}

/** Load and register the given variant of the given family under its
 *  real family name. After the promise resolves the canvas engine can
 *  paint text in this family.
 *
 *  Idempotent per family+variant. Multiple concurrent callers share a
 *  single FontFace.load promise. */
export async function loadGoogleFont(
  family: GoogleFontFamily,
  variant: string,
): Promise<LoadGoogleFontResult> {
  if (typeof document === "undefined") {
    return { family: family.family, variant, face: null };
  }

  const key = variantKey(family.family, variant);
  const existing = loadRegistry.get(key);
  if (existing) {
    const face = await existing.promise;
    return { family: family.family, variant, face };
  }

  const url = variantUrl(family, variant);
  if (!url) {
    return { family: family.family, variant, face: null };
  }

  // Translate variant → CSS descriptors for the FontFace.
  const isItalic = variant.endsWith("italic");
  const weightMatch = variant.match(/^(\d{3})/);
  const weight = weightMatch
    ? weightMatch[1]
    : variant === "italic" || variant === "regular"
    ? "400"
    : "400";

  const face = new FontFace(family.family, `url(${url})`, {
    style: isItalic ? "italic" : "normal",
    weight,
    display: "swap",
  });

  const promise = face
    .load()
    .then((loaded) => {
      try {
        (document as Document & { fonts: FontFaceSet }).fonts.add(loaded);
      } catch {
        // Already added — non-fatal.
      }
      const entry = loadRegistry.get(key);
      if (entry) entry.status = "loaded";
      markVariantLoaded(family.family, variant);
      return loaded;
    })
    .catch((err) => {
      const entry = loadRegistry.get(key);
      if (entry) entry.status = "error";
      loadRegistry.delete(key);
      console.warn(
        `[photo-editor] font load failed: ${family.family} ${variant}`,
        err,
      );
      return null;
    });

  loadRegistry.set(key, { promise, status: "loading" });
  const loaded = await promise;
  return { family: family.family, variant, face: loaded };
}

// ─── Lookup helpers ─────────────────────────────────────────────

/** Whether a given family+variant has been successfully loaded. */
export function isVariantLoaded(family: string, variant: string): boolean {
  const entry = loadRegistry.get(variantKey(family, variant));
  return entry?.status === "loaded";
}

/** Whether a family's menu subset has been loaded. */
export function isMenuLoaded(family: string): boolean {
  const entry = loadRegistry.get(menuKey(family));
  return entry?.status === "loaded";
}

/** Whether document.fonts knows about a family at any size / weight.
 *  Used as a final guard before claiming a family is paintable. */
export function isFontFamilyLoaded(family: string): boolean {
  if (typeof document === "undefined") return false;
  const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
  if (!fonts || typeof fonts.check !== "function") return false;
  // Use a quote-safe family name in the check string. `check` accepts
  // any CSS font shorthand; we use a 16px size as a sentinel.
  const safe = family.includes(" ") ? `"${family}"` : family;
  try {
    return fonts.check(`16px ${safe}`);
  } catch {
    return false;
  }
}
