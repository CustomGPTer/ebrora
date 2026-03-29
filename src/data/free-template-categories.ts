// src/data/free-template-categories.ts
// COMPLETE CATEGORY HIERARCHY for /free-templates
// Source: EBRORA-FILING-STRUCTURE-002 Rev B (26 March 2026)
// Merged: TBT-STRUCTURE-001 (toolbox talks categories & subfolders)
//
// This file defines the category structure. The filesystem scanner
// uses these definitions for SEO metadata and display ordering.
// Actual template files live in /data/free-templates/ using flat naming:
//   {category-slug}--{subcategory-slug}--{template-name}.xlsx

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

  // ═══════════════════════════════════════════════════
  //  SAFETY & COMPLIANCE (1–4)
  // ═══════════════════════════════════════════════════

  // ── 1. HEALTH & SAFETY ──
  {
    name: "Health & Safety",
    slug: "health-and-safety",
    description: "Risk assessments, permits to work, inspection checklists, and compliance templates for UK construction sites.",
    order: 1,
    subcategories: [
      // — Existing —
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
      // — New from TBT merge —
      { name: "Slips, Trips & Falls", slug: "slips-trips-and-falls", description: "Housekeeping checklists, walkway inspection forms, and slip hazard assessment templates." },
      { name: "Asbestos", slug: "asbestos", description: "Asbestos awareness checklists, R&D survey action trackers, and licensed work notification templates." },
      { name: "Dust & Silica", slug: "dust-and-silica", description: "Silica dust exposure assessments, RPE selection records, and dust suppression monitoring logs." },
      { name: "Hot Works", slug: "hot-works", description: "Hot works permit forms, fire watch checklists, and post-works inspection records." },
      { name: "Water Safety", slug: "water-safety", description: "Working near water risk assessments, drowning prevention checklists, and rescue plan templates." },
      { name: "Behavioural Safety", slug: "behavioural-safety", description: "Safety observation cards, BBS audit forms, and positive intervention record templates." },
      { name: "CDM & Legal Compliance", slug: "cdm-and-legal", description: "CDM duty holder checklists, F10 notification trackers, and principal contractor compliance templates." },
      { name: "Seasonal Hazards", slug: "seasonal-hazards", description: "Winter working risk assessments, heat stress checklists, and adverse weather action plan templates." },
      { name: "Site Inductions", slug: "site-inductions", description: "Contractor and visitor site induction presentations and sign-off templates." },
      { name: "Toolbox Talks", slug: "toolbox-talks", description: "Toolbox talk presentation templates covering key construction site safety topics." },
      { name: "Method Statements", slug: "method-statements", description: "RAMS briefing presentations and method statement communication templates." },
      { name: "Emergency Planning", slug: "emergency-planning", description: "Emergency response procedure briefings and crisis management presentation templates." },
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
      { name: "Quality Systems", slug: "quality-systems", description: "Quality management system induction presentations and QMS overview templates." },
    ],
  },

  // ── 3. ENVIRONMENTAL ──
  {
    name: "Environmental",
    slug: "environmental",
    description: "Waste management, carbon tracking, spill response, ecology, and pollution prevention templates for construction sites.",
    order: 3,
    subcategories: [
      // — Existing —
      { name: "Waste Management", slug: "waste-management", description: "Waste transfer logs and site waste management plan templates." },
      { name: "Environmental Inspections", slug: "environmental-inspections", description: "Weekly environmental inspection checklists and water discharge monitoring logs." },
      { name: "Carbon & Sustainability", slug: "carbon-and-sustainability", description: "ICE v3 embodied carbon trackers and sustainability action plan templates." },
      { name: "Spill Response", slug: "spill-response", description: "Spill response record forms and spill kit inspection checklists." },
      { name: "Ecology & Biosecurity", slug: "ecology-and-biosecurity", description: "Ecological constraints checklists and invasive species record forms." },
      // — New from TBT merge —
      { name: "Water Pollution", slug: "water-pollution", description: "Surface water protection checklists, discharge consent monitoring logs, and silt control inspection forms." },
      { name: "Dust & Noise Control", slug: "dust-noise-control", description: "Section 61 consent trackers, noise monitoring logs, and dust suppression inspection checklists." },
      { name: "Environmental Awareness", slug: "environmental-awareness", description: "Environmental awareness induction presentations and general environmental briefing templates." },
      { name: "Sustainability", slug: "sustainability", description: "Carbon reduction plan presentations and sustainability strategy briefing templates." },
    ],
  },

  // ── 4. PROCESS SAFETY ──
  {
    name: "Process Safety",
    slug: "process-safety",
    description: "Mechanical isolation certificates, LOTO procedures, and HAZOP worksheet templates.",
    order: 4,
    subcategories: [
      { name: "Mechanical Isolations", slug: "mechanical-isolations", description: "Valve isolation certificates and multi-point isolation schedule templates." },
      { name: "LOTO", slug: "loto", description: "Lock out tag out procedure templates and lock assignment registers." },
      { name: "Process Hazards", slug: "process-hazards", description: "HAZOP guideword analysis worksheets and SIL assessment record templates." },
    ],
  },

  // ═══════════════════════════════════════════════════
  //  PLANNING & COMMERCIAL (5–8)
  // ═══════════════════════════════════════════════════

  // ── 5. PROGRAMME & PLANNING ──
  {
    name: "Programme & Planning",
    slug: "programme-and-planning",
    description: "Gantt charts, lookahead programmes, milestone trackers, and shutdown planning templates.",
    order: 5,
    subcategories: [
      { name: "Gantt Charts", slug: "gantt-charts", description: "Basic and phased Gantt chart scheduling templates." },
      { name: "Lookahead Programmes", slug: "lookahead-programmes", description: "3-week lookahead and weekly task planner templates." },
      { name: "Milestone Trackers", slug: "milestone-trackers", description: "Target vs actual date milestone register templates." },
      { name: "Constraint Logs", slug: "constraint-logs", description: "Planning constraints, blockers, and dependency tracker templates." },
      { name: "Shutdown & Outage Planning", slug: "shutdown-and-outage-planning", description: "Planned shutdown and outage works programme templates." },
      { name: "Programme Overview", slug: "programme-overview", description: "Project programme overview presentations and master schedule briefing templates." },
      { name: "Delay Analysis", slug: "delay-analysis", description: "Delay analysis presentations and EOT justification briefing templates." },
      { name: "Logistics", slug: "logistics", description: "Phasing and logistics plan presentations and site logistics briefing templates." },
    ],
  },

  // ── 6. COMMERCIAL & QS ──
  {
    name: "Commercial & QS",
    slug: "commercial-and-qs",
    description: "Valuations, variations, cost tracking, and subcontractor payment templates.",
    order: 6,
    subcategories: [
      { name: "Valuations", slug: "valuations", description: "Monthly valuation trackers and daywork sheet templates." },
      { name: "Variations & Claims", slug: "variations-and-claims", description: "Variation registers and NEC early warning notice templates." },
      { name: "Cost Tracking", slug: "cost-tracking", description: "Cost vs budget trackers and monthly forecast sheet templates." },
      { name: "Subcontractor Payments", slug: "subcontractor-payments", description: "Interim payment certificates and payment application templates." },
      { name: "Commercial Reports", slug: "commercial-reports", description: "Monthly commercial report presentations and financial summary briefing templates." },
      { name: "Procurement", slug: "procurement", description: "Subcontractor pre-award presentations and procurement strategy briefing templates." },
      { name: "Final Account", slug: "final-account", description: "Final account summary presentations and contract closeout briefing templates." },
    ],
  },

  // ── 7. SITE MANAGEMENT ──
  {
    name: "Site Management",
    slug: "site-management",
    description: "Daily site diaries, labour allocation sheets, logistics, and visitor management templates.",
    order: 7,
    subcategories: [
      { name: "Daily Reports & Diaries", slug: "daily-reports-and-diaries", description: "Site diary templates covering weather, labour, plant, and progress." },
      { name: "Labour Allocation", slug: "labour-allocation", description: "Weekly gang allocation sheets and labour histogram templates." },
      { name: "Logistics & Deliveries", slug: "logistics-and-deliveries", description: "Delivery booking sheets and laydown area plan templates." },
      { name: "Site Setup & Security", slug: "site-setup-and-security", description: "Site security checklists and establishment plan templates." },
      { name: "Visitor & Induction", slug: "visitor-and-induction", description: "Visitor sign-in sheets and site induction briefing packs." },
      { name: "Site Rules", slug: "site-rules", description: "Site rules and conduct briefing presentations and site standards templates." },
    ],
  },

  // ── 8. SUBCONTRACTOR MANAGEMENT ──
  {
    name: "Subcontractor Management",
    slug: "subcontractor-management",
    description: "Performance scorecards, pre-qualification questionnaires, supply chain safety, and payment templates.",
    order: 8,
    subcategories: [
      // — Existing —
      { name: "Performance Tracking", slug: "performance-tracking", description: "9-category subcontractor performance scorecards and KPI dashboards." },
      { name: "Compliance & Onboarding", slug: "compliance-and-onboarding", description: "Pre-qualification questionnaires and required document checklists." },
      { name: "Payment & Admin", slug: "payment-and-admin", description: "Contra charge notices and subcontractor admin templates." },
      // — New from TBT merge —
      { name: "Supply Chain Safety", slug: "supply-chain-safety", description: "Subcontractor safety performance trackers, audit checklists, and supply chain compliance registers." },
    ],
  },

  // ═══════════════════════════════════════════════════
  //  SITE OPERATIONS (9–13)
  // ═══════════════════════════════════════════════════

  // ── 9. PLANT & EQUIPMENT ──
  {
    name: "Plant & Equipment",
    slug: "plant-and-equipment",
    description: "Pre-use check sheets, maintenance logs, plant registers, and PUWER compliance templates.",
    order: 9,
    subcategories: [
      // — Existing —
      { name: "Pre-Use Checks", slug: "pre-use-checks", description: "Daily pre-use inspection forms for excavators, dumpers, telehandlers, rollers, and generators." },
      { name: "Maintenance & Defects", slug: "maintenance-and-defects", description: "Plant defect report forms and planned maintenance schedule templates." },
      { name: "Plant Register", slug: "plant-register", description: "On-site plant inventory registers and hire schedule trackers." },
      { name: "PUWER Compliance", slug: "puwer-compliance", description: "PUWER work equipment risk assessment templates." },
      { name: "Fuel & Consumables", slug: "fuel-and-consumables", description: "Daily fuel usage draw-off log templates." },
      // — New from TBT merge —
      { name: "Small Plant & Tools", slug: "small-plant-and-tools", description: "Power tool inspection registers, hand tool check forms, and small plant issue records." },
      { name: "Plant Safety", slug: "plant-safety", description: "Plant safety induction presentations and general plant awareness briefing templates." },
      { name: "Operator Competence", slug: "operator-competence", description: "CPCS and operator competence briefing presentations and certification tracking templates." },
    ],
  },

  // ── 10. TRAFFIC MANAGEMENT ──
  {
    name: "Traffic Management",
    slug: "traffic-management",
    description: "Traffic management plans, vehicle pre-use checks, pedestrian routes, and public highway works templates.",
    order: 10,
    subcategories: [
      // — Existing —
      { name: "Traffic Management Plans", slug: "traffic-management-plans", description: "Site traffic management plan forms and vehicle movement plans." },
      { name: "Vehicle Checks", slug: "vehicle-checks", description: "HGV pre-use inspection forms and banksman briefing records." },
      { name: "Pedestrian Management", slug: "pedestrian-management", description: "Pedestrian route assessment and segregation planning forms." },
      // — New from TBT merge —
      { name: "Public Highway Works", slug: "public-highway-works", description: "Chapter 8 signing and guarding checklists, lane closure permit trackers, and road space booking forms." },
    ],
  },

  // ── 11. WELFARE & SITE SETUP ──
  {
    name: "Welfare & Site Setup",
    slug: "welfare-and-site-setup",
    description: "Welfare inspection checklists, emergency response plans, first aid provision, and remote welfare templates.",
    order: 11,
    subcategories: [
      // — Existing —
      { name: "Welfare Standards", slug: "welfare-standards", description: "CDM Schedule 2 welfare inspection checklists and facility cleaning logs." },
      { name: "Emergency Planning", slug: "emergency-planning", description: "Site-specific emergency response plans, fire drill records, and emergency contact templates." },
      { name: "First Aid", slug: "first-aid", description: "HSE first aid needs assessments and first aid kit inspection log templates." },
      // — New from TBT merge —
      { name: "Remote & Temporary Welfare", slug: "remote-welfare", description: "Remote working welfare provision checklists and temporary facility compliance records." },
    ],
  },

  // ── 12. NIGHT WORKING ── (NEW)
  {
    name: "Night Working",
    slug: "night-working",
    description: "Night shift risk assessments, lighting surveys, fatigue management plans, and night works notification templates.",
    order: 12,
    subcategories: [
      { name: "Night Works Planning", slug: "night-works-planning", description: "Night works method statements, Section 61 consent applications, and shift pattern planning templates." },
      { name: "Lighting & Visibility", slug: "lighting-and-visibility", description: "Temporary lighting surveys, lux level records, and task lighting assessment forms." },
      { name: "Fatigue Management", slug: "fatigue-management", description: "Fatigue risk assessments, shift handover checklists, and driver hours monitoring logs." },
    ],
  },

  // ── 13. TRAINING & COMPETENCE ──
  {
    name: "Training & Competence",
    slug: "training-and-competence",
    description: "Competence matrices, induction records, training logs, and briefing sign-off templates.",
    order: 13,
    subcategories: [
      { name: "Training Matrices", slug: "training-matrices", description: "Role vs qualification competence grids and CSCS card expiry trackers." },
      { name: "Induction Records", slug: "induction-records", description: "Site induction sign-off sheets and induction quiz templates." },
      { name: "Training Records", slug: "training-records", description: "Individual training logs and toolbox talk attendance registers." },
      { name: "Briefing Records", slug: "briefing-records", description: "Pre-task briefing sheets and method statement briefing sign-off forms." },
    ],
  },

  // ═══════════════════════════════════════════════════
  //  ADMINISTRATION (14–17)
  // ═══════════════════════════════════════════════════

  // ── 14. DOCUMENT CONTROL ──
  {
    name: "Document Control",
    slug: "document-control",
    description: "Drawing registers, transmittal forms, correspondence logs, and numbering conventions.",
    order: 14,
    subcategories: [
      { name: "Drawing Registers", slug: "drawing-registers", description: "Drawing revision trackers and drawing issue sheets." },
      { name: "Transmittals", slug: "transmittals", description: "Standard transmittal form templates." },
      { name: "Correspondence Logs", slug: "correspondence-logs", description: "Inbound/outbound mail tracker templates." },
      { name: "Document Numbering", slug: "document-numbering", description: "Project document numbering convention templates." },
      { name: "Document Procedures", slug: "document-procedures", description: "Document control procedures briefing presentations and document management process templates." },
    ],
  },

  // ── 15. MEETING & COMMUNICATION ──
  {
    name: "Meeting & Communication",
    slug: "meeting-and-communication",
    description: "Meeting minutes templates, briefing packs, and stakeholder communication logs.",
    order: 15,
    subcategories: [
      { name: "Meeting Minutes", slug: "meeting-minutes", description: "Progress meeting, pre-start, and H&S committee minutes templates." },
      { name: "Briefing Packs", slug: "briefing-packs", description: "Weekly briefing templates and client progress update presentations." },
      { name: "Communication Logs", slug: "communication-logs", description: "Stakeholder and community engagement tracker templates." },
    ],
  },

  // ── 16. REPORTING ──
  {
    name: "Reporting",
    slug: "reporting",
    description: "Weekly and monthly progress reports, KPI dashboards, and management summary templates.",
    order: 16,
    subcategories: [
      { name: "Weekly Reports", slug: "weekly-reports", description: "Weekly progress and H&S report templates with photo sections." },
      { name: "Monthly Reports", slug: "monthly-reports", description: "Monthly project reports and KPI dashboard templates." },
      { name: "Management Reports", slug: "management-reports", description: "Executive summary and RAG status report templates." },
    ],
  },

  // ── 17. HANDOVER & COMPLETION ──
  {
    name: "Handover & Completion",
    slug: "handover-and-completion",
    description: "O&M documentation, practical completion certificates, as-built records, and lessons learned templates.",
    order: 17,
    subcategories: [
      { name: "O&M Documentation", slug: "om-documentation", description: "O&M submission checklists and manual structure templates." },
      { name: "Practical Completion", slug: "practical-completion", description: "Completion certificates and outstanding works register templates." },
      { name: "As-Built Records", slug: "as-built-records", description: "As-built drawing register and submission tracker templates." },
      { name: "Lessons Learned", slug: "lessons-learned", description: "Structured lessons learned registers and post-project review templates." },
      { name: "Handover Packs", slug: "handover-packs", description: "Client handover pack presentations and project closeout briefing templates." },
    ],
  },

  // ═══════════════════════════════════════════════════
  //  TEMPORARY WORKS & ACCESS (18–19)
  // ═══════════════════════════════════════════════════

  // ── 18. TEMPORARY WORKS ──
  {
    name: "Temporary Works",
    slug: "temporary-works",
    description: "BS 5975 temporary works registers, design checklists, formwork, and propping templates.",
    order: 18,
    subcategories: [
      { name: "TW Registers", slug: "tw-registers", description: "TWC/TWS approval trackers and permit to load forms." },
      { name: "Design Checklists", slug: "design-checklists", description: "BS 5975 category classification forms and TW design brief templates." },
      { name: "Specific TW Types", slug: "specific-tw-types", description: "Formwork checklists, propping schedules, and trench support inspection forms." },
      { name: "TW Awareness", slug: "tw-awareness", description: "Temporary works awareness training presentations and BS 5975 overview briefing templates." },
    ],
  },

  // ── 19. SCAFFOLDING ── (NEW)
  {
    name: "Scaffolding",
    slug: "scaffolding",
    description: "Scaffold erection records, inspection registers, design certificates, and handover templates. TG20 and SG4 aligned.",
    order: 19,
    subcategories: [
      { name: "Scaffold Inspection", slug: "scaffold-inspection", description: "7-day scaffold inspection registers, NASC SG4 checklists, and scafftag log templates." },
      { name: "Scaffold Design", slug: "scaffold-design", description: "TG20 compliance checklists, scaffold design brief forms, and loading notice templates." },
      { name: "Erection & Dismantling", slug: "erection-and-dismantling", description: "Scaffold erection sequence records, handover certificates, and dismantling method statement templates." },
      { name: "System Scaffolding", slug: "system-scaffolding", description: "System scaffold inspection forms, MEWP scaffold platform checklists, and birdcage scaffold records." },
      { name: "Scaffold Safety", slug: "scaffold-safety", description: "Scaffold safety awareness presentations and general scaffolding safety briefing templates." },
    ],
  },

  // ═══════════════════════════════════════════════════
  //  CIVIL & INFRASTRUCTURE WORKS (20–27)
  // ═══════════════════════════════════════════════════

  // ── 20. CIVILS & EARTHWORKS ──
  {
    name: "Civils & Earthworks",
    slug: "civils-and-earthworks",
    description: "Concrete pour records, earthworks approvals, piling logs, drainage test records, and surfacing templates.",
    order: 20,
    subcategories: [
      // — Existing —
      { name: "Concrete Works", slug: "concrete-works", description: "Concrete pour records, cube test registers, and pre-pour checklists." },
      { name: "Earthworks", slug: "earthworks", description: "Compaction test records and earthworks layer approval forms." },
      { name: "Piling", slug: "piling", description: "Pile installation records and pile integrity test registers." },
      { name: "Drainage & Pipework", slug: "drainage-and-pipework", description: "Pipe laying records, air/water test records, and CCTV survey logs." },
      { name: "Roads & Surfacing", slug: "roads-and-surfacing", description: "Bituminous laying records and surfacing temperature logs." },
      // — New from TBT merge —
      { name: "Ground Improvement", slug: "ground-improvement", description: "Ground treatment records, geotextile installation logs, and soil stabilisation test forms." },
    ],
  },

  // ── 21. DEMOLITION ── (NEW)
  {
    name: "Demolition",
    slug: "demolition",
    description: "Demolition survey records, pre-demolition checklists, soft strip registers, and method statement templates.",
    order: 21,
    subcategories: [
      { name: "Demolition Planning", slug: "demolition-planning", description: "Pre-demolition survey checklists, structural assessment forms, and demolition sequence plans." },
      { name: "Soft Strip", slug: "soft-strip", description: "Soft strip room-by-room checklists and hazardous material removal registers." },
      { name: "Demolition Records", slug: "demolition-records", description: "Demolition progress records, waste classification logs, and structural monitoring forms." },
    ],
  },

  // ── 22. BURIED SERVICES & UTILITIES ── (NEW)
  {
    name: "Buried Services & Utilities",
    slug: "buried-services",
    description: "Service detection records, CAT & Genny logs, safe digging permits, and utility strike avoidance templates.",
    order: 22,
    subcategories: [
      { name: "Detection & Location", slug: "detection-and-location", description: "CAT & Genny calibration logs, GPR survey records, and service plan request trackers." },
      { name: "Safe Digging", slug: "safe-digging", description: "Safe digging permits, hand dig zone records, and trial hole inspection forms." },
      { name: "Specific Services", slug: "specific-services", description: "Gas main proximity checklists, HV cable crossing records, and fibre optic protection plans." },
    ],
  },

  // ── 23. PIPELINES & PIPEWORK ── (NEW)
  {
    name: "Pipelines & Pipework",
    slug: "pipelines",
    description: "Pipe installation records, pressure test certificates, jointing logs, and pipeline commissioning templates.",
    order: 23,
    subcategories: [
      { name: "Pipe Installation", slug: "pipe-installation", description: "Pipe laying records, bedding and surround inspection forms, and joint check registers." },
      { name: "Pressure Testing", slug: "pressure-testing", description: "Hydrostatic pressure test certificates, air test records, and leak detection logs." },
      { name: "Materials & Jointing", slug: "materials-and-jointing", description: "Pipe material compliance registers, fusion welding records, and flange torque logs." },
    ],
  },

  // ── 24. HIGHWAYS & ROAD WORKS ── (NEW)
  {
    name: "Highways & Road Works",
    slug: "highways",
    description: "Road works planning templates, Chapter 8 signing and guarding records, and highway authority notification forms.",
    order: 24,
    subcategories: [
      { name: "Road Works Planning", slug: "road-works-planning", description: "NRSWA Section 58/58A notice trackers, road space booking forms, and permit scheme applications." },
      { name: "Signing & Guarding", slug: "signing-and-guarding", description: "Chapter 8 layout checklists, temporary traffic signal records, and guarding inspection forms." },
      { name: "Surface Works", slug: "surface-works", description: "Reinstatement records, core sample logs, and highway surfacing temperature check sheets." },
    ],
  },

  // ── 25. REMEDIATION & CONTAMINATED LAND ── (NEW)
  {
    name: "Remediation & Contaminated Land",
    slug: "remediation",
    description: "Contaminated land assessment records, remediation verification templates, and material management plan forms.",
    order: 25,
    subcategories: [
      { name: "Site Investigation", slug: "site-investigation", description: "Contamination screening checklists, soil sample chain of custody forms, and groundwater monitoring records." },
      { name: "Remediation Works", slug: "remediation-works", description: "Remediation method statement templates, verification plan forms, and clean cover system records." },
      { name: "Material Management", slug: "material-management", description: "CL:AIRE MMP declaration forms, materials tracking registers, and waste classification records." },
    ],
  },

  // ── 26. BUILDING & STRUCTURAL WORKS ── (NEW)
  {
    name: "Building & Structural Works",
    slug: "building-and-structural",
    description: "Masonry, carpentry, roofing, and structural installation record templates for building works.",
    order: 26,
    subcategories: [
      { name: "Masonry", slug: "masonry", description: "Brickwork and blockwork inspection checklists, mortar mix records, and cavity wall tie installation logs." },
      { name: "Carpentry & Joinery", slug: "carpentry", description: "Timber frame erection records, structural timber inspection forms, and first fix check sheets." },
      { name: "Roofing", slug: "roofing", description: "Roof covering inspection checklists, batten gauge records, and flat roof installation logs." },
      { name: "Structural Steel", slug: "structural-steel", description: "Steel erection sequence records, bolt torque check sheets, and structural connection inspection forms." },
      { name: "Building Envelope", slug: "building-envelope", description: "Cladding installation records, curtain walling inspection forms, and window/door installation checklists." },
    ],
  },

  // ── 27. SURVEYS & SETTING OUT ──
  {
    name: "Surveys & Setting Out",
    slug: "surveys-and-setting-out",
    description: "Setting out records, control point registers, and ground monitoring templates.",
    order: 27,
    subcategories: [
      { name: "Setting Out", slug: "setting-out", description: "Coordinate and level log templates and survey control station registers." },
      { name: "Monitoring", slug: "monitoring", description: "Settlement monitoring records and groundwater level/quality logs." },
    ],
  },

  // ═══════════════════════════════════════════════════
  //  SPECIALIST WORKS (28–31)
  // ═══════════════════════════════════════════════════

  // ── 28. MEICA ──
  {
    name: "MEICA",
    slug: "meica",
    description: "Mechanical, electrical, instrumentation, and process installation templates for commissioning, testing, and installation.",
    order: 28,
    subcategories: [
      // — Existing —
      { name: "Mechanical", slug: "mechanical", description: "Pipework pressure test records, valve schedules, and pump installation checklists." },
      { name: "Electrical", slug: "electrical", description: "Cable schedules, BS 7671 test certificates, and isolation certificate templates." },
      { name: "ICA (Instrumentation)", slug: "ica-instrumentation", description: "Instrument schedules and loop check record templates." },
      { name: "Commissioning", slug: "commissioning", description: "Commissioning programmes, SAT/FAT records, and commissioning checklist templates." },
      // — New from TBT merge —
      { name: "Process", slug: "process", description: "Process flow verification records, chemical dosing commissioning forms, and process control check sheets." },
    ],
  },

  // ── 29. WELDING & FABRICATION ── (NEW)
  {
    name: "Welding & Fabrication",
    slug: "welding",
    description: "Welding procedure records, welder qualification registers, NDT reports, and fabrication inspection templates.",
    order: 29,
    subcategories: [
      { name: "Welding Records", slug: "welding-records", description: "Weld map registers, welding procedure specification (WPS) forms, and weld visual inspection records." },
      { name: "Welder Qualifications", slug: "welder-qualifications", description: "Welder approval registers, coded welder competence trackers, and revalidation log templates." },
      { name: "NDT & Inspection", slug: "ndt-and-inspection", description: "NDT request forms, radiographic test reports, and MPI/DPI inspection records." },
    ],
  },

  // ── 30. WASTEWATER TREATMENT ── (NEW)
  {
    name: "Wastewater Treatment",
    slug: "wastewater-treatment",
    description: "Process area safe systems, WwTW commissioning records, and water industry specific compliance templates.",
    order: 30,
    subcategories: [
      { name: "Process Areas", slug: "process-areas", description: "Confined space entry records for tanks and chambers, biological process area checklists, and chemical dosing safety forms." },
      { name: "WwTW Commissioning", slug: "wwtw-commissioning", description: "Treatment works commissioning checklists, process proving records, and consent compliance monitoring logs." },
      { name: "Sludge & Biosolids", slug: "sludge-and-biosolids", description: "Sludge handling risk assessments, tanker loading checklists, and biosolids compliance record templates." },
      { name: "Water Industry Compliance", slug: "water-industry-compliance", description: "EA consent monitoring logs, WIRS registration trackers, and water hygiene assessment templates." },
    ],
  },

  // ── 31. CONCRETE & FORMWORK ── (NEW)
  {
    name: "Concrete & Formwork",
    slug: "concrete-and-formwork",
    description: "Formwork design checklists, striking records, concrete mix design approvals, and rebar inspection templates.",
    order: 31,
    subcategories: [
      { name: "Formwork", slug: "formwork", description: "Formwork inspection checklists, striking time records, and formwork design brief templates." },
      { name: "Reinforcement", slug: "reinforcement", description: "Rebar inspection records, bar bending schedules, and pre-pour reinforcement checklists." },
      { name: "Concrete Placement", slug: "concrete-placement", description: "Concrete mix design approval forms, pour sequence plans, and curing record templates." },
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
