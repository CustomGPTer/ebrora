// src/data/access-equipment.ts
// Access Equipment Selector — Equipment Library, Scoring Rules, and Text Library
// HSE hierarchy-compliant: Avoid → Prevent falls (collective) → Minimise consequences

// ─── Dropdown Option Types ──────────────────────────────────────
export interface DropdownOption {
  label: string;
  code: number;
}

export const HEIGHT_BANDS: DropdownOption[] = [
  { label: 'Under 2 m', code: 1 },
  { label: '2–4 m', code: 2 },
  { label: '4–8 m', code: 3 },
  { label: '8 m+', code: 4 },
];

export const DURATION_BANDS: DropdownOption[] = [
  { label: 'Under 15 min', code: 1 },
  { label: '15–60 min', code: 2 },
  { label: '1–4 hours', code: 3 },
  { label: '4+ hours / repetitive', code: 4 },
];

export const FREQUENCY_OPTIONS: DropdownOption[] = [
  { label: 'One-off', code: 1 },
  { label: 'Daily', code: 2 },
  { label: 'Continuous', code: 3 },
];

export const ENVIRONMENT_OPTIONS: DropdownOption[] = [
  { label: 'Indoor', code: 1 },
  { label: 'Outdoor', code: 2 },
];

export const GROUND_CONDITIONS: DropdownOption[] = [
  { label: 'Firm and level', code: 1 },
  { label: 'Soft', code: 2 },
  { label: 'Uneven', code: 3 },
  { label: 'Soft and uneven', code: 4 },
];

export const SPACE_CONSTRAINTS: DropdownOption[] = [
  { label: 'Tight', code: 1 },
  { label: 'Normal', code: 2 },
  { label: 'Open', code: 3 },
];

export const CARRY_MATERIALS: DropdownOption[] = [
  { label: 'None', code: 0 },
  { label: 'Light', code: 1 },
  { label: 'Heavy', code: 2 },
];

export const SIDE_REACH: DropdownOption[] = [
  { label: 'None', code: 0 },
  { label: 'Limited', code: 1 },
  { label: 'Significant', code: 2 },
];

export const YES_NO: DropdownOption[] = [
  { label: 'Yes', code: 1 },
  { label: 'No', code: 0 },
];

export const WIND_EXPOSURE: DropdownOption[] = [
  { label: 'Low', code: 1 },
  { label: 'Moderate', code: 2 },
  { label: 'High', code: 3 },
];

// ─── Equipment Definition ───────────────────────────────────────
export interface EquipmentDefinition {
  id: string;
  name: string;
  hierarchyRank: number;
  hierarchyLevel: 'prevent' | 'minimise' | 'last-resort';
  minHeightCode: number;
  maxHeightCode: number;
  maxDurationCode: number;
  maxFrequencyCode: number;
  indoorAllowed: boolean;
  outdoorAllowed: boolean;
  maxGroundCode: number;       // max ground difficulty it can handle (1=firm only, 4=any)
  minSpaceCode: number;        // min space it needs (1=tight ok, 3=needs open)
  maxCarryCode: number;        // max material load it supports (0=none, 2=heavy)
  maxReachCode: number;        // max side reach (0=none, 2=significant)
  overheadOk: boolean;         // can work under overhead services
  maxWindCode: number;         // max wind it can operate in (1=low only, 3=any)
  isDieselVariant?: boolean;   // auto-selected for outdoor + poor ground
  replaces?: string;           // ID of standard variant this replaces
  training: string;
  justification: string;
  notSuitableWhen: string;
  rescuePlan: string;
  tempWorks: string;
}

