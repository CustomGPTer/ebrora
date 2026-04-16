// src/data/tool-catalogue.ts
//
// SHARED TOOL CATALOGUE — single source of truth for:
//   - Display names per slug (used in both the /tools hub and the nav dropdown)
//   - Category assignments with icons (used in both the hub grid and the nav dropdown)
//
// When you add a new tool, update this file ONLY. Both the hub
// (src/components/tools/ToolsHubClient.tsx) and the nav dropdown
// (src/components/navigation/ToolsDropdown.tsx) will pick up the
// change automatically.
//
// This module intentionally has no React or DOM dependencies so
// it can be imported from both server and client components.

// ─── Display names (slug -> human-readable name) ────────────────
//
// The name here takes precedence over the name stored in the DB
// for nav-dropdown rendering. The /tools hub still uses the DB
// name, which should match.

export const TOOL_NAMES: Record<string, string> = {
  // Health & Safety
  "manual-handling-calculator": "Manual Handling Calculator",
  "fire-risk-score-calculator": "Fire Risk Score Calculator",
  "wbgt-heat-stress-calculator": "WBGT Heat Stress Calculator",
  "hav-calculator": "HAV Calculator",
  "confined-space-calculator": "Confined Space Calculator",
  "welfare-facilities-calculator": "Welfare Facilities Calculator",
  "dust-silica-calculator": "Dust & Silica Calculator",
  "noise-exposure-calculator": "Noise Exposure Calculator",
  "slip-risk-calculator": "Slip Risk Calculator",
  "uv-index-exposure-checker": "UV Index Exposure Checker",
  "cold-stress-wind-chill-calculator": "Cold Stress Wind Chill Calculator",
  "lone-worker-risk-calculator": "Lone Worker Risk Calculator",
  "fatigue-risk-calculator": "Fatigue Risk Calculator",
  "first-aid-needs-calculator": "First Aid Needs Calculator",
  "working-at-height-calculator": "Working at Height Calculator",
  "riddor-reporting-decision-tool": "RIDDOR Reporting Decision Tool",
  "asbestos-notification-decision-tool": "Asbestos Notification Decision Tool",
  "site-induction-duration-calculator": "Site Induction Duration Calculator",
  "fire-extinguisher-selector": "Fire Extinguisher Selector",
  "temporary-traffic-management-selector": "Temporary Traffic Management Selector",
  "working-time-regulations-calculator": "Working Time Regulations Calculator",
  "ladder-stepladder-justification-tool": "Ladder / Stepladder Justification Tool",
  "f10-notification-checker": "F10 Notification Checker",

  // Temporary Works
  "scaffold-load-calculator": "Scaffold Load Calculator",
  "formwork-pressure-calculator": "Formwork Pressure Calculator",
  "excavation-batter-angle-calculator": "Excavation Batter Angle Calculator",

  // Concrete
  "concrete-volume-calculator": "Concrete Volume Calculator",
  "concrete-pour-planner": "Concrete Pour Planner",
  "concrete-curing-estimator": "Concrete Curing Estimator",

  // Materials & Quantities
  "materials-converter": "Materials Converter",
  "aggregate-calculator": "Aggregate Calculator",
  "brick-block-calculator": "Brick & Block Calculator",
  "sling-swl-calculator": "Sling SWL Calculator",
  "topsoil-calculator": "Topsoil Calculator",

  // Plant & Equipment
  "access-equipment-selector": "Access Equipment Selector",
  "fuel-usage-calculator": "Fuel Usage Calculator",
  "plant-pre-use-checksheet": "Plant Pre-Use Checksheet",
  "plant-hire-comparator": "Plant Hire Comparator",

  // Earthworks & Ground
  "excavation-spoil-calculator": "Excavation Spoil Calculator",
  "trench-backfill-calculator": "Trench Backfill Calculator",
  "cbr-modulus-converter": "CBR / Modulus Converter",
  "soil-compaction-calculator": "Soil Compaction Calculator",
  "plate-bearing-test-interpreter": "Plate Bearing Test Interpreter",

  // Programme & Commercial
  "construction-productivity-calculator": "Construction Productivity Calculator",
  "working-days-calculator": "Working Days Calculator",
  "daywork-rate-calculator": "Daywork Rate Calculator",
  "overtime-cost-calculator": "Overtime Cost Calculator",
  "historical-weather": "Historical Weather Data",
  "org-chart-generator": "Org Chart Generator",
  "sunrise-sunset-times": "Sunrise & Sunset Times",

  // Environmental & Ecology
  "ecological-exclusion-zone-checker": "Ecological Exclusion Zone Checker",

  // Utilities & Services
  "cable-trench-depth-checker": "Cable Trench Depth Checker",
  "drainage-pipe-flow-calculator": "Drainage Pipe Flow Calculator",

  // Surveying & Setting Out
  "coordinate-converter": "Coordinate Converter",
};

