// src/data/ladder-stepladder-justification-tool.ts
// Ladder/Stepladder Justification Tool — WAH Regs 2005 hierarchy assessment
// Forces user through all safer access options before ladders/stepladders are justified

// ─── Types ──────────────────────────────────────────────────────
export type OptionId =
  | "avoid"
  | "mewp"
  | "scaffold"
  | "tower"
  | "podium"
  | "hopup"
  | "stepladder"
  | "leaning-ladder";

export type Answer = "yes" | "no";

export type LocationType = "indoor" | "outdoor" | "mixed";
export type DurationBand = "under-15" | "15-30" | "30-60" | "1-4hr" | "over-4hr";
export type Recurrence = "one-off" | "weekly" | "daily" | "multi-daily";

export interface PreAssessment {
  workingHeightM: number;
  durationBand: DurationBand;
  recurrence: Recurrence;
  toolWeightKg: number;
  location: LocationType;
  taskDescription: string;
}

export interface ReasonOption {
  id: string;
  label: string;
}

export interface HierarchyOption {
  id: OptionId;
  rank: number;
  icon: string;
  name: string;
  shortName: string;
  category: "elimination" | "powered-access" | "working-platform" | "small-platform" | "ladder";
  description: string;
  regulation: string;
  question: string;
  /** Reasons why this option might NOT be viable */
  noReasons: ReasonOption[];
  /** Specification & requirements when this option IS chosen */
  specRequirements: string[];
  /** Pre-use checklist items */
  preUseChecklist: string[];
  /** Training/competence requirement */
  competence: string;
  /** Maximum safe working height */
  maxHeightM: number | null;
  /** Safety rating 1-10 (10 = safest) */
  safetyScore: number;
}

export interface OptionAnswer {
  optionId: OptionId;
  answer: Answer | null;
  /** For "No" answers: either a reasonId from noReasons OR a custom free-text reason */
  reasonId: string | null;
  customReason: string;
}

export interface JustificationResult {
  /** The final justified access method — null if none reached (re-design needed) */
  justifiedOption: OptionId | null;
  /** Whether ladders/stepladders are justified as the chosen option */
  laddersJustified: boolean;
  /** Audit trail of all options considered */
  auditTrail: AuditEntry[];
  /** Overall status */
  status: "justified-safer" | "justified-stepladder" | "justified-leaning-ladder" | "no-viable-option" | "incomplete";
  /** Warnings raised by the pre-assessment */
  preAssessmentWarnings: string[];
}

export interface AuditEntry {
  optionId: OptionId;
  optionName: string;
  answer: Answer | null;
  reasonText: string | null;
  rejected: boolean;
  selected: boolean;
}

