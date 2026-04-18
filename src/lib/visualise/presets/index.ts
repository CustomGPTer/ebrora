// =============================================================================
// Visualise — Preset Registry
// Central lookup for all presets. Keep imports explicit (no barrel glob) so
// the Next bundler can tree-shake unused presets out of client bundles.
//
// When adding a preset:
//   1. Create the file in src/lib/visualise/presets/<category>/<id>.tsx
//   2. Import it below
//   3. Add it to PRESETS
//   4. Add a resolver entry in src/lib/visualise/canvas/textEdit.ts
//      (only needed if the preset supports inline text edit)
// =============================================================================

import type { AnyPreset } from './types';

// Batch 1 — foundation examples
import { flowLinear4StepPreset } from './flow/flow-linear-4step';
import { chartBarVerticalPreset } from './charts/chart-bar-vertical';

// Batch 2 — 13 remaining stress-test presets
import { flowDecisionYesNoPreset } from './flow/flow-decision-yesno';
import { timelineHorizontal5EventPreset } from './timeline/timeline-horizontal-5event';
import { hierarchyOrgSimplePreset } from './hierarchy/hierarchy-org-simple';
import { hierarchyPyramid4TierPreset } from './hierarchy/hierarchy-pyramid-4tier';
import { venn3CirclePreset } from './relationships/venn-3circle';
import { quadrantSwotPreset } from './positioning/quadrant-swot';
import { cycle4StepPreset } from './cycle/cycle-4step';
import { chartPiePreset } from './charts/chart-pie';
import { kpiCardGrid3Preset } from './charts/kpi-card-grid-3';
import { conCdmHierarchyPreset } from './construction/con-cdm-hierarchy';
import { conRaciMatrix4ColPreset } from './construction/con-raci-matrix-4col';
import { conRiskMatrix5x5Preset } from './construction/con-risk-matrix-5x5';
import { conHierarchyOfControlsPreset } from './construction/con-hierarchy-of-controls';

// Batch 8a-1 — flow variants
import { flowLinear3StepPreset } from './flow/flow-linear-3step';
import { flowLinear5StepPreset } from './flow/flow-linear-5step';
import { flowLinearVertical4StepPreset } from './flow/flow-linear-vertical-4step';

// Batch 8a-2
import { flowBranching1To2Preset } from './flow/flow-branching-1to2';
import { flowSwimlane2LanePreset } from './flow/flow-swimlane-2lane';
import { flowSwimlane3LanePreset } from './flow/flow-swimlane-3lane';
import { flowSipocPreset } from './flow/flow-sipoc';
import { processNumbered6StepPreset } from './process/process-numbered-6step';

// Batch 8a-3
import { flowMultiGatewayPreset } from './flow/flow-multi-gateway';
import { processCircular4StepPreset } from './process/process-circular-4step';
import { processCircular6StepPreset } from './process/process-circular-6step';
import { processPdcaPreset } from './process/process-pdca';

// Batch 8b — DMAIC, 4-phase stages, horizontal-8 and vertical-5 timelines, gantt-lite
import { processDmaicPreset } from './process/process-dmaic';
import { processStages4PhasePreset } from './process/process-stages-4phase';
import { timelineHorizontal8EventPreset } from './timeline/timeline-horizontal-8event';
import { timelineVertical5EventPreset } from './timeline/timeline-vertical-5event';
import { timelineGanttLitePreset } from './timeline/timeline-gantt-lite';

// Batch 8b-2 — roadmap + milestones timelines, 3-level + generic tree hierarchies
import { timelineRoadmapQuartersPreset } from './timeline/timeline-roadmap-quarters';
import { timelineMilestonesPreset } from './timeline/timeline-milestones';
import { hierarchyOrg3LevelPreset } from './hierarchy/hierarchy-org-3level';
import { hierarchyTreeGenericPreset } from './hierarchy/hierarchy-tree-generic';

// Batch 8c — 2 hierarchy (mindmap, 5-tier pyramid) + 3 relationships (2-circle venn, euler, hub-spoke)
import { hierarchyMindmapCentrePreset } from './hierarchy/hierarchy-mindmap-centre';
import { hierarchyPyramid5TierPreset } from './hierarchy/hierarchy-pyramid-5tier';
import { venn2CirclePreset } from './relationships/venn-2circle';
import { eulerNestedPreset } from './relationships/euler-nested';
import { networkHubSpoke6Preset } from './relationships/network-hub-spoke-6';

// Batch 8c-2 — 2 relationships (fishbone, concept-map) + 2 cycle (6-step, feedback loop)
import { fishboneIshikawa6BonePreset } from './relationships/fishbone-ishikawa-6bone';
import { conceptMapPreset } from './relationships/concept-map';
import { cycle6StepPreset } from './cycle/cycle-6step';
import { cycleFeedbackLoopPreset } from './cycle/cycle-feedback-loop';

// Batch 8d — 5 comparison presets
import { sideBySide2ColPreset } from './comparison/side-by-side-2col';
import { prosConsPreset } from './comparison/pros-cons';
import { matrix3ColPreset } from './comparison/matrix-3col';
import { matrix4ColPreset } from './comparison/matrix-4col';
import { vsCardPreset } from './comparison/vs-card';

