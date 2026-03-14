// src/data/template-categories.ts
// 15 free template categories across Excel, Word, and PowerPoint formats

import { TemplateCategoryData } from "@/types/content";

export const TEMPLATE_CATEGORIES: TemplateCategoryData[] = [
  // --- Excel categories ---
  {
    name: "Project Management",
    slug: "project-management",
    format: "EXCEL",
    description:
      "Free Excel project management templates including trackers, logs, registers, and scheduling tools for construction projects.",
    order: 1,
  },
  {
    name: "Health & Safety",
    slug: "health-and-safety",
    format: "EXCEL",
    description:
      "Free Excel health and safety templates including risk assessments, inspection checklists, COSHH registers, and permit trackers.",
    order: 2,
  },
  {
    name: "Quality Management",
    slug: "quality-management",
    format: "EXCEL",
    description:
      "Free Excel quality management templates including ITPs, NCR logs, snag lists, and inspection registers for construction.",
    order: 3,
  },
  {
    name: "Environmental",
    slug: "environmental",
    format: "EXCEL",
    description:
      "Free Excel environmental templates including waste transfer logs, carbon trackers, spill response records, and environmental checklists.",
    order: 4,
  },
  {
    name: "Programme & Planning",
    slug: "programme-and-planning",
    format: "EXCEL",
    description:
      "Free Excel planning templates including Gantt charts, lookahead programmes, milestone trackers, and resource allocation sheets.",
    order: 5,
  },
  {
    name: "Commercial & QS",
    slug: "commercial-and-qs",
    format: "EXCEL",
    description:
      "Free Excel commercial templates including valuation trackers, cost schedules, variation registers, and interim payment calculators.",
    order: 6,
  },
  {
    name: "Site Management",
    slug: "site-management",
    format: "EXCEL",
    description:
      "Free Excel site management templates including daily reports, allocation sheets, attendance logs, and delivery booking systems.",
    order: 7,
  },
  {
    name: "Plant & Equipment",
    slug: "plant-and-equipment",
    format: "EXCEL",
    description:
      "Free Excel plant templates including pre-use check sheets, maintenance logs, plant registers, and equipment allocation trackers.",
    order: 8,
  },
  {
    name: "Training & Competence",
    slug: "training-and-competence",
    format: "EXCEL",
    description:
      "Free Excel training templates including competence matrices, induction records, training needs analyses, and certification trackers.",
    order: 9,
  },
  // --- Word categories ---
  {
    name: "Temporary Works",
    slug: "temporary-works",
    format: "WORD",
    description:
      "Free Word temporary works templates including TWC registers, design check requests, briefing records, and inspection checklists.",
    order: 10,
  },
  {
    name: "Subcontractor Management",
    slug: "subcontractor-management",
    format: "WORD",
    description:
      "Free Word subcontractor templates including performance scorecards, pre-start meeting agendas, payment certification forms, and compliance checklists.",
    order: 11,
  },
  {
    name: "Document Control",
    slug: "document-control",
    format: "WORD",
    description:
      "Free Word document control templates including transmittal forms, drawing registers, document review logs, and revision tracking sheets.",
    order: 12,
  },
  {
    name: "Meeting & Communication",
    slug: "meeting-and-communication",
    format: "WORD",
    description:
      "Free Word meeting templates including minutes formats, briefing pack structures, progress meeting agendas, and action tracking sheets.",
    order: 13,
  },
  // --- PowerPoint categories ---
  {
    name: "Reporting",
    slug: "reporting",
    format: "POWERPOINT",
    description:
      "Free PowerPoint reporting templates including weekly and monthly progress reports, KPI dashboards, and management summary presentations.",
    order: 14,
  },
  {
    name: "Handover & Completion",
    slug: "handover-and-completion",
    format: "POWERPOINT",
    description:
      "Free PowerPoint handover templates including O&M submission checklists, practical completion packs, snagging presentations, and close-out reports.",
    order: 15,
  },
];