// ─── Hierarchy Options (safest to least safe) ───────────────────
export const HIERARCHY_OPTIONS: HierarchyOption[] = [
  {
    id: "avoid",
    rank: 1,
    icon: "[1]",
    name: "Avoid work at height",
    shortName: "Avoid WaH",
    category: "elimination",
    description: "Eliminate the need to work at height altogether. Can the task be done from ground level, or the element brought down to a safe working height?",
    regulation: "Reg 6(2) Work at Height Regulations 2005",
    question: "Can the work be avoided or eliminated? (e.g. pre-assembly at ground level, use of extendable tools, remote inspection, or bringing the element down)",
    noReasons: [
      { id: "avoid-1", label: "Task physically requires access at height (e.g. overhead installation or fixing)" },
      { id: "avoid-2", label: "Element cannot be brought to ground (fixed/installed structure)" },
      { id: "avoid-3", label: "No remote or extendable-tool alternative available for this task" },
      { id: "avoid-4", label: "Inspection/maintenance requires direct visual and hands-on contact" },
      { id: "avoid-5", label: "Task is a finishing/making-good operation that can only be done in situ" },
    ],
    specRequirements: [
      "Method statement to confirm ground-level working method",
      "Risk assessment to capture any residual at-height risks (e.g. elevated platforms for pre-assembly)",
      "Tools used from ground (extendable/telescopic) must be rated for the load and reach",
      "Manual handling assessment if lowering elements from height",
    ],
    preUseChecklist: [
      "Task confirmed as achievable from ground level",
      "Ground area cleared and segregated where required",
      "Suitable ground-level tools/equipment available and inspected",
      "Workers briefed on ground-level method statement",
    ],
    competence: "Competent for the task itself; no specific at-height training required",
    maxHeightM: 0,
    safetyScore: 10,
  },
  {
    id: "mewp",
    rank: 2,
    icon: "[2]",
    name: "Mobile Elevating Work Platform (MEWP)",
    shortName: "MEWP",
    category: "powered-access",
    description: "Powered access platform -- scissor lift (vertical, platform work) or boom lift / cherry picker (outreach, spot work). Provides a fully enclosed working platform with edge protection.",
    regulation: "BS EN 280 / IPAF / PUWER 1998",
    question: "Is a MEWP (scissor lift, cherry picker, or boom lift) suitable and available for this task?",
    noReasons: [
      { id: "mewp-1", label: "No access route for MEWP (doorway/gate too narrow, stairs only)" },
      { id: "mewp-2", label: "Ground conditions unsuitable (soft, uneven, or sloped beyond MEWP tolerance)" },
      { id: "mewp-3", label: "Overhead obstructions (cables, pipework, ceilings) prevent MEWP deployment" },
      { id: "mewp-4", label: "Interior work with restricted headroom below MEWP stowed height" },
      { id: "mewp-5", label: "Hire cost disproportionate to task size/duration and no MEWP on site" },
    ],
    specRequirements: [
      "Operator holds current IPAF PAL card for the machine category (1a/1b/3a/3b)",
      "Daily pre-use check recorded (LOLER-compliant)",
      "Thorough Examination within last 6 months (LOLER Reg 9)",
      "Ground bearing assessment if outrigger load > ground capacity",
      "Fall arrest harness with short restraint lanyard required on boom (3a/3b) MEWPs",
      "Rescue plan in place for operator trapped at height",
      "Banksman for reversing and manoeuvring in congested areas",
    ],
    preUseChecklist: [
      "MEWP has current Thorough Examination certificate (visible on machine)",
      "Daily pre-use inspection completed and recorded",
      "Operator IPAF PAL card verified for this category",
      "Ground conditions assessed -- firm, level, load-bearing",
      "Overhead hazards identified and avoided (min 600mm clearance from live cables)",
      "Emergency lowering procedure understood by all users",
      "Harness and short lanyard attached to anchor point (boom MEWPs)",
      "Exclusion zone established around MEWP footprint and below platform",
    ],
    competence: "IPAF PAL card (category 1a/1b/3a/3b as appropriate) + site-specific familiarisation",
    maxHeightM: 40,
    safetyScore: 9,
  },
  {
    id: "scaffold",
    rank: 3,
    icon: "[3]",
    name: "Scaffold (tube & fitting or system)",
    shortName: "Scaffold",
    category: "working-platform",
    description: "Fixed scaffold platform providing guardrails, toeboards, and a stable working platform. Best for long-duration, multi-trade, or heavy-load work.",
    regulation: "NASC TG20:21 / SG4:22 / BS EN 12811 / WAH Reg 8",
    question: "Can a scaffold (tube & fitting, system, or birdcage) be erected for this task?",
    noReasons: [
      { id: "scaffold-1", label: "Task duration too short to justify erect/dismantle (typically under 1 shift)" },
      { id: "scaffold-2", label: "No CISRS competent scaffolder available for design category required" },
      { id: "scaffold-3", label: "Task area inaccessible for scaffold tubes (confined, restricted, or no tie points)" },
      { id: "scaffold-4", label: "Live floor/occupancy below prevents birdcage or would require full shutdown" },
      { id: "scaffold-5", label: "Only lightweight or intermittent access required (overspec for task)" },
    ],
    specRequirements: [
      "Design by a Temporary Works Coordinator if non-standard (NASC TG20 non-compliant)",
      "Erection, alteration, and dismantle by CISRS-carded scaffolder",
      "Handover certificate (scafftag) before first use",
      "Weekly inspection by competent person (Reg 12 WAH Regs 2005) -- recorded",
      "Post-adverse-weather inspection before return to use",
      "Loading class confirmed (Class 2/3/4/5/6) per BS EN 12811",
      "Tie pattern verified against design / TG20",
    ],
    preUseChecklist: [
      "Valid scafftag (green) in place with current week's inspection",
      "Guardrails at 950mm + intermediate + toeboards present",
      "Platform boards continuous, no gaps > 25mm",
      "Access ladder tied top and bottom, extends 1m above landing",
      "Loading class not exceeded (check scafftag)",
      "No alterations since last inspection",
      "Ties present at specified pattern",
      "Base plates/soleplates in place, no settlement",
    ],
    competence: "CISRS Basic/Advanced/Supervisor card for scaffolder; competent person for inspection",
    maxHeightM: 60,
    safetyScore: 8,
  },
  {
    id: "tower",
    rank: 4,
    icon: "[4]",
    name: "Mobile aluminium tower (PASMA)",
    shortName: "Tower",
    category: "working-platform",
    description: "Prefabricated mobile aluminium tower with guardrails, outriggers/stabilisers, and a platform. Quick to erect, relocatable, good for medium-duration work.",
    regulation: "BS EN 1004 / PASMA / WAH Reg 8",
    question: "Can a mobile aluminium tower (PASMA-trained assembly) be erected and used for this task?",
    noReasons: [
      { id: "tower-1", label: "Task area inaccessible to tower base footprint (too tight, obstructed)" },
      { id: "tower-2", label: "Floor loading insufficient for tower weight + load class" },
      { id: "tower-3", label: "Height required exceeds mobile tower range (>12m outdoor / >8m indoor standard)" },
      { id: "tower-4", label: "Tower components cannot be moved to work area (doorway/lift too small)" },
      { id: "tower-5", label: "No PASMA-trained operative available on site for assembly/dismantle" },
    ],
    specRequirements: [
      "Assembly and dismantle by PASMA-trained operative (Towers for Users / Advanced / Low Level)",
      "Manufacturer's instruction manual followed for assembly sequence",
      "Stabilisers/outriggers fitted as per manual (critical for stability)",
      "Indoor max height 2.5x shortest base dimension; outdoor 3x",
      "Base wheels/castors locked before access and during use",
      "Tower NEVER moved while occupied",
      "Weekly inspection by competent person if in place over 7 days (Reg 12)",
    ],
    preUseChecklist: [
      "PASMA tag (green) attached with assembly date and inspector",
      "All stabilisers/outriggers correctly fitted and ground-locked",
      "All guardrails, toeboards, and platform sections locked in place",
      "Wheels/castors locked (all four) before mounting",
      "Ladder/access route internal or inclined as per manual",
      "No missing or damaged components (braces, spigots, clips)",
      "Platform load class compatible with task (Class 3 = 2 kN/m2)",
      "Surrounding ground firm and level; exclusion zone established",
    ],
    competence: "PASMA Towers for Users (for assembly/dismantle); competent user for day-to-day use",
    maxHeightM: 12,
    safetyScore: 7,
  },
  {
    id: "podium",
    rank: 5,
    icon: "[5]",
    name: "Podium step / fold-out platform",
    shortName: "Podium",
    category: "small-platform",
    description: "Small wheeled platform with full-height guardrails on all sides (or a self-closing gate). Typically 0.5m to 2.5m platform height. Excellent for internal fit-out work.",
    regulation: "BS 5395-1 / BS EN 131-7 / PASMA Low Level",
    question: "Is a podium step or fold-out low-level work platform suitable and available?",
    noReasons: [
      { id: "podium-1", label: "Height required exceeds podium range (>2.5m platform height)" },
      { id: "podium-2", label: "Floor surface unsuitable (soft, uneven, sloped, or moving)" },
      { id: "podium-3", label: "Task location inaccessible to podium footprint (stairs, tight corners)" },
      { id: "podium-4", label: "Task requires frequent repositioning (podium slow to relocate)" },
      { id: "podium-5", label: "No podium available on site and short-term hire not viable" },
    ],
    specRequirements: [
      "User familiar with manufacturer's instructions",
      "Wheels locked and stabilisers/outriggers deployed (where fitted)",
      "Guardrails and gate fully deployed before access",
      "Max 1 person on platform (typical 150kg SWL -- check manufacturer)",
      "Platform used on level, firm ground only",
      "Weekly inspection by competent person if in continuous use",
    ],
    preUseChecklist: [
      "Wheels locked on all four castors",
      "Guardrails and self-closing gate operating correctly",
      "Platform deck intact, no damage or slip hazard",
      "No missing or damaged components",
      "Floor surface level and firm",
      "SWL not exceeded (1 person + tools typically)",
      "Visual inspection recorded (pre-use check tag)",
    ],
    competence: "PASMA Low Level Access Tower (LLAT) for podiums with wheels; site induction otherwise",
    maxHeightM: 2.5,
    safetyScore: 6,
  },
  {
    id: "hopup",
    rank: 6,
    icon: "[6]",
    name: "Hop-up / low-level work platform",
    shortName: "Hop-up",
    category: "small-platform",
    description: "Solid-top low platform (typically 300-1000mm high) providing a safe, stable standing surface for short-duration low-level work. No guardrails on traditional hop-ups.",
    regulation: "BS 2037 / BS EN 131-7",
    question: "Is a hop-up or trestle-type low-level work platform suitable for this task?",
    noReasons: [
      { id: "hopup-1", label: "Height required exceeds hop-up range (typically >1m platform height)" },
      { id: "hopup-2", label: "Task requires more standing area than hop-up deck provides" },
      { id: "hopup-3", label: "Surface below hop-up unstable, uneven, or sloped" },
      { id: "hopup-4", label: "Task requires overhead reach beyond what hop-up height enables" },
      { id: "hopup-5", label: "No hop-up available on site" },
    ],
    specRequirements: [
      "Hop-up in good condition -- deck intact, feet non-slip, legs straight",
      "Max 1 person on deck",
      "SWL (typically 150kg) not exceeded",
      "Used on level, firm ground only",
      "Not stacked or combined with other platforms to gain height",
    ],
    preUseChecklist: [
      "Deck surface intact, clean, and slip-free",
      "Feet in good condition with non-slip pads/tips",
      "Legs straight, not bent or damaged",
      "Platform level and stable when in position",
      "Ground firm and level",
      "SWL not exceeded",
    ],
    competence: "Site induction and toolbox talk on safe use of hop-ups",
    maxHeightM: 1,
    safetyScore: 5,
  },
  {
    id: "stepladder",
    rank: 7,
    icon: "[7]",
    name: "Stepladder",
    shortName: "Stepladder",
    category: "ladder",
    description: "Free-standing A-frame ladder with flat steps. Must be Class 1 (Industrial) or BS EN 131 Professional for construction use. Max 30 min short-duration use.",
    regulation: "BS EN 131 Professional / Ladder Association / HSE INDG455",
    question: "Is a stepladder the most suitable option? (Only use if ALL safer options have been rejected)",
    noReasons: [
      { id: "stepladder-1", label: "Height required exceeds stepladder range (Class 1 / EN 131 Pro: ~3m platform max)" },
      { id: "stepladder-2", label: "Task requires side-loading (stepladders become unstable laterally)" },
      { id: "stepladder-3", label: "Task requires both hands -- cannot maintain 3 points of contact" },
      { id: "stepladder-4", label: "Task duration exceeds 30-minute short-duration rule" },
      { id: "stepladder-5", label: "Base cannot be positioned on level, firm ground" },
    ],
    specRequirements: [
      "Stepladder must be Class 1 (Industrial) or BS EN 131 Professional -- NOT Class 3 Domestic",
      "Max 30 minutes short-duration use at one location (HSE guidance)",
      "Both locking bars/stays fully engaged before climbing",
      "Used only on firm, level ground",
      "Face the steps when working -- do not work sideways",
      "Maintain 3 points of contact at all times",
      "Do not stand on top step or top platform (unless designed for it)",
      "Do not carry loads that impair grip or 3-points contact",
    ],
    preUseChecklist: [
      "Stepladder is Class 1 (Industrial) / BS EN 131 Professional -- check label/marking",
      "Stiles not bent, twisted, cracked, or damaged",
      "Steps clean, not missing, not loose, not slippery",
      "Feet present, not worn smooth, rubber intact",
      "Locking bars/stays engage fully and stay locked",
      "Ropes/stays/hinges in good condition",
      "No paint or contamination masking cracks",
      "Inspection tag attached, current within last 3 months",
      "Ground below is level, firm, and free of obstructions",
      "Area around base segregated from pedestrian/vehicle traffic",
    ],
    competence: "Ladder Association Ladder User or site-specific toolbox talk + competent supervision",
    maxHeightM: 3,
    safetyScore: 3,
  },
  {
    id: "leaning-ladder",
    rank: 8,
    icon: "[8]",
    name: "Leaning ladder (extension / pole ladder)",
    shortName: "Leaning Ladder",
    category: "ladder",
    description: "Leaning ladder used for access or short-duration work at height. Must be Class 1 (Industrial) or BS EN 131 Professional. Max 30 min short-duration. Requires 1:4 angle, 1m overhang, and footing/tying.",
    regulation: "BS EN 131 Professional / Ladder Association / HSE INDG455",
    question: "Is a leaning ladder the ONLY viable option? (Highest-risk access method -- only if all other options are impossible)",
    noReasons: [
      { id: "leaning-1", label: "No suitable structure to lean ladder against" },
      { id: "leaning-2", label: "1:4 leaning angle (75 deg) cannot be achieved in available space" },
      { id: "leaning-3", label: "Task requires side-loading or two-handed work at height" },
      { id: "leaning-4", label: "Top of ladder cannot extend 1m above landing point" },
      { id: "leaning-5", label: "Task duration exceeds 30-minute short-duration rule" },
    ],
    specRequirements: [
      "Leaning ladder must be Class 1 (Industrial) or BS EN 131 Professional",
      "Max 30 minutes short-duration use at one location (HSE guidance)",
      "Set at 1:4 (75 deg) angle -- for every 4m up, 1m out",
      "Top must extend at least 1m above landing point",
      "Footed by second person OR tied at the top OR secured with stability device",
      "Maintain 3 points of contact at all times",
      "Do not carry loads exceeding 10kg",
      "Do not over-reach -- belt buckle must stay within stiles",
    ],
    preUseChecklist: [
      "Ladder is Class 1 (Industrial) / BS EN 131 Professional -- check marking",
      "Stiles not bent, twisted, cracked, or damaged",
      "Rungs clean, not missing, not loose, not slippery",
      "Feet present, not worn smooth, rubber intact",
      "Ropes (extension ladder) not frayed, pulleys working",
      "Rung locks engage fully (extension ladder)",
      "Inspection tag attached, current within last 3 months",
      "1:4 angle achievable in available space",
      "Top extends 1m above landing point",
      "Top and bottom secured -- tied, footed, or stability device in place",
      "Ground at base firm, level, and clear of obstructions",
      "Area segregated from pedestrian/vehicle traffic",
    ],
    competence: "Ladder Association Ladder User (minimum) + site-specific training + competent supervision",
    maxHeightM: 9,
    safetyScore: 2,
  },
];

