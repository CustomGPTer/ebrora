// src/data/upsell-config.ts
// Maps content categories to relevant Gumroad product upsells and RAMS Builder CTA

import { UpsellItem } from "@/types/content";

// RAMS Builder upsell - shown on every content page
export const RAMS_BUILDER_UPSELL: UpsellItem = {
  title: "RAMS Builder",
  description:
    "Generate professional Risk Assessment and Method Statements in minutes. 10 document formats, site-specific content, instant Word download.",
  gumroadUrl: "/rams-builder",
  price: "From free",
};

// Default upsell for pages with no specific mapping
export const DEFAULT_PRODUCT_UPSELL: UpsellItem = {
  title: "Browse All Templates",
  description:
    "Professional Excel templates built for construction site teams. Gantt charts, trackers, registers, check sheets and more.",
  gumroadUrl: "https://ebrora.gumroad.com",
};

// Category-specific upsells: maps a toolbox talk category slug to relevant Gumroad products
export const TOOLBOX_UPSELLS: Record<string, UpsellItem[]> = {
  "working-at-height": [
    {
      title: "Working at Height Risk Assessment Template",
      description: "Professional risk assessment template with pre-populated hazards for working at height activities.",
      gumroadUrl: "https://ebrora.gumroad.com",
    },
  ],
  "manual-handling": [
    {
      title: "Manual Handling Risk Score Calculator",
      description: "Combined MAC and RAPP scoring tool with 120+ civil engineering task library.",
      gumroadUrl: "https://ebrora.gumroad.com/l/manual-handling-risk-score-calculator",
      price: "From \u00A34.99",
    },
  ],
  "fire-safety": [
    {
      title: "Office Fire Risk Assessment",
      description: "Complete fire risk assessment system with 38 questions, 5x5 risk matrix, and compliance dashboard.",
      gumroadUrl: "https://ebrora.gumroad.com/l/office-fire-risk-assessment",
      price: "From \u00A34.99",
    },
  ],
  "confined-spaces": [
    {
      title: "Confined Space Category Calculator",
      description: "Calculate NC1-NC4 confined space categories with full requirements and qualification mapping.",
      gumroadUrl: "https://ebrora.gumroad.com/l/confined-space-calculator",
      price: "From \u00A34.99",
    },
  ],
  "noise-and-vibration": [
    {
      title: "HAVS Exposure Calculator",
      description: "Track daily vibration exposure against EAV and ELV limits for your site teams.",
      gumroadUrl: "https://ebrora.gumroad.com",
    },
  ],
  "plant-and-vehicles": [
    {
      title: "Plant Pre-Use Check Sheets",
      description: "28 plant types covered with professional pre-use inspection checklists.",
      gumroadUrl: "https://ebrora.gumroad.com/l/plant-pre-use-check-sheets",
      price: "From \u00A34.99",
    },
  ],
  excavations: [
    {
      title: "Excavation Inspection Register",
      description: "Track excavation inspections with automatic scheduling and compliance status.",
      gumroadUrl: "https://ebrora.gumroad.com/l/excavation-inspection-register",
      price: "From \u00A34.99",
    },
  ],
};

// Tool page upsells: maps a tool slug to the Excel product it replaces
export const TOOL_UPSELLS: Record<string, UpsellItem> = {
  "manual-handling-calculator": {
    title: "Get the Full Excel Version",
    description:
      "The complete Manual Handling Risk Score Calculator with 120+ task library, assessment register, and editable scoring settings.",
    gumroadUrl: "https://ebrora.gumroad.com/l/manual-handling-risk-score-calculator",
    price: "From \u00A34.99",
  },
  "fire-risk-assessment": {
    title: "Get the Full Excel Version",
    description:
      "The complete Office Fire Risk Assessment with dashboard, action plan, emergency plan, fire safety log, and review history.",
    gumroadUrl: "https://ebrora.gumroad.com/l/office-fire-risk-assessment",
    price: "From \u00A34.99",
  },
  "materials-converter": {
    title: "Get the Full Excel Version",
    description:
      "The complete Civil Engineering Materials Converter with 100+ materials, cost estimating, and ICE v3 carbon calculations.",
    gumroadUrl: "https://ebrora.gumroad.com/l/civil-engineering-materials-converter",
    price: "From \u00A34.99",
  },
  "confined-space-calculator": {
    title: "Get the Full Excel Version",
    description:
      "The complete Confined Space Category Calculator with full requirements matrix and example guidance.",
    gumroadUrl: "https://ebrora.gumroad.com/l/confined-space-calculator",
    price: "From \u00A34.99",
  },
};
