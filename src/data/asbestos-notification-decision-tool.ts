// src/data/asbestos-notification-decision-tool.ts
// Asbestos Notification Decision Tool -- Full CAR 2012 decision tree
// Covers: building age, survey types, ACM identification, work categories,
// licensed/NNLW/non-licensed determination, ASB5 notification, 4-stage clearance,
// duty holder responsibilities, and analyst requirements.

// ─── Types ───────────────────────────────────────────────────────

export interface TreeNode {
  id: string;
  question: string;
  helpText?: string;
  regulation?: string;
  options: TreeOption[];
}

export interface TreeOption {
  label: string;
  description?: string;
  nextNodeId?: string;
  terminalId?: string;
}

export interface TerminalResult {
  id: string;
  category: "licensed" | "nnlw" | "non-licensed" | "no-work" | "survey-required";
  title: string;
  description: string;
  notificationRequired: boolean;
  notificationType?: string;
  notificationDeadlineDays?: number;
  notificationBody?: string;
  analystRequired: boolean;
  fourStageClearance: boolean;
  clearanceStages?: string[];
  dutyHolders: DutyHolder[];
  recordKeeping: string;
  regulations: string[];
  additionalNotes?: string[];
  actions: string[];
}

export interface DutyHolder {
  role: string;
  duties: string[];
}

export interface DecisionPathStep {
  nodeId: string;
  question: string;
  selectedOption: string;
  regulation?: string;
}

// ─── ACM Types ───────────────────────────────────────────────────

export const ACM_TYPES = [
  { id: "sprayed-coatings", name: "Sprayed coatings (limpet asbestos)", riskLevel: "high", licensable: true, description: "Sprayed asbestos coatings on structural steelwork, ceilings, and walls. Typically contains crocidolite or amosite." },
  { id: "lagging", name: "Pipe and boiler lagging", riskLevel: "high", licensable: true, description: "Thermal insulation on pipes, boilers, vessels, and ducts. Often contains amosite or crocidolite." },
  { id: "aib", name: "Asbestos insulating board (AIB)", riskLevel: "high", licensable: true, description: "Used in fire breaks, ceiling tiles, partition walls, door panels, and column casings. Contains amosite and/or chrysotile." },
  { id: "cement-sheets", name: "Asbestos cement sheets/products", riskLevel: "medium", licensable: false, description: "Corrugated roofing, flat sheets, downpipes, gutters, flue pipes, water tanks. Typically chrysotile at 10-15%." },
  { id: "textured-coatings", name: "Textured coatings (Artex-type)", riskLevel: "low", licensable: false, description: "Decorative textured coatings on walls and ceilings. Typically chrysotile at 1-5%. Pre-2000 Artex may contain asbestos." },
  { id: "floor-tiles", name: "Vinyl floor tiles and backing", riskLevel: "low", licensable: false, description: "Thermoplastic and PVC floor tiles, paper backing on vinyl sheet. Typically chrysotile at 10-25%." },
  { id: "gaskets", name: "Gaskets, washers, and rope seals", riskLevel: "low", licensable: false, description: "Used in plant, pipework flanges, boilers, and flue systems. Chrysotile or crocidolite." },
  { id: "bitumen", name: "Bitumen-based products", riskLevel: "low", licensable: false, description: "Roofing felt, DPC, flashings, gutter linings. Typically chrysotile at 5-10%." },
  { id: "millboard", name: "Millboard and paper products", riskLevel: "medium", licensable: false, description: "Heat-resistant boards behind heaters, in fuse boxes, under windowsills. Chrysotile or amosite." },
  { id: "rope-yarn", name: "Rope, yarn, and woven textiles", riskLevel: "low", licensable: false, description: "Used in pipe jointing, boiler and flue seals, fire blankets, and electrical cable insulation." },
  { id: "loose-fill", name: "Loose-fill insulation", riskLevel: "high", licensable: true, description: "Loose asbestos fibre used as cavity wall or loft insulation. Extremely friable, high fibre release." },
  { id: "toilet-cisterns", name: "Toilet cisterns and seats", riskLevel: "low", licensable: false, description: "Moulded asbestos cement cisterns and seats found in older buildings." },
  { id: "brake-clutch", name: "Brake and clutch linings", riskLevel: "low", licensable: false, description: "Found in older vehicles, plant, and machinery. Chrysotile." },
  { id: "mastics-sealants", name: "Mastics, sealants, and putties", riskLevel: "low", licensable: false, description: "Window putty, bath sealant, floor adhesive, roofing mastic. Various fibre types." },
  { id: "reinforced-plastics", name: "Reinforced plastics and resins", riskLevel: "low", licensable: false, description: "Electrical switchgear, distribution boards, composite panels." },
  { id: "coating-paint", name: "Asbestos-containing paints and coatings", riskLevel: "low", licensable: false, description: "Bituminous paint, anti-condensation coatings, fire-retardant coatings." },
];

