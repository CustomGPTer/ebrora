// =============================================================================
// Lift Plan Builder — Types
// =============================================================================

export type LiftPlanTemplateSlug =
  | 'ebrora-standard'
  | 'operator-brief'
  | 'tandem-lift'
  | 'loler-compliance';

export interface LiftPlanTemplateConfig {
  slug: LiftPlanTemplateSlug;
  displayName: string;
  description: string;
  pageCount: number;
  thumbnailPath: string;
  previewPaths: string[];
  keySections: string[];
  layout: 'standard' | 'compact' | 'structured' | 'banded';
}

/** Ordered list of template slugs for display in picker */
export const LIFT_PLAN_TEMPLATE_ORDER: LiftPlanTemplateSlug[] = [
  'ebrora-standard',
  'operator-brief',
  'tandem-lift',
  'loler-compliance',
];

/** Free-tier templates — Lift Plan is a paid-only tool so all are gated at tool level */
export const LIFT_PLAN_FREE_TEMPLATES: LiftPlanTemplateSlug[] = [
  'ebrora-standard',
  'operator-brief',
];
