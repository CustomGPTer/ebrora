// src/data/free-template-categories.ts
// COMPLETE CATEGORY HIERARCHY for /free-templates
// Source: EBRORA-FILING-STRUCTURE-002 Rev A (22 March 2026)
//
// This file defines the category structure. The filesystem scanner
// uses these definitions for SEO metadata and display ordering.
// Actual template files live in /public/free-templates/{category-slug}/{subcategory-slug}/

export interface FtSubcategory {
  name: string;
  slug: string;
  description: string;
}

export interface FtCategory {
  name: string;
  slug: string;
  description: string;
  order: number;
  subcategories: FtSubcategory[];
}

export const FT_CATEGORIES: FtCategory[] = [
  // ── 1. HEALTH & SAFETY ──
  {
    name: "Health & Safety",
    slug: "health-and-safety",
    description: "Risk assessments, permits to work, inspection checklists, and compliance templates for UK construction sites.",
    order: 1,
    subcategories: [
      { name: "Risk Assessments", slug: "risk-assessments", description: "Generic risk assessment forms and 5x5 matrix templates." },
      { name: "Fire Safety", slug: "fire-safety", description: "Fire risk assessment checklists, evacuation plans, and extinguisher inspection logs. Aligned with FSO 2005." },
      { name: "Manual Handling", slug: "manual-handling", description: "HSE MAC and RAPP assessment forms for lift, carry, team handling, push and pull operations." },
      { name: "COSHH", slug: "coshh", description: "COSHH assessment templates and substance registers for hazardous materials on construction sites." },
      { name: "Working at Height", slug: "working-at-height", description: "WAH risk assessments, roof work method statements, and edge protection inspection checklists." },
      { name: "Confined Spaces", slug: "confined-spaces", description: "Confined space risk assessments, entry permits, and atmospheric monitoring records." },
      { name: "Excavations", slug: "excavations", description: "Excavation permits, daily inspection checklists, and shoring design forms. BS 6031 aligned." },
      { name: "Electrical Safety", slug: "electrical-safety", description: "Electrical isolation permits, safe systems of work, and PAT testing logs." },
      { name: "PPE", slug: "ppe", description: "PPE assessment forms and issue record templates for task-based PPE selection." },
      { name: "Noise & Vibration", slug: "noise-and-vibration", description: "Noise assessment records, HAVS exposure logs, and hearing protection zone registers." },
      { name: "Lone Working", slug: "lone-working", description: "Lone worker risk assessments and timed check-in log templates." },
      { name: "Permits to Work", slug: "permits-to-work", description: "General permits to work, hot works permits, and crane loading permit forms." },
      { name: "Inspection Checklists", slug: "inspection-checklists", description: "Workplace inspection forms, scaffold inspection registers, and ladder check logs." },
      { name: "Accident & Incident", slug: "accident-and-incident", description: "Accident investigation forms, near miss reports, and RIDDOR notification checklists." },
      { name: "Occupational Health", slug: "occupational-health", description: "Health surveillance registers, fitness to work declarations, and DSE assessment templates." },
      { name: "Lifting Operations", slug: "lifting-operations", description: "LOLER lifting plans, lifting equipment registers, and appointed person checklists." },
      { name: "Drug & Alcohol Testing", slug: "drug-and-alcohol-testing", description: "Drug and alcohol test registers and for-cause testing record forms." },
    ],
  },

  // ── 2. QUALITY MANAGEMENT ──
  {
    name: "Quality Management",
    slug: "quality-management",
    description: "Inspection test plans, non-conformance reports, snagging lists, and material compliance templates.",
    order: 2,
    subcategories: [
      { name: "Inspection Test Plans", slug: "inspection-test-plans", description: "ITP templates with hold points, witness points, and activity sequencing." },
      { name: "NCR & Defects", slug: "ncr-and-defects", description: "Non-conformance registers and individual NCR reporting forms." },
      { name: "Snagging", slug: "snagging", description: "Completion snagging lists and defect correction notices." },
      { name: "Quality Audits", slug: "quality-audits", description: "Internal quality audit checklists aligned with ISO 9001." },
      { name: "Material Compliance", slug: "material-compliance", description: "Material approval requests and test certificate registers." },
    ],
  },

  // ── 3. ENVIRONMENTAL ──
  {
    name: "Environmental",
    slug: "environmental",
    description: "Waste management, carbon tracking, spill response, and ecology templates for construction sites.",
    order: 3,
    subcategories: [
      { name: "Waste Management", slug: "waste-management", description: "Waste transfer logs and site waste management plan templates." },
      { name: "Environmental Inspections", slug: "environmental-inspections", description: "Weekly environmental inspection checklists and water discharge monitoring logs." },
      { name: "Carbon & Sustainability", slug: "carbon-and-sustainability", description: "ICE v3 embodied carbon trackers and sustainability action plan templates." },
      { name: "Spill Response", slug: "spill-response", description: "Spill response record forms and spill kit inspection checklists." },
      { name: "Ecology & Biosecurity", slug: "ecology-and-biosecurity", description: "Ecological constraints checklists and invasive species record forms." },
    ],
  },

  // ── 4. PROGRAMME & PLANNING ──
  {
    name: "Programme & Planning",
    slug: "programme-and-planning",
    description: "Gantt charts, lookahead programmes, milestone trackers, and shutdown planning templates.",
    order: 4,
    subcategories: [
      { name: "Gantt Charts", slug: "gantt-charts", description: "Basic and phased Gantt chart scheduling templates." },
      { name: "Lookahead Programmes", slug: "lookahead-programmes", description: "3-week lookahead and weekly task planner templates." },
      { name: "Milestone Trackers", slug: "milestone-trackers", description: "Target vs actual date milestone register templates." },
      { name: "Constraint Logs", slug: "constraint-logs", description: "Planning constraints, blockers, and dependency tracker templates." },
      { name: "Shutdown & Outage Planning", slug: "shutdown-and-outage-planning", description: "Planned shutdown and outage works programme templates." },
    ],
  },

  // ── 5. COMMERCIAL & QS ──
  {
    name: "Commercial & QS",
    slug: "commercial-and-qs",
    description: "Valuations, variations, cost tracking, and subcontractor payment templates.",
    order: 5,
    subcategories: [
      { name: "Valuations", slug: "valuations", description: "Monthly valuation trackers and daywork sheet templates." },
      { name: "Variations & Claims", slug: "variations-and-claims", description: "Variation registers and NEC early warning notice templates." },
      { name: "Cost Tracking", slug: "cost-tracking", description: "Cost vs budget trackers and monthly forecast sheet templates." },
      { name: "Subcontractor Payments", slug: "subcontractor-payments", description: "Interim payment certificates and payment application templates." },
    ],
  },

  // ── 6. SITE MANAGEMENT ──
  {
    name: "Site Management",
    slug: "site-management",
    description: "Daily site diaries, labour allocation sheets, logistics, and visitor management templates.",
    order: 6,
    subcategories: [
      { name: "Daily Reports & Diaries", slug: "daily-reports-and-diaries", description: "Site diary templates covering weather, labour, plant, and progress." },
      { name: "Labour Allocation", slug: "labour-allocation", description: "Weekly gang allocation sheets and labour histogram templates." },
      { name: "Logistics & Deliveries", slug: "logistics-and-deliveries", description: "Delivery booking sheets and laydown area plan templates." },
      { name: "Site Setup & Security", slug: "site-setup-and-security", description: "Site security checklists and establishment plan templates." },
      { name: "Visitor & Induction", slug: "visitor-and-induction", description: "Visitor sign-in sheets and site induction briefing packs." },
    ],
  },

  // ── 7. PLANT & EQUIPMENT ──
  {
    name: "Plant & Equipment",
    slug: "plant-and-equipment",
    description: "Pre-use check sheets, maintenance logs, plant registers, and PUWER compliance templates.",
    order: 7,
    subcategories: [
      { name: "Pre-Use Checks", slug: "pre-use-checks", description: "Daily pre-use inspection forms for excavators, dumpers, telehandlers, rollers, and generators." },
      { name: "Maintenance & Defects", slug: "maintenance-and-defects", description: "Plant defect report forms and planned maintenance schedule templates." },
      { name: "Plant Register", slug: "plant-register", description: "On-site plant inventory registers and hire schedule trackers." },
      { name: "PUWER Compliance", slug: "puwer-compliance", description: "PUWER work equipment risk assessment templates." },
      { name: "Fuel & Consumables", slug: "fuel-and-consumables", description: "Daily fuel usage draw-off log templates." },
    ],
  },

  // ── 8. TRAINING & COMPETENCE ──
  {
    name: "Training & Competence",
    slug: "training-and-competence",
    description: "Competence matrices, induction records, training logs, and briefing sign-off templates.",
    order: 8,
    subcategories: [
      { name: "Training Matrices", slug: "training-matrices", description: "Role vs qualification competence grids and CSCS card expiry trackers." },
      { name: "Induction Records", slug: "induction-records", description: "Site induction sign-off sheets and induction quiz templates." },
      { name: "Training Records", slug: "training-records", description: "Individual training logs and toolbox talk attendance registers." },
      { name: "Briefing Records", slug: "briefing-records", description: "Pre-task briefing sheets and method statement briefing sign-off forms." },
    ],
  },

  // ── 9. TEMPORARY WORKS ──
  {
    name: "Temporary Works",
    slug: "temporary-works",
    description: "BS 5975 temporary works registers, design checklists, formwork, and propping templates.",
    order: 9,
    subcategories: [
      { name: "TW Registers", slug: "tw-registers", description: "TWC/TWS approval trackers and permit to load forms." },
      { name: "Design Checklists", slug: "design-checklists", description: "BS 5975 category classification forms and TW design brief templates." },
      { name: "Specific TW Types", slug: "specific-tw-types", description: "Formwork checklists, propping schedules, and trench support inspection forms." },
    ],
  },

  // ── 10. SUBCONTRACTOR MANAGEMENT ──
  {
    name: "Subcontractor Management",
    slug: "subcontractor-management",
    description: "Performance scorecards, pre-qualification questionnaires, and payment templates.",
    order: 10,
    subcategories: [
      { name: "Performance Tracking", slug: "performance-tracking", description: "9-category subcontractor performance scorecards and KPI dashboards." },
      { name: "Compliance & Onboarding", slug: "compliance-and-onboarding", description: "Pre-qualification questionnaires and required document checklists." },
      { name: "Payment & Admin", slug: "payment-and-admin", description: "Contra charge notices and subcontractor admin templates." },
    ],
  },

  // ── 11. DOCUMENT CONTROL ──
  {
    name: "Document Control",
    slug: "document-control",
    description: "Drawing registers, transmittal forms, correspondence logs, and numbering conventions.",
    order: 11,
    subcategories: [
      { name: "Drawing Registers", slug: "drawing-registers", description: "Drawing revision trackers and drawing issue sheets." },
      { name: "Transmittals", slug: "transmittals", description: "Standard transmittal form templates." },
      { name: "Correspondence Logs", slug: "correspondence-logs", description: "Inbound/outbound mail tracker templates." },
      { name: "Document Numbering", slug: "document-numbering", description: "Project document numbering convention templates." },
    ],
  },

  // ── 12. MEETING & COMMUNICATION ──
  {
    name: "Meeting & Communication",
    slug: "meeting-and-communication",
    description: "Meeting minutes templates, briefing packs, and stakeholder communication logs.",
    order: 12,
    subcategories: [
      { name: "Meeting Minutes", slug: "meeting-minutes", description: "Progress meeting, pre-start, and H&S committee minutes templates." },
      { name: "Briefing Packs", slug: "briefing-packs", description: "Weekly briefing templates and client progress update presentations." },
      { name: "Communication Logs", slug: "communication-logs", description: "Stakeholder and community engagement tracker templates." },
    ],
  },

  // ── 13. REPORTING ──
  {
    name: "Reporting",
    slug: "reporting",
    description: "Weekly and monthly progress reports, KPI dashboards, and management summary templates.",
    order: 13,
    subcategories: [
      { name: "Weekly Reports", slug: "weekly-reports", description: "Weekly progress and H&S report templates with photo sections." },
      { name: "Monthly Reports", slug: "monthly-reports", description: "Monthly project reports and KPI dashboard templates." },
      { name: "Management Reports", slug: "management-reports", description: "Executive summary and RAG status report templates." },
    ],
  },

  // ── 14. HANDOVER & COMPLETION ──
  {
    name: "Handover & Completion",
    slug: "handover-and-completion",
    description: "O&M documentation, practical completion certificates, as-built records, and lessons learned templates.",
    order: 14,
    subcategories: [
      { name: "O&M Documentation", slug: "om-documentation", description: "O&M submission checklists and manual structure templates." },
      { name: "Practical Completion", slug: "practical-completion", description: "Completion certificates and outstanding works register templates." },
      { name: "As-Built Records", slug: "as-built-records", description: "As-built drawing register and submission tracker templates." },
      { name: "Lessons Learned", slug: "lessons-learned", description: "Structured lessons learned registers and post-project review templates." },
    ],
  },

  // ── 15. MEICA ──
  {
    name: "MEICA",
    slug: "meica",
    description: "Mechanical, electrical, and instrumentation templates for commissioning, testing, and installation.",
    order: 15,
    subcategories: [
      { name: "Mechanical", slug: "mechanical", description: "Pipework pressure test records, valve schedules, and pump installation checklists." },
      { name: "Electrical", slug: "electrical", description: "Cable schedules, BS 7671 test certificates, and isolation certificate templates." },
      { name: "ICA (Instrumentation)", slug: "ica-instrumentation", description: "Instrument schedules and loop check record templates." },
      { name: "Commissioning", slug: "commissioning", description: "Commissioning programmes, SAT/FAT records, and commissioning checklist templates." },
    ],
  },

  // ── 16. CIVILS & EARTHWORKS ──
  {
    name: "Civils & Earthworks",
    slug: "civils-and-earthworks",
    description: "Concrete pour records, earthworks approvals, piling logs, drainage test records, and surfacing templates.",
    order: 16,
    subcategories: [
      { name: "Concrete Works", slug: "concrete-works", description: "Concrete pour records, cube test registers, and pre-pour checklists." },
      { name: "Earthworks", slug: "earthworks", description: "Compaction test records and earthworks layer approval forms." },
      { name: "Piling", slug: "piling", description: "Pile installation records and pile integrity test registers." },
      { name: "Drainage & Pipework", slug: "drainage-and-pipework", description: "Pipe laying records, air/water test records, and CCTV survey logs." },
      { name: "Roads & Surfacing", slug: "roads-and-surfacing", description: "Bituminous laying records and surfacing temperature logs." },
    ],
  },

  // ── 17. PROCESS SAFETY ──
  {
    name: "Process Safety",
    slug: "process-safety",
    description: "Mechanical isolation certificates, LOTO procedures, and HAZOP worksheet templates.",
    order: 17,
    subcategories: [
      { name: "Mechanical Isolations", slug: "mechanical-isolations", description: "Valve isolation certificates and multi-point isolation schedule templates." },
      { name: "LOTO", slug: "loto", description: "Lock out tag out procedure templates and lock assignment registers." },
      { name: "Process Hazards", slug: "process-hazards", description: "HAZOP guideword analysis worksheets and SIL assessment record templates." },
    ],
  },

  // ── 18. WELFARE & SITE SETUP ──
  {
    name: "Welfare & Site Setup",
    slug: "welfare-and-site-setup",
    description: "Welfare inspection checklists, emergency response plans, and first aid provision templates.",
    order: 18,
    subcategories: [
      { name: "Welfare Standards", slug: "welfare-standards", description: "CDM Schedule 2 welfare inspection checklists and facility cleaning logs." },
      { name: "Emergency Planning", slug: "emergency-planning", description: "Site-specific emergency response plans, fire drill records, and emergency contact templates." },
      { name: "First Aid", slug: "first-aid", description: "HSE first aid needs assessments and first aid kit inspection log templates." },
    ],
  },

  // ── 19. TRAFFIC MANAGEMENT ──
  {
    name: "Traffic Management",
    slug: "traffic-management",
    description: "Traffic management plans, vehicle pre-use checks, and pedestrian route assessment templates.",
    order: 19,
    subcategories: [
      { name: "Traffic Management Plans", slug: "traffic-management-plans", description: "Site traffic management plan forms and vehicle movement plans." },
      { name: "Vehicle Checks", slug: "vehicle-checks", description: "HGV pre-use inspection forms and banksman briefing records." },
      { name: "Pedestrian Management", slug: "pedestrian-management", description: "Pedestrian route assessment and segregation planning forms." },
    ],
  },

  // ── 20. SURVEYS & SETTING OUT ──
  {
    name: "Surveys & Setting Out",
    slug: "surveys-and-setting-out",
    description: "Setting out records, control point registers, and ground monitoring templates.",
    order: 20,
    subcategories: [
      { name: "Setting Out", slug: "setting-out", description: "Coordinate and level log templates and survey control station registers." },
      { name: "Monitoring", slug: "monitoring", description: "Settlement monitoring records and groundwater level/quality logs." },
    ],
  },
];

// ── Lookup helpers ──

export function getCategoryBySlug(slug: string): FtCategory | undefined {
  return FT_CATEGORIES.find((c) => c.slug === slug);
}

export function getSubcategoryBySlug(
  categorySlug: string,
  subcategorySlug: string
): FtSubcategory | undefined {
  const cat = getCategoryBySlug(categorySlug);
  return cat?.subcategories.find((sc) => sc.slug === subcategorySlug);
}

export function getAllCategorySlugs(): string[] {
  return FT_CATEGORIES.map((c) => c.slug);
}

export function getAllSubcategorySlugs(): Array<{
  categorySlug: string;
  subcategorySlug: string;
}> {
  return FT_CATEGORIES.flatMap((c) =>
    c.subcategories.map((sc) => ({
      categorySlug: c.slug,
      subcategorySlug: sc.slug,
    }))
  );
}
