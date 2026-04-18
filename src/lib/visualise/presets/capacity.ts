// =============================================================================
// Visualise — Preset Capacity Manifest (Batch 1 bug fix)
//
// Every preset declares how many "primary items" it accepts and what structural
// shape of input it fits. The AI uses this at generate-time to avoid picking a
// preset whose capacity can't hold the number of concepts in the user's text.
//
// WHY THIS EXISTS:
// Before this manifest, each preset's Zod schema was the only capacity signal
// (e.g. `.length(6)`). When a user pasted 8 concepts, the AI would silently
// truncate to fit a 6-slot preset's schema. That "8-into-6" bug is the driver
// for Batch 1. The manifest is consumed by:
//   1. buildSystemPrompt — injects each preset's capacity line so the AI sees
//      "capacity: exactly 6 steps" when deciding which preset to pick.
//   2. Post-generation validation — verifies the AI didn't pick a preset whose
//      capacity is below the concept count it declared in `reasoning`.
//
// STRUCTURE vs CAPACITY:
// - capacity.primary.min/max   → the raw slot count the preset can hold
// - capacity.primaryUnit       → human label for one slot ("step", "event", ...)
// - capacity.structure         → what kind of data the preset expresses:
//       sequential   → ordered, arrow-connected  (flows, numbered steps)
//       cyclical     → ordered and loops back    (cycles, PDCA, circular processes)
//       hierarchical → parent → children layers  (org charts, pyramids, trees)
//       named-roles  → each slot has a specific fixed meaning  (SWOT, PDCA, DMAIC, CDM, SIPOC)
//       parallel     → siblings without order    (mindmap, hub-spoke, concept-map)
//       comparative  → exactly N alternatives    (2-col, vs-card, venn, side-by-side)
//       matrix       → 2D grid of cells          (RACI, matrix-3col, table-clean)
//       data         → numeric values            (bar chart, pie chart)
//
// capacity.secondary is present when a preset has a meaningful second dimension
// (swimlanes have N lanes × M items per lane, matrices have N cols × M rows).
//
// ADDING A PRESET:
// When adding a new preset to src/lib/visualise/presets/<family>/<id>.tsx,
// you MUST add a row to PRESET_CAPACITY here. A missing capacity entry will
// throw at startup via assertAllPresetsHaveCapacity() which runs in tests and
// in dev boot.
// =============================================================================

import { getAllPresetIds } from './index';

/** Structural archetype of a preset — drives the AI's shortlist filtering. */
export type PresetStructure =
  | 'sequential'
  | 'cyclical'
  | 'hierarchical'
  | 'named-roles'
  | 'parallel'
  | 'comparative'
  | 'matrix'
  | 'data';

/** Capacity descriptor for a single preset. */
export interface PresetCapacity {
  /** Slot count the preset can hold. For fixed-count presets, min === max. */
  primary: { min: number; max: number };
  /** Human label for one slot — used in AI prompt and UI ("step", "event"...). */
  primaryUnit: string;
  /** Structural archetype — used to match user-text shape to preset shape. */
  structure: PresetStructure;
  /** Optional second-dimension capacity — rows in a matrix, items per lane. */
  secondary?: { min: number; max: number; unit: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// The manifest — exhaustive for all 55 currently-registered presets.
// Derived from each preset's dataSchema Zod constraints (audited Batch 1).
// ─────────────────────────────────────────────────────────────────────────────
export const PRESET_CAPACITY: Record<string, PresetCapacity> = {
  // ── flow (10) ────────────────────────────────────────────────────────────
  'flow-linear-3step': {
    primary: { min: 3, max: 3 },
    primaryUnit: 'step',
    structure: 'sequential',
  },
  'flow-linear-4step': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'step',
    structure: 'sequential',
  },
  'flow-linear-5step': {
    primary: { min: 5, max: 5 },
    primaryUnit: 'step',
    structure: 'sequential',
  },
  'flow-linear-vertical-4step': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'step',
    structure: 'sequential',
  },
  'flow-decision-yesno': {
    primary: { min: 3, max: 3 },
    primaryUnit: 'decision-outcome',
    structure: 'named-roles',
  },
  'flow-branching-1to2': {
    primary: { min: 2, max: 2 },
    primaryUnit: 'branch',
    structure: 'parallel',
  },
  'flow-multi-gateway': {
    primary: { min: 3, max: 5 },
    primaryUnit: 'branch',
    structure: 'parallel',
  },
  'flow-swimlane-2lane': {
    primary: { min: 2, max: 2 },
    primaryUnit: 'lane',
    structure: 'comparative',
    secondary: { min: 2, max: 5, unit: 'step per lane' },
  },
  'flow-swimlane-3lane': {
    primary: { min: 3, max: 3 },
    primaryUnit: 'lane',
    structure: 'comparative',
    secondary: { min: 2, max: 4, unit: 'step per lane' },
  },
  'flow-sipoc': {
    primary: { min: 5, max: 5 },
    primaryUnit: 'SIPOC-column',
    structure: 'named-roles',
    secondary: { min: 2, max: 5, unit: 'item per column' },
  },

