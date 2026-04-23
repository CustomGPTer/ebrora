// src/lib/site-photo-stamp/templates.ts
//
// All 18 site photo stamp templates, each with 3 variants.
// Variants:
//   • solid       — full colour block, white (or dark) body text.
//   • transparent — no background; body text in white sitting directly on
//                   the photo. The title is drawn in the template's base
//                   colour with a thin white stroke so it remains legible
//                   on dark photographs.
//   • icon        — solid colour block + badge icon on the left of the
//                   title (check / cross / warning / eye / clipboard).
//
// Colour palette chosen for maximum scannability on site prints and the
// construction-industry convention (green = positive/good practice, amber =
// caution, red = issue/near miss, blue = record/information).

import type { Template } from "./types";

// ─── Variant builder helpers ────────────────────────────────────

const solid = (bg: string, fg = "#FFFFFF") => ({
  id: "solid" as const,
  label: "Solid",
  accentColor: bg,
  textColor: fg,
});

const transparent = () => ({
  id: "transparent" as const,
  label: "Transparent",
  // Renderer special-cases the "transparent" accent: no card fill is drawn,
  // body text is white, and the title is painted in the template's base
  // colour with a white stroke. See stamp-renderer.ts / drawStampCard.
  accentColor: "transparent",
  textColor: "#FFFFFF",
});

const withIcon = (
  bg: string,
  icon: "check" | "cross" | "warning" | "eye" | "clipboard",
  fg = "#FFFFFF"
) => ({
  id: "icon" as const,
  label: "With Badge",
  accentColor: bg,
  textColor: fg,
  icon,
});

// ─── Templates ──────────────────────────────────────────────────

export const TEMPLATES: Template[] = [
  {
    id: "construction-record",
    title: "Construction Record",
    description: "General record of construction activity for site documentation.",
    baseColor: "#1E40AF",
    variants: [
      solid("#1E40AF"),
      transparent(),
      withIcon("#1E40AF", "clipboard"),
    ],
  },
  {
    id: "close-call",
    title: "Close Call",
    description: "Capture close calls promptly to drive learning and prevent incidents.",
    baseColor: "#F59E0B",
    variants: [
      solid("#F59E0B", "#1F1300"),
      transparent(),
      withIcon("#F59E0B", "warning", "#1F1300"),
    ],
  },
  {
    id: "near-miss",
    title: "Near Miss",
    description: "Photographic record of a near miss event for investigation.",
    baseColor: "#DC2626",
    variants: [
      solid("#DC2626"),
      transparent(),
      withIcon("#DC2626", "warning"),
    ],
  },
  {
    id: "good-practice",
    title: "Good Practice",
    description: "Recognise and share good practice examples from site.",
    baseColor: "#16A34A",
    variants: [
      solid("#16A34A"),
      transparent(),
      withIcon("#16A34A", "check"),
    ],
  },
  {
    id: "safety-observation",
    title: "Safety Observation",
    description: "Safety observation for behavioural or condition-based reporting.",
    baseColor: "#0EA5E9",
    variants: [
      solid("#0EA5E9"),
      transparent(),
      withIcon("#0EA5E9", "eye"),
    ],
  },
  {
    id: "defect-snag",
    title: "Defect / Snag",
    description: "Record defects and snags for action and close-out tracking.",
    baseColor: "#B91C1C",
    variants: [
      solid("#B91C1C"),
      transparent(),
      withIcon("#B91C1C", "cross"),
    ],
  },
  {
    id: "quality-record",
    title: "Quality Record",
    description: "ITR/ITP evidence photograph for quality close-out.",
    baseColor: "#0D9488",
    variants: [
      solid("#0D9488"),
      transparent(),
      withIcon("#0D9488", "check"),
    ],
  },
  {
    id: "progress-photo",
    title: "Progress Photo",
    description: "Weekly or milestone progress record for reporting.",
    baseColor: "#1B5B50",
    variants: [
      solid("#1B5B50"),
      transparent(),
      withIcon("#1B5B50", "clipboard"),
    ],
  },
  {
    id: "delivery-record",
    title: "Delivery Record",
    description: "Materials or plant delivery acceptance photograph.",
    baseColor: "#B45309",
    variants: [
      solid("#B45309"),
      transparent(),
      withIcon("#B45309", "clipboard"),
    ],
  },
  {
    id: "plant-inspection",
    title: "Plant Inspection",
    description: "Pre-use or periodic plant inspection evidence photograph.",
    baseColor: "#EA580C",
    variants: [
      solid("#EA580C"),
      transparent(),
      withIcon("#EA580C", "check"),
    ],
  },
  {
    id: "permit-photo",
    title: "Permit Photo",
    description: "Permit-to-work, hot works, or confined space evidence photograph.",
    baseColor: "#7C3AED",
    variants: [
      solid("#7C3AED"),
      transparent(),
      withIcon("#7C3AED", "clipboard"),
    ],
  },
  {
    id: "environmental-record",
    title: "Environmental Record",
    description: "Spill, pollution, ecology or waste incident/observation.",
    baseColor: "#15803D",
    variants: [
      solid("#15803D"),
      transparent(),
      withIcon("#15803D", "eye"),
    ],
  },
  {
    id: "concrete-pour",
    title: "Concrete Pour",
    description: "Pre-pour checks, slump, cube samples, delivery ticket and strike times.",
    baseColor: "#57534E",
    variants: [
      solid("#57534E"),
      transparent(),
      withIcon("#57534E", "clipboard"),
    ],
  },
  {
    id: "services",
    title: "Existing Services",
    description: "Identification of buried or live services — gas, water, HV/LV, comms.",
    baseColor: "#CA8A04",
    variants: [
      solid("#CA8A04", "#1F1300"),
      transparent(),
      withIcon("#CA8A04", "warning", "#1F1300"),
    ],
  },
  {
    id: "commissioning",
    title: "Commissioning",
    description: "MEICA commissioning, energisation, pressure test or flow test evidence.",
    baseColor: "#0891B2",
    variants: [
      solid("#0891B2"),
      transparent(),
      withIcon("#0891B2", "check"),
    ],
  },
  {
    id: "dilapidation",
    title: "Dilapidation",
    description: "Pre-works condition record of adjacent property, highway or existing asset.",
    baseColor: "#374151",
    variants: [
      solid("#374151"),
      transparent(),
      withIcon("#374151", "clipboard"),
    ],
  },
  {
    id: "excavation",
    title: "Excavation",
    description: "CAT & Genny scan, service drawings and pre-dig checks for permit to dig.",
    baseColor: "#D97706",
    variants: [
      solid("#D97706"),
      transparent(),
      withIcon("#D97706", "warning"),
    ],
  },
  {
    id: "before-after",
    title: "Before / After",
    description: "Side-by-side before and after comparison image.",
    baseColor: "#475569",
    forceTwoUp: true,
    variants: [
      solid("#475569"),
      transparent(),
      withIcon("#475569", "check"),
    ],
  },
];

/** Fast lookup by id. */
export const TEMPLATE_MAP: Record<string, Template> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
);

/** Resolve a template (falls back to construction-record). */
export function getTemplate(id: string): Template {
  return TEMPLATE_MAP[id] ?? TEMPLATES[0];
}
