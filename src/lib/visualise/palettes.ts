// =============================================================================
// Visualise — Palettes
// 6 built-in palettes, each a tuple of 6 hex colours ordered from primary to
// background. Presets index into these tuples by node role.
//
// Palette IDs are also surfaced to the AI in the system prompt so it can pick
// a content-appropriate palette (e.g. earth for ecology work, hi-vis for site-
// safety diagrams).
// =============================================================================

import type { PaletteId } from './types';

export const PALETTES: Record<PaletteId, readonly [string, string, string, string, string, string]> = {
  // Brand teal family — the default for most diagrams.
  'ebrora-primary': ['#1B5B50', '#2A7A6C', '#4A9A8A', '#7EBFB2', '#B5DAD2', '#E6F0EE'],

  // Warm gold accent family — executive / KPI contexts.
  'ebrora-gold':    ['#D4A44C', '#E0B86B', '#EBCB8B', '#F4DEB0', '#FAEACA', '#FDF6E8'],

  // High-visibility construction palette — site safety, PPE, hazards.
  'hi-vis':         ['#FF6600', '#FFAA00', '#FFCC00', '#00AA44', '#0066CC', '#CC0033'],

  // Corporate neutral — formal reports, commercial docs.
  'slate':          ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#1ABC9C', '#3498DB'],

  // Minimalist greyscale — monochrome printouts, black-and-white submissions.
  'mono':           ['#1A1A1A', '#333333', '#4D4D4D', '#808080', '#B3B3B3', '#E5E5E5'],

  // Earth tones — ecology, arboriculture, landscape, contaminated-land work.
  'earth':          ['#5C4033', '#8B6F47', '#A89078', '#C4AE99', '#DCC9B6', '#EEE0CD'],
} as const;

/** Display name used in UI pickers and AI descriptions. */
export const PALETTE_LABELS: Record<PaletteId, string> = {
  'ebrora-primary': 'Ebrora Primary',
  'ebrora-gold':    'Ebrora Gold',
  'hi-vis':         'High Visibility',
  'slate':          'Slate',
  'mono':           'Monochrome',
  'earth':          'Earth',
};

/** Short AI-facing hint explaining when to pick each palette. */
export const PALETTE_AI_HINTS: Record<PaletteId, string> = {
  'ebrora-primary': 'deep teal, brand-aligned, professional — default for most diagrams',
  'ebrora-gold':    'warm accent, executive feel — KPIs, leadership, success metrics',
  'hi-vis':         'orange/amber, construction-site aesthetic — PPE, hazards, site safety',
  'slate':          'blue-grey, corporate neutral — commercial docs, formal reports',
  'mono':           'greys only, minimalist — black-and-white print, submissions',
  'earth':          'browns and greens, natural — ecology, landscape, arb, contaminated land',
};

/**
 * Resolve a colour from a palette with wrap-around for long lists.
 * Index 0 is primary; higher indices are progressively lighter.
 */
export function paletteColor(paletteId: PaletteId, index: number): string {
  const palette = PALETTES[paletteId];
  return palette[index % palette.length];
}

/** List of all palette IDs — useful for iterating in UI pickers. */
export const PALETTE_IDS: readonly PaletteId[] = [
  'ebrora-primary',
  'ebrora-gold',
  'hi-vis',
  'slate',
  'mono',
  'earth',
] as const;