export function getOption(id: OptionId): HierarchyOption {
  return HIERARCHY_OPTIONS.find(o => o.id === id)!;
}

// ─── Pre-Assessment Validation ──────────────────────────────────
export function runPreAssessmentChecks(pre: PreAssessment): string[] {
  const warnings: string[] = [];

  if (pre.workingHeightM > 9) {
    warnings.push(`Working height (${pre.workingHeightM}m) exceeds the maximum safe leaning ladder range. Ladders should NOT be considered for this task -- MEWP, scaffold, or tower required.`);
  }

  if (pre.workingHeightM > 3 && pre.workingHeightM <= 9) {
    warnings.push(`Working height (${pre.workingHeightM}m) exceeds stepladder range. If ladders are considered, only a leaning ladder is appropriate at this height.`);
  }

  if (pre.durationBand === "over-4hr" || pre.durationBand === "1-4hr") {
    warnings.push(`Task duration (${pre.durationBand === "over-4hr" ? "over 4 hours" : "1-4 hours"}) exceeds the HSE 30-minute short-duration rule for ladders. Scaffold or tower is strongly recommended.`);
  }

  if (pre.recurrence === "daily" || pre.recurrence === "multi-daily") {
    warnings.push(`Frequent recurrence indicates a more permanent access solution (scaffold, tower, or installed platform) would be more appropriate than ladders.`);
  }

  if (pre.toolWeightKg > 10) {
    warnings.push(`Tool/material weight (${pre.toolWeightKg}kg) exceeds the 10kg safe carrying limit for ladders. A working platform is required.`);
  }

  if (pre.workingHeightM < 0.5) {
    warnings.push(`Working height under 0.5m -- consider whether any elevated access is needed at all. Ground-level working may be possible.`);
  }

  return warnings;
}