export const EQUIPMENT_LIBRARY: EquipmentDefinition[] = [
  // ── PREVENT FALLS (collective protection) ──────────────────
  {
    id: 'fixed-scaffold',
    name: 'Fixed Scaffold',
    hierarchyRank: 1,
    hierarchyLevel: 'prevent',
    minHeightCode: 2, maxHeightCode: 4,
    maxDurationCode: 4, maxFrequencyCode: 3,
    indoorAllowed: true, outdoorAllowed: true,
    maxGroundCode: 3, minSpaceCode: 2, maxCarryCode: 2, maxReachCode: 2,
    overheadOk: false, maxWindCode: 3,
    training: 'CISRS-qualified scaffolders for erection, alteration and dismantling. All users must complete scaffold awareness training. Scaffold inspection by a competent person before first use and at intervals not exceeding 7 days (Work at Height Regulations 2005, Schedule 7).',
    justification: 'Highest level of collective fall protection. Provides a stable, guarded working platform with full edge protection for extended-duration work. Allows safe storage and handling of materials at height. Compliant with the HSE hierarchy as the preferred collective protection measure.',
    notSuitableWhen: 'Ground or structure cannot support the scaffold loads. Erection and alteration cannot be controlled safely. Access for scaffold vehicles and materials is not available. Very short-duration tasks where erection time exceeds work time.',
    rescuePlan: 'Standard emergency arrangements apply. Rescue plan not normally required for fixed scaffold with full edge protection — but must be in place if any edge protection is temporarily removed.',
    tempWorks: 'Temporary works design required (TWC or competent person to approve). Ground bearing capacity check: confirm ground type, bearing pressures, and use sole boards, base plates, or spreader mats as required. Tie pattern design to structural engineer specification. Scaffold design to BS EN 12811 / TG20 or bespoke design.',
  },
  {
    id: 'mast-climber',
    name: 'Mast Climber',
    hierarchyRank: 2,
    hierarchyLevel: 'prevent',
    minHeightCode: 2, maxHeightCode: 4,
    maxDurationCode: 4, maxFrequencyCode: 3,
    indoorAllowed: false, outdoorAllowed: true,
    maxGroundCode: 2, minSpaceCode: 2, maxCarryCode: 2, maxReachCode: 1,
    overheadOk: false, maxWindCode: 2,
    training: 'Specialist operator training from manufacturer or approved training provider. All users must receive familiarisation training. Erection and dismantling by competent installer only.',
    justification: 'Provides a large, fully guarded working platform that moves vertically under power. Excellent for repetitive access at multiple levels on building facades. Reduces manual handling by carrying materials with the platform. Very high productivity for cladding, brickwork, and facade works.',
    notSuitableWhen: 'Ground conditions cannot support mast loads without extensive foundations. Significant overhead obstructions prevent mast installation. Indoor use required. High wind exposure site — mast climbers have lower wind speed thresholds than fixed scaffold.',
    rescuePlan: 'Rescue plan required. Must address platform failure, power loss, and operator incapacity at height. Emergency lowering procedure to be confirmed with manufacturer.',
    tempWorks: 'Temporary works design required (TWC approval). Foundation design to manufacturer specification. Tie-in pattern to structural engineer design. Ground bearing capacity assessment essential. Installation and dismantling plan required.',
  },
  {
    id: 'mewp-scissor',
    name: 'MEWP Scissor Lift',
    hierarchyRank: 3,
    hierarchyLevel: 'prevent',
    minHeightCode: 2, maxHeightCode: 4,
    maxDurationCode: 3, maxFrequencyCode: 3,
    indoorAllowed: true, outdoorAllowed: true,
    maxGroundCode: 2, minSpaceCode: 1, maxCarryCode: 1, maxReachCode: 1,
    overheadOk: true, maxWindCode: 2,
    training: 'IPAF 3a (scissor lift) or equivalent operator training. Familiarisation on the specific machine. Daily pre-use inspection by the operator.',
    justification: 'Provides a guarded working platform with vertical-only travel. Compact footprint suitable for tight spaces. Quick to deploy — no erection time. Good for repetitive short-to-medium duration tasks at multiple locations. Full edge protection while elevated.',
    notSuitableWhen: 'Ground is soft, uneven, or sloped beyond machine specification. Significant side reach is required (scissor lifts travel vertically only). Work duration exceeds the machine battery life without charging facilities. Floor loading exceeds structural capacity (indoor use).',
    rescuePlan: 'Rescue plan required for all MEWP use (IPAF best practice). Must address platform failure, entrapment, power loss, and operator incapacity. Secondary lowering device location and procedure to be confirmed.',
    tempWorks: 'Ground or floor bearing capacity check required. Outrigger loads to be within floor/ground limits. No temporary works design normally required unless operating on a suspended floor or near an excavation edge.',
  },
  {
    id: 'mewp-boom',
    name: 'MEWP Boom Lift',
    hierarchyRank: 4,
    hierarchyLevel: 'prevent',
    minHeightCode: 2, maxHeightCode: 4,
    maxDurationCode: 3, maxFrequencyCode: 3,
    indoorAllowed: true, outdoorAllowed: true,
    maxGroundCode: 2, minSpaceCode: 2, maxCarryCode: 1, maxReachCode: 2,
    overheadOk: true, maxWindCode: 2,
    training: 'IPAF 3b (boom lift) or equivalent operator training. Familiarisation on the specific machine. Daily pre-use inspection by the operator. Harness and short lanyard training for basket restraint.',
    justification: 'Provides excellent reach — both vertical and horizontal — from a single set-up position. Ideal for accessing difficult locations over obstacles, structures, or other works. Allows repositioning at height without returning to ground. Full edge protection with basket guardrails.',
    notSuitableWhen: 'Ground is soft, uneven, or sloped beyond machine specification. Tight spaces prevent safe boom slewing and travel. Wind speeds exceed the manufacturer rated limit (typically 28–38 mph). Heavy materials need to be carried to height (basket SWL is limited).',
    rescuePlan: 'Rescue plan required (mandatory for all MEWP use). Must address entrapment against structures, power loss, operator incapacity, and basket tilt. Secondary lowering device location and operation to be confirmed. Consider ground-level rescue controller.',
    tempWorks: 'Ground bearing capacity check required, including outrigger loads. If operating near excavations, edge protection or exclusion zones required. No temporary works design normally needed unless on a suspended structure.',
  },
  {
    id: 'stair-tower',
    name: 'Stair Tower',
    hierarchyRank: 5,
    hierarchyLevel: 'prevent',
    minHeightCode: 2, maxHeightCode: 4,
    maxDurationCode: 4, maxFrequencyCode: 3,
    indoorAllowed: true, outdoorAllowed: true,
    maxGroundCode: 2, minSpaceCode: 2, maxCarryCode: 1, maxReachCode: 0,
    overheadOk: false, maxWindCode: 3,
    training: 'PASMA training for assembly and use of prefabricated access towers. Competent person to supervise erection. Users must complete tower awareness training.',
    justification: 'Provides safe staircase access to height with full edge protection at each landing. Excellent for frequent access where people need to ascend and descend regularly. Much safer than ladders for repeated access — reduces fatigue and manual handling risk. Good for inspection routes and access to permanent works.',
    notSuitableWhen: 'Ground is soft or uneven and cannot be levelled. Limited footprint available — stair towers have a larger base than standard scaffold towers. Only needed for very short one-off access (a simpler tower or ladder may suffice).',
    rescuePlan: 'Standard emergency arrangements apply. Rescue plan not normally required for stair towers with full edge protection and stair access.',
    tempWorks: 'Base to be level, firm, and capable of supporting tower loads. Use base plates and sole boards. Outriggers and stabilisers as per manufacturer instructions. Tie to structure if height exceeds the free-standing limit.',
  },
  {
    id: 'mobile-scaffold-tower',
    name: 'Mobile Scaffold Tower',
    hierarchyRank: 6,
    hierarchyLevel: 'prevent',
    minHeightCode: 2, maxHeightCode: 3,
    maxDurationCode: 3, maxFrequencyCode: 3,
    indoorAllowed: true, outdoorAllowed: true,
    maxGroundCode: 1, minSpaceCode: 1, maxCarryCode: 1, maxReachCode: 1,
    overheadOk: false, maxWindCode: 2,
    training: 'PASMA training for tower assembly, use, and dismantling. All users must be trained. Competent person inspection before first use and after any modification.',
    justification: 'Provides a guarded working platform that can be easily repositioned. Good balance of safety and mobility for medium-height tasks. Collective protection with guardrails, toe boards, and platform. Quick to assemble by trained operatives.',
    notSuitableWhen: 'Ground is soft, uneven, or sloped — wheels must be on firm, level surface. Working height exceeds the tower free-standing limit without ties. High wind conditions — mobile towers have lower wind thresholds. Overhead obstructions prevent safe assembly at full height.',
    rescuePlan: 'Standard emergency arrangements apply. Rescue plan not normally required for towers with full edge protection.',
    tempWorks: 'Ground must be firm, level, and capable of supporting tower loads. Castors to be locked before use. Outriggers deployed as per manufacturer instructions. Tie to structure if height-to-base ratio exceeds the free-standing limit (typically 3.5:1 outdoor, 4:1 indoor).',
  },
  // ── MINIMISE CONSEQUENCES ─────────────────────────────────
  {
    id: 'trestle-platform',
    name: 'Trestle Platform',
    hierarchyRank: 7,
    hierarchyLevel: 'minimise',
    minHeightCode: 1, maxHeightCode: 2,
    maxDurationCode: 3, maxFrequencyCode: 2,
    indoorAllowed: true, outdoorAllowed: false,
    maxGroundCode: 1, minSpaceCode: 1, maxCarryCode: 1, maxReachCode: 0,
    overheadOk: true, maxWindCode: 1,
    training: 'User awareness training. Competent person to set up and inspect. No formal certification required but users must understand safe working load and stability.',
    justification: 'Simple, stable low-level platform for indoor work under 2 m. Provides a wider working surface than a step ladder. Good for repetitive tasks like ceiling work, cable tray installation, and painting. Keeps tools and materials at hand height.',
    notSuitableWhen: 'Outdoor use (wind, rain, uneven ground). Work above 2 m platform height. Heavy materials need to be stored on the platform. Ground is uneven or soft. Significant side reach is required.',
    rescuePlan: 'Not required — working at low level with minimal fall height.',
    tempWorks: 'No temporary works required. Ground must be firm and level. Trestles must be locked in the open position. Platform boards must be secured against displacement.',
  },
  {
    id: 'low-level-platform',
    name: 'Low-Level Work Platform',
    hierarchyRank: 8,
    hierarchyLevel: 'minimise',
    minHeightCode: 1, maxHeightCode: 1,
    maxDurationCode: 4, maxFrequencyCode: 3,
    indoorAllowed: true, outdoorAllowed: true,
    maxGroundCode: 2, minSpaceCode: 1, maxCarryCode: 1, maxReachCode: 0,
    overheadOk: true, maxWindCode: 3,
    training: 'No formal training required. Users must understand safe use, maximum platform height, and stability requirements.',
    justification: 'Purpose-designed for work just above ground level (typically under 600 mm platform height). Very stable, wide base. Suitable for extended-duration work. Avoids the instability issues of step ladders for low-level tasks. Good for M&E first fix, low-level painting, and snagging.',
    notSuitableWhen: 'Working height exceeds 2 m. Significant reach beyond the platform edge is needed. Heavy or bulky materials must be handled on the platform.',
    rescuePlan: 'Not required — very low fall height.',
    tempWorks: 'No temporary works required. Platform must be placed on a firm, level surface.',
  },
  {
    id: 'podium-step',
    name: 'Podium Step',
    hierarchyRank: 9,
    hierarchyLevel: 'minimise',
    minHeightCode: 1, maxHeightCode: 2,
    maxDurationCode: 3, maxFrequencyCode: 2,
    indoorAllowed: true, outdoorAllowed: true,
    maxGroundCode: 1, minSpaceCode: 1, maxCarryCode: 1, maxReachCode: 1,
    overheadOk: true, maxWindCode: 2,
    training: 'User awareness training on safe set-up and use. No formal certification required. Pre-use check by user before each use.',
    justification: 'Enclosed guardrail design provides better protection than a step ladder. Wide platform allows a comfortable working position. Suitable for medium-duration tasks at low height. Castors allow easy repositioning. Good alternative to step ladders for repetitive low-level access.',
    notSuitableWhen: 'Working height exceeds the podium maximum (typically 2–2.5 m platform height). Ground is soft or uneven. Heavy materials need to be carried to the platform. Extended-duration continuous work is needed (consider a tower instead).',
    rescuePlan: 'Not required — working at low level with guardrail protection.',
    tempWorks: 'No temporary works required. Ground must be firm and level. Castors must be locked before ascending.',
  },
  // ── SPECIALIST ────────────────────────────────────────────
  {
    id: 'rope-access',
    name: 'Rope Access (Specialist)',
    hierarchyRank: 10,
    hierarchyLevel: 'minimise',
    minHeightCode: 3, maxHeightCode: 4,
    maxDurationCode: 4, maxFrequencyCode: 3,
    indoorAllowed: true, outdoorAllowed: true,
    maxGroundCode: 4, minSpaceCode: 1, maxCarryCode: 0, maxReachCode: 2,
    overheadOk: true, maxWindCode: 2,
    training: 'IRATA or SPRAT certification required for all operatives. Minimum team of 2 (1 working, 1 safety/rescue). Annual medical fitness assessment. Task-specific rescue training.',
    justification: 'Access method for locations where conventional access equipment cannot be erected or is not reasonably practicable. Minimal impact on the structure and surrounding operations. Very flexible — can access complex geometry, overhangs, and confined spaces at height. No ground-level footprint. Fast mobilisation for inspection and light maintenance tasks.',
    notSuitableWhen: 'Heavy materials or tools need to be handled at height. Extended-duration continuous work is planned (rope access is physically demanding). Collective protection such as scaffold is reasonably practicable. Workers are not IRATA/SPRAT certified. High wind conditions.',
    rescuePlan: 'Rescue plan mandatory. Must be specific to the task and location. Minimum 2-person team with rescue capability at all times. Rescue drill to be completed before work begins each shift. Equipment for raising and lowering an incapacitated person must be immediately available.',
    tempWorks: 'Anchor point assessment and certification required. Anchors to be rated for the loads involved (minimum 15 kN per person for life-safety anchors to BS 7883). Anchor installation may require structural engineer sign-off. Edge protection at rope deployment points.',
  },
  // ── LAST RESORT (HSE hierarchy: use only when nothing above is practicable) ──
  {
    id: 'step-ladder',
    name: 'Step Ladder',
    hierarchyRank: 55,
    hierarchyLevel: 'last-resort',
    minHeightCode: 1, maxHeightCode: 2,
    maxDurationCode: 2, maxFrequencyCode: 1,
    indoorAllowed: true, outdoorAllowed: true,
    maxGroundCode: 1, minSpaceCode: 1, maxCarryCode: 0, maxReachCode: 0,
    overheadOk: true, maxWindCode: 1,
    training: 'Ladder awareness training. Pre-use visual inspection by user. No formal certification required.',
    justification: 'Self-supporting access for very short-duration, light-duty tasks at low height. No erection time — immediate use. Compact storage and transport. Suitable only when the task is quick, the risk is low, and collective protection is not reasonably practicable.',
    notSuitableWhen: 'Task duration exceeds 30 minutes. Materials or heavy tools need to be carried. Side reach beyond arm\'s length is required. Ground is uneven, soft, or sloped. Work involves significant force (pushing, pulling, drilling). Collective protection (podium, tower, scaffold) is reasonably practicable.',
    rescuePlan: 'Not required — low-level short-duration use.',
    tempWorks: 'No temporary works required. Ground must be firm and level. Ladder must be in good condition — no bent stiles, cracked treads, or damaged feet. Do not stand on the top 2 treads.',
  },
  {
    id: 'extension-ladder',
    name: 'Extension Ladder',
    hierarchyRank: 65,
    hierarchyLevel: 'last-resort',
    minHeightCode: 2, maxHeightCode: 4,
    maxDurationCode: 2, maxFrequencyCode: 1,
    indoorAllowed: true, outdoorAllowed: true,
    maxGroundCode: 1, minSpaceCode: 1, maxCarryCode: 0, maxReachCode: 0,
    overheadOk: false, maxWindCode: 1,
    training: 'Ladder awareness training. Pre-use visual inspection by user. Understanding of 1-in-4 angle rule and 3-point contact. No formal certification required.',
    justification: 'Leaning ladder for very short-duration access or as a means of reaching a higher working platform. Suitable only when collective protection is not reasonably practicable and the task is simple, quick, and light-duty. Common as a means of access to scaffold platforms or roofs — not as a working platform.',
    notSuitableWhen: 'Task duration exceeds 30 minutes. Work involves both hands (cannot maintain 3-point contact). Materials need to be carried up the ladder. Side reach beyond arm\'s length is needed. Ground is uneven, soft, or sloped. Overhead obstructions prevent safe placement. Collective protection is reasonably practicable.',
    rescuePlan: 'Not normally required for short-duration use. If ladder is the only means of access/egress to a higher level, consider how an injured person would be recovered.',
    tempWorks: 'No temporary works required. Ladder must be secured at the top or footed at the base. Extend at least 1 m above the landing point. Set at 75° (1-in-4 rule). Ground must be firm, level, and clean. Industrial-grade ladder (Class 1 or EN 131-2 Professional) only on construction sites.',
  },
  // ── DIESEL VARIANTS (auto-selected for outdoor + poor ground) ──
  {
    id: 'mewp-scissor-diesel',
    name: 'MEWP Scissor Lift (All-Terrain Diesel)',
    hierarchyRank: 3,
    hierarchyLevel: 'prevent',
    minHeightCode: 2, maxHeightCode: 4,
    maxDurationCode: 3, maxFrequencyCode: 3,
    indoorAllowed: false, outdoorAllowed: true,
    maxGroundCode: 4, minSpaceCode: 2, maxCarryCode: 1, maxReachCode: 1,
    overheadOk: true, maxWindCode: 2,
    isDieselVariant: true, replaces: 'mewp-scissor',
    training: 'IPAF 3a (scissor lift) or equivalent operator training. Familiarisation on the specific machine. Daily pre-use inspection by the operator. Awareness of diesel exhaust emissions and environmental controls.',
    justification: 'All-terrain chassis with 4WD capability allows operation on soft, uneven, or sloped ground where electric/hybrid scissor lifts cannot safely operate. Retains the guarded working platform and collective fall protection of a standard scissor lift. Higher ground clearance and rough-terrain tyres provide stability on construction sites with poor ground conditions.',
    notSuitableWhen: 'Indoor use required (diesel exhaust). Ground is extremely soft and cannot support the machine weight even with outriggers. Noise-sensitive environment. Work is near a watercourse or sensitive receptor where fuel/oil spill risk is unacceptable without additional controls.',
    rescuePlan: 'Rescue plan required for all MEWP use (IPAF best practice). Must address platform failure, entrapment, power loss, and operator incapacity. Secondary lowering device location and procedure to be confirmed.',
    tempWorks: 'Ground assessment required — confirm the machine can safely traverse and operate on the surface conditions. Outrigger loads to be within ground bearing capacity. Exclusion zone around the machine during operation. Spill kit required for diesel/hydraulic oil.',
  },
  {
    id: 'mewp-boom-diesel',
    name: 'MEWP Boom Lift (All-Terrain Diesel)',
    hierarchyRank: 4,
    hierarchyLevel: 'prevent',
    minHeightCode: 2, maxHeightCode: 4,
    maxDurationCode: 3, maxFrequencyCode: 3,
    indoorAllowed: false, outdoorAllowed: true,
    maxGroundCode: 4, minSpaceCode: 2, maxCarryCode: 1, maxReachCode: 2,
    overheadOk: true, maxWindCode: 2,
    isDieselVariant: true, replaces: 'mewp-boom',
    training: 'IPAF 3b (boom lift) or equivalent operator training. Familiarisation on the specific machine. Daily pre-use inspection by the operator. Harness and short lanyard training for basket restraint. Awareness of diesel exhaust and environmental controls.',
    justification: 'All-terrain chassis with 4WD allows operation on soft, uneven, or sloped ground where standard boom lifts cannot safely operate. Retains full boom articulation and reach capability. Higher ground clearance and rough-terrain tyres. Suitable for construction sites with poor ground conditions where significant reach is needed.',
    notSuitableWhen: 'Indoor use required (diesel exhaust). Extremely soft ground that cannot support the machine even with outriggers. Noise-sensitive environment. Narrow or confined site where the large chassis cannot safely manoeuvre.',
    rescuePlan: 'Rescue plan required (mandatory for all MEWP use). Must address entrapment against structures, power loss, operator incapacity, and basket tilt. Secondary lowering device location and operation to be confirmed. Ground-level rescue controller recommended.',
    tempWorks: 'Ground assessment required — confirm bearing capacity for outrigger loads. Exclusion zone during operation. Spill kit for diesel/hydraulic oil. If operating near excavations, edge protection or setback distance required.',
  },
];

// ─── Hierarchy Level Labels ──────────────────────────────────────
export const HIERARCHY_LABELS: Record<string, { label: string; description: string; color: string; bgColor: string; borderColor: string }> = {
  prevent: {
    label: 'Prevent Falls',
    description: 'Collective protection — guarded platforms, edge protection',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  minimise: {
    label: 'Minimise Consequences',
    description: 'Reduced fall height or personal protection',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  'last-resort': {
    label: 'Last Resort',
    description: 'Ladders — use only when nothing above is reasonably practicable',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};
