// src/data/temporary-traffic-management-selector.ts
// Temporary Traffic Management Selector
// Chapter 8 Traffic Signs Manual (2009), Safety at Street Works & Road Works Code of Practice (2013),
// NRSWA 1991, Traffic Management Act 2004, GG 104, CD 122

// ─── Types ──────────────────────────────────────────────────────

export interface RoadType {
  id: string;
  label: string;
  description: string;
  defaultSpeedLimit: number;
  availableSpeeds: number[];
  category: "motorway" | "trunk" | "a-road" | "b-road" | "minor" | "unclassified" | "private";
  highwayAuthority: string;
}

export interface WorksLocation {
  id: string;
  label: string;
  description: string;
  requiresLaneClosure: boolean;
  pedestrianImpact: boolean;
  complexityBase: number;
}

export interface WorksDuration {
  id: string;
  label: string;
  description: string;
  maxDays: number;
  nrswaCategory: "emergency" | "urgent" | "minor" | "standard" | "major";
  noticePeriod: string;
  noticeRef: string;
}

export interface TMLayout {
  id: string;
  ref: string;
  name: string;
  description: string;
  applicableRoads: string[];
  applicableLocations: string[];
  minSpeed: number;
  maxSpeed: number;
  keyFeatures: string[];
  operativeMin: number;
  diagramNotes: string;
}

export interface SigningDistance {
  speedMph: number;
  advanceSignM: number;
  leadInTaperM: number;
  safetyZoneM: number;
  exitTaperM: number;
  coneSpacingM: number;
  totalLeadInM: number;
}

export interface ScoringFactor {
  id: string;
  label: string;
  weight: number;
  options: { label: string; score: number; color: string }[];
}

export interface RiskBand {
  min: number;
  max: number;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  description: string;
}

export interface NHSSRequirement {
  level: "none" | "12a" | "12b" | "both";
  label: string;
  description: string;
  qualification: string;
  trainingProvider: string;
  renewalYears: number;
}

export interface DeploymentCheckItem {
  id: string;
  category: string;
  item: string;
  regulation: string;
}

export interface TMResult {
  layout: TMLayout;
  neighbourLayouts: TMLayout[];
  signing: SigningDistance;
  nrswaNotice: WorksDuration;
  nhssRequirement: NHSSRequirement;
  operativesRequired: number;
  complexityScore: number;
  maxComplexity: number;
  riskBand: RiskBand;
  factorScores: {
    id: string;
    label: string;
    score: number;
    maxScore: number;
    weight: number;
    color: string;
    selectedLabel: string;
  }[];
  signingSchedule: { sign: string; position: string; distance: string; notes: string }[];
  warnings: string[];
  recommendations: string[];
  crossReferences: string[];
}

// ─── Road Types ─────────────────────────────────────────────────

export const ROAD_TYPES: RoadType[] = [
  { id: "motorway", label: "Motorway", description: "M-class motorway (e.g. M6, M62). Managed by National Highways.", defaultSpeedLimit: 70, availableSpeeds: [50, 60, 70], category: "motorway", highwayAuthority: "National Highways" },
  { id: "dual-trunk", label: "Dual Carriageway - Trunk Road", description: "Trunk A-road with central reservation (e.g. A580, A49 dual). Managed by National Highways.", defaultSpeedLimit: 70, availableSpeeds: [40, 50, 60, 70], category: "trunk", highwayAuthority: "National Highways" },
  { id: "dual-a", label: "Dual Carriageway - A Road", description: "A-road with central reservation (e.g. A6 dual sections). Managed by local highway authority.", defaultSpeedLimit: 60, availableSpeeds: [30, 40, 50, 60, 70], category: "a-road", highwayAuthority: "Local Highway Authority" },
  { id: "single-trunk", label: "Single Carriageway - Trunk Road", description: "Single carriageway trunk A-road. National speed limit applies unless restricted.", defaultSpeedLimit: 60, availableSpeeds: [30, 40, 50, 60], category: "trunk", highwayAuthority: "National Highways" },
  { id: "single-a", label: "Single Carriageway - A Road", description: "Standard A-road single carriageway. Most common for utility works.", defaultSpeedLimit: 30, availableSpeeds: [20, 30, 40, 50, 60], category: "a-road", highwayAuthority: "Local Highway Authority" },
  { id: "single-b", label: "Single Carriageway - B Road", description: "B-road. Typically 30 mph in built-up areas, NSL rural.", defaultSpeedLimit: 30, availableSpeeds: [20, 30, 40, 50, 60], category: "b-road", highwayAuthority: "Local Highway Authority" },
  { id: "minor-c", label: "Minor Road - C Class", description: "C-class road. Often narrow, residential feeders or rural lanes.", defaultSpeedLimit: 30, availableSpeeds: [20, 30, 40, 50, 60], category: "minor", highwayAuthority: "Local Highway Authority" },
  { id: "unclassified", label: "Unclassified Road", description: "Residential streets, cul-de-sacs, housing estates. Usually 20-30 mph.", defaultSpeedLimit: 30, availableSpeeds: [20, 30], category: "unclassified", highwayAuthority: "Local Highway Authority" },
  { id: "private", label: "Private Road / Site Access", description: "Private estate roads, industrial estate access, site haul roads. Not adopted highway.", defaultSpeedLimit: 20, availableSpeeds: [5, 10, 15, 20], category: "private", highwayAuthority: "Landowner / Site Manager" },
];

// ─── Works Locations ────────────────────────────────────────────

export const WORKS_LOCATIONS: WorksLocation[] = [
  { id: "nearside-lane", label: "Nearside Lane (Lane 1)", description: "Works in the nearside (left) running lane closest to the kerb.", requiresLaneClosure: true, pedestrianImpact: false, complexityBase: 2 },
  { id: "offside-lane", label: "Offside Lane (Lane 2+)", description: "Works in offside (right) lane on dual carriageway or multi-lane road.", requiresLaneClosure: true, pedestrianImpact: false, complexityBase: 3 },
  { id: "centre-lane", label: "Centre Lane (3+ lane road)", description: "Works in the centre lane of a 3+ lane carriageway.", requiresLaneClosure: true, pedestrianImpact: false, complexityBase: 4 },
  { id: "central-reserve", label: "Central Reservation / Median", description: "Works within the central reservation of a dual carriageway.", requiresLaneClosure: true, pedestrianImpact: false, complexityBase: 3 },
  { id: "hard-shoulder", label: "Hard Shoulder / Verge (roadside)", description: "Works on the hard shoulder or roadside verge adjacent to running lanes.", requiresLaneClosure: false, pedestrianImpact: false, complexityBase: 1 },
  { id: "footway-only", label: "Footway Only (no carriageway)", description: "Works confined to the footway/pavement with no carriageway encroachment.", requiresLaneClosure: false, pedestrianImpact: true, complexityBase: 1 },
  { id: "footway-carriageway", label: "Footway with Carriageway Encroachment", description: "Footway works requiring partial carriageway occupation for pedestrian walkway.", requiresLaneClosure: true, pedestrianImpact: true, complexityBase: 2 },
  { id: "full-closure", label: "Full Road Closure", description: "Complete closure of the carriageway. Requires signed diversion route.", requiresLaneClosure: true, pedestrianImpact: true, complexityBase: 5 },
  { id: "shuttle-manual", label: "Shuttle Working (Stop/Go Boards)", description: "One lane closed, traffic controlled alternately by manual stop/go boards.", requiresLaneClosure: true, pedestrianImpact: false, complexityBase: 3 },
  { id: "shuttle-signals", label: "Shuttle Working (Portable Signals)", description: "One lane closed, traffic controlled by temporary traffic signals.", requiresLaneClosure: true, pedestrianImpact: false, complexityBase: 3 },
  { id: "contraflow", label: "Contraflow", description: "Traffic diverted to opposite carriageway on dual carriageway. Complex layout.", requiresLaneClosure: true, pedestrianImpact: false, complexityBase: 5 },
  { id: "roundabout", label: "Roundabout / Junction", description: "Works on or immediately adjacent to a roundabout or signalised junction.", requiresLaneClosure: true, pedestrianImpact: true, complexityBase: 4 },
  { id: "multi-phase", label: "Multi-Phase / Phased Works", description: "Works requiring multiple TM configurations switched over the programme.", requiresLaneClosure: true, pedestrianImpact: true, complexityBase: 4 },
  { id: "crossing", label: "Pedestrian Crossing / Controlled Crossing", description: "Works at or near a pedestrian, toucan, puffin, or pelican crossing.", requiresLaneClosure: false, pedestrianImpact: true, complexityBase: 3 },
];

