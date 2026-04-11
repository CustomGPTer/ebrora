// src/data/riddor-reporting-decision-tool.ts
// RIDDOR Reporting Decision Tool — Full RIDDOR 2013 decision tree
// Covers: deaths, specified injuries, 7-day injuries, non-worker hospital,
// dangerous occurrences (full Schedule 2), reportable diseases (Schedule 1),
// gas incidents (Reg 6(3)), and Gas Safe Register obligations.

// ─── Types ───────────────────────────────────────────────────────

export type IncidentCategory =
  | "death"
  | "injury"
  | "dangerous-occurrence"
  | "disease"
  | "gas-incident";

export interface IncidentCategoryOption {
  id: IncidentCategory;
  label: string;
  description: string;
  icon: string;
  regulation: string;
}

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
  nextNodeId?: string; // undefined = go to terminal
  terminalId?: string; // if set, this option leads to a terminal result
}

export interface TerminalResult {
  id: string;
  reportable: boolean;
  title: string;
  description: string;
  deadline: string;
  deadlineDays?: number; // for date calculation
  deadlineImmediate?: boolean;
  method: string;
  form: string;
  phoneRequired: boolean;
  phoneNumber?: string;
  onlineUrl?: string;
  responsiblePerson: string;
  recordKeeping: string;
  regulations: string[];
  additionalNotes?: string[];
}

export interface DecisionPathStep {
  nodeId: string;
  question: string;
  selectedOption: string;
  regulation?: string;
}

// ─── Incident Categories ─────────────────────────────────────────

export const INCIDENT_CATEGORIES: IncidentCategoryOption[] = [
  {
    id: "death",
    label: "Death",
    description: "Death of any person as a result of a work-related accident, including acts of physical violence",
    icon: "D",
    regulation: "RIDDOR 2013 Reg 6(1)",
  },
  {
    id: "injury",
    label: "Injury",
    description: "Non-fatal injury to a worker or non-worker arising out of or in connection with work",
    icon: "I",
    regulation: "RIDDOR 2013 Regs 4 & 5",
  },
  {
    id: "dangerous-occurrence",
    label: "Dangerous Occurrence",
    description: "An event listed in Schedule 2 of RIDDOR 2013, whether or not anyone was injured",
    icon: "O",
    regulation: "RIDDOR 2013 Reg 7 & Schedule 2",
  },
  {
    id: "disease",
    label: "Occupational Disease",
    description: "A disease listed in Schedule 1 of RIDDOR 2013, diagnosed by a doctor and linked to work activity",
    icon: "X",
    regulation: "RIDDOR 2013 Reg 8 & Schedule 1",
  },
  {
    id: "gas-incident",
    label: "Gas Incident",
    description: "An incident involving piped gas or LPG causing death, injury, or involving a faulty fitting or appliance",
    icon: "G",
    regulation: "RIDDOR 2013 Reg 6(3) & GSIUR 1998",
  },
];

// ─── Terminal Results ────────────────────────────────────────────

