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

  // ─── Batch 1a — Secondary palettes ────────────────────────────────────────
  // These eight are surfaced via the "More colours" expand in the sidebar
  // chooser. Each is domain-tuned (utilities / civils / traffic / ecology /
  // heritage / residential / sustainability / rail) rather than brand-tuned.
  //
  // WCAG targets honoured on both nodeFill/text and accent/accentText:
  // AA normal (≥4.5:1) on every pairing, verified against the sRGB relative
  // luminance formula (L = 0.2126·R + 0.7152·G + 0.0722·B, linearised).
  // ─────────────────────────────────────────────────────────────────────────

  // Deep navy utilities blue with a utility-teal accent. Fits water/wastewater,
  // marine works, coastal infrastructure. Close neighbour to United Utilities'
  // working palette; intentionally not identical — this is a lookalike, not
  // the UU brand.
  marine: {
    bg: '#EEF4F7',
    nodeFill: '#0B3954',
    nodeStroke: '#082438',
    text: '#FFFFFF', // navy on white ~ 13.1:1, AAA.
    accent: '#3EC1D3',
    // White on bright teal fails (~2.5:1); near-black reads ~8.8:1.
    accentText: '#0C1F26',
  },

  // Cool charcoal/stone with a gold-ochre accent — suits civils, concrete,
  // structures, foundations. The accent echoes rebar/hi-vis without being
  // site-safety loud.
  stone: {
    bg: '#F2F3F5',
    nodeFill: '#4A5568',
    nodeStroke: '#2D3748',
    text: '#FFFFFF', // ~7.5:1, AAA.
    accent: '#E2B04A',
    // White on warm gold fails (~2.4:1); near-black reads ~8.2:1.
    accentText: '#1A1A1A',
  },

  // Traffic red + MUTCD black — highway works, traffic management, TMPs,
  // road-space booking. Distinct from hi-vis (which is orange-led) — highway
  // leads with red and pairs with flat black rather than blue.
  highway: {
    bg: '#FAFAFA',
    nodeFill: '#C1272D',
    nodeStroke: '#8B1B1F',
    text: '#FFFFFF', // ~5.9:1, AA.
    accent: '#1A1A1A',
    // White on near-black ~ 20:1, AAA.
    accentText: '#FFFFFF',
  },

  // Forest green + moss accent. Ecology, arboriculture, planning/landscape,
  // SuDS, habitat reports. Reads as "vegetation" rather than "corporate".
  verdant: {
    bg: '#F1F5EB',
    nodeFill: '#3F5F2C',
    nodeStroke: '#2B4320',
    text: '#FFFFFF', // ~7.4:1, AAA.
    accent: '#96B56E',
    // White on light moss fails (~3.1:1); dark olive reads ~7.1:1.
    accentText: '#1F2A14',
  },

  // Terracotta brick + warm cream accent. Residential, brickwork, small
  // build schemes, private-client reports where "industrial" looks wrong.
  brick: {
    bg: '#FAF3EA',
    nodeFill: '#8B3A2E',
    nodeStroke: '#5E251C',
    text: '#FFFFFF', // ~6.8:1, AA.
    accent: '#D9B382',
    // White on sand cream fails (~2.7:1); dark brown reads ~7.1:1.
    accentText: '#3A2117',
  },

  // Deep burgundy + antique gold — listed buildings, conservation areas,
  // heritage impact assessments. More formal than brick; pairs with the
  // serif headings often used in heritage reports.
  heritage: {
    bg: '#FAF5EF',
    nodeFill: '#5C1F29',
    nodeStroke: '#3E111A',
    text: '#FFFFFF', // ~10.2:1, AAA.
    accent: '#C9A86A',
    // White on antique gold fails (~2.6:1); near-black reads ~8.5:1.
    accentText: '#2B1A0B',
  },

  // Nordic blue + pale sky accent — climate resilience, flood risk, net
  // zero / sustainability reports, environmental permitting. Cool and
  // low-saturation by design; "clinical" without being sterile.
  nordic: {
    bg: '#F5F9FC',
    nodeFill: '#1E4F6B',
    nodeStroke: '#0F3349',
    text: '#FFFFFF', // ~8.1:1, AAA.
    accent: '#76B6C4',
    // White on pale sky fails (~2.4:1); near-black reads ~8.2:1.
    accentText: '#0C1D26',
  },

  // Network-Rail-inspired deep blue + hi-vis orange. Rail schemes, station
  // works, possession planning, NR framework submissions. Lookalike (not
  // identical) to NR brand blue to stay clear of trade-mark friction.
  rail: {
    bg: '#FAF0E6',
    nodeFill: '#003473',
    nodeStroke: '#001C42',
    text: '#FFFFFF', // ~11.4:1, AAA.
    accent: '#F77F00',
    // White on hi-vis orange fails (~2.5:1); near-black reads ~8.1:1.
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
  // Batch 1a — secondary palettes.
  marine: 'Marine',
  stone: 'Stone',
  highway: 'Highway',
  verdant: 'Verdant',
  brick: 'Brick',
  heritage: 'Heritage',
  nordic: 'Nordic',
  rail: 'Rail',
};

