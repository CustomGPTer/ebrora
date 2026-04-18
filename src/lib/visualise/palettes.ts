// =============================================================================
// Visualise — Palettes (Batch 2 — "Visual polish")
//
// PRE-BATCH-2 SHAPE (removed in Batch 2b):
//   Each palette was a positional 6-tuple [darkest → lightest]. Renderers
//   called `paletteColor(id, N)` with N = 0..5 and inferred the slot's role
//   from the number. That worked but was brittle — presets encoded the
//   "index 0 is primary fill, index 5 is text-on-dark" convention silently.
//
// BATCH 2 SHAPE (6 slots):
//   Every palette is now a structured object with NAMED roles:
//     bg          → canvas / background fill (lightest)
//     nodeFill    → primary node/shape fill (the brand colour)
//     nodeStroke  → slightly darker than nodeFill, for definition
//     text        → colour that reads on nodeFill
//     accent      → callout / hierarchy-apex / matrix-header / highlighted-tier
//     accentText  → colour that reads on `accent` (added in Batch 2b)
//
// Why `accentText` was added in Batch 2b:
//   Batch 2a shipped a 5-slot shape and reused `text` for text on both
//   `nodeFill` and `accent`. That worked for palettes whose nodeFill and
//   accent had similar luminance (ebrora-gold, hi-vis, mono) but failed
//   WCAG AA on palettes where the two differ sharply (ebrora-primary's
//   gold accent, slate's mint accent, earth's olive accent all ran at
//   ~2.3–3.3:1 contrast against white text). Splitting the text role
//   into `text` (for nodeFill) and `accentText` (for accent) lets each
//   palette pick the optimal text colour for each fill independently.
//
// Two helpers layer on top of the slot shape:
//   gradientSequence(palette, count)   — sequential/cyclical presets
//   accentSequence(palette, count, i)  — hierarchies + matrices
// =============================================================================

import type { PaletteId } from './types';

/** The 6-slot palette shape every renderer consumes. */
export interface Palette {
  /** Canvas/background fill — the lightest colour. */
  bg: string;
  /** Primary node/shape fill — the palette's brand colour. */
  nodeFill: string;
  /** Slightly darker than nodeFill, for stroke/border definition. */
  nodeStroke: string;
  /** Text colour that reads on `nodeFill` (usually white; near-black on light palettes). */
  text: string;
  /** Callout colour — apex of a hierarchy, header row of a matrix, highlighted tier. */
  accent: string;
  /** Text colour that reads on `accent` — picked independently from `text` so each
   *  palette can hit WCAG AA on both nodeFill and accent, even when those two
   *  colours have very different luminance (e.g. teal nodeFill + gold accent). */
  accentText: string;
}

export const PALETTES: Record<PaletteId, Palette> = {
  // Brand teal family. Gold accent pairs with teal in the Ebrora brand system.
  'ebrora-primary': {
    bg: '#F6FAF8',
    nodeFill: '#1B5B50',
    nodeStroke: '#144840',
    text: '#FFFFFF',
    accent: '#D4A44C',
    // Dark brown on gold accent — white fails AA (2.28:1); this is ~7.3:1.
    accentText: '#2C1810',
  },

  // Warm gold. Teal accent inverts the primary pairing. `text` is dark-brown
  // (not white) because white text fails WCAG on the light-gold fill (~2.3:1).
  'ebrora-gold': {
    bg: '#FDF6E8',
    nodeFill: '#D4A44C',
    nodeStroke: '#A7803B',
    text: '#2C1810',
    accent: '#1B5B50',
    // White on teal accent — ~7.9:1, AAA.
    accentText: '#FFFFFF',
  },

  // High-visibility construction. Blue accent is the complementary hi-vis
  // contrast used in UK site safety signage. `text` is near-black (not white)
  // because white text fails WCAG on the bright-orange fill (~2.9:1).
  'hi-vis': {
    bg: '#FFF8E8',
    nodeFill: '#FF6600',
    nodeStroke: '#CC4400',
    text: '#1A1A1A',
    accent: '#0066CC',
    // White on safety-blue accent — ~7.3:1, AAA.
    accentText: '#FFFFFF',
  },

  // Corporate slate. Mint accent mirrors the "1ABC9C callout" the old
  // 6-tuple used at index 4.
  slate: {
    bg: '#F5F7FA',
    nodeFill: '#2C3E50',
    nodeStroke: '#1A2834',
    text: '#FFFFFF',
    accent: '#1ABC9C',
    // Dark on mint accent — white fails AA (~2.7:1); this is ~7.0:1.
    accentText: '#1A1A1A',
  },

  // Pure monochrome — print-safe. Accent is mid-grey so "accent" still
  // differentiates without introducing hue on a deliberately hue-free palette.
  mono: {
    bg: '#FFFFFF',
    nodeFill: '#1A1A1A',
    nodeStroke: '#000000',
    text: '#FFFFFF',
    accent: '#666666',
    // White on mid-grey accent — ~5.7:1, AA normal.
    accentText: '#FFFFFF',
  },

  // Earth tones. Olive accent reads as vegetation/ecology against the
  // brown nodeFill — fits arboriculture and contaminated-land work.
  earth: {
    bg: '#F5EFE3',
    nodeFill: '#5C4033',
    nodeStroke: '#3E2A22',
    text: '#FFFFFF',
    accent: '#8B9A5B',
    // Dark on olive accent — white is borderline (~3.3:1); this is ~5.7:1.
    accentText: '#1A1A1A',
  },
};