// ─── Works Durations (NRSWA) ────────────────────────────────────

export const WORKS_DURATIONS: WorksDuration[] = [
  { id: "emergency", label: "Emergency Works", description: "Danger to persons or property, or to restore supply/service. No advance notice. Notify street authority within 2 hours of starting.", maxDays: 999, nrswaCategory: "emergency", noticePeriod: "None (notify within 2 hours)", noticeRef: "NRSWA 1991 s.52" },
  { id: "urgent", label: "Urgent Works", description: "Works that are not emergency but which cannot reasonably be deferred. Notify street authority within 2 hours.", maxDays: 999, nrswaCategory: "urgent", noticePeriod: "None (notify within 2 hours)", noticeRef: "NRSWA 1991 s.52, s.55(2)" },
  { id: "immediate-minor", label: "Immediate Activities (up to 3 days)", description: "Minor routine maintenance that cannot reasonably give advance notice. Max 3 working days.", maxDays: 3, nrswaCategory: "minor", noticePeriod: "None (notify before starting)", noticeRef: "NRSWA 1991 s.55(1)(b)" },
  { id: "minor", label: "Minor Works (up to 3 days)", description: "Planned works lasting no more than 3 working days. Requires 3 working days advance notice.", maxDays: 3, nrswaCategory: "minor", noticePeriod: "3 working days advance", noticeRef: "NRSWA 1991 s.55(1)(a)" },
  { id: "standard", label: "Standard Works (4 to 10 days)", description: "Planned works lasting between 4 and 10 working days. Requires 7 working days advance notice.", maxDays: 10, nrswaCategory: "standard", noticePeriod: "7 working days advance", noticeRef: "NRSWA 1991 s.55" },
  { id: "major-short", label: "Major Works - Short (11 to 21 days)", description: "Planned major works lasting 11-21 working days. Requires 10 working days advance notice plus coordination under TMA 2004.", maxDays: 21, nrswaCategory: "major", noticePeriod: "10 working days advance + 3 month S.54 notice", noticeRef: "NRSWA 1991 s.54, s.55, TMA 2004" },
  { id: "major-long", label: "Major Works - Long (over 21 days)", description: "Large-scale planned works exceeding 21 working days. Full coordination and advance notice required.", maxDays: 999, nrswaCategory: "major", noticePeriod: "10 working days advance + 3 month S.54 notice", noticeRef: "NRSWA 1991 s.54, s.55, TMA 2004" },
  { id: "permit", label: "Permit Scheme Area", description: "Works within a permit scheme area (most English highway authorities). Permit required in addition to NRSWA notice.", maxDays: 999, nrswaCategory: "major", noticePeriod: "Per permit scheme conditions", noticeRef: "TMA 2004 Part 3, Permit Scheme Conditions" },
];

// ─── Signing Distances (Safety at Street Works Code of Practice 2013, Table A1) ──

export const SIGNING_DISTANCES: SigningDistance[] = [
  { speedMph: 5, advanceSignM: 0, leadInTaperM: 5, safetyZoneM: 0, exitTaperM: 3, coneSpacingM: 1.5, totalLeadInM: 5 },
  { speedMph: 10, advanceSignM: 0, leadInTaperM: 10, safetyZoneM: 0, exitTaperM: 5, coneSpacingM: 1.5, totalLeadInM: 10 },
  { speedMph: 15, advanceSignM: 25, leadInTaperM: 12, safetyZoneM: 0, exitTaperM: 6, coneSpacingM: 1.5, totalLeadInM: 37 },
  { speedMph: 20, advanceSignM: 50, leadInTaperM: 15, safetyZoneM: 0, exitTaperM: 8, coneSpacingM: 3, totalLeadInM: 65 },
  { speedMph: 30, advanceSignM: 50, leadInTaperM: 25, safetyZoneM: 0, exitTaperM: 13, coneSpacingM: 3, totalLeadInM: 75 },
  { speedMph: 40, advanceSignM: 100, leadInTaperM: 45, safetyZoneM: 15, exitTaperM: 23, coneSpacingM: 6, totalLeadInM: 160 },
  { speedMph: 50, advanceSignM: 150, leadInTaperM: 70, safetyZoneM: 25, exitTaperM: 35, coneSpacingM: 9, totalLeadInM: 245 },
  { speedMph: 60, advanceSignM: 200, leadInTaperM: 100, safetyZoneM: 40, exitTaperM: 50, coneSpacingM: 12, totalLeadInM: 340 },
  { speedMph: 70, advanceSignM: 350, leadInTaperM: 150, safetyZoneM: 60, exitTaperM: 75, coneSpacingM: 15, totalLeadInM: 560 },
];

// ─── TM Layouts (Chapter 8 / Safety at Street Works) ────────────

