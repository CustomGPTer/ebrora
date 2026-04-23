// src/lib/site-photo-stamp/templates.ts
//
// All 13 site photo stamp templates, each with 3 variants.
// Variants: solid (colour block, white text), outline (white block, coloured
// text + border), icon (solid colour + badge icon).
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

const outline = (bg: string, fg: string) => ({
  id: "outline" as const,
  label: "Outline",
  accentColor: "#FFFFFF",
  textColor: fg,
  borderColor: bg,
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
      outline("#1E40AF", "#1E40AF"),
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
      outline("#F59E0B", "#92400E"),
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
      outline("#DC2626", "#991B1B"),
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
      outline("#16A34A", "#166534"),
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
      outline("#0EA5E9", "#0369A1"),
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
      outline("#B91C1C", "#7F1D1D"),
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
      outline("#0D9488", "#115E59"),
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
      outline("#1B5B50", "#134037"),
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
      outline("#B45309", "#78350F"),
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
      outline("#EA580C", "#9A3412"),
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
      outline("#7C3AED", "#5B21B6"),
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
      outline("#15803D", "#14532D"),
      withIcon("#15803D", "eye"),
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
      outline("#475569", "#1E293B"),
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