/** Short AI-facing hint explaining when to pick each palette. */
export const PALETTE_AI_HINTS: Record<PaletteId, string> = {
  'ebrora-primary': 'deep teal, brand-aligned, professional — default for most diagrams',
  'ebrora-gold': 'warm accent, executive feel — KPIs, leadership, success metrics',
  'hi-vis': 'orange/amber, construction-site aesthetic — PPE, hazards, site safety',
  slate: 'blue-grey, corporate neutral — commercial docs, formal reports',
  mono: 'greys only, minimalist — black-and-white print, submissions',
  earth: 'browns and greens, natural — ecology, landscape, arb, contaminated land',
  // Batch 1a — secondary palettes. Tuned for specific construction sub-domains;
  // the AI should prefer these when the source text is clearly about the named
  // domain and fall back to ebrora-primary if the topic is generic.
  marine: 'navy + utility teal — water/wastewater, coastal, marine, flood works',
  stone: 'cool charcoal + gold-ochre — civils, concrete, foundations, structures',
  highway: 'traffic red + black — highway works, traffic management, TMPs',
  verdant: 'forest green + moss — ecology, arboriculture, planning, landscape, SuDS',
  brick: 'terracotta + cream — residential, small build, brickwork, private client',
  heritage: 'burgundy + antique gold — listed buildings, conservation, heritage impact',
  nordic: 'nordic blue + pale sky — climate, flood risk, net zero, sustainability',
  rail: 'deep blue + hi-vis orange — rail schemes, station works, possessions, NR',
};

/**
 * Primary palette IDs — the original 6, always visible in the palette chooser.
 * These are brand-neutral / executive-neutral and work for any document.
 */
export const PALETTE_IDS_PRIMARY: readonly PaletteId[] = [
  'ebrora-primary',
  'ebrora-gold',
  'hi-vis',
  'slate',
  'mono',
  'earth',
] as const;

/**
 * Secondary palette IDs — added in Batch 1a. Surfaced in the sidebar behind a
 * "More colours" expand to keep the default chooser compact. Each is tuned for
 * a specific construction sub-domain (see PALETTE_AI_HINTS for the matchups).
 */
export const PALETTE_IDS_SECONDARY: readonly PaletteId[] = [
  'marine',
  'stone',
  'highway',
  'verdant',
  'brick',
  'heritage',
  'nordic',
  'rail',
] as const;

/**
 * Flat list of ALL palette IDs (primary first, then secondary).
 *
 * Consumers that don't care about the primary/secondary split should keep
 * using this — e.g. the AI system prompt (where the model needs to see every
 * option) and the response validator (enum over every legal ID). The UI
 * palette chooser is the one place that *does* care about the split, and it
 * imports PALETTE_IDS_PRIMARY and PALETTE_IDS_SECONDARY directly.
 */
export const PALETTE_IDS: readonly PaletteId[] = [
  ...PALETTE_IDS_PRIMARY,
  ...PALETTE_IDS_SECONDARY,
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