export const TERMINAL_RESULTS: Record<string, TerminalResult> = {
  "death-reportable": {
    id: "death-reportable",
    reportable: true,
    title: "REPORTABLE -- Death",
    description: "A death arising from a work-related accident must be reported immediately by the fastest practicable means (telephone), followed by an online report within 10 days.",
    deadline: "IMMEDIATE by telephone, then online form within 10 days",
    deadlineImmediate: true,
    deadlineDays: 10,
    method: "Telephone IMMEDIATELY, then online form",
    form: "Online report via HSE RIDDOR portal",
    phoneRequired: true,
    phoneNumber: "0345 300 9923",
    onlineUrl: "https://www.hse.gov.uk/riddor/report.htm",
    responsiblePerson: "The responsible person is the employer, self-employed person, or person in control of the premises where the work was being carried out (RIDDOR 2013 Reg 3).",
    recordKeeping: "Records must be kept for at least 3 years from the date of the incident (RIDDOR 2013 Reg 12). Records must include the date and method of reporting, the date/time/place of the event, personal details of those involved, and a brief description of the nature of the event.",
    regulations: [
      "RIDDOR 2013 Reg 6(1) -- Notification of deaths",
      "RIDDOR 2013 Reg 6(2) -- Telephone notification for deaths",
      "RIDDOR 2013 Reg 12 -- Record keeping",
      "HSWA 1974 s2 -- General duties of employers",
      "HSWA 1974 s3 -- Duty to non-employees",
      "HSWA 1974 s37 -- Offences by bodies corporate",
    ],
    additionalNotes: [
      "The police must also be notified in cases of workplace death.",
      "The scene must be preserved until the HSE inspector has attended or given permission to disturb it.",
      "If a person dies within one year of a reportable work-related injury, this must also be reported under Reg 6(1).",
      "Consider whether HSWA 1974 s37 applies (offences by directors/managers).",
    ],
  },
  "specified-injury": {
    id: "specified-injury",
    reportable: true,
    title: "REPORTABLE -- Specified Injury (Reg 4)",
    description: "A specified injury to a worker must be reported immediately by the fastest practicable means (telephone), followed by an online report within 10 days.",
    deadline: "IMMEDIATE by telephone, then online form within 10 days",
    deadlineImmediate: true,
    deadlineDays: 10,
    method: "Telephone IMMEDIATELY, then online form",
    form: "F2508 (online via HSE RIDDOR portal)",
    phoneRequired: true,
    phoneNumber: "0345 300 9923",
    onlineUrl: "https://www.hse.gov.uk/riddor/report.htm",
    responsiblePerson: "The responsible person is the employer of the injured person, or the self-employed person, or the person in control of the premises.",
    recordKeeping: "Records must be kept for at least 3 years from the date of the incident. Include date/method of reporting, date/time/place of event, personal details, and nature of injury.",
    regulations: [
      "RIDDOR 2013 Reg 4 -- Specified injuries to workers",
      "RIDDOR 2013 Reg 6(2) -- Immediate telephone notification",
      "RIDDOR 2013 Schedule 1 -- List of specified injuries",
      "RIDDOR 2013 Reg 12 -- Record keeping",
    ],
    additionalNotes: [
      "Specified injuries include: fractures (other than fingers/thumbs/toes), amputation, crush injuries, dislocation of shoulder/hip/knee/spine, loss of sight, chemical/hot metal burn to eye, scalping, any burn or injury leading to hypothermia/heat-induced illness/unconsciousness, any injury requiring resuscitation or admittance to hospital for 24+ hours.",
    ],
  },
  "over-7-day": {
    id: "over-7-day",
    reportable: true,
    title: "REPORTABLE -- Over-7-Day Incapacitation",
    description: "An injury that incapacitates the worker for more than 7 consecutive days (not counting the day of the accident) must be reported online within 15 days of the accident.",
    deadline: "Online form within 15 days of the accident",
    deadlineDays: 15,
    method: "Online form only (no telephone call required)",
    form: "F2508 (online via HSE RIDDOR portal)",
    phoneRequired: false,
    onlineUrl: "https://www.hse.gov.uk/riddor/report.htm",
    responsiblePerson: "The employer of the injured person, the self-employed person, or the person in control of the premises.",
    recordKeeping: "Records must be kept for at least 3 years. The employer's accident book entry may serve as the record if it contains all required information.",
    regulations: [
      "RIDDOR 2013 Reg 4(2) -- Over-7-day incapacitation",
      "RIDDOR 2013 Reg 12 -- Record keeping",
    ],
    additionalNotes: [
      "The 7 days are CONSECUTIVE days, not working days. The day of the accident is NOT counted.",
      "Incapacitation means the worker is unable to do their normal work. This does not necessarily mean they are off work entirely.",
      "If initially reported as an over-7-day injury but later results in death within one year, a further report must be made.",
    ],
  },
  "non-worker-hospital": {
    id: "non-worker-hospital",
    reportable: true,
    title: "REPORTABLE -- Non-Worker Taken to Hospital",
    description: "An accident arising out of or in connection with work that results in a non-worker (e.g. member of the public, visitor) being taken directly to hospital for treatment must be reported online within 10 days.",
    deadline: "Online form within 10 days of the accident",
    deadlineDays: 10,
    method: "Online form only (no telephone call required)",
    form: "F2508 (online via HSE RIDDOR portal)",
    phoneRequired: false,
    onlineUrl: "https://www.hse.gov.uk/riddor/report.htm",
    responsiblePerson: "The person in control of the premises where the accident occurred, or the employer whose work activity caused the accident.",
    recordKeeping: "Records must be kept for at least 3 years from the date of the incident.",
    regulations: [
      "RIDDOR 2013 Reg 5(1) -- Non-fatal injuries to non-workers",
      "RIDDOR 2013 Reg 12 -- Record keeping",
      "HSWA 1974 s3 -- Duty to persons not in employment",
    ],
    additionalNotes: [
      "The person must be taken DIRECTLY to hospital from the scene of the accident. If they go home first and later attend hospital, it is NOT reportable under this provision.",
      "The treatment must be for the injury itself, not just precautionary.",
    ],
  },
  "not-reportable-injury": {
    id: "not-reportable-injury",
    reportable: false,
    title: "NOT REPORTABLE under RIDDOR",
    description: "Based on the information provided, this injury does not meet the threshold for RIDDOR reporting. However, the employer must still record it in the accident book if the injured person is an employee.",
    deadline: "N/A",
    method: "N/A -- record in accident book only",
    form: "N/A",
    phoneRequired: false,
    responsiblePerson: "The employer should still record the incident and investigate the root cause to prevent recurrence.",
    recordKeeping: "Record in the accident book (BI 510 or equivalent). Accident book records must be kept for 3 years. Consider GDPR requirements for data retention.",
    regulations: [
      "Social Security (Claims & Payments) Regulations 1979 Reg 25 -- Accident book requirement",
      "GDPR 2018 -- Data protection for accident records",
    ],
    additionalNotes: [
      "Even though this incident is not RIDDOR-reportable, consider whether it could have been more serious (a 'near miss') and take preventive action.",
      "If the worker is subsequently incapacitated for more than 7 consecutive days, the incident becomes RIDDOR-reportable at that point.",
      "Monitor the injured person's recovery -- if their condition worsens, reassess RIDDOR reporting obligations.",
    ],
  },
  "dangerous-occurrence-reportable": {
    id: "dangerous-occurrence-reportable",
    reportable: true,
    title: "REPORTABLE -- Dangerous Occurrence",
    description: "This dangerous occurrence must be reported immediately by the fastest practicable means (telephone), followed by an online report within 10 days.",
    deadline: "IMMEDIATE by telephone, then online form within 10 days",
    deadlineImmediate: true,
    deadlineDays: 10,
    method: "Telephone IMMEDIATELY, then online form",
    form: "F2508 (online via HSE RIDDOR portal)",
    phoneRequired: true,
    phoneNumber: "0345 300 9923",
    onlineUrl: "https://www.hse.gov.uk/riddor/report.htm",
    responsiblePerson: "The employer, self-employed person, or person in control of the premises. For mines and quarries, the mine/quarry operator.",
    recordKeeping: "Records must be kept for at least 3 years. Include full description of the occurrence, actions taken, and investigation findings.",
    regulations: [
      "RIDDOR 2013 Reg 7 -- Dangerous occurrences",
      "RIDDOR 2013 Schedule 2 -- List of dangerous occurrences",
      "RIDDOR 2013 Reg 6(2) -- Immediate telephone notification",
      "RIDDOR 2013 Reg 12 -- Record keeping",
    ],
    additionalNotes: [
      "Dangerous occurrences are reportable WHETHER OR NOT anyone was injured.",
      "Preserve the scene for investigation where practicable.",
      "Consider whether the occurrence indicates a systemic failure requiring wider action.",
    ],
  },
  "not-dangerous-occurrence": {
    id: "not-dangerous-occurrence",
    reportable: false,
    title: "NOT REPORTABLE as a Dangerous Occurrence",
    description: "Based on the information provided, this event does not match any of the dangerous occurrences listed in Schedule 2 of RIDDOR 2013. However, it should still be investigated as a near miss.",
    deadline: "N/A",
    method: "N/A -- record internally and investigate",
    form: "N/A",
    phoneRequired: false,
    responsiblePerson: "The employer or person in control of the premises should investigate the event as a near miss.",
    recordKeeping: "Record internally for near-miss analysis. Consider health and safety committee review.",
    regulations: [
      "HSWA 1974 s2(2)(e) -- Safe systems of work",
      "Management of H&S at Work Regs 1999 Reg 5 -- Risk assessment review",
    ],
    additionalNotes: [
      "Even though this is not RIDDOR-reportable, it may indicate a significant hazard that requires corrective action.",
      "If anyone WAS injured, assess separately whether the INJURY is reportable.",
    ],
  },
  "disease-reportable": {
    id: "disease-reportable",
    reportable: true,
    title: "REPORTABLE -- Occupational Disease",
    description: "This occupational disease must be reported online as soon as a doctor notifies the employer (or self-employed person) that the worker is suffering from a reportable disease linked to a specified work activity.",
    deadline: "As soon as a written diagnosis is received linking the disease to the work activity",
    deadlineDays: 15,
    method: "Online form",
    form: "F2508A (Disease report, online via HSE RIDDOR portal)",
    phoneRequired: false,
    onlineUrl: "https://www.hse.gov.uk/riddor/report.htm",
    responsiblePerson: "The employer of the affected person, or the self-employed person themselves.",
    recordKeeping: "Records must be kept for at least 3 years. Include diagnosis details, work activity linked, date of diagnosis, and doctor's details.",
    regulations: [
      "RIDDOR 2013 Reg 8 -- Reportable diseases",
      "RIDDOR 2013 Schedule 1 -- List of reportable diseases and linked activities",
      "RIDDOR 2013 Reg 12 -- Record keeping",
    ],
    additionalNotes: [
      "The disease must be BOTH listed in Schedule 1 AND linked to the specified work activity.",
      "A written diagnosis from a registered medical practitioner is required before reporting.",
      "Consider whether COSHH assessments need review following the diagnosis.",
      "Occupational health surveillance records may be relevant.",
    ],
  },
  "not-disease": {
    id: "not-disease",
    reportable: false,
    title: "NOT REPORTABLE as an Occupational Disease",
    description: "Based on the information provided, this condition does not meet the RIDDOR reporting criteria for occupational diseases. It may not be listed in Schedule 1, or may not be linked to a specified work activity.",
    deadline: "N/A",
    method: "N/A",
    form: "N/A",
    phoneRequired: false,
    responsiblePerson: "The employer should still consider occupational health implications and review COSHH/risk assessments.",
    recordKeeping: "Record through occupational health system. Review COSHH assessments and health surveillance programme.",
    regulations: [
      "COSHH Regulations 2002 Reg 11 -- Health surveillance",
      "Management of H&S at Work Regs 1999 Reg 6 -- Health surveillance",
    ],
  },
  "gas-death-injury": {
    id: "gas-death-injury",
    reportable: true,
    title: "REPORTABLE -- Gas Incident (Death or Injury)",
    description: "A gas incident that causes death, loss of consciousness, or requires hospital treatment must be reported BOTH to the HSE under RIDDOR AND to the Gas Safe Register.",
    deadline: "IMMEDIATE by telephone to HSE. Also notify Gas Safe Register.",
    deadlineImmediate: true,
    deadlineDays: 10,
    method: "Telephone HSE IMMEDIATELY, then online form. Also telephone Gas Safe Register.",
    form: "F2508 via HSE RIDDOR portal + Gas Safe Register notification",
    phoneRequired: true,
    phoneNumber: "0345 300 9923 (HSE) and 0800 408 5500 (Gas Safe Register)",
    onlineUrl: "https://www.hse.gov.uk/riddor/report.htm",
    responsiblePerson: "The gas engineer, gas supplier, or person in control of the premises. Landlords have additional duties under GSIUR 1998.",
    recordKeeping: "Records must be kept for at least 3 years. Gas Safe Register will also maintain their own records.",
    regulations: [
      "RIDDOR 2013 Reg 6(3) -- Gas incidents",
      "Gas Safety (Installation and Use) Regulations 1998 Reg 26 -- Duties of employers",
      "GSIUR 1998 Reg 36 -- Landlord duties",
      "HSWA 1974 s3 -- Duty to non-employees",
    ],
    additionalNotes: [
      "Gas Safe Register must be notified separately -- RIDDOR reporting alone is NOT sufficient.",
      "The gas supply should be isolated immediately if safe to do so.",
      "Landlords must ensure annual gas safety checks under GSIUR 1998 Reg 36.",
      "Consider CO (carbon monoxide) exposure -- request blood COHb levels from hospital.",
    ],
  },
  "gas-faulty-fitting": {
    id: "gas-faulty-fitting",
    reportable: true,
    title: "REPORTABLE -- Gas Incident (Faulty Fitting/Appliance)",
    description: "A faulty gas fitting or appliance that could cause death, loss of consciousness, or hospital treatment (whether or not it actually did) must be reported to the Gas Safe Register by the gas engineer.",
    deadline: "Within 14 days of completion of work or discovery of the fault",
    deadlineDays: 14,
    method: "Gas Safe Register notification form",
    form: "Gas Safe Register Unsafe Situations notification",
    phoneRequired: false,
    phoneNumber: "0800 408 5500 (Gas Safe Register)",
    onlineUrl: "https://www.gassaferegister.co.uk/",
    responsiblePerson: "The registered gas engineer who discovered the fault, or the gas supplier.",
    recordKeeping: "The gas engineer must keep records of the unsafe situation found, action taken, and notification to the Gas Safe Register. Copy to the responsible person/landlord.",
    regulations: [
      "RIDDOR 2013 Reg 6(3)(b) -- Gas fittings",
      "GSIUR 1998 Reg 26(1) -- Duty to report unsafe gas fittings",
      "GSIUR 1998 Reg 34 -- Unsafe appliances",
      "IGEM/UP/1B -- Tightness testing and purging procedures",
    ],
    additionalNotes: [
      "The gas engineer must classify the situation using the Gas Industry Unsafe Situations Procedure (GIUSP).",
      "Classifications: Immediately Dangerous (ID), At Risk (AR), Not to Current Standards (NCS).",
      "ID situations require immediate disconnection or isolation.",
      "AR situations require a warning notice and the user must be informed.",
    ],
  },
  "gas-not-reportable": {
    id: "gas-not-reportable",
    reportable: false,
    title: "NOT REPORTABLE as a Gas Incident",
    description: "Based on the information provided, this does not meet the RIDDOR or Gas Safe Register reporting thresholds for gas incidents.",
    deadline: "N/A",
    method: "N/A",
    form: "N/A",
    phoneRequired: false,
    responsiblePerson: "The person in control of the premises should still arrange for the gas system to be inspected by a Gas Safe registered engineer.",
    recordKeeping: "Record internally. Consider commissioning a gas safety inspection.",
    regulations: [
      "GSIUR 1998 Reg 3 -- Duties of employers of gas engineers",
      "GSIUR 1998 Reg 34 -- Qualification requirements",
    ],
  },
};