// ─── Result Calculation ─────────────────────────────────────────
export function calculateJustification(
  answers: OptionAnswer[],
  pre: PreAssessment,
): JustificationResult {
  const preAssessmentWarnings = runPreAssessmentChecks(pre);
  const auditTrail: AuditEntry[] = [];
  let justifiedOption: OptionId | null = null;
  let status: JustificationResult["status"] = "incomplete";

  for (const opt of HIERARCHY_OPTIONS) {
    const ans = answers.find(a => a.optionId === opt.id);

    if (!ans || ans.answer === null) {
      // Unanswered — stop progression
      auditTrail.push({
        optionId: opt.id,
        optionName: opt.name,
        answer: null,
        reasonText: null,
        rejected: false,
        selected: false,
      });
      break;
    }

    if (ans.answer === "yes") {
      // First YES wins — this is the justified method
      justifiedOption = opt.id;
      auditTrail.push({
        optionId: opt.id,
        optionName: opt.name,
        answer: "yes",
        reasonText: null,
        rejected: false,
        selected: true,
      });

      if (opt.id === "stepladder") status = "justified-stepladder";
      else if (opt.id === "leaning-ladder") status = "justified-leaning-ladder";
      else status = "justified-safer";
      break;
    }

    // NO — record rejection with reason
    const reasonText = ans.customReason?.trim()
      ? ans.customReason.trim()
      : opt.noReasons.find(r => r.id === ans.reasonId)?.label ?? null;

    auditTrail.push({
      optionId: opt.id,
      optionName: opt.name,
      answer: "no",
      reasonText,
      rejected: true,
      selected: false,
    });
  }

  // If we went through every option and all were "no", no viable solution
  if (
    status === "incomplete" &&
    auditTrail.length === HIERARCHY_OPTIONS.length &&
    auditTrail.every(a => a.answer === "no")
  ) {
    status = "no-viable-option";
  }

  const laddersJustified =
    status === "justified-stepladder" || status === "justified-leaning-ladder";

  return {
    justifiedOption,
    laddersJustified,
    auditTrail,
    status,
    preAssessmentWarnings,
  };
}

// ─── Formatters ─────────────────────────────────────────────────
export function durationLabel(d: DurationBand): string {
  return {
    "under-15": "Under 15 minutes",
    "15-30": "15 - 30 minutes",
    "30-60": "30 - 60 minutes",
    "1-4hr": "1 - 4 hours",
    "over-4hr": "Over 4 hours",
  }[d];
}

export function recurrenceLabel(r: Recurrence): string {
  return {
    "one-off": "One-off task",
    "weekly": "Weekly or less",
    "daily": "Daily",
    "multi-daily": "Multiple times per day",
  }[r];
}

export function locationLabel(l: LocationType): string {
  return {
    "indoor": "Indoor",
    "outdoor": "Outdoor",
    "mixed": "Indoor and outdoor",
  }[l];
}