export const TM_LAYOUTS: TMLayout[] = [
  // Footway only
  {
    id: "fw-1", ref: "FW-1", name: "Footway Works - Pedestrian Walkway on Carriageway",
    description: "Footway closed, pedestrian walkway formed on carriageway using barriers and ramps. Signing for both pedestrians and vehicular traffic.",
    applicableRoads: ["single-a", "single-b", "minor-c", "unclassified", "dual-a"],
    applicableLocations: ["footway-carriageway"],
    minSpeed: 20, maxSpeed: 40,
    keyFeatures: ["Pedestrian barriers both sides", "Ramps at transitions", "Adequate width (min 1.2m, prefer 1.5m)", "Tactile paving at entry/exit", "Lighting if night works"],
    operativeMin: 2,
    diagramNotes: "Barriers must be continuous with no gaps. Ramps at max 1:12 gradient. 'Pedestrians' sign at each end."
  },
  {
    id: "fw-2", ref: "FW-2", name: "Footway Works - Pedestrian Diversion Opposite Side",
    description: "Footway closed, pedestrians diverted to opposite footway via temporary crossing points.",
    applicableRoads: ["single-a", "single-b", "minor-c", "unclassified", "dual-a"],
    applicableLocations: ["footway-only"],
    minSpeed: 20, maxSpeed: 60,
    keyFeatures: ["Temporary crossing points signed", "Barriers at closure point", "Pedestrian diversion signs", "Consider mobility impaired users"],
    operativeMin: 1,
    diagramNotes: "If no controlled crossing within 50m, provide marshalled crossing or temporary signals."
  },
  // Verge / hard shoulder
  {
    id: "vs-1", ref: "VS-1", name: "Verge / Hard Shoulder Works - No Lane Closure",
    description: "Works confined to verge or hard shoulder with no encroachment into running lanes. Advance warning signs only.",
    applicableRoads: ["motorway", "dual-trunk", "dual-a", "single-trunk", "single-a", "single-b"],
    applicableLocations: ["hard-shoulder"],
    minSpeed: 20, maxSpeed: 70,
    keyFeatures: ["Advance warning signs", "Cones along works edge", "Vehicle conspicuity (amber beacons)", "No lane encroachment"],
    operativeMin: 1,
    diagramNotes: "Works vehicles must be clear of running lanes. High-visibility clothing mandatory."
  },
  // Single carriageway nearside
  {
    id: "sc-1", ref: "SC-1", name: "Single Carriageway - Nearside Lane Closure (Give and Take)",
    description: "Nearside lane partially closed. Width sufficient for cautious two-way passing. Appropriate for low traffic roads at low speeds.",
    applicableRoads: ["single-a", "single-b", "minor-c", "unclassified"],
    applicableLocations: ["nearside-lane"],
    minSpeed: 20, maxSpeed: 30,
    keyFeatures: ["Coned taper", "Road narrows signs both directions", "Min 3.0m clear carriageway width", "Not suitable if >30 mph or high HGV traffic"],
    operativeMin: 1,
    diagramNotes: "Give and take only where remaining width > 3.0m and traffic flow < 500 vehicles/hr."
  },
  {
    id: "sc-2", ref: "SC-2", name: "Single Carriageway - Priority Signing",
    description: "Lane closure with priority given to one direction using 'Priority' and 'Give Way' signs. Suitable where opposing visibility is adequate.",
    applicableRoads: ["single-a", "single-b", "minor-c"],
    applicableLocations: ["nearside-lane"],
    minSpeed: 20, maxSpeed: 40,
    keyFeatures: ["Priority to one direction", "Give Way to Oncoming Traffic sign", "Priority over oncoming vehicles sign", "Min 3.0m clear width", "Forward visibility required"],
    operativeMin: 1,
    diagramNotes: "Priority usually given to traffic passing the works. Only where forward visibility > 50m at 30 mph."
  },
  {
    id: "sc-3", ref: "SC-3", name: "Single Carriageway - Shuttle Working (Stop/Go Boards)",
    description: "One lane closed, traffic controlled alternately by manual stop/go boards operated by trained operatives.",
    applicableRoads: ["single-a", "single-b", "minor-c"],
    applicableLocations: ["nearside-lane", "shuttle-manual"],
    minSpeed: 20, maxSpeed: 40,
    keyFeatures: ["2x trained stop/go board operatives", "Radio communication between operatives", "NHSS 12A trained", "Max 500m between operatives", "Emergency vehicle protocol"],
    operativeMin: 3,
    diagramNotes: "Stop/go board operatives must have clear line of sight or use radio. Max works length 500m."
  },
  {
    id: "sc-4", ref: "SC-4", name: "Single Carriageway - Shuttle Working (Portable Traffic Signals)",
    description: "One lane closed, traffic controlled by portable temporary traffic signals (PTTS).",
    applicableRoads: ["single-a", "single-b", "minor-c", "single-trunk"],
    applicableLocations: ["nearside-lane", "shuttle-signals"],
    minSpeed: 20, maxSpeed: 60,
    keyFeatures: ["Portable traffic signals (PTTS)", "All-red phase calibrated", "Vehicle actuation or fixed time", "Must not conflict with permanent signals", "Battery backup or generator"],
    operativeMin: 2,
    diagramNotes: "Signal cycle times must account for works length. Consider pedestrian phase if ped crossing affected."
  },
  {
    id: "sc-5", ref: "SC-5", name: "Single Carriageway - Full Road Closure with Diversion",
    description: "Complete carriageway closure with signed diversion route. For works requiring full road width or when no safe passing possible.",
    applicableRoads: ["single-a", "single-b", "minor-c", "unclassified"],
    applicableLocations: ["full-closure"],
    minSpeed: 20, maxSpeed: 60,
    keyFeatures: ["Road Closed signs", "Signed diversion route (agreed with HA)", "Local access provision where possible", "Emergency services notified", "Advance publicity recommended"],
    operativeMin: 2,
    diagramNotes: "Diversion must use roads of equal or higher classification. Notify bus operators and emergency services."
  },
  // Dual carriageway
  {
    id: "dc-1", ref: "DC-1", name: "Dual Carriageway - Nearside Lane Closure",
    description: "Nearside lane (Lane 1) closure on dual carriageway with traffic merging to offside lane(s).",
    applicableRoads: ["dual-trunk", "dual-a"],
    applicableLocations: ["nearside-lane"],
    minSpeed: 30, maxSpeed: 70,
    keyFeatures: ["Lane closure taper with cones/cylinders", "Advance lane closure signs", "High visibility cones (750mm min at 50+mph)", "Arrow board/matrix sign at 50+ mph", "Safety zone behind taper"],
    operativeMin: 3,
    diagramNotes: "Use 1m cones/cylinders at 50+ mph. Arrow board mandatory on high-speed roads."
  },
  {
    id: "dc-2", ref: "DC-2", name: "Dual Carriageway - Offside Lane Closure",
    description: "Offside lane closure on dual carriageway. More complex than nearside due to traffic weaving.",
    applicableRoads: ["dual-trunk", "dual-a"],
    applicableLocations: ["offside-lane"],
    minSpeed: 30, maxSpeed: 70,
    keyFeatures: ["Lane closure taper", "Offside merge signing", "Arrow board/VMS", "Longer taper than nearside recommended", "Consider speed restriction"],
    operativeMin: 3,
    diagramNotes: "Offside closures may require temporary speed restriction. Consider impact protection vehicle (IPV)."
  },
  {
    id: "dc-3", ref: "DC-3", name: "Dual Carriageway - Central Reservation Works",
    description: "Works in the central reservation. May require nearside lane closure on one or both carriageways for safety zone.",
    applicableRoads: ["dual-trunk", "dual-a"],
    applicableLocations: ["central-reserve"],
    minSpeed: 30, maxSpeed: 70,
    keyFeatures: ["Lane closure both sides if narrow median", "Barrier protection", "Advance signing both directions", "Consider contraflow if extended"],
    operativeMin: 4,
    diagramNotes: "If central reserve width < 1.5m, nearside lane closure required on both carriageways."
  },
  {
    id: "dc-4", ref: "DC-4", name: "Dual Carriageway - Contraflow",
    description: "Traffic from closed carriageway diverted to opposite carriageway via crossover. Complex high-risk layout.",
    applicableRoads: ["dual-trunk", "dual-a"],
    applicableLocations: ["contraflow"],
    minSpeed: 30, maxSpeed: 60,
    keyFeatures: ["Crossover construction required", "Barrier separation in contraflow", "Speed restriction mandatory", "Extensive advance signing", "VMS/arrow boards", "12B designed scheme"],
    operativeMin: 6,
    diagramNotes: "Contraflow requires 12B design. Mandatory speed reduction. Barrier separation between opposing flows."
  },
  // Motorway specific
  {
    id: "mw-1", ref: "MW-1", name: "Motorway - Hard Shoulder Closure",
    description: "Hard shoulder closed for works with Lane 1 kept open. Standard motorway works entry point.",
    applicableRoads: ["motorway"],
    applicableLocations: ["hard-shoulder"],
    minSpeed: 50, maxSpeed: 70,
    keyFeatures: ["Advance signing per Chapter 8 Part 2", "IPV with arrow board", "1m cones/cylinders", "Safety zone 50m+ per speed", "Lane 1 may need temporary 50 mph restriction"],
    operativeMin: 4,
    diagramNotes: "IPV mandatory. All operatives must hold NHSS 12A. Scheme designed by 12B holder."
  },
  {
    id: "mw-2", ref: "MW-2", name: "Motorway - Lane 1 Closure",
    description: "Nearside lane closure on motorway. Traffic merges to Lane 2+. Full Chapter 8 Part 2 signing.",
    applicableRoads: ["motorway"],
    applicableLocations: ["nearside-lane"],
    minSpeed: 50, maxSpeed: 70,
    keyFeatures: ["Full advance signing sequence", "IPV with arrow board", "1m cones/delineators", "60m+ safety zone", "National Highways approval required", "VMS activation"],
    operativeMin: 6,
    diagramNotes: "National Highways must approve all motorway lane closures. Apply via NOMS/Street Manager."
  },
  {
    id: "mw-3", ref: "MW-3", name: "Motorway - Multi-Lane Closure",
    description: "Two or more lanes closed on motorway. Requires full traffic management scheme with possible contraflow.",
    applicableRoads: ["motorway"],
    applicableLocations: ["offside-lane", "centre-lane", "contraflow"],
    minSpeed: 50, maxSpeed: 70,
    keyFeatures: ["Full scheme design by 12B", "National Highways approved", "IPVs and arrow boards", "VMS and matrix signs", "Speed restriction 50/40 mph", "Possible hard shoulder running"],
    operativeMin: 8,
    diagramNotes: "Multi-lane motorway closures require detailed design review by National Highways. Off-peak only where possible."
  },
  // Junction / roundabout
  {
    id: "jn-1", ref: "JN-1", name: "Junction / Roundabout Works",
    description: "Works at or near a junction or roundabout requiring approach signing on all affected arms.",
    applicableRoads: ["dual-trunk", "dual-a", "single-trunk", "single-a", "single-b"],
    applicableLocations: ["roundabout"],
    minSpeed: 20, maxSpeed: 60,
    keyFeatures: ["Signing on all affected arms", "Lane closure markings", "Consider temporary traffic signals", "Pedestrian diversion if crossings affected", "Swept path check for HGVs"],
    operativeMin: 3,
    diagramNotes: "Junction TM must be designed by 12B qualified person. Consider all approach arms."
  },
  // Multi-phase
  {
    id: "mp-1", ref: "MP-1", name: "Multi-Phase Traffic Management",
    description: "Works requiring multiple sequential TM layouts. Phase plan with switching schedule.",
    applicableRoads: ["dual-trunk", "dual-a", "single-trunk", "single-a", "single-b", "minor-c"],
    applicableLocations: ["multi-phase"],
    minSpeed: 20, maxSpeed: 70,
    keyFeatures: ["Phase plan with drawings", "Switching schedule", "Each phase designed separately", "Transition risk assessment", "Communication protocol for phase changes"],
    operativeMin: 4,
    diagramNotes: "Each phase must have its own layout drawing. Transition between phases is highest-risk period."
  },
  // Pedestrian crossing
  {
    id: "pc-1", ref: "PC-1", name: "Works at Pedestrian Crossing",
    description: "Works affecting a controlled (pelican/puffin/toucan) or uncontrolled pedestrian crossing.",
    applicableRoads: ["single-a", "single-b", "minor-c", "unclassified", "dual-a"],
    applicableLocations: ["crossing"],
    minSpeed: 20, maxSpeed: 50,
    keyFeatures: ["Temporary crossing provision or diversion", "Signal controller isolation if needed", "Barrier protection for pedestrians", "Tactile paving at temporary crossings", "Notify mobility groups if long-term"],
    operativeMin: 2,
    diagramNotes: "If crossing disabled, provide alternative within 50m or marshal crossing. Consider Equality Act 2010 requirements."
  },
];

