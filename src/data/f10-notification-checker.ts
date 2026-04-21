// src/data/f10-notification-checker.ts
// F10 Notification Checker -- CDM 2015 reg 6 notification decision tree
// Covers: notifiability test (reg 6(1)), update triggers (reg 6(2)),
// domestic client duty transfer (reg 7), site display (reg 6(4)),
// PD/PC appointment triggers (reg 5), F10 field catalogue.

// ─── Types ───────────────────────────────────────────────────────

export type F10Category =
  | "new-project"
  | "existing-update"
  | "domestic-check"
  | "display-check";

export interface F10CategoryOption {
  id: F10Category;
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
  nextNodeId?: string;
  terminalId?: string;
}

export interface TerminalResult {
  id: string;
  notifiable: boolean;
  title: string;
  description: string;
  deadline: string;
  recommendedLeadDays?: number; // soft deadline (14 days before start)
  method: string;
  form: string;
  portalUrl?: string;
  responsiblePerson: string;
  updateRequired: boolean;
  displayRequired: boolean;
  pdPcAppointmentRequired: boolean;
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

// ─── Project input data (hybrid screen) ─────────────────────────

export interface ProjectInputs {
  projectName: string;
  projectAddress: string;
  existingUse: string;
  plannedStartDate: string; // ISO
  durationWeeks: number;
  peakSimultaneousWorkers: number;
  contractorOrganisationCount: number;
  demolitionInvolved: boolean;
  clientName: string;
  clientIsDomestic: boolean;
  pdName: string;
  pcName: string;
  avgDailyWorkforce: number; // used for person-day auto-calc
  briefDescription: string;
  localAuthority: string;
  hseRegistrationRef: string; // when F10 already submitted
}

export const DEFAULT_INPUTS: ProjectInputs = {
  projectName: "",
  projectAddress: "",
  existingUse: "",
  plannedStartDate: "",
  durationWeeks: 0,
  peakSimultaneousWorkers: 0,
  contractorOrganisationCount: 1,
  demolitionInvolved: false,
  clientName: "",
  clientIsDomestic: false,
  pdName: "",
  pcName: "",
  avgDailyWorkforce: 0,
  briefDescription: "",
  localAuthority: "",
  hseRegistrationRef: "",
};

// ─── Person-day auto-compute ────────────────────────────────────

export function computePersonDays(inputs: ProjectInputs): {
  workingDays: number;
  personDays: number;
  exceeds30WorkingDays: boolean;
  exceeds20Simultaneous: boolean;
  exceeds500PersonDays: boolean;
  notifiableByRule6: boolean;
} {
  // Working days assumed 5 per week
  const workingDays = Math.max(0, Math.floor((inputs.durationWeeks || 0) * 5));
  const personDays = Math.max(0, workingDays * (inputs.avgDailyWorkforce || 0));
  const exceeds30WorkingDays = workingDays > 30;
  const exceeds20Simultaneous = (inputs.peakSimultaneousWorkers || 0) > 20;
  const exceeds500PersonDays = personDays > 500;
  // CDM 2015 reg 6(1): notifiable if (>30 working days AND >20 simultaneous) OR (>500 person-days)
  const notifiableByRule6 =
    (exceeds30WorkingDays && exceeds20Simultaneous) || exceeds500PersonDays;
  return {
    workingDays,
    personDays,
    exceeds30WorkingDays,
    exceeds20Simultaneous,
    exceeds500PersonDays,
    notifiableByRule6,
  };
}

// ─── Deadline Calculator (days from today until planned start) ──

export function calculateDeadline(
  plannedStartDate: string,
  recommendedLeadDays = 14,
): {
  startDate: string;
  recommendedByDate: string;
  daysUntilStart: number;
  daysUntilRecommendedDeadline: number;
  isOverdue: boolean;
  isPastStart: boolean;
} | null {
  if (!plannedStartDate) return null;
  const start = new Date(plannedStartDate);
  if (isNaN(start.getTime())) return null;
  const recommendedBy = new Date(start);
  recommendedBy.setDate(recommendedBy.getDate() - recommendedLeadDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  recommendedBy.setHours(0, 0, 0, 0);
  const daysUntilStart = Math.ceil(
    (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysUntilRecommendedDeadline = Math.ceil(
    (recommendedBy.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  return {
    startDate: start.toISOString().slice(0, 10),
    recommendedByDate: recommendedBy.toISOString().slice(0, 10),
    daysUntilStart,
    daysUntilRecommendedDeadline,
    isOverdue: daysUntilRecommendedDeadline < 0,
    isPastStart: daysUntilStart < 0,
  };
}

// ─── Entry Categories ────────────────────────────────────────────

export const F10_CATEGORIES: F10CategoryOption[] = [
  {
    id: "new-project",
    label: "New Project -- Check Notifiability",
    description:
      "Standard path for a new construction project. Tests the CDM 2015 reg 6(1) notification thresholds and establishes PD/PC appointment obligations.",
    icon: "N",
    regulation: "CDM 2015 Regs 4, 5 & 6(1)",
  },
  {
    id: "existing-update",
    label: "Existing Project -- Has Something Changed?",
    description:
      "Check whether a change to an already-notified project (PC change, PD change, material scope change) triggers an F10 update under reg 6(2).",
    icon: "U",
    regulation: "CDM 2015 Reg 6(2)",
  },
  {
    id: "domestic-check",
    label: "Domestic Client Check",
    description:
      "Establish who carries the client duties on a domestic project under CDM 2015 reg 7. Notification may still be required.",
    icon: "D",
    regulation: "CDM 2015 Reg 7",
  },
  {
    id: "display-check",
    label: "Site Display / Compliance Check",
    description:
      "F10 already submitted. Verify the reg 6(4) site display obligation and the contents required on the displayed copy.",
    icon: "S",
    regulation: "CDM 2015 Reg 6(4)",
  },
];

// ─── Terminal Results ────────────────────────────────────────────

export const TERMINAL_RESULTS: Record<string, TerminalResult> = {
  // ── NEW PROJECT path ────────────────────────────────────────────
  "new-notifiable-multi": {
    id: "new-notifiable-multi",
    notifiable: true,
    title: "NOTIFIABLE -- F10 Required (Multi-Contractor Project)",
    description:
      "This project is notifiable under CDM 2015 reg 6(1). More than one contractor is or will be working on the project, so a Principal Designer and Principal Contractor must also be appointed in writing by the client (reg 5).",
    deadline:
      "As soon as practicable BEFORE the construction phase begins (HSE recommends at least 14 days before start on site).",
    recommendedLeadDays: 14,
    method:
      "Online submission only via the HSE F10 portal (https://form.hse.gov.uk/f10). HSE no longer accepts paper forms or notifications by email or post.",
    form: "F10 -- Notification of construction project",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The CLIENT is responsible for submitting the F10 notification under CDM 2015 reg 6(1). The duty cannot be delegated, although the client may arrange for another party (e.g. the PD) to prepare the form on their behalf.",
    updateRequired: false,
    displayRequired: true,
    pdPcAppointmentRequired: true,
    recordKeeping:
      "A copy of the submitted F10, the HSE acknowledgement, and any revisions must be retained for the duration of the project and kept available for HSE inspection. The most recent F10 must be displayed on site where workers can read it (reg 6(4)).",
    regulations: [
      "CDM 2015 Reg 4 -- Client duties",
      "CDM 2015 Reg 5 -- Appointment of Principal Designer and Principal Contractor",
      "CDM 2015 Reg 6(1) -- Notification to HSE",
      "CDM 2015 Reg 6(4) -- Display on site",
      "CDM 2015 Reg 8 -- General duties of duty holders",
      "HSE L153 -- Managing health and safety in construction",
      "HSWA 1974 s3 -- Duty to non-employees",
    ],
    additionalNotes: [
      "Under reg 5, the client's appointment of PD and PC must be in writing. Failure to appoint means the client takes on the PD/PC duties themselves.",
      "The F10 must be submitted by the client -- the PC cannot submit it on their own behalf, though they may prepare the form.",
      "HSE guidance is to notify 'as soon as practicable' before construction starts. Fourteen days is recommended to allow HSE time to acknowledge.",
      "The notification must be displayed in a place where workers on site can read it and must be updated if particulars change.",
    ],
  },
  "new-notifiable-single": {
    id: "new-notifiable-single",
    notifiable: true,
    title: "NOTIFIABLE -- F10 Required (Single Contractor)",
    description:
      "This project is notifiable under CDM 2015 reg 6(1). As only one contractor is involved, PD/PC appointment is not strictly required -- however the contractor carries PC-equivalent duties.",
    deadline:
      "As soon as practicable BEFORE the construction phase begins (HSE recommends at least 14 days before start on site).",
    recommendedLeadDays: 14,
    method:
      "Online submission only via the HSE F10 portal (https://form.hse.gov.uk/f10). HSE no longer accepts paper forms or notifications by email or post.",
    form: "F10 -- Notification of construction project",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The CLIENT is responsible for submitting the F10 notification under CDM 2015 reg 6(1).",
    updateRequired: false,
    displayRequired: true,
    pdPcAppointmentRequired: false,
    recordKeeping:
      "A copy of the submitted F10 and HSE acknowledgement must be retained for the duration of the project and displayed on site (reg 6(4)).",
    regulations: [
      "CDM 2015 Reg 4 -- Client duties",
      "CDM 2015 Reg 6(1) -- Notification to HSE",
      "CDM 2015 Reg 6(4) -- Display on site",
      "CDM 2015 Reg 8 -- General duties of duty holders",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "With only one contractor, that contractor must comply with the duties in reg 15 (contractors).",
      "If additional contractors are subsequently engaged, PD/PC must be appointed and the F10 updated (reg 6(2)).",
      "The client retains all reg 4 duties regardless of contractor count.",
    ],
  },
  "new-not-notifiable": {
    id: "new-not-notifiable",
    notifiable: false,
    title: "NOT NOTIFIABLE -- F10 Not Required",
    description:
      "The project does not meet the CDM 2015 reg 6(1) notification thresholds. All other CDM 2015 duties (client, designer, contractor) still apply in full.",
    deadline: "Not applicable -- project is not notifiable.",
    method: "No F10 submission required.",
    form: "N/A",
    responsiblePerson:
      "All parties retain their CDM 2015 duties. The client must still comply with reg 4 (client duties) including providing pre-construction information and ensuring suitable welfare facilities.",
    updateRequired: false,
    displayRequired: false,
    pdPcAppointmentRequired: false,
    recordKeeping:
      "Even though no F10 is required, the client should retain written evidence of the notifiability determination (e.g. this assessment) in case of challenge.",
    regulations: [
      "CDM 2015 Reg 4 -- Client duties",
      "CDM 2015 Reg 6(1) -- Notification thresholds",
      "CDM 2015 Reg 8 -- General duties",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "If conditions change (longer programme, more workers, additional contractors), re-run this assessment.",
      "If there is more than one contractor, the client must still appoint PD and PC in writing under reg 5, even if not notifiable.",
      "Being non-notifiable does NOT remove any CDM 2015 duties -- it only removes the F10 submission obligation.",
    ],
  },
  "new-notifiable-multi-pre-start": {
    id: "new-notifiable-multi-pre-start",
    notifiable: true,
    title: "NOTIFIABLE -- Construction Already Started (Overdue, Multi-Contractor)",
    description:
      "The project is notifiable AND construction has already begun. The F10 must be submitted IMMEDIATELY -- failure to notify before works commenced is a breach of CDM 2015 reg 6(1).",
    deadline:
      "IMMEDIATE -- submit the F10 without further delay. Under CDM 2015 reg 6(1), the notification should have been made BEFORE the construction phase began.",
    recommendedLeadDays: 0,
    method:
      "Online submission only via the HSE F10 portal (https://form.hse.gov.uk/f10) without delay. Document the reason for late notification in the project records. HSE no longer accepts paper forms or notifications by email or post.",
    form: "F10 -- Notification of construction project",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The CLIENT is responsible for submitting the F10. Failure to notify a notifiable project is an offence under HSWA 1974 s33 and may attract HSE enforcement action.",
    updateRequired: false,
    displayRequired: true,
    pdPcAppointmentRequired: true,
    recordKeeping:
      "Record the reason for late notification, the date construction started, and the date the F10 was submitted. Display the F10 on site immediately upon receipt of the HSE acknowledgement.",
    regulations: [
      "CDM 2015 Reg 6(1) -- Notification to HSE",
      "CDM 2015 Reg 6(4) -- Display on site",
      "HSWA 1974 s33 -- Offences",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "A late F10 is better than no F10. Submit immediately.",
      "The HSE may make enquiries about the delay. Be prepared to explain the reasons.",
      "Late notification does not retrospectively cover the pre-notification period -- the client remained in breach.",
      "Review project governance to prevent recurrence.",
    ],
  },

  // ── EXISTING UPDATE path ─────────────────────────────────────
  "update-required-pc-change": {
    id: "update-required-pc-change",
    notifiable: true,
    title: "F10 UPDATE REQUIRED -- Principal Contractor Changed",
    description:
      "A change of Principal Contractor materially changes the particulars of the notification. The F10 must be updated under CDM 2015 reg 6(2).",
    deadline:
      "As soon as practicable after the change takes effect -- update the F10 without delay.",
    recommendedLeadDays: 0,
    method:
      "Log in to the HSE F10 portal using the original submission reference and update the Principal Contractor particulars.",
    form: "F10 -- Notification of construction project (Update)",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The CLIENT is responsible for updating the F10 under CDM 2015 reg 6(2), even where the incoming PC prepares the revision.",
    updateRequired: true,
    displayRequired: true,
    pdPcAppointmentRequired: true,
    recordKeeping:
      "Retain a copy of the original F10 AND the revised F10. Replace the displayed copy on site with the updated version. Record the effective date of the change.",
    regulations: [
      "CDM 2015 Reg 5 -- Appointment of Principal Contractor",
      "CDM 2015 Reg 6(2) -- Notification of change of particulars",
      "CDM 2015 Reg 6(4) -- Display on site",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "Re-appointment must be in writing before updating the F10.",
      "Ensure the outgoing PC has handed over all H&S file material to the incoming PC before the change takes effect.",
      "Display the new F10 in place of the old one.",
    ],
  },
  "update-required-pd-change": {
    id: "update-required-pd-change",
    notifiable: true,
    title: "F10 UPDATE REQUIRED -- Principal Designer Changed",
    description:
      "A change of Principal Designer materially changes the particulars of the notification. The F10 must be updated under CDM 2015 reg 6(2).",
    deadline:
      "As soon as practicable after the change takes effect -- update the F10 without delay.",
    recommendedLeadDays: 0,
    method:
      "Log in to the HSE F10 portal using the original submission reference and update the Principal Designer particulars.",
    form: "F10 -- Notification of construction project (Update)",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The CLIENT is responsible for updating the F10 under CDM 2015 reg 6(2).",
    updateRequired: true,
    displayRequired: true,
    pdPcAppointmentRequired: true,
    recordKeeping:
      "Retain a copy of the original F10 AND the revised F10. Replace the displayed copy on site. Record the effective date of the change and confirm pre-construction information handover.",
    regulations: [
      "CDM 2015 Reg 5 -- Appointment of Principal Designer",
      "CDM 2015 Reg 6(2) -- Notification of change of particulars",
      "CDM 2015 Reg 11 -- PD duties",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "Re-appointment must be in writing before updating the F10.",
      "PD handover must include all pre-construction information gathered to date.",
      "Display the new F10 in place of the old one.",
    ],
  },
  "update-required-scope-change": {
    id: "update-required-scope-change",
    notifiable: true,
    title: "F10 UPDATE REQUIRED -- Material Scope / Duration Change",
    description:
      "A material change to the project description, duration, workforce, or start/end date changes the particulars of the notification. The F10 must be updated under CDM 2015 reg 6(2).",
    deadline:
      "As soon as practicable after the change is confirmed -- update the F10 without delay.",
    recommendedLeadDays: 0,
    method:
      "Log in to the HSE F10 portal using the original submission reference and update the relevant particulars.",
    form: "F10 -- Notification of construction project (Update)",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The CLIENT is responsible for updating the F10 under CDM 2015 reg 6(2).",
    updateRequired: true,
    displayRequired: true,
    pdPcAppointmentRequired: true,
    recordKeeping:
      "Retain both versions. Replace the displayed copy on site. Record the effective date of the change.",
    regulations: [
      "CDM 2015 Reg 6(2) -- Notification of change of particulars",
      "CDM 2015 Reg 6(4) -- Display on site",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "Minor programme slippage is not normally a material change -- use judgement.",
      "Changes that are clearly material: change of addresses, doubling of workforce, significant extension of duration, change of client.",
    ],
  },
  "update-not-required": {
    id: "update-not-required",
    notifiable: true,
    title: "NO F10 UPDATE REQUIRED",
    description:
      "The change described is not material to the F10 particulars. No update is required under CDM 2015 reg 6(2), although internal records should still reflect the change.",
    deadline: "Not applicable -- no update required.",
    method: "No HSE submission required for this change.",
    form: "N/A",
    responsiblePerson:
      "Retain internal records of the change. The existing F10 remains valid.",
    updateRequired: false,
    displayRequired: true,
    pdPcAppointmentRequired: false,
    recordKeeping:
      "Log the change in project records. No HSE submission required unless further changes push the project into reg 6(2) territory.",
    regulations: [
      "CDM 2015 Reg 6(2) -- Notification of change of particulars",
      "CDM 2015 Reg 6(4) -- Display on site",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "If cumulative minor changes amount to a material change, re-run this assessment.",
      "The F10 displayed on site must remain the most recent version.",
    ],
  },

  // ── DOMESTIC CLIENT path ─────────────────────────────────────
  "domestic-duties-to-pc": {
    id: "domestic-duties-to-pc",
    notifiable: true,
    title: "DOMESTIC CLIENT -- Duties Transfer to PC (and F10 Required)",
    description:
      "The project is for a domestic client (private home, not a business). The project is notifiable under reg 6. Client duties transfer to the Principal Contractor under reg 7(1), or to the Principal Designer if there is a written agreement (reg 7(1)(c)).",
    deadline:
      "As soon as practicable before the construction phase begins (HSE recommends at least 14 days before start).",
    recommendedLeadDays: 14,
    method:
      "Online submission only via the HSE F10 portal (https://form.hse.gov.uk/f10) by the PC (or PD with written agreement under reg 7(1)(c)), not the domestic client. HSE no longer accepts paper forms or notifications by email or post.",
    form: "F10 -- Notification of construction project",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The PRINCIPAL CONTRACTOR submits the F10 under CDM 2015 reg 7(1), unless there is a written agreement between the PD and the domestic client transferring the duties to the PD (reg 7(1)(c)).",
    updateRequired: false,
    displayRequired: true,
    pdPcAppointmentRequired: true,
    recordKeeping:
      "Retain a copy of the F10, the HSE acknowledgement, and any written agreement transferring duties under reg 7(1)(c). Display the F10 on site.",
    regulations: [
      "CDM 2015 Reg 7(1) -- Domestic client duties transfer to PC",
      "CDM 2015 Reg 7(1)(c) -- Written agreement for PD to take on duties",
      "CDM 2015 Reg 6(1) -- Notification to HSE",
      "CDM 2015 Reg 6(4) -- Display on site",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "A 'domestic client' means an individual having work done at their private dwelling that is not connected with any business.",
      "Under reg 7(1), if the client does NOT appoint a PC, the domestic client duties transfer automatically.",
      "Under reg 7(1)(c), a PD may take on the client duties by WRITTEN agreement with the domestic client.",
      "The domestic client retains no CDM duties once transferred.",
    ],
  },
  "domestic-duties-to-pd": {
    id: "domestic-duties-to-pd",
    notifiable: true,
    title:
      "DOMESTIC CLIENT -- Duties Transfer to PD (Written Agreement, F10 Required)",
    description:
      "The project is for a domestic client AND a written agreement exists between the Principal Designer and the domestic client transferring the client duties to the PD under CDM 2015 reg 7(1)(c). The project is notifiable.",
    deadline:
      "As soon as practicable before the construction phase begins (HSE recommends at least 14 days before start).",
    recommendedLeadDays: 14,
    method:
      "Online submission only via the HSE F10 portal (https://form.hse.gov.uk/f10) by the Principal Designer. HSE no longer accepts paper forms or notifications by email or post.",
    form: "F10 -- Notification of construction project",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The PRINCIPAL DESIGNER submits the F10 under the written reg 7(1)(c) agreement.",
    updateRequired: false,
    displayRequired: true,
    pdPcAppointmentRequired: true,
    recordKeeping:
      "Retain a signed copy of the reg 7(1)(c) written agreement alongside the F10. Display the F10 on site.",
    regulations: [
      "CDM 2015 Reg 7(1)(c) -- Written agreement for PD to take on client duties",
      "CDM 2015 Reg 6(1) -- Notification to HSE",
      "CDM 2015 Reg 6(4) -- Display on site",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "The written agreement MUST be in place before the PD takes on the duties.",
      "The PD must have the competence and capacity to discharge the client duties.",
      "Without the written agreement, reg 7(1) applies and duties default to the PC.",
    ],
  },
  "domestic-not-notifiable": {
    id: "domestic-not-notifiable",
    notifiable: false,
    title: "DOMESTIC CLIENT -- Not Notifiable (Duties Still Transfer)",
    description:
      "The project is for a domestic client and does NOT meet the reg 6(1) notification thresholds. No F10 required, but the client duties still transfer to the PC (reg 7(1)) or PD (reg 7(1)(c)).",
    deadline: "Not applicable -- project is not notifiable.",
    method: "No F10 submission required.",
    form: "N/A",
    responsiblePerson:
      "All other CDM duties remain. The PC (or PD under a reg 7(1)(c) agreement) takes on the domestic client duties.",
    updateRequired: false,
    displayRequired: false,
    pdPcAppointmentRequired: false,
    recordKeeping:
      "Retain any reg 7(1)(c) written agreement. Record the notifiability determination for project records.",
    regulations: [
      "CDM 2015 Reg 7(1) -- Domestic client duties transfer",
      "CDM 2015 Reg 7(1)(c) -- Written agreement for PD",
      "CDM 2015 Reg 6(1) -- Notification thresholds",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "Even non-notifiable domestic projects must comply with the rest of CDM 2015.",
      "Where more than one contractor is engaged, PD and PC must still be appointed in writing (reg 5).",
    ],
  },

  // ── SITE DISPLAY path ───────────────────────────────────────
  "display-compliant": {
    id: "display-compliant",
    notifiable: true,
    title: "SITE DISPLAY -- Compliant",
    description:
      "The most recent F10 is displayed on site, legible, and accessible to workers. This satisfies CDM 2015 reg 6(4). Continue to update the displayed copy if any particulars change.",
    deadline: "Ongoing duty -- displayed copy must remain current.",
    method: "No further submission required.",
    form: "N/A",
    responsiblePerson:
      "The Principal Contractor is typically responsible for maintaining the displayed F10 on site, under reg 13 (PC duties).",
    updateRequired: false,
    displayRequired: true,
    pdPcAppointmentRequired: false,
    recordKeeping:
      "Continue to review the displayed F10 at each site safety walk. Replace with updated versions if particulars change.",
    regulations: [
      "CDM 2015 Reg 6(4) -- Display on site",
      "CDM 2015 Reg 13 -- Principal Contractor duties",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "A common site location is the site noticeboard at the welfare cabin entrance.",
      "The notice must be legible and understandable to workers -- consider translation for non-English-speaking crews.",
      "Photograph the displayed notice monthly as part of site records.",
    ],
  },
  "display-action-required": {
    id: "display-action-required",
    notifiable: true,
    title: "SITE DISPLAY -- Action Required",
    description:
      "The displayed F10 is missing, outdated, or not accessible to workers. This is a breach of CDM 2015 reg 6(4). Action must be taken immediately to display the most recent F10 on site.",
    deadline:
      "IMMEDIATE -- display a copy of the most recent F10 on site today.",
    recommendedLeadDays: 0,
    method:
      "Print a copy of the HSE F10 acknowledgement (or the current revised F10) and display it on the site noticeboard or an equivalent location visible to all workers.",
    form: "F10 -- Notification of construction project (display copy)",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The Principal Contractor is responsible for ensuring the F10 is displayed on site under reg 13.",
    updateRequired: true,
    displayRequired: true,
    pdPcAppointmentRequired: false,
    recordKeeping:
      "Record the date the displayed notice was reinstated or updated. If the notice was missing, investigate the cause and prevent recurrence.",
    regulations: [
      "CDM 2015 Reg 6(4) -- Display on site",
      "CDM 2015 Reg 13 -- Principal Contractor duties",
      "HSWA 1974 s33 -- Offences",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "HSE inspectors will look for the displayed F10 during a site visit -- absence is visible evidence of non-compliance.",
      "If the F10 particulars have changed since the original submission, update the F10 before displaying.",
      "Consider laminating the displayed copy to protect against weather.",
    ],
  },

  // ── EXTRA terminals introduced during Batch 5 review ─────────
  // Splits the late-notification path into single vs multi-contractor outcomes
  // (the original `new-notifiable-multi-pre-start` blanket-applied PD/PC duties
  // even to single-contractor projects, which is wrong under reg 5).
  "new-notifiable-single-pre-start": {
    id: "new-notifiable-single-pre-start",
    notifiable: true,
    title: "NOTIFIABLE -- Construction Already Started (Overdue, Single Contractor)",
    description:
      "The project is notifiable AND construction has already begun. The F10 must be submitted IMMEDIATELY -- failure to notify before works commenced is a breach of CDM 2015 reg 6(1). As only one contractor is involved, PD/PC appointment under reg 5 is not strictly required, but the contractor carries PC-equivalent duties.",
    deadline:
      "IMMEDIATE -- submit the F10 without further delay. Under CDM 2015 reg 6(1), the notification should have been made BEFORE the construction phase began.",
    recommendedLeadDays: 0,
    method:
      "Online submission only via the HSE F10 portal (https://form.hse.gov.uk/f10) without delay. Document the reason for late notification in the project records. HSE no longer accepts paper forms or notifications by email or post.",
    form: "F10 -- Notification of construction project",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The CLIENT is responsible for submitting the F10. Failure to notify a notifiable project is an offence under HSWA 1974 s33 and may attract HSE enforcement action.",
    updateRequired: false,
    displayRequired: true,
    pdPcAppointmentRequired: false,
    recordKeeping:
      "Record the reason for late notification, the date construction started, and the date the F10 was submitted. Display the F10 on site immediately upon receipt of the HSE acknowledgement.",
    regulations: [
      "CDM 2015 Reg 6(1) -- Notification to HSE",
      "CDM 2015 Reg 6(4) -- Display on site",
      "CDM 2015 Reg 15 -- Duties of contractors (single-contractor obligations)",
      "HSWA 1974 s33 -- Offences",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "A late F10 is better than no F10. Submit immediately.",
      "If additional contractors are subsequently engaged, PD/PC must be appointed in writing under reg 5 and the F10 must be updated under reg 6(2).",
      "The HSE may make enquiries about the delay. Be prepared to explain the reasons.",
      "Late notification does not retrospectively cover the pre-notification period -- the client remained in breach.",
    ],
  },

  // Differentiates the non-notifiable-domestic outcome based on contractor count
  // (the original tree asked the question but used the same terminal either way).
  "domestic-not-notifiable-multi": {
    id: "domestic-not-notifiable-multi",
    notifiable: false,
    title: "DOMESTIC CLIENT -- Not Notifiable (Multi-Contractor, PD/PC Still Required)",
    description:
      "The project is for a domestic client and does NOT meet the reg 6(1) notification thresholds, so no F10 is required. However more than one contractor is engaged, so a Principal Designer and Principal Contractor MUST still be appointed in writing under reg 5. Client duties transfer to the PC under reg 7(1)(b), or to the PD under reg 7(1)(c) if a written agreement is in place.",
    deadline: "Not applicable -- project is not notifiable. Reg 5 PD/PC appointments must be in place before the construction phase begins.",
    method: "No F10 submission required.",
    form: "N/A",
    responsiblePerson:
      "PD and PC must be appointed in writing by the domestic client under reg 5. Client duties then transfer to the PC (reg 7(1)(b)) or PD by written agreement (reg 7(1)(c)). If the domestic client fails to appoint, reg 7(2) applies: the designer in control of the pre-construction phase becomes the PD, the contractor in control of the construction phase becomes the PC.",
    updateRequired: false,
    displayRequired: false,
    pdPcAppointmentRequired: true,
    recordKeeping:
      "Retain written reg 5 appointments and any reg 7(1)(c) PD agreement. Record the notifiability determination for project records.",
    regulations: [
      "CDM 2015 Reg 5 -- Appointment of PD and PC (multi-contractor)",
      "CDM 2015 Reg 6(1) -- Notification thresholds",
      "CDM 2015 Reg 7(1) -- Domestic client duty transfer",
      "CDM 2015 Reg 7(2) -- Default appointments where domestic client fails to appoint",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "Even non-notifiable domestic projects must comply with the rest of CDM 2015.",
      "Without written reg 5 appointments, reg 7(2) automatically defaults the PD/PC roles to the relevant designer/contractor in control.",
    ],
  },

  "domestic-not-notifiable-single": {
    id: "domestic-not-notifiable-single",
    notifiable: false,
    title: "DOMESTIC CLIENT -- Not Notifiable (Single Contractor)",
    description:
      "The project is for a domestic client and does NOT meet the reg 6(1) notification thresholds. As only one contractor is involved, PD/PC appointment is not required. Domestic client duties transfer to the contractor under reg 7(1)(a).",
    deadline: "Not applicable -- project is not notifiable.",
    method: "No F10 submission required.",
    form: "N/A",
    responsiblePerson:
      "The CONTRACTOR takes on the domestic client duties under reg 7(1)(a) in addition to their own contractor duties under reg 15.",
    updateRequired: false,
    displayRequired: false,
    pdPcAppointmentRequired: false,
    recordKeeping:
      "Record the notifiability determination for project records. The contractor must retain evidence of compliance with reg 15 contractor duties.",
    regulations: [
      "CDM 2015 Reg 7(1)(a) -- Domestic client duties transfer to single contractor",
      "CDM 2015 Reg 6(1) -- Notification thresholds",
      "CDM 2015 Reg 15 -- Duties of contractors",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "Even non-notifiable domestic projects must comply with the rest of CDM 2015.",
      "If a second contractor is engaged at any point, the project becomes a multi-contractor project: the domestic client must appoint PD/PC in writing under reg 5 and the duty transfer route changes to reg 7(1)(b).",
    ],
  },

  // Differentiates "yes -- written appointment in place" (proceed with update) from
  // "no -- get the appointment in writing first" (update is BLOCKED until appointed).
  // Original tree collapsed both onto update-required-pc-change which lost the action item.
  "update-blocked-pc-no-written-appointment": {
    id: "update-blocked-pc-no-written-appointment",
    notifiable: true,
    title: "F10 UPDATE BLOCKED -- Secure PC Written Appointment First",
    description:
      "A change of Principal Contractor has been initiated, but the new PC has not yet been appointed in writing by the client. CDM 2015 reg 5(1)(b) requires PC appointments to be in writing. The F10 update under reg 6(2) cannot be completed honestly until the written appointment is in place; meanwhile the client is exposed to the reg 5(3)/(4) consequence of carrying the PC duties personally.",
    deadline: "IMMEDIATE -- arrange the written PC appointment, then update the F10 within days.",
    recommendedLeadDays: 0,
    method: "Once the written reg 5 appointment is in place, update the F10 via the HSE portal (https://form.hse.gov.uk/f10) using the original submission reference.",
    form: "F10 -- Notification of construction project (Update, after written appointment)",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The CLIENT must (1) make the written PC appointment under reg 5(1)(b), then (2) update the F10 under reg 6(2). Until step (1) is complete, the client carries the PC duties under reg 5(4).",
    updateRequired: true,
    displayRequired: true,
    pdPcAppointmentRequired: true,
    recordKeeping:
      "Retain the new written reg 5 appointment, the H&S file handover from the outgoing PC, and both the original and revised F10. Display the new F10 once issued.",
    regulations: [
      "CDM 2015 Reg 5(1)(b) -- Written appointment of Principal Contractor",
      "CDM 2015 Reg 5(4) -- Client carries PC duties if no written PC appointed",
      "CDM 2015 Reg 6(2) -- Notification of change of particulars",
      "CDM 2015 Reg 6(4) -- Display on site",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "Re-appointment MUST be in writing before the F10 update is submitted.",
      "Outgoing PC must hand over all H&S file material before the change takes effect.",
      "Until the written appointment is made, the client is the PC by default and bears the reg 13/14 PC duties personally.",
    ],
  },

  "update-blocked-pd-no-written-appointment": {
    id: "update-blocked-pd-no-written-appointment",
    notifiable: true,
    title: "F10 UPDATE BLOCKED -- Secure PD Written Appointment First",
    description:
      "A change of Principal Designer has been initiated, but the new PD has not yet been appointed in writing by the client. CDM 2015 reg 5(1)(a) requires PD appointments to be in writing. The F10 update under reg 6(2) cannot be completed honestly until the written appointment is in place; meanwhile the client carries the PD duties under reg 5(3).",
    deadline: "IMMEDIATE -- arrange the written PD appointment, then update the F10 within days.",
    recommendedLeadDays: 0,
    method: "Once the written reg 5 appointment is in place, update the F10 via the HSE portal (https://form.hse.gov.uk/f10) using the original submission reference.",
    form: "F10 -- Notification of construction project (Update, after written appointment)",
    portalUrl: "https://form.hse.gov.uk/f10",
    responsiblePerson:
      "The CLIENT must (1) make the written PD appointment under reg 5(1)(a), then (2) update the F10 under reg 6(2). Until step (1) is complete, the client carries the PD duties under reg 5(3).",
    updateRequired: true,
    displayRequired: true,
    pdPcAppointmentRequired: true,
    recordKeeping:
      "Retain the new written reg 5 appointment, the pre-construction information handover from the outgoing PD, and both the original and revised F10. Display the new F10 once issued.",
    regulations: [
      "CDM 2015 Reg 5(1)(a) -- Written appointment of Principal Designer",
      "CDM 2015 Reg 5(3) -- Client carries PD duties if no written PD appointed",
      "CDM 2015 Reg 6(2) -- Notification of change of particulars",
      "CDM 2015 Reg 11 -- PD duties",
      "HSE L153 -- Managing health and safety in construction",
    ],
    additionalNotes: [
      "Re-appointment MUST be in writing before the F10 update is submitted.",
      "PD handover must include all pre-construction information gathered to date.",
      "Until the written appointment is made, the client is the PD by default and bears the reg 11 PD duties personally.",
    ],
  },
};

// ─── Decision Tree Nodes ────────────────────────────────────────

// NEW PROJECT branch ----------------------------------------------
export const NEW_PROJECT_NODES: TreeNode[] = [
  {
    id: "new-1",
    question: "Is the project for a domestic client?",
    helpText:
      "A domestic client is an individual having work done on their own home that is NOT connected with any business. Landlords, housing associations, and commercial property owners are NOT domestic clients.",
    regulation: "CDM 2015 Reg 7",
    options: [
      { label: "Yes -- domestic client (private home, not business)", nextNodeId: "dom-1" },
      { label: "No -- commercial, public, or other non-domestic client", nextNodeId: "new-2" },
    ],
  },
  {
    id: "new-2",
    question:
      "Based on the project inputs above, does the project meet the CDM 2015 reg 6(1) notification thresholds?",
    helpText:
      "Reg 6(1): notifiable if the construction phase is likely to (a) last longer than 30 working days AND have more than 20 workers working simultaneously at any point, OR (b) exceed 500 person-days. This tool has auto-calculated the outcome from your inputs.",
    regulation: "CDM 2015 Reg 6(1)",
    options: [
      {
        label: "YES -- thresholds exceeded (auto-computed)",
        description: "Project meets one or both reg 6(1) thresholds.",
        nextNodeId: "new-3",
      },
      {
        label: "NO -- thresholds not exceeded",
        description: "Project is below both reg 6(1) thresholds.",
        terminalId: "new-not-notifiable",
      },
    ],
  },
  {
    id: "new-3",
    question: "Has construction work already started on site?",
    helpText:
      "The F10 must be submitted BEFORE the construction phase begins. Late notification is a breach of reg 6(1).",
    regulation: "CDM 2015 Reg 6(1)",
    options: [
      {
        label: "No -- construction has NOT yet started",
        nextNodeId: "new-4",
      },
      {
        label: "YES -- construction has ALREADY started without F10 submitted",
        description: "Late notification -- the next question determines whether PD/PC appointment is required.",
        nextNodeId: "new-3a",
      },
    ],
  },
  {
    id: "new-3a",
    question:
      "(Late notification) Will more than one contractor be engaged on the project at any point?",
    helpText:
      "Even for late-notified projects, the reg 5 PD/PC appointment trigger turns on whether the project is multi-contractor. A single-contractor late-notified project does not require PD/PC under reg 5; the contractor carries reg 15 duties.",
    regulation: "CDM 2015 Reg 5",
    options: [
      {
        label: "Yes -- more than one contractor (PD/PC required)",
        terminalId: "new-notifiable-multi-pre-start",
      },
      {
        label: "No -- only a single contractor",
        terminalId: "new-notifiable-single-pre-start",
      },
    ],
  },
  {
    id: "new-4",
    question:
      "Will more than one contractor be engaged on the project at any point?",
    helpText:
      "If more than one contractor is engaged, the client must appoint a Principal Designer and Principal Contractor in writing under reg 5. This affects the F10 fields relating to PD/PC details.",
    regulation: "CDM 2015 Reg 5",
    options: [
      {
        label: "Yes -- more than one contractor",
        description: "PD and PC must be appointed in writing.",
        terminalId: "new-notifiable-multi",
      },
      {
        label: "No -- only a single contractor",
        description: "PD/PC not strictly required, but the contractor carries PC-equivalent duties.",
        terminalId: "new-notifiable-single",
      },
    ],
  },
];

// EXISTING UPDATE branch ------------------------------------------
export const UPDATE_NODES: TreeNode[] = [
  {
    id: "upd-1",
    question: "What type of change has occurred?",
    helpText:
      "Reg 6(2) requires an F10 update when the particulars of the original notification change materially. Select the change that has occurred (you can re-run this tool for multiple changes).",
    regulation: "CDM 2015 Reg 6(2)",
    options: [
      {
        label: "Principal Contractor has changed",
        nextNodeId: "upd-2a",
      },
      {
        label: "Principal Designer has changed",
        nextNodeId: "upd-2b",
      },
      {
        label: "Project description, duration, workforce, or start/end date has changed",
        nextNodeId: "upd-2c",
      },
      {
        label: "Client details have changed",
        nextNodeId: "upd-2d",
      },
      {
        label: "Minor administrative change (e.g. contact number, typo correction)",
        terminalId: "update-not-required",
      },
    ],
  },
  {
    id: "upd-2a",
    question:
      "Has the new Principal Contractor been appointed in writing by the client?",
    helpText:
      "Under reg 5, the PC appointment must be in writing. Without a written appointment, the client takes on the PC duties themselves under reg 5(4) until appointment is made -- and the F10 update should not be submitted listing a PC that has not yet been formally appointed.",
    regulation: "CDM 2015 Reg 5(1)(b)",
    options: [
      {
        label: "Yes -- written appointment is in place",
        terminalId: "update-required-pc-change",
      },
      {
        label: "No -- appointment not yet written",
        description: "F10 update is BLOCKED until the written appointment is in place.",
        terminalId: "update-blocked-pc-no-written-appointment",
      },
    ],
  },
  {
    id: "upd-2b",
    question:
      "Has the new Principal Designer been appointed in writing by the client?",
    helpText:
      "Under reg 5, the PD appointment must be in writing. Without a written appointment, the client takes on the PD duties themselves under reg 5(3) until appointment is made -- and the F10 update should not be submitted listing a PD that has not yet been formally appointed.",
    regulation: "CDM 2015 Reg 5(1)(a)",
    options: [
      {
        label: "Yes -- written appointment is in place",
        terminalId: "update-required-pd-change",
      },
      {
        label: "No -- appointment not yet written",
        description: "F10 update is BLOCKED until the written appointment is in place.",
        terminalId: "update-blocked-pd-no-written-appointment",
      },
    ],
  },
  {
    id: "upd-2c",
    question: "Is the change material? (substantially affects scope, duration, or workforce)",
    helpText:
      "Material changes include: significant extension of programme, doubling of peak workforce, addition of demolition scope, major change in project description. Minor slippage (e.g. 2-week delay on a 52-week project) is not normally material.",
    regulation: "CDM 2015 Reg 6(2)",
    options: [
      {
        label: "Yes -- material change",
        terminalId: "update-required-scope-change",
      },
      {
        label: "No -- change is minor",
        terminalId: "update-not-required",
      },
    ],
  },
  {
    id: "upd-2d",
    question: "Has the client organisation changed, or just contact details?",
    helpText:
      "A change of client (e.g. project sold to a different owner) is material and requires update. A change of client contact person or contact number is not.",
    regulation: "CDM 2015 Reg 6(2)",
    options: [
      {
        label: "Client organisation has changed",
        terminalId: "update-required-scope-change",
      },
      {
        label: "Only client contact details have changed",
        terminalId: "update-not-required",
      },
    ],
  },
];

// DOMESTIC CLIENT branch ------------------------------------------
export const DOMESTIC_NODES: TreeNode[] = [
  {
    id: "dom-1",
    question: "Does the project meet the CDM 2015 reg 6(1) notification thresholds?",
    helpText:
      "Reg 6(1): notifiable if >30 working days AND >20 simultaneous workers, OR >500 person-days. This applies to domestic projects too.",
    regulation: "CDM 2015 Reg 6(1)",
    options: [
      {
        label: "YES -- thresholds exceeded",
        nextNodeId: "dom-2",
      },
      {
        label: "NO -- thresholds not exceeded",
        nextNodeId: "dom-3",
      },
    ],
  },
  {
    id: "dom-2",
    question:
      "Is there a written agreement between the Principal Designer and the domestic client transferring client duties to the PD under reg 7(1)(c)?",
    helpText:
      "Reg 7(1)(c) allows a PD to take on the domestic client duties, but only by written agreement. Without such an agreement, reg 7(1) applies and the duties fall to the PC.",
    regulation: "CDM 2015 Reg 7(1)(c)",
    options: [
      {
        label: "Yes -- signed reg 7(1)(c) agreement in place",
        terminalId: "domestic-duties-to-pd",
      },
      {
        label: "No written agreement -- default to PC",
        terminalId: "domestic-duties-to-pc",
      },
    ],
  },
  {
    id: "dom-3",
    question:
      "Will more than one contractor be engaged on the project at any point?",
    helpText:
      "Even for non-notifiable domestic projects, PD/PC must be appointed in writing under reg 5 where multiple contractors are involved. Reg 7(1)(b) transfers client duties to the PC. For a single-contractor domestic project, reg 7(1)(a) transfers the duties to that contractor and PD/PC appointment is not required.",
    regulation: "CDM 2015 Reg 5",
    options: [
      {
        label: "Yes -- multiple contractors",
        description: "PD and PC must still be appointed in writing under reg 5.",
        terminalId: "domestic-not-notifiable-multi",
      },
      {
        label: "No -- single contractor only",
        description: "Domestic client duties transfer to the contractor under reg 7(1)(a).",
        terminalId: "domestic-not-notifiable-single",
      },
    ],
  },
];

// SITE DISPLAY branch ---------------------------------------------
export const DISPLAY_NODES: TreeNode[] = [
  {
    id: "dis-1",
    question: "Is a copy of the most recent F10 currently displayed on site?",
    helpText:
      "Reg 6(4) requires the most recent F10 to be displayed on site in a place where it can be read by workers. A pinned printout on the site noticeboard is sufficient.",
    regulation: "CDM 2015 Reg 6(4)",
    options: [
      {
        label: "Yes -- displayed and legible",
        nextNodeId: "dis-2",
      },
      {
        label: "No -- not displayed, missing, or illegible",
        terminalId: "display-action-required",
      },
    ],
  },
  {
    id: "dis-2",
    question:
      "Is the displayed F10 the MOST RECENT version (i.e. reflects all updates under reg 6(2))?",
    helpText:
      "Every F10 revision must be displayed in place of the previous version. An outdated displayed F10 is a breach of reg 6(4).",
    regulation: "CDM 2015 Reg 6(4)",
    options: [
      {
        label: "Yes -- the displayed copy is the most recent version",
        nextNodeId: "dis-3",
      },
      {
        label: "No -- the displayed copy is an earlier version",
        terminalId: "display-action-required",
      },
    ],
  },
  {
    id: "dis-3",
    question:
      "Can all workers on site (including non-English speakers, if applicable) read and understand the displayed F10?",
    helpText:
      "Reg 6(4) is about effective communication. If workers cannot read the notice, the display duty is not satisfied. Consider translation or pictorial summaries where appropriate.",
    regulation: "CDM 2015 Reg 6(4)",
    options: [
      {
        label: "Yes -- legible and comprehensible to all workers",
        terminalId: "display-compliant",
      },
      {
        label: "No -- some workers cannot read or understand the notice",
        terminalId: "display-action-required",
      },
    ],
  },
];

// ─── All nodes & first-node map ──────────────────────────────────

export function getAllNodes(): Record<string, TreeNode> {
  const map: Record<string, TreeNode> = {};
  [...NEW_PROJECT_NODES, ...UPDATE_NODES, ...DOMESTIC_NODES, ...DISPLAY_NODES].forEach(n => {
    map[n.id] = n;
  });
  return map;
}

export const CATEGORY_FIRST_NODE: Record<F10Category, string> = {
  "new-project": "new-1",
  "existing-update": "upd-1",
  "domestic-check": "dom-1",
  "display-check": "dis-1",
};

// ─── HSE Contact Details ────────────────────────────────────────

export const HSE_CONTACTS = {
  // Verified from https://www.hse.gov.uk/forms/notification/f10.htm (April 2026):
  // HSE no longer accepts F10 submissions by email or post. Submission is online only.
  // The HSE Customer Services Team handles F10 enquiries via telephone.
  f10Portal: "https://form.hse.gov.uk/f10",
  f10Guidance: "https://www.hse.gov.uk/forms/notification/f10.htm",
  f10ConstructionGuidance: "https://www.hse.gov.uk/construction/cdm/2015/notification.htm",
  l153Url: "https://www.hse.gov.uk/pubns/books/l153.htm",
  hseInfoLine: "0300 003 1747",
  hseInfoLineHours: "Monday to Friday, 8:30am to 5pm",
  hseAddress:
    "Health and Safety Executive, Redgrave Court, Merton Road, Bootle, Merseyside L20 7HS",
  // F10 enquiries are routed through the Customer Services Team telephone (above).
  // HSE does not publish a dedicated F10 enquiries email -- previous "notifications@hse.gov.uk"
  // address removed as it could not be verified against the HSE F10 page.
};

// ─── F10 Field Catalogue (mandatory fields per HSE F10 form) ────

export interface F10Field {
  id: string;
  label: string;
  section: string;
  required: boolean;
  mandatoryReg: string;
  inputSource: keyof ProjectInputs | "derived" | "manual";
  description: string;
}

// CDM 2015 Schedule 1 ("Particulars to be notified under regulation 6") contains
// 15 paragraphs. The mapping below uses the actual statutory paragraph numbers
// for the items that ARE in Schedule 1, and labels the additional fields the
// HSE F10 portal asks for (project name, existing site use, demolition flag,
// submission date) as "HSE F10 form (additional)" -- they are not legally
// required by Schedule 1 but the online portal collects them.
//
// Schedule 1 (CDM 2015):
//   1.  Date of forwarding the notice
//   2.  Address of the construction site
//   3.  Name of the local authority
//   4.  Brief description of the project and the construction work
//   5.  Contact details of the client
//   6.  Contact details of the principal designer
//   7.  Contact details of the principal contractor
//   8.  Date planned for the start of the construction phase
//   9.  Time allocated by the client under reg 4(1) for the construction work
//  10.  Planned duration of the construction phase
//  11.  Estimated maximum number of people at work on site
//  12.  Planned number of contractors on the construction site
//  13.  Name and address of any contractor already appointed
//  14.  Name and address of any designer already appointed
//  15.  Declaration signed by or on behalf of the client
export const F10_FIELDS: F10Field[] = [
  // Project identification
  {
    id: "project-name",
    label: "Project name / title",
    section: "Project Identification",
    required: true,
    mandatoryReg: "HSE F10 form (additional, not in Sched 1)",
    inputSource: "projectName",
    description: "Short identifying name for the project (e.g. 'Main Street Flats -- Fit-out'). Not a statutory Sched 1 particular but collected by the HSE F10 online portal as a project identifier.",
  },
  {
    id: "site-address",
    label: "Site address (including postcode)",
    section: "Project Identification",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 2",
    inputSource: "projectAddress",
    description: "Full postal address where the construction work will take place.",
  },
  {
    id: "local-authority",
    label: "Local authority for the site",
    section: "Project Identification",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 3",
    inputSource: "localAuthority",
    description:
      "The local authority in whose area the site falls (e.g. 'Salford City Council').",
  },
  {
    id: "existing-use",
    label: "Brief description of existing use of site",
    section: "Project Identification",
    required: true,
    mandatoryReg: "HSE F10 form (additional, not in Sched 1)",
    inputSource: "existingUse",
    description: "What the site is currently used for (e.g. 'vacant warehouse', 'occupied office'). Collected by the HSE F10 portal but not a statutory Sched 1 particular.",
  },
  {
    id: "brief-description",
    label: "Brief description of the construction work",
    section: "Project Identification",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 4",
    inputSource: "briefDescription",
    description:
      "One- or two-sentence description of the works (e.g. 'Demolition of existing warehouse and erection of 12-storey residential building').",
  },
  // Timing & workforce
  {
    id: "planned-start",
    label: "Planned date for construction phase start",
    section: "Timing & Workforce",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 8",
    inputSource: "plannedStartDate",
    description: "Date construction work is planned to begin on site.",
  },
  {
    id: "planned-duration",
    label: "Planned duration of the construction phase",
    section: "Timing & Workforce",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 10",
    inputSource: "durationWeeks",
    description: "Expected total length of the construction phase, in weeks. (Sched 1 para 9 -- the time allocated by the client under reg 4(1) -- is a related but separately-listed particular and is captured by the HSE F10 portal.)",
  },
  {
    id: "peak-workers",
    label: "Estimated maximum number of people working simultaneously on site",
    section: "Timing & Workforce",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 11",
    inputSource: "peakSimultaneousWorkers",
    description: "Peak simultaneous workforce -- drives the reg 6(1) threshold test.",
  },
  {
    id: "contractor-count",
    label: "Estimated number of contractor organisations on the project",
    section: "Timing & Workforce",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 12",
    inputSource: "contractorOrganisationCount",
    description: "Number of separate contractor companies expected to be engaged.",
  },
  {
    id: "demolition",
    label: "Does the project involve demolition?",
    section: "Timing & Workforce",
    required: true,
    mandatoryReg: "HSE F10 form (additional, not in Sched 1)",
    inputSource: "demolitionInvolved",
    description:
      "If yes, additional duties apply under CDM 2015 Part 4 (construction site health and safety). Collected by the HSE F10 portal but not a statutory Sched 1 particular.",
  },
  // Duty holders
  {
    id: "client-name",
    label: "Client's name",
    section: "Duty Holders",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 5",
    inputSource: "clientName",
    description: "Name of the client (or domestic client where reg 7 applies). Sched 1 para 5 requires full contact details (name, address, telephone, email) -- this field captures the name component.",
  },
  {
    id: "client-address",
    label: "Client's address and contact details",
    section: "Duty Holders",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 5",
    inputSource: "manual",
    description: "Address, telephone, email of the client (Sched 1 para 5 contact details).",
  },
  {
    id: "pd-name",
    label: "Principal Designer's name (if appointed)",
    section: "Duty Holders",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 6",
    inputSource: "pdName",
    description:
      "Must be appointed in writing under reg 5 where more than one contractor is engaged. Sched 1 para 6 requires PD contact details.",
  },
  {
    id: "pd-address",
    label: "Principal Designer's address and contact details",
    section: "Duty Holders",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 6",
    inputSource: "manual",
    description: "Address, telephone, email of the PD (Sched 1 para 6 contact details).",
  },
  {
    id: "pc-name",
    label: "Principal Contractor's name (if appointed)",
    section: "Duty Holders",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 7",
    inputSource: "pcName",
    description:
      "Must be appointed in writing under reg 5 where more than one contractor is engaged. Sched 1 para 7 requires PC contact details.",
  },
  {
    id: "pc-address",
    label: "Principal Contractor's address and contact details",
    section: "Duty Holders",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 7",
    inputSource: "manual",
    description: "Address, telephone, email of the PC (Sched 1 para 7 contact details).",
  },
  // Declaration
  {
    id: "declaration",
    label:
      "Declaration by client that they are aware of their CDM 2015 duties",
    section: "Declaration",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 15",
    inputSource: "manual",
    description:
      "Declaration signed by or on behalf of the client that the client is aware of the duties under CDM 2015. The HSE F10 online portal captures this as a tick box.",
  },
  {
    id: "submission-date",
    label: "Date of notification",
    section: "Declaration",
    required: true,
    mandatoryReg: "CDM 2015 Sched 1 para 1",
    inputSource: "derived",
    description: "Date the F10 is forwarded to HSE (Sched 1 para 1, 'date of forwarding the notice'). Auto-captured by the online portal at the moment of submission.",
  },
];

// Compute which fields are provided from current inputs
export function computeF10FieldStatus(inputs: ProjectInputs): {
  fields: { field: F10Field; provided: boolean; value?: string }[];
  providedCount: number;
  totalCount: number;
} {
  const fields = F10_FIELDS.map(f => {
    let provided = false;
    let value: string | undefined;
    if (f.inputSource === "manual" || f.inputSource === "derived") {
      provided = false; // manual fields not captured in inputs
    } else {
      const v = inputs[f.inputSource];
      if (typeof v === "string") {
        provided = v.trim().length > 0;
        value = v;
      } else if (typeof v === "number") {
        provided = v > 0;
        value = String(v);
      } else if (typeof v === "boolean") {
        // Booleans: only count as "provided" when affirmatively true.
        // A default-false (e.g. unchecked "Demolition?") should not inflate the
        // captured count until the user engages with it.
        provided = v === true;
        value = v ? "Yes" : "No";
      }
    }
    return { field: f, provided, value };
  });
  const providedCount = fields.filter(f => f.provided).length;
  return {
    fields,
    providedCount,
    totalCount: F10_FIELDS.length,
  };
}

// ─── Cross-references to related tools ─────────────────────────

export interface CrossRef {
  slug: string;
  name: string;
  relevance: string;
}

export const CROSS_REFS: CrossRef[] = [
  {
    slug: "welfare-facilities-calculator",
    name: "Welfare Facilities Calculator",
    relevance:
      "Calculate CDM 2015 Sched 2 welfare facilities required for the planned workforce.",
  },
  {
    slug: "site-induction-duration-calculator",
    name: "Site Induction Duration Calculator",
    relevance:
      "Determine the site induction duration based on project type and CDM 2015 status.",
  },
  {
    slug: "sunrise-sunset-times",
    name: "Sunrise & Sunset Times",
    relevance:
      "Check civil twilight and recommended CDM 2015 reg 34 working hours for the site location.",
  },
  {
    slug: "cdm-checker-builder",
    name: "AI CDM Compliance Checker",
    relevance:
      "Generate a full CDM 2015 gap analysis across all duty holders with regulation-by-regulation checks.",
    // Note: this is an AI tool not under /tools
  },
];

// ─── Responsible Person Guidance ────────────────────────────────

export const RESPONSIBLE_PERSON_GUIDANCE = {
  title: "Who Submits the F10?",
  description:
    "Under CDM 2015, the responsibility for submitting the F10 depends on the type of client:",
  categories: [
    {
      scenario: "Commercial / non-domestic client",
      responsible:
        "The CLIENT themselves. The duty cannot be delegated, although another party (e.g. PD) may prepare the form on the client's behalf.",
    },
    {
      scenario: "Domestic client (default)",
      responsible:
        "The PRINCIPAL CONTRACTOR -- domestic client duties transfer to the PC under reg 7(1).",
    },
    {
      scenario: "Domestic client (with reg 7(1)(c) written agreement)",
      responsible:
        "The PRINCIPAL DESIGNER -- client duties transfer to the PD by written agreement under reg 7(1)(c).",
    },
    {
      scenario: "Change of particulars (reg 6(2))",
      responsible:
        "Whoever originally submitted the F10 (client or PC/PD under reg 7). Updates are made via the HSE F10 portal.",
    },
    {
      scenario: "Site display (reg 6(4))",
      responsible:
        "The PRINCIPAL CONTRACTOR is typically responsible for maintaining the displayed F10 under reg 13 PC duties.",
    },
  ],
  additionalNotes: [
    "The client cannot delegate the F10 submission duty, but may ask the PD or another competent party to prepare the form for them to submit.",
    "Failure to submit a required F10 is an offence under HSWA 1974 s33 and may attract HSE enforcement action.",
    "Even where client duties transfer to the PC/PD on domestic projects, the domestic client still benefits from the protections of CDM 2015.",
  ],
};

// ─── Flowchart node type ────────────────────────────────────────

export interface FlowchartNode {
  id: string;
  label: string;
  type: "start" | "question" | "terminal-yes" | "terminal-no" | "category";
  status: "inactive" | "active" | "completed" | "future";
}