// ─── Decision Tree Nodes ─────────────────────────────────────────

// INJURY pathway
export const INJURY_NODES: TreeNode[] = [
  {
    id: "inj-1",
    question: "Is the injured person a worker (employee, contractor, self-employed working on the premises) or a non-worker (member of the public, visitor, customer, bystander)?",
    helpText: "A 'worker' includes employees, agency workers, and self-employed persons working under someone else's control. A 'non-worker' includes members of the public, visitors, patients, students (in some cases), and bystanders.",
    regulation: "RIDDOR 2013 Regs 4 & 5",
    options: [
      { label: "Worker", description: "Employee, agency worker, contractor, or self-employed person", nextNodeId: "inj-2" },
      { label: "Non-worker", description: "Member of the public, visitor, customer, bystander", nextNodeId: "inj-nonworker" },
    ],
  },
  {
    id: "inj-2",
    question: "Is the injury a 'specified injury' as defined in RIDDOR 2013 Regulation 4?",
    helpText: "Specified injuries include: fractures (other than fingers, thumbs or toes), amputation of an arm/hand/finger/thumb/leg/foot/toe, permanent loss or reduction of sight, crush injuries leading to internal organ damage, scalping requiring hospital treatment, burns or scalding covering more than 10% of the body or causing significant damage to eyes/respiratory system/other vital organs, loss of consciousness caused by head injury or asphyxia, and any other injury arising from working in an enclosed space which leads to hypothermia/heat-induced illness or requires resuscitation or admittance to hospital for more than 24 hours.",
    regulation: "RIDDOR 2013 Reg 4(1) & Schedule 1",
    options: [
      { label: "Yes -- specified injury", description: "Fracture, amputation, loss of sight, crush injury, scalping, serious burn, loss of consciousness, or enclosed space injury", terminalId: "specified-injury" },
      { label: "No -- not a specified injury", nextNodeId: "inj-3" },
      { label: "Not sure", description: "I need to see the full list of specified injuries", nextNodeId: "inj-specified-list" },
    ],
  },
  {
    id: "inj-specified-list",
    question: "Does the injury match ANY of the following specified injuries?",
    helpText: "Select the one that best matches the injury sustained. If none match, select 'None of the above'.",
    regulation: "RIDDOR 2013 Reg 4(1) & Schedule 1",
    options: [
      { label: "Fracture (not fingers/thumbs/toes)", description: "Any bone other than a finger, thumb or toe", terminalId: "specified-injury" },
      { label: "Amputation of arm, hand, finger, thumb, leg, foot or toe", terminalId: "specified-injury" },
      { label: "Permanent loss or reduction of sight", terminalId: "specified-injury" },
      { label: "Crush injury leading to internal organ damage", terminalId: "specified-injury" },
      { label: "Scalping requiring hospital treatment", description: "Separation of skin from the head", terminalId: "specified-injury" },
      { label: "Burn covering >10% of body or damage to eyes/respiratory/vital organs", terminalId: "specified-injury" },
      { label: "Loss of consciousness from head injury or asphyxia", terminalId: "specified-injury" },
      { label: "Injury from enclosed space causing hypothermia, heat illness, or requiring resuscitation/24hr+ hospital admission", terminalId: "specified-injury" },
      { label: "None of the above", nextNodeId: "inj-3" },
    ],
  },
  {
    id: "inj-3",
    question: "Has the worker been incapacitated (unable to perform their normal work duties) for more than 7 CONSECUTIVE days, not counting the day of the accident?",
    helpText: "The 7 days are consecutive calendar days, NOT working days. The day of the accident itself is not counted. 'Incapacitated' means unable to do the full range of their normal duties -- it does not mean they must be completely absent from work.",
    regulation: "RIDDOR 2013 Reg 4(2)",
    options: [
      { label: "Yes -- more than 7 consecutive days", terminalId: "over-7-day" },
      { label: "No -- 7 days or fewer", terminalId: "not-reportable-injury" },
      { label: "Not yet known -- still within 7 days", nextNodeId: "inj-monitor" },
    ],
  },
  {
    id: "inj-monitor",
    question: "The 7-day period has not yet elapsed. You must monitor the worker's condition. If they remain incapacitated beyond 7 consecutive days (not counting the day of the accident), this becomes reportable. Do you want to record this as a monitored case?",
    helpText: "Set a reminder to check the worker's status on day 8 after the accident. If they are still unable to perform normal duties at that point, you must report within 15 days of the accident date.",
    regulation: "RIDDOR 2013 Reg 4(2)",
    options: [
      { label: "Yes -- record as monitored case", terminalId: "not-reportable-injury" },
    ],
  },
  {
    id: "inj-nonworker",
    question: "Was the non-worker (member of the public, visitor, etc.) taken DIRECTLY to hospital from the scene of the accident for treatment of the injury?",
    helpText: "'Taken directly to hospital' means they were transported from the accident scene to hospital. If they went home first and later attended hospital, or attended a GP surgery, this does NOT count. The treatment must be for the actual injury, not precautionary observation.",
    regulation: "RIDDOR 2013 Reg 5(1)",
    options: [
      { label: "Yes -- taken directly to hospital from scene", terminalId: "non-worker-hospital" },
      { label: "No -- not taken directly to hospital", terminalId: "not-reportable-injury" },
    ],
  },
];