// Batch 8d-2 — 1 comparison (table-clean) + 4 positioning (generic 2×2, BCG, impact/effort, perceptual map)
import { tableCleanPreset } from './comparison/table-clean';
import { quadrant2x2GenericPreset } from './positioning/quadrant-2x2-generic';
import { quadrantBcgPreset } from './positioning/quadrant-bcg';
import { quadrantImpactEffortPreset } from './positioning/quadrant-impact-effort';
import { perceptualMapPreset } from './positioning/perceptual-map';

/**
 * The canonical preset list.
 * Order here is reflected in the preset gallery and dev preview page.
 * Grouped by category for readability.
 */
export const PRESETS: readonly AnyPreset[] = [
  // flow (10)
  flowLinear3StepPreset as AnyPreset,
  flowLinear4StepPreset as AnyPreset,
  flowLinear5StepPreset as AnyPreset,
  flowLinearVertical4StepPreset as AnyPreset,
  flowDecisionYesNoPreset as AnyPreset,
  flowBranching1To2Preset as AnyPreset,
  flowMultiGatewayPreset as AnyPreset,
  flowSwimlane2LanePreset as AnyPreset,
  flowSwimlane3LanePreset as AnyPreset,
  flowSipocPreset as AnyPreset,
  // process (6)
  processNumbered6StepPreset as AnyPreset,
  processCircular4StepPreset as AnyPreset,
  processCircular6StepPreset as AnyPreset,
  processPdcaPreset as AnyPreset,
  processDmaicPreset as AnyPreset,
  processStages4PhasePreset as AnyPreset,
  // timeline (6)
  timelineHorizontal5EventPreset as AnyPreset,
  timelineHorizontal8EventPreset as AnyPreset,
  timelineVertical5EventPreset as AnyPreset,
  timelineGanttLitePreset as AnyPreset,
  timelineRoadmapQuartersPreset as AnyPreset,
  timelineMilestonesPreset as AnyPreset,
  // hierarchy (6)
  hierarchyOrgSimplePreset as AnyPreset,
  hierarchyOrg3LevelPreset as AnyPreset,
  hierarchyTreeGenericPreset as AnyPreset,
  hierarchyMindmapCentrePreset as AnyPreset,
  hierarchyPyramid4TierPreset as AnyPreset,
  hierarchyPyramid5TierPreset as AnyPreset,
  // relationships (6)
  venn2CirclePreset as AnyPreset,
  venn3CirclePreset as AnyPreset,
  eulerNestedPreset as AnyPreset,
  networkHubSpoke6Preset as AnyPreset,
  fishboneIshikawa6BonePreset as AnyPreset,
  conceptMapPreset as AnyPreset,
  // comparison (6)
  sideBySide2ColPreset as AnyPreset,
  prosConsPreset as AnyPreset,
  matrix3ColPreset as AnyPreset,
  matrix4ColPreset as AnyPreset,
  vsCardPreset as AnyPreset,
  tableCleanPreset as AnyPreset,
  // positioning (5)
  quadrantSwotPreset as AnyPreset,
  quadrant2x2GenericPreset as AnyPreset,
  quadrantBcgPreset as AnyPreset,
  quadrantImpactEffortPreset as AnyPreset,
  perceptualMapPreset as AnyPreset,
  // cycle (3)
  cycle4StepPreset as AnyPreset,
  cycle6StepPreset as AnyPreset,
  cycleFeedbackLoopPreset as AnyPreset,
  // charts (3)
  chartBarVerticalPreset as AnyPreset,
  chartPiePreset as AnyPreset,
  kpiCardGrid3Preset as AnyPreset,
  // construction (4)
  conCdmHierarchyPreset as AnyPreset,
  conRaciMatrix4ColPreset as AnyPreset,
  conRiskMatrix5x5Preset as AnyPreset,
  conHierarchyOfControlsPreset as AnyPreset,
];

/** Map from preset ID → preset definition for O(1) lookup. */
const PRESETS_BY_ID: Map<string, AnyPreset> = new Map(
  PRESETS.map((preset) => [preset.id, preset]),
);

/** Look up a single preset by ID. Returns undefined if not found. */
export function getPresetById(id: string): AnyPreset | undefined {
  return PRESETS_BY_ID.get(id);
}

/** Return all registered presets. */
export function getAllPresets(): readonly AnyPreset[] {
  return PRESETS;
}

/** Return all preset IDs — useful for Zod enum validators on AI responses. */
export function getAllPresetIds(): readonly string[] {
  return PRESETS.map((p) => p.id);
}

/** Filter presets by category for category-scoped UI (e.g. sidebar gallery). */
export function getPresetsByCategory(category: string): readonly AnyPreset[] {
  return PRESETS.filter((p) => p.category === category);
}

/** Re-export Preset types for convenience. */
export type { AnyPreset, Preset, PresetCategory, PresetRenderProps } from './types';