// ─── Survey Types ────────────────────────────────────────────────

export const SURVEY_TYPES = [
  { id: "management", name: "Management Survey", description: "Locates ACMs likely to be disturbed during normal occupancy and maintenance. Formerly Type 2. Minimum requirement for all non-domestic buildings.", regulation: "CAR 2012 Reg 4" },
  { id: "refurb-demo", name: "Refurbishment and Demolition Survey (R&D)", description: "Fully intrusive survey required before any refurbishment or demolition work. Locates ALL ACMs including those hidden behind walls, above ceilings, and within structures. Formerly Type 3.", regulation: "CAR 2012 Reg 7" },
  { id: "targeted", name: "Targeted/Localised Survey", description: "Focused survey of a specific area before planned intrusive work. Can be part of a wider management survey or standalone.", regulation: "HSG264" },
  { id: "none", name: "No survey conducted", description: "No asbestos survey has been carried out. A survey is required before any work on pre-2000 buildings.", regulation: "CAR 2012 Reg 4 & 5" },
];

// ─── Terminal Results ────────────────────────────────────────────

export const TERMINAL_RESULTS: Record<string, TerminalResult> = {
  "licensed-work": {
    id: "licensed-work",
    category: "licensed",
    title: "LICENSED WORK -- HSE Licensed Contractor Required",
    description: "This work involves high-risk ACMs and must be carried out by an HSE-licensed asbestos removal contractor. ASB5 notification to the relevant enforcing authority is mandatory at least 14 days before work begins.",
    notificationRequired: true,
    notificationType: "ASB5 Notification to HSE/Local Authority",
    notificationDeadlineDays: 14,
    notificationBody: "HSE (for construction sites) or Local Authority Environmental Health (for non-construction premises)",
    analystRequired: true,
    fourStageClearance: true,
    clearanceStages: [
      "Stage 1 -- Preliminary check of site condition and completeness by licensed contractor",
      "Stage 2 -- Visual inspection by UKAS-accredited analyst. All ACM removed, surfaces cleaned, no visible debris.",
      "Stage 3 -- Air monitoring by UKAS-accredited analyst. Reassurance air test to confirm fibre levels below 0.01 f/ml clearance indicator.",
      "Stage 4 -- Final assessment by analyst. Certificate of Reoccupation issued. Site handed back for normal use.",
    ],
    dutyHolders: [
      { role: "Duty holder / Client", duties: ["Commission R&D survey before work", "Appoint HSE-licensed contractor", "Ensure ASB5 submitted 14 days before start", "Provide asbestos register to contractor", "Ensure plan of work prepared (CAR Reg 7)", "Ensure adequate welfare facilities provided", "Ensure medical surveillance records available"] },
      { role: "HSE-Licensed Contractor", duties: ["Prepare plan of work (CAR Reg 7)", "Submit ASB5 notification", "Provide adequate training and supervision", "Implement exposure controls (RPE, enclosures, decontamination)", "Arrange medical surveillance for workers (CAR Reg 22)", "Dispose of waste as special/hazardous waste", "Commission 4-stage clearance"] },
      { role: "UKAS-Accredited Analyst", duties: ["Conduct 4-stage clearance procedure", "Perform reassurance air monitoring", "Issue Certificate of Reoccupation", "Maintain air monitoring records for 40 years (CAR Reg 19)"] },
      { role: "Principal Contractor (CDM)", duties: ["Ensure asbestos work is included in construction phase plan", "Coordinate with licensed contractor", "Ensure site segregation and exclusion zones", "Manage interfaces with other trades"] },
      { role: "Principal Designer (CDM)", duties: ["Identify asbestos risks in pre-construction information", "Ensure R&D survey commissioned before design work", "Include asbestos management in health and safety file"] },
    ],
    recordKeeping: "Records must be kept for 40 years (CAR 2012 Reg 19). This includes: plan of work, ASB5 notification, air monitoring results, medical surveillance records, waste consignment notes, 4-stage clearance certificates, and training records.",
    regulations: [
      "Control of Asbestos Regulations 2012 Reg 7 -- Plans of work",
      "CAR 2012 Reg 8 -- Licensing of work with asbestos",
      "CAR 2012 Reg 9 -- Notification of work with asbestos (ASB5)",
      "CAR 2012 Reg 10 -- Information, instruction, and training",
      "CAR 2012 Reg 11 -- Prevention or reduction of exposure",
      "CAR 2012 Reg 16 -- Air monitoring",
      "CAR 2012 Reg 17 -- Standards for air testing and site clearance",
      "CAR 2012 Reg 19 -- Record keeping (40 years)",
      "CAR 2012 Reg 22 -- Medical surveillance",
      "CAR 2012 Reg 23 -- Washing and changing facilities",
      "Hazardous Waste Regulations 2005 -- Waste disposal",
      "HSG248 -- Analysts Guide",
      "HSG247 -- Asbestos: The Licensed Contractors Guide",
    ],
    additionalNotes: [
      "Work must NOT commence until 14 days after ASB5 notification is received by the enforcing authority (unless waiver granted).",
      "The 14-day period can be waived by HSE in emergencies, but the ASB5 must still be submitted.",
      "All workers must hold a valid asbestos medical certificate.",
      "Air monitoring is mandatory during licensed work (CAR Reg 16).",
      "The control limit is 0.1 fibres per cm3 averaged over a continuous 4-hour period (CAR Reg 2).",
      "Waste must be double-bagged in red-striped asbestos waste bags and disposed of at a licensed facility.",
      "Decontamination units (DCU) must be provided with shower, dirty end, and clean end.",
    ],
    actions: [
      "Commission a Refurbishment and Demolition (R&D) survey if not already done",
      "Appoint an HSE-licensed asbestos removal contractor",
      "Ensure the contractor submits ASB5 notification at least 14 days before work starts",
      "Verify all workers have valid asbestos medical certificates",
      "Ensure a written plan of work is prepared before any work begins",
      "Set up exclusion zone with appropriate signage and barriers",
      "Ensure decontamination unit (DCU) is on site",
      "Appoint a UKAS-accredited analyst for air monitoring and 4-stage clearance",
      "Notify the principal contractor (if CDM applies) to coordinate with other trades",
      "Arrange hazardous waste disposal with a licensed waste carrier",
      "Update the asbestos register after work is complete",
      "File all records for 40 years (CAR Reg 19)",
    ],
  },
  "nnlw": {
    id: "nnlw",
    category: "nnlw",
    title: "NOTIFIABLE NON-LICENSED WORK (NNLW)",
    description: "This work does not require a licensed contractor but IS notifiable. ASB5 notification must be submitted to the relevant enforcing authority before work begins. Workers must be under medical surveillance and the work must be brief and controlled.",
    notificationRequired: true,
    notificationType: "ASB5 Notification (NNLW)",
    notificationDeadlineDays: 0,
    notificationBody: "HSE (for construction sites) or Local Authority Environmental Health. Notification must be submitted BEFORE work starts (no 14-day waiting period for NNLW).",
    analystRequired: false,
    fourStageClearance: false,
    clearanceStages: [
      "Visual inspection after work by a competent person (not necessarily UKAS analyst).",
      "Thorough cleaning of the work area.",
      "Visual confirmation that all debris has been removed.",
    ],
    dutyHolders: [
      { role: "Duty holder / Client", duties: ["Commission appropriate survey", "Appoint competent contractor (does not need HSE licence)", "Ensure ASB5 submitted before work starts", "Provide asbestos register to contractor"] },
      { role: "Contractor", duties: ["Prepare brief written plan of work", "Submit ASB5 notification before work starts", "Ensure workers have asbestos awareness training (minimum)", "Provide appropriate RPE and PPE", "Keep work duration short and controlled", "Ensure medical surveillance for workers (CAR Reg 22)", "Dispose of waste as hazardous waste", "Keep exposure records for 40 years"] },
      { role: "Competent Person", duties: ["Conduct visual inspection after work", "Confirm area is clean and safe for reoccupation"] },
    ],
    recordKeeping: "Records must be kept for 40 years (CAR 2012 Reg 19). This includes: ASB5 notification, written plan of work, medical surveillance records, waste consignment notes, and training records.",
    regulations: [
      "CAR 2012 Reg 3(2) -- Definition of notifiable non-licensed work",
      "CAR 2012 Reg 7 -- Plans of work",
      "CAR 2012 Reg 9 -- Notification (ASB5)",
      "CAR 2012 Reg 10 -- Information, instruction, and training",
      "CAR 2012 Reg 11 -- Prevention or reduction of exposure",
      "CAR 2012 Reg 19 -- Record keeping (40 years)",
      "CAR 2012 Reg 22 -- Medical surveillance",
      "HSG210 -- Asbestos Essentials",
    ],
    additionalNotes: [
      "NNLW does NOT require a 14-day waiting period -- but ASB5 must be submitted BEFORE work starts.",
      "NNLW typically covers short-duration work on materials like asbestos cement, textured coatings, and floor tiles.",
      "The work must be sporadic and of low intensity.",
      "If exposure cannot be clearly kept below the control limit, the work should be treated as licensed.",
      "Workers must have at minimum asbestos awareness training, but competent person training is recommended.",
      "Medical surveillance must be offered to workers.",
    ],
    actions: [
      "Submit ASB5 notification before work starts (no 14-day wait required)",
      "Prepare a brief written plan of work",
      "Ensure all workers have asbestos awareness training (minimum)",
      "Provide appropriate RPE (minimum FFP3 mask) and disposable overalls",
      "Wet the material to suppress fibre release",
      "Use controlled removal techniques (no power tools, no dry sweeping)",
      "Double-bag waste in red-striped asbestos waste bags",
      "Arrange hazardous waste disposal",
      "Conduct visual inspection after work",
      "Ensure medical surveillance offered to workers",
      "Update the asbestos register",
      "Keep records for 40 years",
    ],
  },
  "non-licensed": {
    id: "non-licensed",
    category: "non-licensed",
    title: "NON-LICENSED WORK -- No Notification Required",
    description: "This work can be carried out by a competent (non-licensed) contractor without ASB5 notification. However, a plan of work is still required, workers must be trained, and all precautions must be taken to minimise fibre release.",
    notificationRequired: false,
    analystRequired: false,
    fourStageClearance: false,
    dutyHolders: [
      { role: "Duty holder / Client", duties: ["Commission appropriate survey", "Appoint competent contractor", "Provide asbestos register to contractor"] },
      { role: "Contractor", duties: ["Prepare written plan of work", "Ensure workers have asbestos awareness training", "Provide appropriate RPE and PPE", "Use controlled removal techniques", "Dispose of waste as hazardous waste"] },
    ],
    recordKeeping: "Maintain records of the work carried out, waste disposal, and training records. While the 40-year retention is not mandatory for non-licensed work, it is best practice.",
    regulations: [
      "CAR 2012 Reg 3(1) -- Non-licensed work",
      "CAR 2012 Reg 5 -- Identification of asbestos",
      "CAR 2012 Reg 7 -- Plans of work",
      "CAR 2012 Reg 10 -- Information, instruction, and training",
      "CAR 2012 Reg 11 -- Prevention or reduction of exposure",
      "HSG210 -- Asbestos Essentials task sheets",
    ],
    additionalNotes: [
      "Even though this is non-licensed work, ALL precautions must still be taken to minimise exposure.",
      "Workers must have at minimum asbestos awareness training.",
      "Appropriate RPE (minimum FFP3 disposable mask) and disposable overalls should be worn.",
      "Waste must still be treated as hazardous waste and disposed of at a licensed facility.",
      "If in doubt about the work category, always treat as the higher risk category.",
    ],
    actions: [
      "Prepare a written plan of work",
      "Ensure all workers have asbestos awareness training",
      "Provide RPE (minimum FFP3) and disposable overalls",
      "Wet the material before and during removal",
      "Do NOT use power tools on asbestos-containing materials",
      "Double-bag waste in appropriate asbestos waste bags",
      "Arrange hazardous waste disposal with licensed carrier",
      "Clean the area thoroughly after work (damp wiping, type H vacuum)",
      "Update the asbestos register",
    ],
  },
  "survey-required": {
    id: "survey-required",
    category: "survey-required",
    title: "ASBESTOS SURVEY REQUIRED BEFORE PROCEEDING",
    description: "An asbestos survey must be carried out before any work can proceed on this building. The type of survey depends on the planned work. All non-domestic buildings built or refurbished before 2000 must have an asbestos management survey as a minimum.",
    notificationRequired: false,
    analystRequired: false,
    fourStageClearance: false,
    dutyHolders: [
      { role: "Duty holder / Client", duties: ["Commission an asbestos survey from a UKAS-accredited surveyor", "Do NOT allow any intrusive work until survey is complete", "Provide survey results to all contractors and designers"] },
    ],
    recordKeeping: "The asbestos survey report becomes part of the asbestos register and must be maintained for the life of the building.",
    regulations: [
      "CAR 2012 Reg 4 -- Duty to manage asbestos in non-domestic premises",
      "CAR 2012 Reg 5 -- Identification of the presence of asbestos",
      "HSG264 -- Asbestos: The Survey Guide",
    ],
    additionalNotes: [
      "Management Survey: required for all non-domestic buildings. Locates ACMs likely to be disturbed during normal occupancy.",
      "R&D Survey: required before any refurbishment or demolition. Fully intrusive -- may require temporary vacation of the building.",
      "The surveyor must be UKAS-accredited to ISO 17020.",
      "If asbestos is suspected but cannot be confirmed, presume it contains asbestos until proven otherwise (CAR Reg 5).",
    ],
    actions: [
      "STOP all planned intrusive work immediately",
      "Commission an asbestos survey from a UKAS-accredited surveyor",
      "Determine survey type: Management Survey for general management, R&D Survey for refurbishment/demolition",
      "Do NOT disturb any suspected ACMs until survey results are available",
      "Brief all site personnel on the presumption of asbestos",
      "Once survey is complete, reassess the work category using this tool",
    ],
  },
  "no-asbestos-risk": {
    id: "no-asbestos-risk",
    category: "no-work",
    title: "LOW ASBESTOS RISK -- Standard Precautions",
    description: "Based on the information provided, this building/work has a low risk of asbestos exposure. However, always remain vigilant -- if unexpected materials are discovered during work, stop immediately and reassess.",
    notificationRequired: false,
    analystRequired: false,
    fourStageClearance: false,
    dutyHolders: [
      { role: "All workers", duties: ["Complete asbestos awareness training", "Know how to recognise potential ACMs", "Stop work and report if unexpected materials are discovered"] },
    ],
    recordKeeping: "Record the basis for the low-risk determination. Maintain awareness training records.",
    regulations: [
      "CAR 2012 Reg 10 -- Asbestos awareness training required for all workers who may disturb ACMs",
    ],
    additionalNotes: [
      "Buildings constructed entirely after 2000 are very unlikely to contain asbestos, but imported materials or contaminated land may still pose a risk.",
      "If ANY suspect material is found during work, STOP immediately and arrange for sampling.",
      "All workers on construction sites should have asbestos awareness training regardless of asbestos risk level.",
    ],
    actions: [
      "Ensure all workers have completed asbestos awareness training",
      "Brief workers on the 'stop and report' procedure for unexpected materials",
      "Proceed with planned work using standard precautions",
      "If suspect material is discovered, stop work and arrange for sampling",
    ],
  },
};