// ─── Scoring Factors (Complexity Score) ─────────────────────────

export const SCORING_FACTORS: ScoringFactor[] = [
  {
    id: "road-speed", label: "Road Speed", weight: 2,
    options: [
      { label: "Private / 5-15 mph", score: 1, color: "#22C55E" },
      { label: "20 mph", score: 1, color: "#22C55E" },
      { label: "30 mph", score: 2, color: "#3B82F6" },
      { label: "40 mph", score: 3, color: "#EAB308" },
      { label: "50 mph", score: 4, color: "#F97316" },
      { label: "60 mph", score: 4, color: "#F97316" },
      { label: "70 mph / motorway", score: 5, color: "#EF4444" },
    ],
  },
  {
    id: "road-type", label: "Road Classification", weight: 2,
    options: [
      { label: "Private road / site access", score: 1, color: "#22C55E" },
      { label: "Unclassified / residential", score: 1, color: "#22C55E" },
      { label: "Minor (C) road", score: 2, color: "#3B82F6" },
      { label: "B road", score: 2, color: "#3B82F6" },
      { label: "A road (single)", score: 3, color: "#EAB308" },
      { label: "A road (dual) / trunk single", score: 4, color: "#F97316" },
      { label: "Trunk dual / motorway", score: 5, color: "#EF4444" },
    ],
  },
  {
    id: "works-location", label: "Works Location", weight: 1.5,
    options: [
      { label: "Footway only", score: 1, color: "#22C55E" },
      { label: "Verge / hard shoulder (no lane)", score: 1, color: "#22C55E" },
      { label: "Nearside lane (give and take)", score: 2, color: "#3B82F6" },
      { label: "Nearside lane (controlled)", score: 3, color: "#EAB308" },
      { label: "Offside lane / central reserve", score: 4, color: "#F97316" },
      { label: "Full closure / contraflow", score: 5, color: "#EF4444" },
      { label: "Junction / roundabout / multi-phase", score: 5, color: "#EF4444" },
    ],
  },
  {
    id: "duration", label: "Works Duration", weight: 1,
    options: [
      { label: "Under 1 hour", score: 1, color: "#22C55E" },
      { label: "1-4 hours", score: 2, color: "#3B82F6" },
      { label: "1-3 days", score: 2, color: "#3B82F6" },
      { label: "4-10 days", score: 3, color: "#EAB308" },
      { label: "11-21 days", score: 4, color: "#F97316" },
      { label: "Over 21 days", score: 5, color: "#EF4444" },
    ],
  },
  {
    id: "lane-closures", label: "Lane Closures / Extent", weight: 1,
    options: [
      { label: "None (footway/verge only)", score: 1, color: "#22C55E" },
      { label: "Partial narrowing (give and take)", score: 2, color: "#3B82F6" },
      { label: "Single lane closure", score: 3, color: "#EAB308" },
      { label: "Multiple lane closures", score: 4, color: "#F97316" },
      { label: "Full road closure / contraflow", score: 5, color: "#EF4444" },
    ],
  },
  {
    id: "pedestrian", label: "Pedestrian / Vulnerable Road User Impact", weight: 1.5,
    options: [
      { label: "None - no pedestrian activity", score: 1, color: "#22C55E" },
      { label: "Low - footway unaffected", score: 1, color: "#22C55E" },
      { label: "Moderate - diversion to opposite footway", score: 2, color: "#3B82F6" },
      { label: "Significant - walkway on carriageway", score: 3, color: "#EAB308" },
      { label: "High - crossing affected or school route", score: 4, color: "#F97316" },
      { label: "Very high - no alternative pedestrian route", score: 5, color: "#EF4444" },
    ],
  },
  {
    id: "night-works", label: "Night Works / Lighting", weight: 1,
    options: [
      { label: "Daylight hours only", score: 1, color: "#22C55E" },
      { label: "Dusk/dawn - lit road", score: 2, color: "#3B82F6" },
      { label: "Night works - lit road", score: 3, color: "#EAB308" },
      { label: "Night works - unlit road", score: 4, color: "#F97316" },
      { label: "24-hour works", score: 4, color: "#F97316" },
    ],
  },
];

