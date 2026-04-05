// src/data/tool-definitions.ts
// Free tool definitions based on the 4 Excel calculators

import { FreeToolData } from "@/types/content";

export const TOOL_DEFINITIONS: FreeToolData[] = [
  {
    name: "Manual Handling Risk Score Calculator",
    slug: "manual-handling-calculator",
    description:
      "Score manual handling tasks using HSE's MAC (lift, carry, team handling) and RAPP (push and pull) methodologies. Includes a 120+ civil engineering task library with suggested handling types, automatic risk banding, and colour-coded output.",
    features: [
      "Combined MAC + RAPP scoring in one tool",
      "120+ civil engineering task library",
      "Automatic risk banding (Low, Medium, High)",
      "Supports Lift, Carry, Team Handling, Push and Pull",
      "Scoring factors: weight, reach, posture, grip, frequency, environment",
      "Printable assessment output",
    ],
    status: "COMING_SOON",
    route: "/tools/manual-handling-calculator",
    gumroadUrl: "https://ebrora.gumroad.com/l/manual-handling-risk-score-calculator",
    order: 1,
  },
  {
    name: "Office Fire Risk Assessment",
    slug: "fire-risk-assessment",
    description:
      "Complete fire risk assessment system for construction site offices. 38 fire safety questions across 17 sections with automated compliance scoring, 5x5 risk matrix, live dashboard, and action plan tracker. Aligned with the Regulatory Reform (Fire Safety) Order 2005, CDM 2015, and HSG168.",
    features: [
      "38 fire safety control questions across 17 sections",
      "5x5 likelihood x severity risk matrix",
      "Live compliance dashboard with percentages",
      "Automatic noncompliant item identification",
      "Action plan tracker with owners and target dates",
      "Based on Fire Safety Order 2005, CDM 2015, HSG168",
    ],
    status: "COMING_SOON",
    route: "/tools/fire-risk-assessment",
    gumroadUrl: "https://ebrora.gumroad.com/l/office-fire-risk-assessment",
    order: 2,
  },
  {
    name: "Civil Engineering Materials Converter",
    slug: "materials-converter",
    description:
      "Convert between tonnes, cubic metres, kilograms, litres, square metres, bulk bags, and wagon loads for 100+ civil engineering materials. Includes loose and compacted densities, cost estimating, and embodied carbon calculations using ICE v3 emission factors.",
    features: [
      "100+ civil engineering materials across 4 categories",
      "Convert between tonnes, m³, kg, litres, m², bags, loads",
      "Loose vs compacted density switching",
      "Cost estimating with editable rates per material",
      "Embodied carbon (ICE v3/v4 emission factors)",
      "Live category subtotals and grand totals",
      "Multi-row take-off sheet with CSV export",
      "Editable assumptions (bag size, load weight, default thickness)",
    ],
    status: "LIVE",
    route: "/tools/materials-converter",
    gumroadUrl: "https://ebrora.gumroad.com/l/civil-engineering-materials-converter",
    order: 3,
  },
  {
    name: "Confined Space Category Calculator",
    slug: "confined-space-calculator",
    description:
      "Calculate the confined space risk category (NC1 Low Risk through to NC4 High Risk with Rescue) using a weighted scoring system. Covers specified risks, depth, access, ventilation, atmosphere, and communication factors. Outputs full category requirements including qualifications, equipment, and permits.",
    features: [
      "Weighted scoring across 6 risk factor groups",
      "Categories: NC1 (Low) to NC4 (High + Rescue)",
      "Full requirements output per category",
      "City and Guilds 6160 qualification mapping",
      "Specified risk assessment (fire, gas, drowning, entrapment)",
      "Equipment and permit requirements per category",
    ],
    status: "COMING_SOON",
    route: "/tools/confined-space-calculator",
    gumroadUrl: "https://ebrora.gumroad.com/l/confined-space-calculator",
    order: 4,
  },
];