// ─── Decision Tree Nodes ─────────────────────────────────────────

export const DECISION_NODES: TreeNode[] = [
  {
    id: "age-1",
    question: "When was the building (or the relevant part of the building) constructed or last refurbished?",
    helpText: "The UK banned all use of asbestos in 1999. Buildings constructed entirely after 2000 are very unlikely to contain asbestos. However, buildings refurbished before 2000 may have ACMs even if originally built later. If in doubt, select 'Before 2000 / Unknown'.",
    regulation: "CAR 2012 Reg 4 & 5",
    options: [
      { label: "Before 2000 or unknown", description: "Built or refurbished before the UK asbestos ban", nextNodeId: "survey-1" },
      { label: "After 2000 (confirmed)", description: "Entirely constructed after the UK asbestos ban with no pre-2000 components", nextNodeId: "post-2000" },
    ],
  },
  {
    id: "post-2000",
    question: "Even though the building was constructed after 2000, could any of the following apply?",
    helpText: "Some post-2000 buildings may still have asbestos risk from imported materials, contaminated land, or re-used components from older buildings.",
    options: [
      { label: "No -- entirely new construction with no legacy materials", terminalId: "no-asbestos-risk" },
      { label: "Yes -- imported materials, re-used components, or contaminated land may be present", nextNodeId: "survey-1" },
      { label: "Not sure", nextNodeId: "survey-1" },
    ],
  },
  {
    id: "survey-1",
    question: "Has an asbestos survey been carried out for the building or the area where work is planned?",
    helpText: "Under CAR 2012 Reg 4, the duty holder must manage asbestos in non-domestic premises. This includes commissioning an asbestos survey. Under Reg 5, anyone planning work that could disturb asbestos must identify whether asbestos is present.",
    regulation: "CAR 2012 Reg 4 & 5, HSG264",
    options: [
      { label: "Yes -- Management Survey completed", description: "Formerly Type 2. Locates ACMs likely to be disturbed during normal occupancy", nextNodeId: "survey-adequate" },
      { label: "Yes -- Refurbishment and Demolition (R&D) Survey completed", description: "Formerly Type 3. Fully intrusive survey locating ALL ACMs", nextNodeId: "acm-found" },
      { label: "Yes -- both Management and R&D Survey completed", nextNodeId: "acm-found" },
      { label: "No survey carried out", terminalId: "survey-required" },
      { label: "Survey carried out but results are incomplete or out of date", terminalId: "survey-required" },
    ],
  },
  {
    id: "survey-adequate",
    question: "What type of work are you planning? This determines whether the Management Survey is sufficient or whether an R&D Survey is needed.",
    helpText: "A Management Survey is sufficient for normal maintenance and minor works that are unlikely to disturb ACMs. An R&D Survey is required before any refurbishment or demolition work.",
    regulation: "CAR 2012 Reg 7, HSG264",
    options: [
      { label: "Routine maintenance (no structural disturbance)", description: "Painting, decorating, minor repairs not involving structural elements", nextNodeId: "acm-found" },
      { label: "Minor works (localised disturbance possible)", description: "Installing cables, shelving, minor drilling -- localised area only", nextNodeId: "acm-found" },
      { label: "Refurbishment work", description: "Structural alterations, strip-out, system upgrades -- R&D survey required", nextNodeId: "need-rd-survey" },
      { label: "Demolition (partial or full)", description: "Any demolition work requires R&D survey", nextNodeId: "need-rd-survey" },
    ],
  },
  {
    id: "need-rd-survey",
    question: "An R&D Survey is required for refurbishment or demolition work. Has an R&D Survey been commissioned or completed for the work area?",
    regulation: "CAR 2012 Reg 7, HSG264 Chapter 4",
    options: [
      { label: "Yes -- R&D Survey completed for the work area", nextNodeId: "acm-found" },
      { label: "No -- R&D Survey has not been done", terminalId: "survey-required" },
    ],
  },
  {
    id: "acm-found",
    question: "Did the survey identify any asbestos-containing materials (ACMs) in or near the planned work area?",
    helpText: "Check the asbestos register and survey report. ACMs may be present in areas adjacent to the planned work (e.g. above ceilings, behind walls) even if not directly in the work zone.",
    regulation: "CAR 2012 Reg 5",
    options: [
      { label: "Yes -- ACMs identified in or near the work area", nextNodeId: "acm-type" },
      { label: "No -- survey confirmed no ACMs in or near the work area", terminalId: "no-asbestos-risk" },
      { label: "Presumed ACMs -- materials could not be accessed for sampling", nextNodeId: "acm-type" },
    ],
  },
  {
    id: "acm-type",
    question: "Which type of ACM is present or presumed? Select the HIGHEST risk ACM that will be disturbed by the planned work.",
    helpText: "If multiple ACM types are present, always classify by the highest-risk material. Licensed work is required if ANY licensable ACM will be disturbed.",
    regulation: "CAR 2012 Reg 3 & 8",
    options: [
      { label: "Sprayed coatings (limpet asbestos)", description: "LICENSABLE -- highest risk. Spray-applied thermal/acoustic insulation.", terminalId: "licensed-work" },
      { label: "Pipe/boiler lagging", description: "LICENSABLE -- high risk. Thermal insulation on pipework and boilers.", terminalId: "licensed-work" },
      { label: "Asbestos insulating board (AIB)", description: "LICENSABLE -- high risk. Fire breaks, ceiling tiles, partition walls.", terminalId: "licensed-work" },
      { label: "Loose-fill insulation", description: "LICENSABLE -- extremely friable, high fibre release.", terminalId: "licensed-work" },
      { label: "Asbestos cement products", description: "Roofing sheets, flat sheets, downpipes, flues. May be NNLW or non-licensed.", nextNodeId: "work-method-cement" },
      { label: "Textured coatings (Artex-type)", description: "Decorative coatings. Usually non-licensed or NNLW.", nextNodeId: "work-method-textured" },
      { label: "Floor tiles and vinyl backing", description: "Thermoplastic or PVC tiles. Usually non-licensed.", nextNodeId: "work-method-tiles" },
      { label: "Gaskets, rope seals, or bitumen products", description: "Low-risk ACMs. Usually non-licensed.", nextNodeId: "work-method-low" },
      { label: "Millboard or paper products", description: "Medium-risk. Depends on condition and work method.", nextNodeId: "work-method-millboard" },
      { label: "Other or unknown ACM type", description: "If ACM type cannot be determined, presume highest risk", nextNodeId: "work-method-unknown" },
    ],
  },
  {
    id: "work-method-cement",
    question: "How will the asbestos cement be disturbed during the planned work?",
    helpText: "Asbestos cement in good condition has low fibre release. However, using power tools, breaking, or working on damaged/weathered material significantly increases risk.",
    regulation: "CAR 2012 Reg 3(2), HSG210 Task Sheets",
    options: [
      { label: "Removing whole sheets intact (no breaking)", description: "Controlled removal without cutting or breaking. Bolts unfastened, sheets lowered.", nextNodeId: "nnlw-or-nonlic" },
      { label: "Drilling, cutting, or using power tools", description: "Any mechanical disturbance significantly increases fibre release", terminalId: "nnlw" },
      { label: "Material is in poor condition, damaged, or weathered", description: "Friable or crumbling material", terminalId: "nnlw" },
      { label: "Minor disturbance (sealing, painting over, encapsulation)", description: "No removal -- encapsulating or painting in good condition", terminalId: "non-licensed" },
      { label: "Extensive removal or large quantities", description: "Large-scale removal project", terminalId: "nnlw" },
    ],
  },
  {
    id: "work-method-textured",
    question: "How will the textured coating be disturbed?",
    helpText: "Textured coatings typically contain 1-5% chrysotile. Scraping or sanding creates significant fibre release. Overboarding or painting over is lower risk.",
    regulation: "HSG210 Task Sheet A26",
    options: [
      { label: "Scraping, sanding, or mechanical removal", description: "High fibre release -- generates significant dust", terminalId: "nnlw" },
      { label: "Overboarding (covering with new plasterboard)", description: "Low disturbance -- ACM left in place and encapsulated", terminalId: "non-licensed" },
      { label: "Painting or sealing over (no scraping)", description: "Minimal disturbance", terminalId: "non-licensed" },
      { label: "Steam stripping", description: "Moderate fibre release", terminalId: "nnlw" },
      { label: "Drilling through for fixings (small number)", description: "Very localised disturbance", terminalId: "non-licensed" },
    ],
  },
  {
    id: "work-method-tiles",
    question: "How will the floor tiles/vinyl be disturbed?",
    helpText: "Floor tiles in good condition have low fibre release when carefully lifted. Grinding, sanding, or using power tools significantly increases risk.",
    regulation: "HSG210 Task Sheet A15",
    options: [
      { label: "Carefully lifting intact tiles (no breaking)", description: "Using hand tools to lift tiles whole", terminalId: "non-licensed" },
      { label: "Tiles are bonded and require chipping/scraping", description: "Mechanical disturbance of adhesive or tile", terminalId: "nnlw" },
      { label: "Grinding, sanding, or using power tools on tiles", description: "High fibre release", terminalId: "nnlw" },
      { label: "Overboarding or overlaying (tiles left in place)", description: "No disturbance -- encapsulation", terminalId: "non-licensed" },
    ],
  },
  {
    id: "work-method-low",
    question: "How will the gasket, seal, rope, or bitumen product be disturbed?",
    regulation: "HSG210 Task Sheets",
    options: [
      { label: "Removal of a small number of gaskets/seals by hand", description: "Brief, controlled task", terminalId: "non-licensed" },
      { label: "Cutting or machining rope/yarn material", description: "Generates fibrous dust", terminalId: "nnlw" },
      { label: "Removal of bitumen roofing felt (intact)", description: "Controlled strip and bag", terminalId: "non-licensed" },
      { label: "Scraping or sanding bitumen products", description: "Mechanical disturbance", terminalId: "nnlw" },
    ],
  },
  {
    id: "work-method-millboard",
    question: "How will the millboard or paper product be disturbed?",
    regulation: "HSG210 Task Sheets",
    options: [
      { label: "Removing intact boards by hand (unscrewing, unclipping)", description: "Controlled removal without breaking", nextNodeId: "nnlw-or-nonlic" },
      { label: "Cutting, drilling, or sawing through millboard", description: "Mechanical disturbance", terminalId: "nnlw" },
      { label: "Material is damaged, crumbling, or in poor condition", description: "Friable material", terminalId: "nnlw" },
    ],
  },
  {
    id: "work-method-unknown",
    question: "If the ACM type cannot be determined, the precautionary principle applies. How would you like to proceed?",
    helpText: "Under CAR 2012 Reg 5, if the type of asbestos cannot be identified, it must be presumed to be the most hazardous type (crocidolite/amosite). This means the work should be treated as licensed unless sampling confirms a lower-risk material.",
    regulation: "CAR 2012 Reg 5",
    options: [
      { label: "Treat as licensed work (precautionary)", description: "Safest option -- engage HSE-licensed contractor", terminalId: "licensed-work" },
      { label: "Arrange for sampling to identify ACM type", description: "Send samples to a UKAS-accredited laboratory", terminalId: "survey-required" },
    ],
  },
  {
    id: "nnlw-or-nonlic",
    question: "Will the work be sporadic and of low intensity, with a short duration (no more than 1 hour total in any 7 consecutive days per worker)?",
    helpText: "Per HSE ACOP L143 and CAR 2012 Reg 3(2), work is non-licensed (and not notifiable) only where exposure is sporadic and low intensity AND the total working time on asbestos per worker does not exceed 1 hour in any 7 consecutive days. Longer or more intensive work is NNLW.",
    regulation: "CAR 2012 Reg 3(2), HSE ACOP L143 paras 45–47",
    options: [
      { label: "Yes — ≤1 hour per worker in any 7 consecutive days, sporadic and low intensity", terminalId: "non-licensed" },
      { label: "No — exceeds the 1-hour/7-day threshold, or not sporadic, or higher intensity", terminalId: "nnlw" },
      { label: "Not sure", description: "If in doubt, treat as NNLW (higher category)", terminalId: "nnlw" },
    ],
  },
];