// ─── Risk Bands ─────────────────────────────────────────────────

export const RISK_BANDS: RiskBand[] = [
  { min: 0, max: 14, label: "Low Complexity", color: "#22C55E", bgClass: "bg-emerald-50", textClass: "text-emerald-800", borderClass: "border-emerald-200", dotClass: "bg-emerald-500", description: "Simple traffic management. Standard signing and coning. Single operative may be sufficient with appropriate training." },
  { min: 15, max: 25, label: "Medium Complexity", color: "#EAB308", bgClass: "bg-yellow-50", textClass: "text-yellow-800", borderClass: "border-yellow-200", dotClass: "bg-yellow-500", description: "Moderate traffic management. Requires planned TM layout, competent operatives, and supervisor oversight." },
  { min: 26, max: 35, label: "High Complexity", color: "#F97316", bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500", description: "Complex traffic management. Requires 12B designed scheme, detailed risk assessment, and experienced TM operatives." },
  { min: 36, max: 100, label: "Very High Complexity", color: "#EF4444", bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500", description: "Very complex traffic management. Full Chapter 8 Part 2 design, National Highways or HA approval may be required, specialist TM contractor recommended." },
];

// ─── NHSS Requirements ──────────────────────────────────────────

export const NHSS_REQUIREMENTS: NHSSRequirement[] = [
  { level: "none", label: "No NHSS Required", description: "Works on private roads or where no public highway is affected. Standard site traffic management applies.", qualification: "N/A", trainingProvider: "N/A", renewalYears: 0 },
  { level: "12a", label: "NHSS 12D Required", description: "Works on urban/rural roads and low-speed dual carriageways (40 mph and below) require NHSS 12D qualified operatives. NHSS 12D (Sector Scheme 12D) covers installing, maintaining and removing temporary traffic management on these roads. Module M1/M2 for single carriageway, M3 for low-speed duals, M5 for multiphase signals, M7 for designers.", qualification: "NHSS Sector Scheme 12D - Installing, Maintaining and Removing TTM on Rural and Urban Roads", trainingProvider: "Lantra Awards, NHSS accredited providers (e.g. HSCT)", renewalYears: 5 },
  { level: "12b", label: "NHSS 12A/B + 12D M7 Required", description: "Works requiring both 12A/B qualified operatives (for installation on high-speed roads) and a 12D M7 or 12B qualified designer/planner. Required for complex schemes on any road type where the TM design requires professional input.", qualification: "NHSS 12A/B for operatives + 12D M7 or 12B for design/planning", trainingProvider: "Lantra Awards, NHSS accredited providers (e.g. HSCT)", renewalYears: 5 },
  { level: "both", label: "NHSS 12A + 12B Required", description: "Works on motorways and high-speed dual carriageways (50 mph and above) require NHSS 12A/B qualified operatives and designers. NHSS 12A covers installation, maintenance and removal. NHSS 12B covers planning and design of TM schemes on these roads. All operatives must hold 12A minimum; the scheme must be designed by a 12B qualified person.", qualification: "NHSS 12A (installation operatives) + NHSS 12B (design/planning)", trainingProvider: "Lantra Awards, NHSS accredited providers (e.g. HSCT)", renewalYears: 5 },
];

// ─── Signing Schedule Templates ─────────────────────────────────

export interface SignEntry { sign: string; position: string; distance: string; notes: string }

export function getSigningSchedule(
  speedMph: number, layout: TMLayout, signing: SigningDistance, pedestrianDiversion: boolean, nightWorks: boolean,
): SignEntry[] {
  const schedule: SignEntry[] = [];
  const isHighSpeed = speedMph >= 50;
  const isMotorway = layout.applicableRoads.includes("motorway");

  // Advance warning signs
  if (signing.advanceSignM > 0) {
    schedule.push({ sign: "Road Works Ahead (7001.1)", position: "Nearside, approaching traffic", distance: `${signing.advanceSignM}m before works`, notes: "On both approaches if two-way road" });
  }
  if (isHighSpeed) {
    schedule.push({ sign: "Distance plate 'xxx yds'", position: "Below advance warning sign", distance: `${signing.advanceSignM}m before works`, notes: "Show distance to works start" });
  }
  if (isMotorway) {
    schedule.push({ sign: "Motorway advance sign (1 mile)", position: "Nearside", distance: "1600m before works", notes: "First motorway warning" });
    schedule.push({ sign: "Motorway advance sign (800 yds)", position: "Nearside", distance: "730m before works", notes: "Second motorway warning" });
    schedule.push({ sign: "Motorway advance sign (400 yds)", position: "Nearside", distance: "365m before works", notes: "Third motorway warning" });
  }

  // Lane closure signs
  if (layout.applicableLocations.some(l => ["nearside-lane", "offside-lane", "centre-lane"].includes(l))) {
    const laneRef = layout.applicableLocations.includes("offside-lane") ? "offside" : "nearside";
    schedule.push({ sign: `Lane Closed (${laneRef})`, position: "Nearside", distance: `${Math.round(signing.advanceSignM * 0.75)}m before taper`, notes: `${laneRef.charAt(0).toUpperCase() + laneRef.slice(1)} lane closure ahead` });
    schedule.push({ sign: "Keep Left/Right (610/611)", position: "At taper start", distance: "Start of coned taper", notes: "Direct traffic to open lane(s)" });
  }

  // Taper cones
  schedule.push({ sign: `Coned taper (${signing.coneSpacingM}m spacing)`, position: "Carriageway", distance: `${signing.leadInTaperM}m length`, notes: `${Math.ceil(signing.leadInTaperM / signing.coneSpacingM)} cones in taper. ${isHighSpeed ? "Min 750mm cones" : "Min 450mm cones"}` });

  // Safety zone
  if (signing.safetyZoneM > 0) {
    schedule.push({ sign: "Longitudinal safety zone (no works)", position: "Between taper end and works", distance: `${signing.safetyZoneM}m clear zone`, notes: "No personnel, plant or materials in safety zone" });
  }

  // Works area cones
  schedule.push({ sign: `Works area cones (${signing.coneSpacingM}m spacing)`, position: "Alongside works", distance: "Full length of works", notes: `Continuous coning at ${signing.coneSpacingM}m centres` });

  // Shuttle working specific
  if (layout.id === "sc-3") {
    schedule.push({ sign: "Stop/Go boards", position: "Each end of works", distance: "At taper ends", notes: "Operated by NHSS 12A trained personnel with radio communication" });
  }
  if (layout.id === "sc-4") {
    schedule.push({ sign: "Portable Traffic Signals", position: "Each end of works", distance: "At stop lines", notes: "Vehicle actuation preferred. All-red calibrated for works length." });
  }

  // Speed restriction
  if (isHighSpeed || isMotorway) {
    const tempSpeed = isMotorway ? 50 : Math.min(speedMph - 10, 40);
    schedule.push({ sign: `Temporary speed limit ${tempSpeed} mph`, position: "Nearside, both approaches", distance: `Before taper start`, notes: "Temporary speed restriction order may be required" });
  }

  // Road narrows
  if (layout.applicableLocations.some(l => ["nearside-lane", "shuttle-manual", "shuttle-signals"].includes(l))) {
    schedule.push({ sign: "Road Narrows (517)", position: "Nearside, both approaches", distance: `Before works`, notes: "On both approaches for two-way roads" });
  }

  // Pedestrian signs
  if (pedestrianDiversion) {
    schedule.push({ sign: "Pedestrian diversion signs", position: "At each diversion point", distance: "Start/end of diversion", notes: "Tactile ground surface indicators at transitions" });
    schedule.push({ sign: "Footpath Closed Ahead / Use Other Side", position: "Both approaches on footway", distance: "Before closure point", notes: "Must provide accessible alternative route" });
  }

  // Night works lighting
  if (nightWorks) {
    schedule.push({ sign: "Reflective cones/signs", position: "All positions", distance: "Full length", notes: "All signs must be reflective. Cones must have reflective sleeves." });
    schedule.push({ sign: "Works lighting", position: "Works area", distance: "Full works area", notes: "Adequate illumination for operatives and signing visibility" });
  }

  // Exit taper
  schedule.push({ sign: `Exit taper (${signing.coneSpacingM}m spacing)`, position: "End of works", distance: `${signing.exitTaperM}m length`, notes: `${Math.ceil(signing.exitTaperM / signing.coneSpacingM)} cones in exit taper` });

  // End of restrictions
  schedule.push({ sign: "End of road works / restrictions", position: "After exit taper", distance: "After all works clear", notes: "Remove temporary speed restriction signs" });

  // Arrow board / IPV
  if (isHighSpeed || isMotorway) {
    schedule.push({ sign: "Impact Protection Vehicle (IPV) with arrow board", position: "In safety zone / taper", distance: "Rear of safety zone", notes: "Mandatory on motorways and high-speed roads. Class TL2 or TL3 per EN 1317." });
  }

  return schedule;
}

// ─── Deployment Checklist ───────────────────────────────────────

export const DEPLOYMENT_CHECKLIST: DeploymentCheckItem[] = [
  // Pre-deployment
  { id: "dc-01", category: "Pre-Deployment Planning", item: "TM layout drawing available and understood by all operatives", regulation: "Chapter 8, Safety at Street Works CoP" },
  { id: "dc-02", category: "Pre-Deployment Planning", item: "Risk assessment completed for TM installation and removal", regulation: "MHSWR 1999 reg.3" },
  { id: "dc-03", category: "Pre-Deployment Planning", item: "NRSWA notice served (if applicable) and reference number obtained", regulation: "NRSWA 1991 s.54/s.55" },
  { id: "dc-04", category: "Pre-Deployment Planning", item: "Permit obtained (if in permit scheme area)", regulation: "TMA 2004 Part 3" },
  { id: "dc-05", category: "Pre-Deployment Planning", item: "Highway authority / National Highways approval obtained (if required)", regulation: "TMA 2004, GG 104" },
  { id: "dc-06", category: "Pre-Deployment Planning", item: "All operatives hold valid NHSS 12A/12B as required", regulation: "NHSS Sector Schemes 12A/12B" },
  { id: "dc-07", category: "Pre-Deployment Planning", item: "Emergency vehicle access plan confirmed", regulation: "Chapter 8 Part 2" },
  { id: "dc-08", category: "Pre-Deployment Planning", item: "Bus operators and emergency services notified (if applicable)", regulation: "NRSWA 1991, Chapter 8" },
  // Equipment
  { id: "dc-09", category: "Equipment Check", item: "Correct number of cones available (including spares)", regulation: "Safety at Street Works CoP" },
  { id: "dc-10", category: "Equipment Check", item: "Cone height correct for speed: 450mm (<50mph) or 750mm (50+mph)", regulation: "Chapter 8 Part 2" },
  { id: "dc-11", category: "Equipment Check", item: "All signs clean, reflective, and compliant with TSRGD", regulation: "TSRGD 2016" },
  { id: "dc-12", category: "Equipment Check", item: "Stop/Go boards in good condition (if shuttle working)", regulation: "Safety at Street Works CoP" },
  { id: "dc-13", category: "Equipment Check", item: "Portable traffic signals tested (if used)", regulation: "Safety at Street Works CoP" },
  { id: "dc-14", category: "Equipment Check", item: "Barriers, pedestrian guard rails, and ramps available (if pedestrian diversion)", regulation: "Chapter 8, Equality Act 2010" },
  { id: "dc-15", category: "Equipment Check", item: "Vehicle amber beacons operational", regulation: "RVLR 1989" },
  { id: "dc-16", category: "Equipment Check", item: "IPV available and operational (if high-speed road)", regulation: "Chapter 8 Part 2, CD 122" },
  // Installation
  { id: "dc-17", category: "Installation", item: "Signs installed from furthest upstream point working back towards works", regulation: "Safety at Street Works CoP" },
  { id: "dc-18", category: "Installation", item: "Taper installed at correct angle and spacing for speed limit", regulation: "Chapter 8 Table A1" },
  { id: "dc-19", category: "Installation", item: "Safety zone clear of all personnel, plant and materials", regulation: "Chapter 8 Part 2" },
  { id: "dc-20", category: "Installation", item: "Cones/signs weighted or stabilised (not blown over)", regulation: "Safety at Street Works CoP" },
  { id: "dc-21", category: "Installation", item: "Pedestrian route signed and barriers continuous (if applicable)", regulation: "Chapter 8, Equality Act 2010" },
  { id: "dc-22", category: "Installation", item: "Speed restriction signs in place (if applicable)", regulation: "TSRGD 2016, TRO" },
  { id: "dc-23", category: "Installation", item: "Road closure signs and diversion signs in place (if applicable)", regulation: "Chapter 8, NRSWA 1991" },
  // Monitoring
  { id: "dc-24", category: "Monitoring & Maintenance", item: "TM checked at start of each shift", regulation: "Safety at Street Works CoP" },
  { id: "dc-25", category: "Monitoring & Maintenance", item: "Displaced cones/signs repositioned immediately", regulation: "Safety at Street Works CoP" },
  { id: "dc-26", category: "Monitoring & Maintenance", item: "Night-time check: all reflective signs visible, lighting adequate", regulation: "Chapter 8" },
  { id: "dc-27", category: "Monitoring & Maintenance", item: "Works area and TM photographed for records", regulation: "Best practice" },
  // Removal
  { id: "dc-28", category: "Removal", item: "Signs removed from works area outward (reverse of installation)", regulation: "Safety at Street Works CoP" },
  { id: "dc-29", category: "Removal", item: "All cones, signs, and equipment recovered (nothing left on highway)", regulation: "HA Act 1980 s.148" },
  { id: "dc-30", category: "Removal", item: "Road surface clean and free of debris", regulation: "NRSWA 1991, HA Act 1980" },
  { id: "dc-31", category: "Removal", item: "Permanent road markings and signs uncovered / reinstated", regulation: "TSRGD 2016" },
  { id: "dc-32", category: "Removal", item: "NRSWA works closure notice submitted (works complete)", regulation: "NRSWA 1991 s.55, Coordination CoP" },
];

// ─── Calculation Functions ──────────────────────────────────────

export function getSigningForSpeed(speedMph: number): SigningDistance {
  // Find exact match or interpolate to next higher
  const exact = SIGNING_DISTANCES.find(s => s.speedMph === speedMph);
  if (exact) return exact;
  // Fall back to next higher speed
  const higher = SIGNING_DISTANCES.filter(s => s.speedMph >= speedMph).sort((a, b) => a.speedMph - b.speedMph);
  return higher[0] || SIGNING_DISTANCES[SIGNING_DISTANCES.length - 1];
}

export function getNHSSRequirement(roadType: RoadType, speedMph: number, layout: TMLayout): NHSSRequirement {
  if (roadType.category === "private") return NHSS_REQUIREMENTS[0]; // none
  if (roadType.category === "motorway") return NHSS_REQUIREMENTS[3]; // 12A + 12B (motorway)
  if (roadType.category === "trunk") return NHSS_REQUIREMENTS[3]; // 12A + 12B (trunk = National Highways)
  // High-speed dual carriageways (50+ mph) = 12A/B
  if (speedMph >= 50 && ["dual-a", "dual-trunk"].includes(roadType.id)) return NHSS_REQUIREMENTS[3]; // 12A + 12B
  // Complex layouts on any road type need designer involvement
  const complexLayouts = ["dc-4", "mw-1", "mw-2", "mw-3", "jn-1", "mp-1"];
  if (complexLayouts.includes(layout.id)) return NHSS_REQUIREMENTS[2]; // 12A/B + 12D M7
  // All other public highway works = 12D
  return NHSS_REQUIREMENTS[1]; // 12D
}

export function selectLayout(
  roadTypeId: string, speedMph: number, worksLocationId: string, durationId: string,
): TMLayout {
  const road = ROAD_TYPES.find(r => r.id === roadTypeId)!;

  // Motorway-specific
  if (road.category === "motorway") {
    if (worksLocationId === "hard-shoulder") return TM_LAYOUTS.find(l => l.id === "mw-1")!;
    if (worksLocationId === "nearside-lane") return TM_LAYOUTS.find(l => l.id === "mw-2")!;
    return TM_LAYOUTS.find(l => l.id === "mw-3")!;
  }

  // Dual carriageway
  if (["dual-trunk", "dual-a"].includes(roadTypeId)) {
    if (worksLocationId === "hard-shoulder") return TM_LAYOUTS.find(l => l.id === "vs-1")!;
    if (worksLocationId === "nearside-lane") return TM_LAYOUTS.find(l => l.id === "dc-1")!;
    if (worksLocationId === "offside-lane") return TM_LAYOUTS.find(l => l.id === "dc-2")!;
    if (worksLocationId === "central-reserve") return TM_LAYOUTS.find(l => l.id === "dc-3")!;
    if (worksLocationId === "contraflow") return TM_LAYOUTS.find(l => l.id === "dc-4")!;
    if (worksLocationId === "roundabout") return TM_LAYOUTS.find(l => l.id === "jn-1")!;
    if (worksLocationId === "multi-phase") return TM_LAYOUTS.find(l => l.id === "mp-1")!;
    if (worksLocationId === "crossing") return TM_LAYOUTS.find(l => l.id === "pc-1")!;
    if (worksLocationId === "footway-only") return TM_LAYOUTS.find(l => l.id === "fw-2")!;
    if (worksLocationId === "footway-carriageway") return TM_LAYOUTS.find(l => l.id === "fw-1")!;
    if (worksLocationId === "full-closure") return TM_LAYOUTS.find(l => l.id === "sc-5")!;
    // Default dual nearside
    return TM_LAYOUTS.find(l => l.id === "dc-1")!;
  }

  // Single carriageway
  if (worksLocationId === "footway-only") return TM_LAYOUTS.find(l => l.id === "fw-2")!;
  if (worksLocationId === "footway-carriageway") return TM_LAYOUTS.find(l => l.id === "fw-1")!;
  if (worksLocationId === "hard-shoulder") return TM_LAYOUTS.find(l => l.id === "vs-1")!;
  if (worksLocationId === "full-closure") return TM_LAYOUTS.find(l => l.id === "sc-5")!;
  if (worksLocationId === "shuttle-manual") return TM_LAYOUTS.find(l => l.id === "sc-3")!;
  if (worksLocationId === "shuttle-signals") return TM_LAYOUTS.find(l => l.id === "sc-4")!;
  if (worksLocationId === "roundabout") return TM_LAYOUTS.find(l => l.id === "jn-1")!;
  if (worksLocationId === "multi-phase") return TM_LAYOUTS.find(l => l.id === "mp-1")!;
  if (worksLocationId === "crossing") return TM_LAYOUTS.find(l => l.id === "pc-1")!;

  // Nearside lane on single carriageway - depends on speed and road
  if (worksLocationId === "nearside-lane") {
    if (speedMph <= 30 && ["minor-c", "unclassified"].includes(roadTypeId)) return TM_LAYOUTS.find(l => l.id === "sc-1")!;
    if (speedMph <= 40) return TM_LAYOUTS.find(l => l.id === "sc-2")!;
    return TM_LAYOUTS.find(l => l.id === "sc-4")!; // High speed = signals
  }

  // Offside lane on single = shuttle working
  if (worksLocationId === "offside-lane" || worksLocationId === "centre-lane") {
    if (speedMph <= 40) return TM_LAYOUTS.find(l => l.id === "sc-3")!;
    return TM_LAYOUTS.find(l => l.id === "sc-4")!;
  }

  if (worksLocationId === "contraflow") return TM_LAYOUTS.find(l => l.id === "sc-5")!;

  // Default
  return TM_LAYOUTS.find(l => l.id === "sc-1")!;
}

export function getNeighbourLayouts(selectedLayout: TMLayout): TMLayout[] {
  // Return 1-2 adjacent/alternative layouts for comparison
  const idx = TM_LAYOUTS.findIndex(l => l.id === selectedLayout.id);
  const neighbours: TMLayout[] = [];

  // Find layouts with overlapping road types and locations
  for (const layout of TM_LAYOUTS) {
    if (layout.id === selectedLayout.id) continue;
    const sharedRoads = layout.applicableRoads.some(r => selectedLayout.applicableRoads.includes(r));
    const sharedLocations = layout.applicableLocations.some(l => selectedLayout.applicableLocations.includes(l));
    if (sharedRoads || sharedLocations) {
      neighbours.push(layout);
    }
    if (neighbours.length >= 2) break;
  }

  // If no overlapping found, just return adjacent in list
  if (neighbours.length === 0) {
    if (idx > 0) neighbours.push(TM_LAYOUTS[idx - 1]);
    if (idx < TM_LAYOUTS.length - 1) neighbours.push(TM_LAYOUTS[idx + 1]);
  }

  return neighbours.slice(0, 2);
}

export function calculateComplexityScore(
  selections: Record<string, number>,
): { score: number; max: number; band: RiskBand; factorScores: TMResult["factorScores"] } {
  let score = 0;
  let max = 0;
  const factorScores: TMResult["factorScores"] = [];

  SCORING_FACTORS.forEach(f => {
    const selectedIndex = selections[f.id] ?? 0;
    const option = f.options[selectedIndex] || f.options[0];
    const maxOption = f.options.reduce((a, b) => (b.score > a.score ? b : a));
    const weighted = option.score * f.weight;
    const maxWeighted = maxOption.score * f.weight;
    score += weighted;
    max += maxWeighted;
    factorScores.push({
      id: f.id,
      label: f.label,
      score: weighted,
      maxScore: maxWeighted,
      weight: f.weight,
      color: option.color,
      selectedLabel: option.label,
    });
  });

  const band = RISK_BANDS.find(b => score >= b.min && score <= b.max) || RISK_BANDS[RISK_BANDS.length - 1];
  return { score, max, band, factorScores };
}

export function getOperativesRequired(layout: TMLayout, nightWorks: boolean, pedestrianDiversion: boolean): number {
  let count = layout.operativeMin;
  if (nightWorks) count = Math.max(count, count + 1); // extra for safety
  if (pedestrianDiversion && layout.operativeMin < 3) count = Math.max(count, 2);
  return count;
}

export function generateWarnings(
  road: RoadType, speedMph: number, layout: TMLayout, nightWorks: boolean, pedestrianDiversion: boolean,
): string[] {
  const warnings: string[] = [];
  if (road.category === "motorway") {
    warnings.push("MOTORWAY WORKS: National Highways approval mandatory. Apply via NOMS/Street Manager. All operatives require NHSS 12A minimum.");
  }
  if (road.category === "trunk") {
    warnings.push("TRUNK ROAD: National Highways is the highway authority. Contact Area 10 (North West) or relevant area for approval.");
  }
  if (speedMph >= 60) {
    warnings.push("HIGH SPEED ROAD (60+ mph): Impact Protection Vehicle (IPV) strongly recommended. All cones must be min 750mm with reflective sleeves.");
  }
  if (layout.id === "dc-4" || layout.id === "mw-3") {
    warnings.push("CONTRAFLOW / MULTI-LANE CLOSURE: This is a high-risk TM configuration. Full 12B design with independent check recommended.");
  }
  if (nightWorks && speedMph >= 40) {
    warnings.push("NIGHT WORKS ON HIGH-SPEED ROAD: Enhanced reflective signing, lighting towers, and additional operatives required.");
  }
  if (pedestrianDiversion) {
    warnings.push("PEDESTRIAN DIVERSION: Ensure Equality Act 2010 compliant route. Provide tactile paving, ramps (max 1:12), and min 1.5m width (1.2m absolute minimum).");
  }
  if (layout.id === "sc-3") {
    warnings.push("STOP/GO BOARDS: Both operatives must maintain radio contact. Maximum distance 500m between operatives.");
  }
  if (layout.id === "full-closure" || layout.id === "sc-5") {
    warnings.push("ROAD CLOSURE: Diversion route must use roads of equal or higher classification. Notify emergency services and bus operators.");
  }
  return warnings;
}

export function generateRecommendations(
  road: RoadType, speedMph: number, layout: TMLayout, nhss: NHSSRequirement, complexity: RiskBand,
): string[] {
  const recs: string[] = [];
  recs.push(`Use the ${layout.ref} layout as the basis for your TM drawing. Adapt dimensions to match site conditions.`);
  if (nhss.level !== "none") {
    recs.push(`Ensure all TM operatives hold current ${nhss.level === "12a" ? "NHSS 12A" : nhss.level === "12b" ? "NHSS 12B" : "NHSS 12A and 12B"} certification before deployment.`);
  }
  if (speedMph >= 50) {
    recs.push("Use 750mm or 1000mm cones with reflective sleeves on roads 50 mph and above.");
  } else {
    recs.push("Use 450mm cones minimum. 750mm cones recommended on all roads 40 mph and above.");
  }
  if (complexity.label.includes("High") || complexity.label.includes("Very")) {
    recs.push("Consider appointing a dedicated TM supervisor separate from the site works supervisor.");
    recs.push("Conduct a specific TM risk assessment (separate from the works RAMS) before deployment.");
  }
  recs.push("Photograph the TM layout once installed and retain photos as evidence of compliance.");
  recs.push("Brief all site operatives on the TM layout, pedestrian routes, and emergency vehicle access before starting works.");
  if (road.category !== "private") {
    recs.push("Check for any Traffic Regulation Orders (TROs) or existing temporary TM that may conflict with your layout.");
  }
  return recs;
}

export function generateCrossReferences(layout: TMLayout, pedestrianDiversion: boolean): string[] {
  const refs: string[] = [];
  refs.push("Use the Working at Height Risk Score Calculator if erecting high-level signs or gantries.");
  if (pedestrianDiversion) {
    refs.push("Use the Slip Risk Calculator to assess temporary pedestrian walkway surfaces.");
  }
  refs.push("Use the Fire Risk Score Calculator for welfare and compound areas adjacent to TM zones.");
  refs.push("Use the WBGT Heat Stress Calculator for operatives working in PPE on exposed roads in warm weather.");
  return refs;
}