  // ── process (6) ──────────────────────────────────────────────────────────
  'process-numbered-6step': {
    primary: { min: 6, max: 6 },
    primaryUnit: 'step',
    structure: 'sequential',
  },
  'process-circular-4step': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'step',
    structure: 'cyclical',
  },
  'process-circular-6step': {
    primary: { min: 6, max: 6 },
    primaryUnit: 'step',
    structure: 'cyclical',
  },
  'process-pdca': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'PDCA-phase',
    structure: 'named-roles',
  },
  'process-dmaic': {
    primary: { min: 5, max: 5 },
    primaryUnit: 'DMAIC-stage',
    structure: 'named-roles',
  },
  'process-stages-4phase': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'phase',
    structure: 'sequential',
  },

  // ── timeline (6) ─────────────────────────────────────────────────────────
  'timeline-horizontal-5event': {
    primary: { min: 5, max: 5 },
    primaryUnit: 'event',
    structure: 'sequential',
  },
  'timeline-horizontal-8event': {
    primary: { min: 8, max: 8 },
    primaryUnit: 'event',
    structure: 'sequential',
  },
  'timeline-vertical-5event': {
    primary: { min: 5, max: 5 },
    primaryUnit: 'event',
    structure: 'sequential',
  },
  'timeline-gantt-lite': {
    primary: { min: 3, max: 7 },
    primaryUnit: 'task',
    structure: 'sequential',
  },
  'timeline-roadmap-quarters': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'quarter',
    structure: 'named-roles',
    secondary: { min: 1, max: 6, unit: 'item per quarter' },
  },
  'timeline-milestones': {
    primary: { min: 3, max: 6 },
    primaryUnit: 'milestone',
    structure: 'sequential',
  },

  // ── hierarchy (6) ────────────────────────────────────────────────────────
  'hierarchy-org-simple': {
    // 1 root + exactly 3 children
    primary: { min: 3, max: 3 },
    primaryUnit: 'direct-report',
    structure: 'hierarchical',
  },
  'hierarchy-org-3level': {
    // top + 2–3 middle + 3–6 bottom; count = total nodes
    primary: { min: 6, max: 10 },
    primaryUnit: 'node',
    structure: 'hierarchical',
  },
  'hierarchy-tree-generic': {
    // 2–4 top-level branches (each may have leaves)
    primary: { min: 2, max: 4 },
    primaryUnit: 'branch',
    structure: 'hierarchical',
  },
  'hierarchy-mindmap-centre': {
    primary: { min: 4, max: 8 },
    primaryUnit: 'spoke',
    structure: 'parallel',
  },
  'hierarchy-pyramid-4tier': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'tier',
    structure: 'hierarchical',
  },
  'hierarchy-pyramid-5tier': {
    primary: { min: 5, max: 5 },
    primaryUnit: 'tier',
    structure: 'hierarchical',
  },

  // ── relationships (6) ────────────────────────────────────────────────────
  'venn-2circle': {
    primary: { min: 2, max: 2 },
    primaryUnit: 'set',
    structure: 'comparative',
  },
  'venn-3circle': {
    primary: { min: 3, max: 3 },
    primaryUnit: 'set',
    structure: 'comparative',
  },
  'euler-nested': {
    primary: { min: 3, max: 3 },
    primaryUnit: 'nested-set',
    structure: 'hierarchical',
  },
  'network-hub-spoke-6': {
    primary: { min: 6, max: 6 },
    primaryUnit: 'spoke',
    structure: 'parallel',
  },
  'fishbone-ishikawa-6bone': {
    primary: { min: 6, max: 6 },
    primaryUnit: 'cause-category',
    structure: 'named-roles',
  },
  'concept-map': {
    primary: { min: 6, max: 6 },
    primaryUnit: 'concept',
    structure: 'parallel',
  },

  // ── comparison (6) ───────────────────────────────────────────────────────
  'side-by-side-2col': {
    primary: { min: 2, max: 2 },
    primaryUnit: 'option',
    structure: 'comparative',
  },
  'pros-cons': {
    primary: { min: 2, max: 2 },
    primaryUnit: 'side',
    structure: 'comparative',
    secondary: { min: 1, max: 6, unit: 'point per side' },
  },
  'matrix-3col': {
    primary: { min: 3, max: 3 },
    primaryUnit: 'column',
    structure: 'matrix',
    secondary: { min: 2, max: 6, unit: 'row' },
  },
  'matrix-4col': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'column',
    structure: 'matrix',
    secondary: { min: 2, max: 6, unit: 'row' },
  },
  'vs-card': {
    primary: { min: 2, max: 2 },
    primaryUnit: 'option',
    structure: 'comparative',
  },
  'table-clean': {
    primary: { min: 3, max: 5 },
    primaryUnit: 'column',
    structure: 'matrix',
    secondary: { min: 2, max: 8, unit: 'row' },
  },

  // ── positioning (5) ──────────────────────────────────────────────────────
  'quadrant-swot': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'SWOT-quadrant',
    structure: 'named-roles',
  },
  'quadrant-2x2-generic': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'quadrant',
    structure: 'named-roles',
  },
  'quadrant-bcg': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'BCG-quadrant',
    structure: 'named-roles',
  },
  'quadrant-impact-effort': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'impact-effort-quadrant',
    structure: 'named-roles',
  },
  'perceptual-map': {
    primary: { min: 3, max: 10 },
    primaryUnit: 'plotted-item',
    structure: 'parallel',
  },

  // ── cycle (3) ────────────────────────────────────────────────────────────
  'cycle-4step': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'step',
    structure: 'cyclical',
  },
  'cycle-6step': {
    primary: { min: 6, max: 6 },
    primaryUnit: 'step',
    structure: 'cyclical',
  },
  'cycle-feedback-loop': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'step',
    structure: 'cyclical',
  },

  // ── charts (3) ───────────────────────────────────────────────────────────
  'chart-bar-vertical': {
    primary: { min: 2, max: 8 },
    primaryUnit: 'bar',
    structure: 'data',
  },
  'chart-pie': {
    primary: { min: 2, max: 6 },
    primaryUnit: 'slice',
    structure: 'data',
  },
  'kpi-card-grid-3': {
    primary: { min: 3, max: 3 },
    primaryUnit: 'KPI',
    structure: 'parallel',
  },

  // ── construction (4) ─────────────────────────────────────────────────────
  'con-cdm-hierarchy': {
    primary: { min: 6, max: 6 },
    primaryUnit: 'CDM-duty-holder',
    structure: 'named-roles',
  },
  'con-raci-matrix-4col': {
    primary: { min: 4, max: 4 },
    primaryUnit: 'RACI-role',
    structure: 'matrix',
    secondary: { min: 2, max: 6, unit: 'task row' },
  },
  'con-risk-matrix-5x5': {
    // 5×5 grid is fixed; risks plotted on top (0–6)
    primary: { min: 0, max: 6 },
    primaryUnit: 'plotted risk',
    structure: 'matrix',
    secondary: { min: 5, max: 5, unit: 'likelihood × severity axes' },
  },
  'con-hierarchy-of-controls': {
    primary: { min: 6, max: 6 },
    primaryUnit: 'control-level',
    structure: 'named-roles',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Look up a preset's capacity. Returns undefined if the preset isn't registered here. */
export function getCapacity(presetId: string): PresetCapacity | undefined {
  return PRESET_CAPACITY[presetId];
}

/**
 * Does a preset's primary capacity accommodate the given count?
 * Used both by the AI shortlist filter and post-generation validation.
 */
export function capacityAccommodates(presetId: string, count: number): boolean {
  const cap = PRESET_CAPACITY[presetId];
  if (!cap) return false;
  return count >= cap.primary.min && count <= cap.primary.max;
}

/**
 * Format a preset's capacity as a short phrase for the AI system prompt.
 *   { min:6, max:6, unit:'step' } → "exactly 6 steps"
 *   { min:3, max:7, unit:'task' } → "3–7 tasks"
 *   { min:0, max:6, unit:'plotted risk' } → "up to 6 plotted risks"
 * Secondary dimension is appended in parentheses when present.
 */
export function describeCapacityForAi(presetId: string): string {
  const cap = PRESET_CAPACITY[presetId];
  if (!cap) return 'capacity unknown';
  const { min, max } = cap.primary;
  const unit = pluralise(cap.primaryUnit, max === 1 ? 1 : 2);
  let main: string;
  if (min === max) {
    main = `exactly ${max} ${unit}`;
  } else if (min === 0) {
    main = `up to ${max} ${unit}`;
  } else {
    main = `${min}–${max} ${unit}`;
  }
  if (cap.secondary) {
    const { min: smin, max: smax, unit: sunit } = cap.secondary;
    const sPhrase =
      smin === smax ? `${smax} ${sunit}` : `${smin}–${smax} ${sunit}`;
    main += ` with ${sPhrase}`;
  }
  main += ` — ${cap.structure}`;
  return main;
}

/**
 * Naive pluraliser — good enough for the unit labels used in the manifest.
 * "step" → "steps", "SWOT-quadrant" → "SWOT-quadrants", "KPI" → "KPIs",
 * "CDM-duty-holder" → "CDM-duty-holders".
 */
function pluralise(word: string, count: number): string {
  if (count === 1) return word;
  if (/[sxz]$|[cs]h$/i.test(word)) return `${word}es`;
  return `${word}s`;
}

/**
 * Return the IDs of all presets whose primary capacity can accommodate `count`.
 * Pass structure filter (optional) to further narrow by structural archetype.
 * Used by the AI shortlist builder when an exact concept count is known.
 */
export function filterByCount(
  count: number,
  structureFilter?: readonly PresetStructure[],
): string[] {
  return Object.entries(PRESET_CAPACITY)
    .filter(([, cap]) => {
      if (count < cap.primary.min || count > cap.primary.max) return false;
      if (structureFilter && !structureFilter.includes(cap.structure)) return false;
      return true;
    })
    .map(([id]) => id);
}

/**
 * Dev-time assertion: every registered preset must have a capacity row here.
 * Called from the system-prompt builder at request time so missing entries
 * produce a loud error immediately rather than silent AI mis-matching.
 * Returns the list of missing IDs (empty when everything is accounted for).
 */
export function assertAllPresetsHaveCapacity(): string[] {
  const registered = getAllPresetIds();
  const missing = registered.filter((id) => !(id in PRESET_CAPACITY));
  if (missing.length > 0) {
    console.error(
      '[visualise] PRESET_CAPACITY is missing entries for:',
      missing.join(', '),
    );
  }
  return missing;
}
