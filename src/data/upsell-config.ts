// src/data/upsell-config.ts
// Maps content categories to relevant product upsells and RAMS Builder CTA

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
  gumroadUrl: "/products",
};

// Category-specific upsells: maps a toolbox talk category slug to relevant products
export const TOOLBOX_UPSELLS: Record<string, UpsellItem[]> = {
  "working-at-height": [
    {
      title: "Access Equipment Selector",
      description: "Choose the right access equipment for your task with built-in height, reach, and terrain calculations.",
      gumroadUrl: "/products#access-equipment-selector",
      price: "£4.99",
    },
  ],
  "manual-handling": [
    {
      title: "Manual Handling Risk Score Calculator",
      description: "Combined MAC and RAPP scoring tool with 120+ civil engineering task library.",
      gumroadUrl: "/products#manual-handling-risk-score-calculator",
      price: "£4.99",
    },
  ],
  "fire-safety": [
    {
      title: "Office Fire Risk Assessment",
      description: "Complete fire risk assessment system with 38 questions, 5x5 risk matrix, and compliance dashboard.",
      gumroadUrl: "/products#office-fire-risk-assessment",
      price: "£4.99",
    },
  ],
  "confined-spaces": [
    {
      title: "Confined Space Assessment Calculator",
      description: "Calculate NC1-NC4 confined space categories with full requirements and qualification mapping.",
      gumroadUrl: "/products#confined-space-assessment-calculator",
      price: "£4.99",
    },
  ],
  "noise-and-vibration": [
    {
      title: "HAVS Monitoring Tool",
      description: "Track daily vibration exposure against EAV and ELV limits for your site teams.",
      gumroadUrl: "/products#havs-monitoring",
      price: "£4.99",
    },
  ],
  "plant-and-vehicles": [
    {
      title: "Plant Pre-Use Check Sheets",
      description: "28 plant types covered with professional pre-use inspection checklists.",
      gumroadUrl: "/products#plant-pre-use-check-sheets",
      price: "£4.99",
    },
  ],
  excavations: [
    {
      title: "Excavation Inspection Register",
      description: "Track excavation inspections with automatic scheduling and compliance status.",
      gumroadUrl: "/products#excavation-inspection-register",
      price: "£4.99",
    },
  ],
  "coshh": [
    {
      title: "COSHH Assessment Tool",
      description: "Professional COSHH assessment template with product register, exposure tracking, and control measures.",
      gumroadUrl: "/products#coshh-assessment-tool",
      price: "£4.99",
    },
  ],
  "concrete-and-cement": [
    {
      title: "Concrete Pour Register",
      description: "Track concrete pours with formwork strike times, cube test results, and defect recording.",
      gumroadUrl: "/products#concrete-pour-register",
      price: "£4.99",
    },
  ],
  "project-management": [
    {
      title: "Gantt Chart Project Planner",
      description: "Professional construction Gantt chart with dependencies, RAG status, and multi-timescale views.",
      gumroadUrl: "/products#gantt-chart-project-planner",
      price: "£9.99",
    },
  ],
  "environmental": [
    {
      title: "Carbon Calculator for Construction",
      description: "Calculate embodied carbon using ICE v3.0 emission factors with material and transport breakdowns.",
      gumroadUrl: "/products#carbon-calculator-construction",
      price: "£4.99",
    },
  ],
  "temporary-works": [
    {
      title: "Temporary Works Register",
      description: "Track temporary works from design through installation to removal with permit integration.",
      gumroadUrl: "/products#temporary-works-register",
      price: "£4.99",
    },
  ],
  "lifting-operations": [
    {
      title: "Plant Pre-Use Check Sheets",
      description: "28 plant types covered including cranes and lifting equipment with professional inspection checklists.",
      gumroadUrl: "/products#plant-pre-use-check-sheets",
      price: "£4.99",
    },
  ],
  "permits-to-work": [
    {
      title: "Ladder & Stepladder Permit System",
      description: "Complete permit system for ladder and stepladder use with inspection records.",
      gumroadUrl: "/products#ladder-stepladder-permit",
      price: "£4.99",
    },
  ],
};

// Tool page upsells: maps a tool slug to the Excel product it relates to
export const TOOL_UPSELLS: Record<string, UpsellItem> = {
  "manual-handling-calculator": {
    title: "Get the Full Excel Version",
    description:
      "The complete Manual Handling Risk Score Calculator with 120+ task library, assessment register, and editable scoring settings.",
    gumroadUrl: "/products#manual-handling-risk-score-calculator",
    price: "£4.99",
  },
  "fire-risk-assessment": {
    title: "Get the Full Excel Version",
    description:
      "The complete Office Fire Risk Assessment with dashboard, action plan, emergency plan, fire safety log, and review history.",
    gumroadUrl: "/products#office-fire-risk-assessment",
    price: "£4.99",
  },
  "materials-converter": {
    title: "Get the Full Excel Version",
    description:
      "The complete Civil Engineering Materials Converter with 100+ materials, cost estimating, and ICE v3 carbon calculations.",
    gumroadUrl: "/products#civil-engineering-materials-converter",
    price: "£4.99",
  },
  "confined-space-calculator": {
    title: "Get the Full Excel Version",
    description:
      "The complete Confined Space Assessment Calculator with full requirements matrix and example guidance.",
    gumroadUrl: "/products#confined-space-assessment-calculator",
    price: "£4.99",
  },
};