// ─── All nodes for lookup ────────────────────────────────────────

export function getAllNodes(): Record<string, TreeNode> {
  const map: Record<string, TreeNode> = {};
  DECISION_NODES.forEach(n => { map[n.id] = n; });
  return map;
}

// ─── ASB5 Form Fields ────────────────────────────────────────────

export const ASB5_FIELDS = [
  "Name and address of the notifier",
  "Name and address of the premises where work will take place",
  "Brief description of the work to be carried out",
  "Type of asbestos (chrysotile, amosite, crocidolite, or unknown)",
  "Maximum number of workers expected to be involved",
  "Date of commencement of work",
  "Expected duration of the work",
  "Methods to be used for the work",
  "Measures to prevent or reduce exposure",
  "Equipment to be used for protection of workers",
  "Name of the UKAS-accredited analyst (for licensed work)",
  "Name of the waste carrier and disposal site",
];

// ─── Deadline Calculator ─────────────────────────────────────────

export function calculateDeadline(startDate: string, deadlineDays: number): { deadlineDate: string; daysRemaining: number; isOverdue: boolean } | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() - deadlineDays); // notification must be BEFORE start
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return {
    deadlineDate: deadline.toISOString().slice(0, 10),
    daysRemaining: diff,
    isOverdue: diff < 0,
  };
}

// ─── Contact Details ─────────────────────────────────────────────

export const CONTACTS = {
  hseAsbestos: "0345 300 9923",
  hseInfoLine: "0300 003 1747",
  hseOnline: "https://www.hse.gov.uk/asbestos/",
  asb5Online: "https://www.hse.gov.uk/forms/notification/asb5.htm",
  ukasLab: "https://www.ukas.com/find-an-organisation/",
  hseAddress: "Health and Safety Executive, Redgrave Court, Merton Road, Bootle, Merseyside L20 7HS",
};
