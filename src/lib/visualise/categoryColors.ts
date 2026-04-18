// =============================================================================
// Visualise — Category colour palette
//
// Assigns a distinct accent tint to each preset category so the user can
// identify families at a glance in the VariantPicker and TemplateGalleryModal.
//
// The accents are deliberately muted — they supplement the Ebrora primary
// (#1B5B50), they don't replace it. Active states still use the primary;
// category colours appear as tile backgrounds and thumbnail-container tints
// on idle states.
//
// Exposed as two parallel maps (background + text) rather than a single
// object so consumers can cherry-pick without importing style shapes.
// =============================================================================

import type { PresetCategory } from '@/lib/visualise/presets/types';

/** Soft background tint for a preset thumbnail container. */
export const CATEGORY_TILE_BG: Record<PresetCategory, string> = {
  flow: 'bg-sky-50',
  process: 'bg-emerald-50',
  timeline: 'bg-violet-50',
  hierarchy: 'bg-indigo-50',
  relationships: 'bg-rose-50',
  cycle: 'bg-amber-50',
  comparison: 'bg-slate-50',
  positioning: 'bg-orange-50',
  'funnel-pyramid': 'bg-fuchsia-50',
  charts: 'bg-cyan-50',
  construction: 'bg-yellow-50',
};

/** Slightly stronger version for hover states. */
export const CATEGORY_TILE_BG_HOVER: Record<PresetCategory, string> = {
  flow: 'group-hover:bg-sky-100',
  process: 'group-hover:bg-emerald-100',
  timeline: 'group-hover:bg-violet-100',
  hierarchy: 'group-hover:bg-indigo-100',
  relationships: 'group-hover:bg-rose-100',
  cycle: 'group-hover:bg-amber-100',
  comparison: 'group-hover:bg-slate-100',
  positioning: 'group-hover:bg-orange-100',
  'funnel-pyramid': 'group-hover:bg-fuchsia-100',
  charts: 'group-hover:bg-cyan-100',
  construction: 'group-hover:bg-yellow-100',
};

/** Small coloured dot for the category label under each tile. */
export const CATEGORY_DOT: Record<PresetCategory, string> = {
  flow: 'bg-sky-500',
  process: 'bg-emerald-500',
  timeline: 'bg-violet-500',
  hierarchy: 'bg-indigo-500',
  relationships: 'bg-rose-500',
  cycle: 'bg-amber-500',
  comparison: 'bg-slate-500',
  positioning: 'bg-orange-500',
  'funnel-pyramid': 'bg-fuchsia-500',
  charts: 'bg-cyan-500',
  construction: 'bg-yellow-500',
};

/** Short human label for the category (used as a tooltip / sub-label). */
export const CATEGORY_SHORT_LABEL: Record<PresetCategory, string> = {
  flow: 'Flow',
  process: 'Process',
  timeline: 'Timeline',
  hierarchy: 'Hierarchy',
  relationships: 'Relationships',
  cycle: 'Cycle',
  comparison: 'Compare',
  positioning: 'Matrix',
  'funnel-pyramid': 'Funnel',
  charts: 'Chart',
  construction: 'Construction',
};

/**
 * Safe lookup with a neutral fallback — returns a grey background if a
 * preset's category somehow isn't in the map.
 */
export function getCategoryTileBg(category: PresetCategory | undefined): string {
  if (!category) return 'bg-gray-50';
  return CATEGORY_TILE_BG[category] ?? 'bg-gray-50';
}

export function getCategoryTileBgHover(category: PresetCategory | undefined): string {
  if (!category) return 'group-hover:bg-gray-100';
  return CATEGORY_TILE_BG_HOVER[category] ?? 'group-hover:bg-gray-100';
}

export function getCategoryDot(category: PresetCategory | undefined): string {
  if (!category) return 'bg-gray-400';
  return CATEGORY_DOT[category] ?? 'bg-gray-400';
}

export function getCategoryShortLabel(category: PresetCategory | undefined): string {
  if (!category) return '';
  return CATEGORY_SHORT_LABEL[category] ?? '';
}
