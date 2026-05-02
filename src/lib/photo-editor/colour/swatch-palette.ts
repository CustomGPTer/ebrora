// src/lib/photo-editor/colour/swatch-palette.ts
//
// 200-swatch standard palette, generated once and frozen at module
// load. Layout: black + white + 8 greys + (24 hues × 8 shades). Hues
// march around the wheel starting at red (0°) so the strip reads as
// a smooth rainbow when scrolled left-to-right.
//
// Each hue's 8 shades go from pale (high lightness, low saturation)
// to deep (low lightness, full saturation), so within a hue you scan
// the row vertically — but we present everything as one long flat
// row, so the user sees the lightest shade of each hue first as they
// scroll, then comes back round through the deeper tones.
//
// Storage format: hex strings (#RRGGBB, uppercase) for direct use
// with the existing Stroke / fill / shadow ColorString fields.
//
// May 2026 — new colour system build.

export interface SwatchEntry {
  hex: string;
  /** Hue in degrees [0, 360). Used for sorting favourites / placing
   *  the current-colour ring. Black / white / grey carry hue 0 with
   *  saturation 0 — distinguishable via the `kind` field. */
  hue: number;
  /** "neutral" for black / white / grey, "colour" for everything
   *  else. Lets favourites sort neutrals to one end. */
  kind: "neutral" | "colour";
}

// ─── HSL → hex ──────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): string {
  // Standard HSL → RGB conversion. h in [0, 360), s/l in [0, 1].
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (
    "#" +
    ri.toString(16).padStart(2, "0") +
    gi.toString(16).padStart(2, "0") +
    bi.toString(16).padStart(2, "0")
  ).toUpperCase();
}

// ─── Build the 200-swatch palette ──────────────────────────────

function buildPalette(): SwatchEntry[] {
  const out: SwatchEntry[] = [];

  // Pure white + pure black at the very start.
  out.push({ hex: "#FFFFFF", hue: 0, kind: "neutral" });
  out.push({ hex: "#000000", hue: 0, kind: "neutral" });

  // 8 greys ramping from light (#EEEEEE) to dark (#222222).
  for (let i = 0; i < 8; i++) {
    const v = Math.round(238 - (238 - 34) * (i / 7));
    const hex = "#" + [v, v, v].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();
    out.push({ hex, hue: 0, kind: "neutral" });
  }

  // 24 hues × 8 shades. 24 hues = every 15° around the wheel; the
  // 8 shades per hue ramp from very light (low s, high l) to deeply
  // saturated (full s, mid-low l), giving 192 colours.
  //
  // Shade ramp (s, l) — chosen by eye to give a usable spread that
  // includes pastels, mid-tones, and deep shades for every hue:
  const shades: { s: number; l: number }[] = [
    { s: 0.45, l: 0.92 }, // pale
    { s: 0.55, l: 0.82 }, // light
    { s: 0.7, l: 0.7 }, // mid-light
    { s: 0.8, l: 0.58 }, // mid
    { s: 0.85, l: 0.48 }, // mid-deep
    { s: 0.9, l: 0.4 }, // deep
    { s: 0.95, l: 0.32 }, // very deep
    { s: 1.0, l: 0.22 }, // darkest
  ];

  for (let h = 0; h < 360; h += 15) {
    for (const { s, l } of shades) {
      out.push({ hex: hslToHex(h, s, l), hue: h, kind: "colour" });
    }
  }

  return out;
}

const PALETTE = buildPalette();

/** The 200-swatch standard palette, in hue / shade order. */
export const STANDARD_PALETTE: readonly SwatchEntry[] = PALETTE;

/** Map from hex (uppercase) → palette index. Used to detect when
 *  the current colour matches a swatch so we can ring it. */
const PALETTE_INDEX = new Map<string, number>(
  PALETTE.map((s, i) => [s.hex, i] as const),
);

export function paletteIndexOf(hex: string): number | null {
  const norm = hex.trim().toUpperCase();
  const idx = PALETTE_INDEX.get(norm);
  return idx === undefined ? null : idx;
}

/** Compute hue (0..360) for an arbitrary hex string. Used to insert
 *  favourites in hue order. Neutrals (saturation < 0.05) report
 *  hue 0; sort them before colours via a separate predicate. */
export function hueOfHex(hex: string): { hue: number; saturation: number } {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return { hue: 0, saturation: 0 };
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  // Saturation in HSL = d / (1 - |2L - 1|).
  const l = (max + min) / 2;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { hue: h, saturation: sat };
}