// DANGEROUS OCCURRENCE pathway — full Schedule 2
export const DANGEROUS_OCCURRENCE_NODES: TreeNode[] = [
  {
    id: "do-1",
    question: "Which category of dangerous occurrence does this event fall under?",
    helpText: "Select the category that best describes the type of dangerous occurrence. These are drawn from RIDDOR 2013 Schedule 2. If none apply, select 'None of the above'.",
    regulation: "RIDDOR 2013 Schedule 2",
    options: [
      { label: "Structural collapse or failure", description: "Collapse of building, structure, scaffold, or falsework", nextNodeId: "do-structural" },
      { label: "Plant and equipment failure", description: "Failure of lifting equipment, pressure systems, or electrical systems", nextNodeId: "do-plant" },
      { label: "Explosions, fires, and dangerous substances", description: "Explosion, fire, or uncontrolled release of hazardous substance", nextNodeId: "do-explosion" },
      { label: "Excavation and ground collapse", description: "Collapse of excavation, tunnel, earthwork, or well", nextNodeId: "do-excavation" },
      { label: "Electrical incidents", description: "Electrical short circuit, overload, or malfunction causing fire or explosion", nextNodeId: "do-electrical" },
      { label: "Overhead and underground services", description: "Contact with or damage to overhead power lines or underground services", nextNodeId: "do-services" },
      { label: "Radiation and biological agents", description: "Accidental release of radioactive substance or biological agent", nextNodeId: "do-radiation" },
      { label: "Breathing apparatus and diving", description: "Malfunction of breathing apparatus or diving incident", nextNodeId: "do-breathing" },
      { label: "Wells and pipelines", description: "Uncontrolled release from a well, pipeline, or borehole", nextNodeId: "do-wells" },
      { label: "Transport incidents", description: "Collapse, overturning, or failure of a vehicle or load", nextNodeId: "do-transport" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
  {
    id: "do-structural",
    question: "Which of the following structural collapses or failures occurred?",
    regulation: "RIDDOR 2013 Schedule 2 Part 1",
    options: [
      { label: "Collapse or partial collapse of any scaffold over 5 metres", description: "Schedule 2 Para 1", terminalId: "dangerous-occurrence-reportable" },
      { label: "Collapse or partial collapse of a building or structure under construction/alteration/demolition", description: "Schedule 2 Para 2", terminalId: "dangerous-occurrence-reportable" },
      { label: "Collapse or partial collapse of any floor or wall in a place of work", description: "Schedule 2 Para 2", terminalId: "dangerous-occurrence-reportable" },
      { label: "Collapse or failure of falsework", description: "Schedule 2 Para 2", terminalId: "dangerous-occurrence-reportable" },
      { label: "Collapse or partial collapse of a structure designed for people to access (e.g. grandstand, stage)", description: "Schedule 2 Para 2", terminalId: "dangerous-occurrence-reportable" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
  {
    id: "do-plant",
    question: "Which of the following plant or equipment failures occurred?",
    regulation: "RIDDOR 2013 Schedule 2 Part 1",
    options: [
      { label: "Failure of a load-bearing part of any lift, hoist, crane, derrick, or mobile powered access platform", description: "Schedule 2 Para 3 -- includes failure of any part carrying load", terminalId: "dangerous-occurrence-reportable" },
      { label: "Collapse or overturning of a crane", description: "Schedule 2 Para 3", terminalId: "dangerous-occurrence-reportable" },
      { label: "Failure of a pressure system (pressure vessel, boiler, steam receiver, air receiver)", description: "Schedule 2 Para 4 -- any uncontrolled release of stored energy from a pressure system", terminalId: "dangerous-occurrence-reportable" },
      { label: "Collapse, overturning or failure of freight container exceeding 500kg", description: "Schedule 2 Para 5", terminalId: "dangerous-occurrence-reportable" },
      { label: "Plant or equipment coming into contact with overhead power line exceeding 200V", description: "Schedule 2 Para 8", terminalId: "dangerous-occurrence-reportable" },
      { label: "Failure of any closed vessel or associated pipework resulting in release of dangerous substance", description: "Schedule 2 Para 13", terminalId: "dangerous-occurrence-reportable" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
  {
    id: "do-explosion",
    question: "Which of the following explosion, fire, or dangerous substance events occurred?",
    regulation: "RIDDOR 2013 Schedule 2 Part 1",
    options: [
      { label: "Explosion or fire causing suspension of normal work for more than 24 hours", description: "Schedule 2 Para 6", terminalId: "dangerous-occurrence-reportable" },
      { label: "Accidental release of any substance which could cause damage to health", description: "Schedule 2 Para 14", terminalId: "dangerous-occurrence-reportable" },
      { label: "Uncontrolled or accidental explosion", description: "Schedule 2 Para 7", terminalId: "dangerous-occurrence-reportable" },
      { label: "Unintended collapse or partial collapse of any structure involving explosives", terminalId: "dangerous-occurrence-reportable" },
      { label: "Misfire of explosives", description: "Schedule 2 Para 7", terminalId: "dangerous-occurrence-reportable" },
      { label: "Failure to detonate explosives as planned", terminalId: "dangerous-occurrence-reportable" },
      { label: "Uncontrolled release of flammable liquid or gas", description: "Schedule 2 Para 14", terminalId: "dangerous-occurrence-reportable" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
  {
    id: "do-excavation",
    question: "Which of the following excavation or ground collapse events occurred?",
    regulation: "RIDDOR 2013 Schedule 2 Part 1",
    options: [
      { label: "Collapse or partial collapse of any excavation", description: "Schedule 2 Para 2", terminalId: "dangerous-occurrence-reportable" },
      { label: "Collapse of tunnel, shaft, or borehole wall", description: "Schedule 2 Para 2", terminalId: "dangerous-occurrence-reportable" },
      { label: "Subsidence or ground heave affecting any structure or roadway", description: "To the extent that it affects structural integrity", terminalId: "dangerous-occurrence-reportable" },
      { label: "Inrush of water or material into an excavation, tunnel, or cofferdam", description: "Schedule 2 Para 2", terminalId: "dangerous-occurrence-reportable" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
  {
    id: "do-electrical",
    question: "Which of the following electrical incidents occurred?",
    regulation: "RIDDOR 2013 Schedule 2 Part 1",
    options: [
      { label: "Electrical short circuit or overload causing fire or explosion", description: "Schedule 2 Para 6", terminalId: "dangerous-occurrence-reportable" },
      { label: "Electrical short circuit or overload causing work stoppage of more than 24 hours", description: "Schedule 2 Para 6", terminalId: "dangerous-occurrence-reportable" },
      { label: "Accidental contact with any overhead electric line or underground cable", description: "Schedule 2 Para 8", terminalId: "dangerous-occurrence-reportable" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
  {
    id: "do-services",
    question: "Which of the following overhead or underground service incidents occurred?",
    regulation: "RIDDOR 2013 Schedule 2 Part 1",
    options: [
      { label: "Contact with or damage to overhead power line exceeding 200V", description: "Schedule 2 Para 8", terminalId: "dangerous-occurrence-reportable" },
      { label: "Damage to underground cable carrying more than 200V", description: "Schedule 2 Para 8", terminalId: "dangerous-occurrence-reportable" },
      { label: "Damage to underground gas pipe or main", description: "Causing release of gas", terminalId: "dangerous-occurrence-reportable" },
      { label: "Damage to underground water main causing flooding affecting work or public areas", terminalId: "dangerous-occurrence-reportable" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
  {
    id: "do-radiation",
    question: "Which of the following radiation or biological agent incidents occurred?",
    regulation: "RIDDOR 2013 Schedule 2 Part 1",
    options: [
      { label: "Accidental release of radioactive substance exceeding a relevant quantity", description: "Schedule 2 Para 11", terminalId: "dangerous-occurrence-reportable" },
      { label: "Loss or theft of radioactive material", description: "Schedule 2 Para 11", terminalId: "dangerous-occurrence-reportable" },
      { label: "Accidental release of a biological agent likely to cause severe human illness", description: "Schedule 2 Para 12", terminalId: "dangerous-occurrence-reportable" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
  {
    id: "do-breathing",
    question: "Which of the following breathing apparatus or diving incidents occurred?",
    regulation: "RIDDOR 2013 Schedule 2 Part 1",
    options: [
      { label: "Malfunction of breathing apparatus where there was a risk to health", description: "Schedule 2 Para 9", terminalId: "dangerous-occurrence-reportable" },
      { label: "Malfunction of a rebreather or SCBA during use", description: "Schedule 2 Para 9", terminalId: "dangerous-occurrence-reportable" },
      { label: "Diving incident involving failure of diving plant, loss of communication, or emergency ascent", description: "Schedule 2 Para 10", terminalId: "dangerous-occurrence-reportable" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
  {
    id: "do-wells",
    question: "Which of the following well or pipeline incidents occurred?",
    regulation: "RIDDOR 2013 Schedule 2 Part 3",
    options: [
      { label: "Uncontrolled or unintended release from a well (blowout)", description: "Schedule 2 Part 3", terminalId: "dangerous-occurrence-reportable" },
      { label: "Uncontrolled release from a pipeline", description: "Schedule 2 Part 3", terminalId: "dangerous-occurrence-reportable" },
      { label: "Failure of well control equipment during well operations", description: "Schedule 2 Part 3", terminalId: "dangerous-occurrence-reportable" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
  {
    id: "do-transport",
    question: "Which of the following transport incidents occurred?",
    regulation: "RIDDOR 2013 Schedule 2 Part 1",
    options: [
      { label: "Overturning or collapse of a load-carrying vehicle", description: "Schedule 2 Para 5", terminalId: "dangerous-occurrence-reportable" },
      { label: "Train collision, derailment, or failure of train braking system", description: "Schedule 2 Para 15", terminalId: "dangerous-occurrence-reportable" },
      { label: "Failure of a fairground ride or amusement device", description: "Schedule 2 Para 16", terminalId: "dangerous-occurrence-reportable" },
      { label: "None of the above", terminalId: "not-dangerous-occurrence" },
    ],
  },
];

// DISEASE pathway — full Schedule 1
export const DISEASE_NODES: TreeNode[] = [
  {
    id: "dis-1",
    question: "Has a registered medical practitioner (doctor) diagnosed the worker with an occupational disease and confirmed in writing that it is linked to their work activity?",
    helpText: "A written diagnosis from a doctor is REQUIRED before RIDDOR reporting. Self-diagnosis or diagnosis by a non-medical professional does not trigger RIDDOR obligations.",
    regulation: "RIDDOR 2013 Reg 8",
    options: [
      { label: "Yes -- written medical diagnosis received", nextNodeId: "dis-2" },
      { label: "No -- no written diagnosis yet", nextNodeId: "dis-nodoc" },
    ],
  },
  {
    id: "dis-nodoc",
    question: "A written medical diagnosis linking the disease to work activity is required before RIDDOR reporting. However, you should still refer the worker for occupational health assessment. Would you like to record this as a pending case?",
    regulation: "RIDDOR 2013 Reg 8",
    options: [
      { label: "Yes -- record as pending medical assessment", terminalId: "not-disease" },
    ],
  },
  {
    id: "dis-2",
    question: "Which category of occupational disease has been diagnosed?",
    helpText: "Select the category that matches the diagnosed condition. These categories are from RIDDOR 2013 Schedule 1.",
    regulation: "RIDDOR 2013 Schedule 1",
    options: [
      { label: "Musculoskeletal disorders", description: "Carpal tunnel, cramp of hand/forearm, tendonitis, tenosynovitis", nextNodeId: "dis-msd" },
      { label: "Respiratory diseases", description: "Occupational asthma, COPD, pneumoconiosis, asbestosis, mesothelioma, silicosis, byssinosis", nextNodeId: "dis-resp" },
      { label: "Skin diseases", description: "Occupational dermatitis, skin cancer, chrome ulceration", nextNodeId: "dis-skin" },
      { label: "Infections", description: "Leptospirosis, hepatitis, tuberculosis, legionellosis, anthrax", nextNodeId: "dis-infection" },
      { label: "Hearing loss", description: "Occupational noise-induced hearing loss (NIHL)", nextNodeId: "dis-hearing" },
      { label: "Vibration-related conditions", description: "Hand-arm vibration syndrome (HAVS), whole-body vibration", nextNodeId: "dis-vibration" },
      { label: "Cancer and toxicity", description: "Lead poisoning, arsenic poisoning, occupational cancer, bladder cancer", nextNodeId: "dis-cancer" },
      { label: "Other occupational diseases", description: "Decompression illness, cataract due to radiation, any other Schedule 1 disease", nextNodeId: "dis-other" },
      { label: "None of the above", terminalId: "not-disease" },
    ],
  },
  {
    id: "dis-msd",
    question: "Which musculoskeletal disorder has been diagnosed?",
    regulation: "RIDDOR 2013 Schedule 1",
    options: [
      { label: "Carpal tunnel syndrome", description: "Linked to use of hand-held vibrating tools, repeated wrist movements, or keyboard use", terminalId: "disease-reportable" },
      { label: "Cramp of the hand or forearm (writer's cramp)", description: "Linked to prolonged periods of repetitive hand movements", terminalId: "disease-reportable" },
      { label: "Tendonitis or tenosynovitis", description: "Linked to physically demanding work involving repetitive movement", terminalId: "disease-reportable" },
      { label: "None of the above", terminalId: "not-disease" },
    ],
  },
  {
    id: "dis-resp",
    question: "Which respiratory disease has been diagnosed?",
    regulation: "RIDDOR 2013 Schedule 1",
    options: [
      { label: "Occupational asthma", description: "Linked to exposure to known respiratory sensitiser at work", terminalId: "disease-reportable" },
      { label: "Chronic obstructive pulmonary disease (COPD)", description: "Linked to significant dust/fume exposure at work", terminalId: "disease-reportable" },
      { label: "Pneumoconiosis (including silicosis)", description: "Linked to exposure to silica, coal dust, asbestos, or other fibrogenic dusts", terminalId: "disease-reportable" },
      { label: "Asbestosis", description: "Linked to asbestos exposure", terminalId: "disease-reportable" },
      { label: "Mesothelioma", description: "Linked to asbestos exposure", terminalId: "disease-reportable" },
      { label: "Byssinosis", description: "Linked to cotton, flax, or hemp dust exposure", terminalId: "disease-reportable" },
      { label: "Extrinsic allergic alveolitis (farmer's lung, etc.)", description: "Linked to mould spores, bird droppings, or other organic dusts", terminalId: "disease-reportable" },
      { label: "None of the above", terminalId: "not-disease" },
    ],
  },
  {
    id: "dis-skin",
    question: "Which skin disease has been diagnosed?",
    regulation: "RIDDOR 2013 Schedule 1",
    options: [
      { label: "Occupational dermatitis", description: "Linked to exposure to irritant or sensitising substances at work", terminalId: "disease-reportable" },
      { label: "Skin cancer (squamous cell carcinoma)", description: "Linked to exposure to mineral oils, tar, pitch, soot, or arsenic", terminalId: "disease-reportable" },
      { label: "Chrome ulceration", description: "Linked to exposure to chromic acid or chromates", terminalId: "disease-reportable" },
      { label: "None of the above", terminalId: "not-disease" },
    ],
  },
  {
    id: "dis-infection",
    question: "Which infection has been diagnosed?",
    regulation: "RIDDOR 2013 Schedule 1",
    options: [
      { label: "Leptospirosis (Weil's disease)", description: "Linked to work in contact with rats, sewage, or contaminated water", terminalId: "disease-reportable" },
      { label: "Hepatitis (occupationally acquired)", description: "Linked to contact with human blood/body fluids or work with hepatitis virus", terminalId: "disease-reportable" },
      { label: "Tuberculosis (occupationally acquired)", description: "Linked to healthcare work or close contact with infected persons", terminalId: "disease-reportable" },
      { label: "Legionellosis (Legionnaires' disease)", description: "Linked to exposure to water systems contaminated with Legionella", terminalId: "disease-reportable" },
      { label: "Anthrax", description: "Linked to handling infected animals, hides, wool, or bone products", terminalId: "disease-reportable" },
      { label: "Tetanus", description: "Linked to work with soil, animals, or contaminated materials", terminalId: "disease-reportable" },
      { label: "Lyme disease (occupationally acquired)", description: "Linked to outdoor work in tick-infested areas", terminalId: "disease-reportable" },
      { label: "Q fever", description: "Linked to work with cattle, sheep, or goats", terminalId: "disease-reportable" },
      { label: "None of the above", terminalId: "not-disease" },
    ],
  },
  {
    id: "dis-hearing",
    question: "Has the diagnosed noise-induced hearing loss been confirmed through audiometry and linked to occupational noise exposure?",
    regulation: "RIDDOR 2013 Schedule 1",
    options: [
      { label: "Yes -- confirmed NIHL linked to work noise exposure", description: "Diagnosis confirmed by audiometry with occupational noise exposure history", terminalId: "disease-reportable" },
      { label: "No -- not confirmed or not linked to work", terminalId: "not-disease" },
    ],
  },
  {
    id: "dis-vibration",
    question: "Which vibration-related condition has been diagnosed?",
    regulation: "RIDDOR 2013 Schedule 1",
    options: [
      { label: "Hand-arm vibration syndrome (HAVS)", description: "Linked to use of hand-held vibrating tools -- includes vibration white finger (VWF)", terminalId: "disease-reportable" },
      { label: "Whole-body vibration injury", description: "Linked to prolonged use of vibrating vehicles or platforms", terminalId: "disease-reportable" },
      { label: "None of the above", terminalId: "not-disease" },
    ],
  },
  {
    id: "dis-cancer",
    question: "Which cancer or toxicity condition has been diagnosed?",
    regulation: "RIDDOR 2013 Schedule 1",
    options: [
      { label: "Lead poisoning (chronic)", description: "Linked to work with lead or lead compounds", terminalId: "disease-reportable" },
      { label: "Arsenic poisoning", description: "Linked to exposure to arsenic or arsenic compounds", terminalId: "disease-reportable" },
      { label: "Phosphorus poisoning", description: "Linked to exposure to phosphorus or phosphorus compounds", terminalId: "disease-reportable" },
      { label: "Mercury poisoning", description: "Linked to exposure to mercury or mercury compounds", terminalId: "disease-reportable" },
      { label: "Bladder cancer (occupational)", description: "Linked to exposure to 2-naphthylamine, benzidine, or other aromatic amines", terminalId: "disease-reportable" },
      { label: "Nasal cancer (occupational)", description: "Linked to work in hardwood dust, leather dust, or nickel refining", terminalId: "disease-reportable" },
      { label: "Lung cancer (occupational)", description: "Linked to asbestos, silica, or other occupational carcinogen exposure", terminalId: "disease-reportable" },
      { label: "None of the above", terminalId: "not-disease" },
    ],
  },
  {
    id: "dis-other",
    question: "Which other occupational disease has been diagnosed?",
    regulation: "RIDDOR 2013 Schedule 1",
    options: [
      { label: "Decompression illness (the bends)", description: "Linked to compressed air work, diving, or caisson work", terminalId: "disease-reportable" },
      { label: "Cataract due to electromagnetic radiation", description: "Linked to exposure to infrared radiation, microwave radiation, or ionising radiation", terminalId: "disease-reportable" },
      { label: "Occupational vitiligo", description: "Linked to exposure to certain chemicals", terminalId: "disease-reportable" },
      { label: "Bursitis (beat knee, beat elbow)", description: "Linked to prolonged kneeling or pressure on the elbow", terminalId: "disease-reportable" },
      { label: "None of the above", terminalId: "not-disease" },
    ],
  },
];

// GAS INCIDENT pathway
export const GAS_NODES: TreeNode[] = [
  {
    id: "gas-1",
    question: "Did the gas incident involve piped natural gas, LPG (bottled gas), or another gas supply type?",
    helpText: "RIDDOR Reg 6(3) covers gas distributed through a fixed pipe system or supplied in a refillable container (LPG).",
    regulation: "RIDDOR 2013 Reg 6(3)",
    options: [
      { label: "Piped natural gas (mains supply)", nextNodeId: "gas-2" },
      { label: "LPG (bottled/bulk -- propane, butane)", nextNodeId: "gas-2" },
      { label: "Other gas type (industrial, medical, etc.)", nextNodeId: "gas-other" },
    ],
  },
  {
    id: "gas-other",
    question: "Incidents involving industrial, medical, or other gas types may still be reportable as dangerous occurrences under Schedule 2. Would you like to assess as a dangerous occurrence instead?",
    options: [
      { label: "Yes -- assess as dangerous occurrence", nextNodeId: "do-1" },
      { label: "No -- not applicable", terminalId: "gas-not-reportable" },
    ],
  },
  {
    id: "gas-2",
    question: "What was the outcome of the gas incident?",
    helpText: "Consider all persons affected, including workers and members of the public.",
    regulation: "RIDDOR 2013 Reg 6(3)",
    options: [
      { label: "Death of any person", terminalId: "gas-death-injury" },
      { label: "Loss of consciousness of any person", terminalId: "gas-death-injury" },
      { label: "Person taken to hospital for treatment", terminalId: "gas-death-injury" },
      { label: "No death, loss of consciousness, or hospital treatment", nextNodeId: "gas-3" },
    ],
  },
  {
    id: "gas-3",
    question: "Was a gas fitting or appliance found to be faulty, or in such a condition that it COULD have caused death, loss of consciousness, or hospital treatment?",
    helpText: "This includes situations where a gas engineer discovers a faulty fitting that has the POTENTIAL to cause harm, even if no one has been harmed yet. The assessment is about potential danger, not just actual harm.",
    regulation: "RIDDOR 2013 Reg 6(3)(b) & GSIUR 1998",
    options: [
      { label: "Yes -- faulty fitting/appliance found with potential to cause harm", terminalId: "gas-faulty-fitting" },
      { label: "No -- no faulty fitting or appliance identified", terminalId: "gas-not-reportable" },
    ],
  },
];

// ─── All nodes combined for lookup ───────────────────────────────

export function getAllNodes(): Record<string, TreeNode> {
  const map: Record<string, TreeNode> = {};
  [...INJURY_NODES, ...DANGEROUS_OCCURRENCE_NODES, ...DISEASE_NODES, ...GAS_NODES].forEach(n => {
    map[n.id] = n;
  });
  return map;
}

// ─── First node per category ─────────────────────────────────────

export const CATEGORY_FIRST_NODE: Record<IncidentCategory, string> = {
  death: "__death_terminal__", // special: death goes straight to terminal
  injury: "inj-1",
  "dangerous-occurrence": "do-1",
  disease: "dis-1",
  "gas-incident": "gas-1",
};

// ─── HSE Contact Details ─────────────────────────────────────────

export const HSE_CONTACTS = {
  riddorPhone: "0345 300 9923",
  riddorPhoneHours: "Monday to Friday, 8:30am to 5pm",
  riddorOutOfHours: "0151 922 9235 (duty officer, emergencies only)",
  riddorOnline: "https://www.hse.gov.uk/riddor/report.htm",
  riddorEmail: "riddor@natbrit.com",
  gasSafePhone: "0800 408 5500",
  gasSafeWeb: "https://www.gassaferegister.co.uk/",
  hseInfoLine: "0300 003 1747",
  hseAddress: "Health and Safety Executive, RIDDOR Reports, Redgrave Court, Merton Road, Bootle, Merseyside L20 7HS",
  policeEmergency: "999",
};

// ─── Responsible Person Guidance ─────────────────────────────────

export const RESPONSIBLE_PERSON_GUIDANCE = {
  title: "Who is the Responsible Person?",
  description: "Under RIDDOR 2013 Reg 3, the 'responsible person' who must make the report depends on the circumstances of the incident:",
  categories: [
    { scenario: "Injury to an employee", responsible: "The employer of the injured person" },
    { scenario: "Injury to a self-employed person", responsible: "The self-employed person themselves, or the person in control of the premises" },
    { scenario: "Injury to a person not at work", responsible: "The person in control of the premises where the accident occurred" },
    { scenario: "Dangerous occurrence", responsible: "The employer, self-employed person, or person in control of the premises" },
    { scenario: "Reportable disease", responsible: "The employer of the person affected by the disease" },
    { scenario: "Gas incident", responsible: "The gas engineer, gas supplier, or person in control of the premises" },
    { scenario: "Death", responsible: "The employer or person in control of the premises. Police must also be notified." },
  ],
  additionalNotes: [
    "On construction sites under CDM 2015, the principal contractor is typically the person in control of the premises during the construction phase.",
    "Where multiple employers are involved, the employer of the injured person has the primary duty to report.",
    "Failure to report a RIDDOR incident is a criminal offence under HSWA 1974 s33.",
  ],
};

// ─── Deadline Calculator ─────────────────────────────────────────

export function calculateDeadline(incidentDate: string, terminal: TerminalResult): { deadlineDate: string; daysRemaining: number; isOverdue: boolean } | null {
  if (!terminal.deadlineDays || !incidentDate) return null;
  const incident = new Date(incidentDate);
  const deadline = new Date(incident);
  deadline.setDate(deadline.getDate() + terminal.deadlineDays);
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

// ─── Flowchart Node Positions (for SVG rendering) ────────────────

export interface FlowchartNode {
  id: string;
  label: string;
  type: "start" | "question" | "terminal-yes" | "terminal-no" | "category";
  status: "inactive" | "active" | "completed" | "future";
}