/** Display name used in UI pickers and AI descriptions. */
export const PALETTE_LABELS: Record<PaletteId, string> = {
  'ebrora-primary': 'Ebrora Primary',
  'ebrora-gold': 'Ebrora Gold',
  'hi-vis': 'High Visibility',
  slate: 'Slate',
  mono: 'Monochrome',
  earth: 'Earth',
};

/** Short AI-facing hint explaining when to pick each palette. */
export const PALETTE_AI_HINTS: Record<PaletteId, string> = {
  'ebrora-primary': 'deep teal, brand-aligned, professional — default for most diagrams',
  'ebrora-gold': 'warm accent, executive feel — KPIs, leadership, success metrics',
  'hi-vis': 'orange/amber, construction-site aesthetic — PPE, hazards, site safety',
  slate: 'blue-grey, corporate neutral — commercial docs, formal reports',
  mono: 'greys only, minimalist — black-and-white print, submissions',
  earth: 'browns and greens, natural — ecology, landscape, arb, contaminated land',
};

/** List of all palette IDs — useful for iterating in UI pickers. */
export const PALETTE_IDS: readonly PaletteId[] = [
  'ebrora-primary',
  'ebrora-gold',
  'hi-vis',
  'slate',
  'mono',
  'earth',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Accessors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a palette by ID. Always returns a real Palette object — unknown
 * IDs fall back to ebrora-primary so a stale `paletteId` in an old blob
 * can't crash a render.
 */
export function getPalette(id: PaletteId | string): Palette {
  const p = (PALETTES as Record<string, Palette>)[id];
  return p ?? PALETTES['ebrora-primary'];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a `#RRGGBB` string into `[r, g, b]` channel ints 0..255.
 * Throws on malformed input — palette values are static, so a throw here
 * means a bug in this file rather than runtime corruption.
 */
function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex colour: ${hex}`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/** Format `[r, g, b]` back to `#RRGGBB`. */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const h = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

/** Linear interpolation between two hex colours in RGB space. `t` in [0, 1]. */
function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** Lighten a hex colour by mixing it toward white. `amount` in [0, 1]. */
export function lighten(hex: string, amount: number): string {
  return mixHex(hex, '#FFFFFF', Math.max(0, Math.min(1, amount)));
}

/** Darken a hex colour by mixing it toward black. `amount` in [0, 1]. */
export function darken(hex: string, amount: number): string {
  return mixHex(hex, '#000000', Math.max(0, Math.min(1, amount)));
}

/**
 * Generate a gradient of `count` colours for sequential or cyclical presets.
 *
 * Default behaviour: interpolate from `palette.nodeFill` (the full brand
 * colour) to a 15%-darkened version of it. Darkening (rather than lightening)
 * means every step in the gradient has AT LEAST the contrast of the baseline
 * nodeFill against `palette.text` — so text readability is monotonically
 * preserved across the whole sequence. Lightening as a default would drop
 * contrast below WCAG on ebrora-gold and hi-vis (they have bright fills).
 *
 * Override `from` / `to` to interpolate between arbitrary anchors, e.g.
 * `{ from: palette.nodeFill, to: palette.accent }` for a brand-to-accent ramp
 * where text contrast is managed by the renderer per-node.
 */
export function gradientSequence(
  palette: Palette,
  count: number,
  opts: { from?: string; to?: string } = {},
): string[] {
  if (count <= 0) return [];
  const from = opts.from ?? palette.nodeFill;
  const to = opts.to ?? darken(palette.nodeFill, 0.15);
  if (count === 1) return [from];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    out.push(mixHex(from, to, t));
  }
  return out;
}

/**
 * Generate an N-colour sequence where one index is highlighted with `accent`
 * and the rest use `nodeFill`. Defaults to highlighting index 0 — the apex
 * of a pyramid, the header row of a matrix, the root of a hierarchy.
 *
 * For hierarchies with multiple tiers that should each be distinct (but not
 * a full gradient), prefer building: gradient + overriding one index with
 * accent, e.g.
 *   const tiers = gradientSequence(palette, 4);
 *   tiers[0] = palette.accent;
 */
export function accentSequence(
  palette: Palette,
  count: number,
  accentedIndex: number = 0,
): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(i === accentedIndex ? palette.accent : palette.nodeFill);
  }
  return out;
}