// ─── Category definitions ──────────────────────────────────────
//
// This is the canonical list of category -> slugs. Each category
// carries an icon and visual accents. A slug can appear in multiple
// categories (intentional -- e.g. "drainage-pipe-flow-calculator"
// is both Utilities & Services and Water & Wastewater).
//
// Order of keys here is the order in which categories appear in the
// nav dropdown and the /tools hub filter list.

export interface CategorySpec {
  icon: string;         // emoji or glyph
  accent: string;       // hex colour for category highlight
  accentLight: string;  // rgba tint for hover/background
  slugs: string[];      // slugs in this category, rendered in this order
}

export const TOOL_CATEGORIES: Record<string, CategorySpec> = {
  "Health & Safety": {
    icon: "🛡️",
    accent: "#DC2626",
    accentLight: "rgba(220,38,38,0.08)",
    slugs: [
      "manual-handling-calculator",
      "fire-risk-score-calculator",
      "wbgt-heat-stress-calculator",
      "hav-calculator",
      "confined-space-calculator",
      "welfare-facilities-calculator",
      "dust-silica-calculator",
      "noise-exposure-calculator",
      "slip-risk-calculator",
      "uv-index-exposure-checker",
      "cold-stress-wind-chill-calculator",
      "lone-worker-risk-calculator",
      "fatigue-risk-calculator",
      "first-aid-needs-calculator",
      "working-at-height-calculator",
      "riddor-reporting-decision-tool",
      "asbestos-notification-decision-tool",
      "site-induction-duration-calculator",
      "fire-extinguisher-selector",
      "temporary-traffic-management-selector",
      "working-time-regulations-calculator",
      "ladder-stepladder-justification-tool",
      "f10-notification-checker",
    ],
  },
  "Temporary Works": {
    icon: "🏗️",
    accent: "#64748B",
    accentLight: "rgba(100,116,139,0.08)",
    slugs: [
      "scaffold-load-calculator",
      "formwork-pressure-calculator",
      "excavation-batter-angle-calculator",
    ],
  },
  "Concrete": {
    icon: "🧱",
    accent: "#78716C",
    accentLight: "rgba(120,113,108,0.08)",
    slugs: [
      "concrete-volume-calculator",
      "concrete-pour-planner",
      "concrete-curing-estimator",
      "formwork-pressure-calculator",
      "historical-weather",
    ],
  },
  "Materials & Quantities": {
    icon: "🧱",
    accent: "#B45309",
    accentLight: "rgba(180,83,9,0.08)",
    slugs: [
      "materials-converter",
      "concrete-volume-calculator",
      "aggregate-calculator",
      "excavation-spoil-calculator",
      "trench-backfill-calculator",
      "brick-block-calculator",
      "concrete-pour-planner",
      "topsoil-calculator",
      "concrete-curing-estimator",
      "sling-swl-calculator",
    ],
  },
  "Plant & Equipment": {
    icon: "🚜",
    accent: "#EA580C",
    accentLight: "rgba(234,88,12,0.08)",
    slugs: [
      "fuel-usage-calculator",
      "plant-pre-use-checksheet",
      "access-equipment-selector",
      "sling-swl-calculator",
      "plant-hire-comparator",
    ],
  },
  "Earthworks & Ground": {
    icon: "⛏️",
    accent: "#0891B2",
    accentLight: "rgba(8,145,178,0.08)",
    slugs: [
      "cbr-modulus-converter",
      "drainage-pipe-flow-calculator",
      "soil-compaction-calculator",
      "plate-bearing-test-interpreter",
      "excavation-spoil-calculator",
      "trench-backfill-calculator",
      "topsoil-calculator",
      "excavation-batter-angle-calculator",
    ],
  },
  "Programme & Commercial": {
    icon: "📊",
    accent: "#7C3AED",
    accentLight: "rgba(124,58,237,0.08)",
    slugs: [
      "construction-productivity-calculator",
      "sunrise-sunset-times",
      "working-days-calculator",
      "daywork-rate-calculator",
      "overtime-cost-calculator",
      "historical-weather",
      "plant-hire-comparator",
      "org-chart-generator",
      "temporary-traffic-management-selector",
      "working-time-regulations-calculator",
      "f10-notification-checker",
    ],
  },
  "Environmental & Ecology": {
    icon: "🌿",
    accent: "#16A34A",
    accentLight: "rgba(22,163,74,0.08)",
    slugs: [
      "ecological-exclusion-zone-checker",
      "asbestos-notification-decision-tool",
    ],
  },
  "Utilities & Services": {
    icon: "⚡",
    accent: "#0284C7",
    accentLight: "rgba(2,132,199,0.08)",
    slugs: [
      "cable-trench-depth-checker",
      "trench-backfill-calculator",
      "drainage-pipe-flow-calculator",
    ],
  },
  "Surveying & Setting Out": {
    icon: "📐",
    accent: "#6D28D9",
    accentLight: "rgba(109,40,217,0.08)",
    slugs: [
      "coordinate-converter",
      "sunrise-sunset-times",
    ],
  },
  "Quality & Testing": {
    icon: "🔬",
    accent: "#0F766E",
    accentLight: "rgba(15,118,110,0.08)",
    slugs: [
      "plate-bearing-test-interpreter",
      "soil-compaction-calculator",
      "cbr-modulus-converter",
      "concrete-curing-estimator",
      "concrete-pour-planner",
    ],
  },
  "Training & Competence": {
    icon: "🎓",
    accent: "#BE185D",
    accentLight: "rgba(190,24,93,0.08)",
    slugs: [
      "first-aid-needs-calculator",
      "plant-pre-use-checksheet",
      "confined-space-calculator",
      "site-induction-duration-calculator",
      "ladder-stepladder-justification-tool",
    ],
  },
  "Water & Wastewater": {
    icon: "💧",
    accent: "#1D4ED8",
    accentLight: "rgba(29,78,216,0.08)",
    slugs: [
      "drainage-pipe-flow-calculator",
      "confined-space-calculator",
      "welfare-facilities-calculator",
    ],
  },
  "MEICA": {
    icon: "🔧",
    accent: "#475569",
    accentLight: "rgba(71,85,105,0.08)",
    slugs: [
      "noise-exposure-calculator",
      "hav-calculator",
      "sling-swl-calculator",
      "plant-pre-use-checksheet",
      "confined-space-calculator",
    ],
  },
};

// ─── Helpers ───────────────────────────────────────────────────

/**
 * Lookup the display name for a tool slug. Falls back to the
 * title-cased slug if the name is not registered (this should
 * never happen in production but keeps the UI safe during dev).
 */
export function getToolName(slug: string): string {
  return (
    TOOL_NAMES[slug] ??
    slug
      .split("-")
      .map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
      .join(" ")
  );
}

/**
 * List every category that contains the given slug.
 */
export function getCategoriesForSlug(slug: string): string[] {
  return Object.entries(TOOL_CATEGORIES)
    .filter(([, spec]) => spec.slugs.includes(slug))
    .map(([name]) => name);
}

/**
 * Every slug that appears in at least one category, deduplicated.
 */
export function getAllCatalogueSlugs(): string[] {
  const seen = new Set<string>();
  for (const spec of Object.values(TOOL_CATEGORIES)) {
    for (const slug of spec.slugs) seen.add(slug);
  }
  return Array.from(seen);
}
