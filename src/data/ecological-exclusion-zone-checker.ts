// src/data/ecological-exclusion-zone-checker.ts
// Ecological Exclusion Zone Checker — Full UK species database
// Legislation: Wildlife & Countryside Act 1981, Conservation of Habitats & Species Regs 2017,
// Protection of Badgers Act 1992, NERC Act 2006, Natural England standing advice

// ─── Types ───────────────────────────────────────────────────
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export const MONTH_NAMES: Record<Month, string> = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
};
export const MONTH_FULL: Record<Month, string> = {
  1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
  7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December",
};

export type TrafficLight = "green" | "yellow" | "amber" | "red";
export const TRAFFIC_LABELS: Record<TrafficLight, string> = {
  green: "No Conflict",
  yellow: "Awareness — Precautionary Measures",
  amber: "Mitigation Required — Survey / Watching Brief",
  red: "Licence Required or Works Cannot Proceed",
};
export const TRAFFIC_COLOURS: Record<TrafficLight, { bg: string; text: string; border: string; dot: string; rgb: number[] }> = {
  green:  { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500", rgb: [22, 163, 74] },
  yellow: { bg: "bg-yellow-50",  text: "text-yellow-800",  border: "border-yellow-200",  dot: "bg-yellow-500",  rgb: [202, 138, 4] },
  amber:  { bg: "bg-amber-50",   text: "text-amber-800",   border: "border-amber-200",   dot: "bg-amber-500",   rgb: [245, 158, 11] },
  red:    { bg: "bg-red-50",     text: "text-red-800",     border: "border-red-200",     dot: "bg-red-500",     rgb: [220, 38, 38] },
};

export type SpeciesGroup =
  | "bats" | "great-crested-newts" | "nesting-birds" | "badgers" | "barn-owls"
  | "water-voles" | "otters" | "reptiles" | "red-squirrels" | "dormice"
  | "white-clawed-crayfish" | "atlantic-salmon" | "freshwater-pearl-mussel"
  | "lamprey" | "invasive-plants" | "tpo-trees" | "protected-plants";

export interface RestrictedPeriod {
  label: string;
  months: Month[];
  severity: "high" | "moderate";
  description: string;
}

export interface SpeciesProfile {
  id: string;
  group: SpeciesGroup;
  name: string;
  commonName?: string;
  legislation: string[];
  prohibitions: string[];
  restrictedPeriods: RestrictedPeriod[];
  exclusionZoneM: number;
  exclusionZoneNote: string;
  yearRoundProtection: boolean;
  habitatFeatures: string[];
  category: "mammal" | "bird" | "amphibian" | "reptile" | "fish" | "invertebrate" | "plant";
  epsSpecies: boolean; // European Protected Species
}

export interface WorksType {
  id: string;
  label: string;
  description: string;
  riskLevel: "high" | "medium" | "low";
  noiseDisturbance: boolean;
  groundDisturbance: boolean;
  vegetationRemoval: boolean;
  watercourseImpact: boolean;
  lightingImpact: boolean;
}

export interface ConflictResult {
  species: SpeciesProfile;
  trafficLight: TrafficLight;
  conflictingPeriods: RestrictedPeriod[];
  actions: string[];
  licenceRequired: boolean;
  surveyRequired: boolean;
  eclerkRequired: boolean;
}

export interface AssessmentResult {
  conflicts: ConflictResult[];
  overallTrafficLight: TrafficLight;
  totalSpecies: number;
  conflictCount: number;
  licenceCount: number;
  surveyCount: number;
  optimalWindow: Month[] | null;
  summary: string;
}

// ─── Works Types ─────────────────────────────────────────────
export const WORKS_TYPES: WorksType[] = [
  { id: "demolition", label: "Demolition", description: "Building or structure demolition", riskLevel: "high", noiseDisturbance: true, groundDisturbance: true, vegetationRemoval: false, watercourseImpact: false, lightingImpact: false },
  { id: "tree-felling", label: "Tree Felling", description: "Removal of trees and large shrubs", riskLevel: "high", noiseDisturbance: true, groundDisturbance: false, vegetationRemoval: true, watercourseImpact: false, lightingImpact: false },
  { id: "excavation", label: "Excavation", description: "Earthworks, trenching, foundation digging", riskLevel: "high", noiseDisturbance: true, groundDisturbance: true, vegetationRemoval: false, watercourseImpact: false, lightingImpact: false },
  { id: "piling", label: "Piling", description: "Driven or bored piling", riskLevel: "high", noiseDisturbance: true, groundDisturbance: true, vegetationRemoval: false, watercourseImpact: false, lightingImpact: false },
  { id: "general-construction", label: "General Construction", description: "General building works", riskLevel: "medium", noiseDisturbance: true, groundDisturbance: false, vegetationRemoval: false, watercourseImpact: false, lightingImpact: false },
  { id: "vegetation-clearance", label: "Vegetation Clearance", description: "Scrub, hedge, or grass removal", riskLevel: "high", noiseDisturbance: false, groundDisturbance: false, vegetationRemoval: true, watercourseImpact: false, lightingImpact: false },
  { id: "watercourse-works", label: "Watercourse Works", description: "River, stream, pond, or drainage works", riskLevel: "high", noiseDisturbance: true, groundDisturbance: true, vegetationRemoval: false, watercourseImpact: true, lightingImpact: false },
  { id: "dewatering", label: "Dewatering", description: "Pumping or draining water from excavations", riskLevel: "high", noiseDisturbance: false, groundDisturbance: false, vegetationRemoval: false, watercourseImpact: true, lightingImpact: false },
  { id: "night-works", label: "Night Works", description: "Works conducted during darkness", riskLevel: "high", noiseDisturbance: true, groundDisturbance: false, vegetationRemoval: false, watercourseImpact: false, lightingImpact: true },
  { id: "lighting-installation", label: "Lighting Installation", description: "Permanent or temporary lighting", riskLevel: "medium", noiseDisturbance: false, groundDisturbance: false, vegetationRemoval: false, watercourseImpact: false, lightingImpact: true },
  { id: "road-construction", label: "Road / Path Construction", description: "Highway or access road works", riskLevel: "medium", noiseDisturbance: true, groundDisturbance: true, vegetationRemoval: true, watercourseImpact: false, lightingImpact: false },
  { id: "bridge-works", label: "Bridge Works", description: "Bridge construction, repair, or demolition", riskLevel: "high", noiseDisturbance: true, groundDisturbance: true, vegetationRemoval: false, watercourseImpact: true, lightingImpact: false },
  { id: "marine-river-works", label: "Marine / River Works", description: "In-channel or intertidal works", riskLevel: "high", noiseDisturbance: true, groundDisturbance: true, vegetationRemoval: false, watercourseImpact: true, lightingImpact: false },
];

// ─── Species Database ────────────────────────────────────────

// Bat species — full UK list
const BAT_LEGISLATION = [
  "Conservation of Habitats and Species Regulations 2017 (Reg 43)",
  "Wildlife and Countryside Act 1981 (Schedule 5)",
  "NERC Act 2006 (Section 41 — Species of Principal Importance)",
];
const BAT_PROHIBITIONS = [
  "Deliberately capture, injure, or kill",
  "Deliberately disturb (impairing ability to survive, breed, or rear young)",
  "Damage or destroy a breeding site or resting place",
];
const BAT_PERIODS: RestrictedPeriod[] = [
  { label: "Hibernation", months: [11, 12, 1, 2, 3], severity: "high", description: "Hibernation roost disturbance prohibited. Hibernating bats are extremely vulnerable to disturbance." },
  { label: "Maternity season", months: [5, 6, 7, 8], severity: "high", description: "Maternity roost disturbance prohibited. Females gather in maternity colonies to give birth and rear young." },
  { label: "Active / foraging", months: [4, 9, 10], severity: "moderate", description: "Bats are active and foraging. Roost disturbance still prohibited year-round, but risk of hibernation/maternity disturbance is lower." },
];

function makeBat(id: string, name: string, exclusionM: number, note: string, commonName?: string): SpeciesProfile {
  return {
    id, group: "bats", name, commonName, legislation: BAT_LEGISLATION, prohibitions: BAT_PROHIBITIONS,
    restrictedPeriods: BAT_PERIODS, exclusionZoneM: exclusionM, exclusionZoneNote: note,
    yearRoundProtection: true, habitatFeatures: ["Roosts (buildings, trees, bridges, caves)", "Flight lines", "Foraging habitat"],
    category: "mammal", epsSpecies: true,
  };
}

const BATS: SpeciesProfile[] = [
  makeBat("bat-common-pip", "Common Pipistrelle (Pipistrellus pipistrellus)", 15, "15m from roost entrance for most works"),
  makeBat("bat-soprano-pip", "Soprano Pipistrelle (Pipistrellus pygmaeus)", 15, "15m from roost entrance for most works"),
  makeBat("bat-nathusius-pip", "Nathusius' Pipistrelle (Pipistrellus nathusii)", 15, "15m from roost entrance; rare — potential for higher buffer"),
  makeBat("bat-brown-long-eared", "Brown Long-eared Bat (Plecotus auritus)", 20, "20m from roost; light-averse species, sensitive to illumination"),
  makeBat("bat-grey-long-eared", "Grey Long-eared Bat (Plecotus austriacus)", 25, "25m from roost; very rare, high sensitivity"),
  makeBat("bat-noctule", "Noctule (Nyctalus noctula)", 20, "20m from tree roost; high-flying species"),
  makeBat("bat-leislers", "Leisler's Bat (Nyctalus leisleri)", 20, "20m from tree roost"),
  makeBat("bat-daubentons", "Daubenton's Bat (Myotis daubentonii)", 20, "20m from roost; often associated with waterways and bridges"),
  makeBat("bat-natterers", "Natterer's Bat (Myotis nattereri)", 20, "20m from roost"),
  makeBat("bat-whiskered", "Whiskered Bat (Myotis mystacinus)", 20, "20m from roost"),
  makeBat("bat-brandts", "Brandt's Bat (Myotis brandtii)", 20, "20m from roost"),
  makeBat("bat-alcathoe", "Alcathoe Bat (Myotis alcathoe)", 25, "25m from roost; extremely rare — specialist advice required"),
  makeBat("bat-bechsteins", "Bechstein's Bat (Myotis bechsteinii)", 25, "25m from tree roost; very rare, woodland specialist"),
  makeBat("bat-serotine", "Serotine (Eptesicus serotinus)", 20, "20m from roost"),
  makeBat("bat-barbastelle", "Barbastelle (Barbastella barbastellus)", 25, "25m from roost; very rare, light-averse"),
  makeBat("bat-greater-horseshoe", "Greater Horseshoe Bat (Rhinolophus ferrumequinum)", 25, "25m from roost entrance; extremely light-sensitive, specialist advice required"),
  makeBat("bat-lesser-horseshoe", "Lesser Horseshoe Bat (Rhinolophus hipposideros)", 25, "25m from roost entrance; extremely light-sensitive"),
];

// Great Crested Newts
const GCN: SpeciesProfile = {
  id: "gcn", group: "great-crested-newts", name: "Great Crested Newt (Triturus cristatus)",
  legislation: [
    "Conservation of Habitats and Species Regulations 2017 (Reg 43)",
    "Wildlife and Countryside Act 1981 (Schedule 5)",
    "NERC Act 2006 (Section 41)",
  ],
  prohibitions: [
    "Deliberately capture, injure, or kill",
    "Deliberately disturb",
    "Damage or destroy a breeding site or resting place",
    "Possess or transport (except under licence)",
  ],
  restrictedPeriods: [
    { label: "Terrestrial hibernation", months: [10, 11, 12, 1, 2], severity: "high", description: "Newts hibernate in log piles, rubble, tree roots, and underground refugia. Ground disturbance near ponds can destroy hibernacula." },
    { label: "Breeding / aquatic phase", months: [3, 4, 5, 6], severity: "high", description: "Newts migrate to breeding ponds March-April and remain aquatic until June. Pond disturbance is critical." },
    { label: "Dispersal / terrestrial active", months: [7, 8, 9], severity: "moderate", description: "Juveniles and adults disperse across terrestrial habitat. Ground disturbance may injure or kill newts." },
  ],
  exclusionZoneM: 250,
  exclusionZoneNote: "50m core zone around breeding ponds (no works without licence), 250m wider buffer (survey required before ground disturbance). Natural England District Level Licensing may apply.",
  yearRoundProtection: true,
  habitatFeatures: ["Breeding ponds", "Terrestrial hibernacula (log piles, rubble)", "Rough grassland", "Woodland edge"],
  category: "amphibian", epsSpecies: true,
};

// Nesting Birds
const NESTING_BIRDS: SpeciesProfile = {
  id: "nesting-birds", group: "nesting-birds", name: "Nesting Birds (all species)",
  legislation: [
    "Wildlife and Countryside Act 1981 (Part 1, Section 1)",
    "NERC Act 2006 (Section 41 — some species)",
  ],
  prohibitions: [
    "Intentionally kill, injure, or take any wild bird",
    "Take, damage, or destroy the nest of any wild bird while in use or being built",
    "Take or destroy the egg of any wild bird",
  ],
  restrictedPeriods: [
    { label: "Main nesting season", months: [3, 4, 5, 6, 7, 8], severity: "high", description: "General nesting season March-August. No fixed closed season — if active nests are confirmed at any time of year, disturbance is an offence." },
    { label: "Extended nesting (some species)", months: [2, 9], severity: "moderate", description: "Some species nest early (Feb) or late (Sep). Pre-commencement checks required." },
  ],
  exclusionZoneM: 15,
  exclusionZoneNote: "5-15m for common species, 50m+ for Schedule 1 species (e.g. barn owl, peregrine, osprey). Variable depending on species and sensitivity.",
  yearRoundProtection: true,
  habitatFeatures: ["Trees", "Hedgerows", "Buildings / structures", "Ground nesting sites", "Reed beds"],
  category: "bird", epsSpecies: false,
};

// Barn Owls (Schedule 1 — additional protection)
const BARN_OWLS: SpeciesProfile = {
  id: "barn-owls", group: "barn-owls", name: "Barn Owl (Tyto alba)",
  legislation: [
    "Wildlife and Countryside Act 1981 (Schedule 1 — additional protection)",
    "NERC Act 2006 (Section 41)",
  ],
  prohibitions: [
    "All wild bird prohibitions apply",
    "Intentionally or recklessly disturb at, on, or near an active nest (Schedule 1 offence)",
    "Disturb dependent young",
  ],
  restrictedPeriods: [
    { label: "Nesting season", months: [3, 4, 5, 6, 7, 8], severity: "high", description: "Barn owls nest March-August. Schedule 1 species — intentional or reckless disturbance at or near the nest is a criminal offence." },
    { label: "Winter roosting", months: [11, 12, 1, 2], severity: "moderate", description: "Barn owls roost in buildings and tree cavities over winter. Loss of roost sites reduces survival." },
  ],
  exclusionZoneM: 50,
  exclusionZoneNote: "50m from known nest/roost site during nesting. Barn Owl Trust recommends minimum 3m from known roost at all times.",
  yearRoundProtection: true,
  habitatFeatures: ["Barns / derelict buildings", "Tree cavities", "Nest boxes", "Rough grassland foraging"],
  category: "bird", epsSpecies: false,
};

// Badgers
const BADGERS: SpeciesProfile = {
  id: "badgers", group: "badgers", name: "Eurasian Badger (Meles meles)",
  legislation: [
    "Protection of Badgers Act 1992",
  ],
  prohibitions: [
    "Wilfully kill, injure, or take a badger",
    "Cruelly ill-treat a badger",
    "Interfere with a badger sett (damage, destroy, obstruct, or disturb)",
  ],
  restrictedPeriods: [
    { label: "Breeding season (sett closure restricted)", months: [12, 1, 2, 3, 4, 5, 6], severity: "high", description: "Cubs born January-March, dependent until June. Sett closure under licence is restricted December-June inclusive." },
    { label: "Active foraging", months: [7, 8, 9, 10, 11], severity: "moderate", description: "Badgers are active year-round. Sett disturbance is always an offence. Sett closure licences generally only granted July-November." },
  ],
  exclusionZoneM: 30,
  exclusionZoneNote: "30m from active sett entrances for heavy machinery, vibration, and excavation. 20m for light hand-tool works with Natural England licence. No sett closure Dec-Jun.",
  yearRoundProtection: true,
  habitatFeatures: ["Active setts (main, annexe, subsidiary, outlier)", "Foraging pathways", "Latrines"],
  category: "mammal", epsSpecies: false,
};

// Water Voles
const WATER_VOLES: SpeciesProfile = {
  id: "water-voles", group: "water-voles", name: "Water Vole (Arvicola amphibius)",
  legislation: [
    "Wildlife and Countryside Act 1981 (Schedule 5 — full protection since 2008)",
    "NERC Act 2006 (Section 41)",
  ],
  prohibitions: [
    "Intentionally kill, injure, or take",
    "Intentionally or recklessly damage, destroy, or obstruct any structure or place used for shelter or protection",
    "Intentionally or recklessly disturb while occupying such a structure",
  ],
  restrictedPeriods: [
    { label: "Breeding season", months: [3, 4, 5, 6, 7, 8, 9, 10], severity: "high", description: "Water voles breed March-October. Burrow disturbance during this period is a criminal offence." },
    { label: "Winter (reduced activity)", months: [11, 12, 1, 2], severity: "moderate", description: "Water voles are less active but burrows remain protected. Works near watercourses still require caution." },
  ],
  exclusionZoneM: 10,
  exclusionZoneNote: "5m from top of watercourse bank (minimum). 10m buffer recommended for heavy machinery. Works within 5m of known burrows require a conservation licence.",
  yearRoundProtection: true,
  habitatFeatures: ["Watercourse banks", "Ditches", "Ponds", "Reed beds", "Burrow systems"],
  category: "mammal", epsSpecies: false,
};

// Otters
const OTTERS: SpeciesProfile = {
  id: "otters", group: "otters", name: "European Otter (Lutra lutra)",
  legislation: [
    "Conservation of Habitats and Species Regulations 2017 (Reg 43)",
    "Wildlife and Countryside Act 1981 (Schedule 5)",
    "NERC Act 2006 (Section 41)",
  ],
  prohibitions: [
    "Deliberately capture, injure, or kill",
    "Deliberately disturb",
    "Damage or destroy a breeding site or resting place (holt or couch)",
  ],
  restrictedPeriods: [
    { label: "Breeding (year-round, peak winter/spring)", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], severity: "high", description: "Otters breed year-round in the UK with no fixed season. Cubs can be born in any month. Holt disturbance is prohibited at all times." },
  ],
  exclusionZoneM: 30,
  exclusionZoneNote: "30m from known holt or natal holt. 10m from known couch (above-ground resting site). Holts are protected whether or not the otter is present.",
  yearRoundProtection: true,
  habitatFeatures: ["Holts (underground dens)", "Couches (above-ground resting)", "Watercourses", "Riparian vegetation"],
  category: "mammal", epsSpecies: true,
};

// Reptiles — common species
function makeCommonReptile(id: string, name: string): SpeciesProfile {
  return {
    id, group: "reptiles", name,
    legislation: [
      "Wildlife and Countryside Act 1981 (Schedule 5 — partial protection: killing/injuring only)",
      "NERC Act 2006 (Section 41)",
    ],
    prohibitions: [
      "Intentionally kill or injure",
      "Sell, offer for sale, or advertise",
    ],
    restrictedPeriods: [
      { label: "Hibernation", months: [10, 11, 12, 1, 2, 3], severity: "high", description: "Reptiles hibernate in frost-free refugia (log piles, rubble, compost heaps, banks). Ground disturbance can destroy hibernacula and kill individuals." },
      { label: "Active season / breeding", months: [4, 5, 6, 7, 8, 9], severity: "moderate", description: "Reptiles are active and breeding. Vegetation clearance and ground works risk killing or injuring individuals. Phased habitat manipulation required." },
    ],
    exclusionZoneM: 10,
    exclusionZoneNote: "No formal exclusion zone. Best practice: retain refugia within 10m buffer. Phased vegetation clearance (directional strimming) during active season to displace reptiles.",
    yearRoundProtection: false,
    habitatFeatures: ["South-facing banks", "Log / rubble piles", "Rough grassland", "Heathland", "Railway embankments"],
    category: "reptile", epsSpecies: false,
  };
}

// EPS reptiles (sand lizard, smooth snake)
function makeEpsReptile(id: string, name: string, exclusionM: number): SpeciesProfile {
  return {
    id, group: "reptiles", name,
    legislation: [
      "Conservation of Habitats and Species Regulations 2017 (Reg 43)",
      "Wildlife and Countryside Act 1981 (Schedule 5 — full protection)",
      "NERC Act 2006 (Section 41)",
    ],
    prohibitions: [
      "Deliberately capture, injure, or kill",
      "Deliberately disturb",
      "Damage or destroy a breeding site or resting place",
    ],
    restrictedPeriods: [
      { label: "Hibernation", months: [10, 11, 12, 1, 2, 3], severity: "high", description: "Hibernation period — habitat destruction can kill hibernating animals." },
      { label: "Breeding / active", months: [4, 5, 6, 7, 8, 9], severity: "high", description: "Breeding season. EPS licence required for any works affecting habitat." },
    ],
    exclusionZoneM: exclusionM,
    exclusionZoneNote: `${exclusionM}m from known habitat. EPS licence from Natural England required for any disturbance.`,
    yearRoundProtection: true,
    habitatFeatures: ["Heathland", "Sand dunes", "South-facing banks"],
    category: "reptile", epsSpecies: true,
  };
}

const REPTILES: SpeciesProfile[] = [
  makeCommonReptile("reptile-slow-worm", "Slow Worm (Anguis fragilis)"),
  makeCommonReptile("reptile-grass-snake", "Grass Snake (Natrix helvetica)"),
  makeCommonReptile("reptile-adder", "Adder (Vipera berus)"),
  makeCommonReptile("reptile-common-lizard", "Common Lizard (Zootoca vivipara)"),
  makeEpsReptile("reptile-sand-lizard", "Sand Lizard (Lacerta agilis)", 25),
  makeEpsReptile("reptile-smooth-snake", "Smooth Snake (Coronella austriaca)", 25),
];

// Red Squirrels
const RED_SQUIRRELS: SpeciesProfile = {
  id: "red-squirrels", group: "red-squirrels", name: "Red Squirrel (Sciurus vulgaris)",
  legislation: [
    "Wildlife and Countryside Act 1981 (Schedule 5)",
    "NERC Act 2006 (Section 41)",
  ],
  prohibitions: [
    "Intentionally kill, injure, or take",
    "Intentionally or recklessly damage, destroy, or obstruct any structure or place used for shelter or protection",
    "Intentionally or recklessly disturb while occupying such a structure",
  ],
  restrictedPeriods: [
    { label: "Breeding / kitten rearing", months: [2, 3, 4, 5, 6, 7, 8, 9], severity: "high", description: "Red squirrels have two breeding seasons (Feb-Apr and Jun-Aug). Dreys containing young must not be disturbed." },
    { label: "Winter (drey dependent)", months: [10, 11, 12, 1], severity: "moderate", description: "Squirrels shelter in dreys over winter. Tree felling should avoid occupied dreys." },
  ],
  exclusionZoneM: 20,
  exclusionZoneNote: "20m from known drey. Check all trees within works area for dreys before felling.",
  yearRoundProtection: true,
  habitatFeatures: ["Dreys (tree nests)", "Coniferous / mixed woodland", "Nut-producing trees"],
  category: "mammal", epsSpecies: false,
};

// Dormice
const DORMICE: SpeciesProfile = {
  id: "dormice", group: "dormice", name: "Hazel Dormouse (Muscardinus avellanarius)",
  legislation: [
    "Conservation of Habitats and Species Regulations 2017 (Reg 43)",
    "Wildlife and Countryside Act 1981 (Schedule 5)",
    "NERC Act 2006 (Section 41)",
  ],
  prohibitions: [
    "Deliberately capture, injure, or kill",
    "Deliberately disturb",
    "Damage or destroy a breeding site or resting place",
  ],
  restrictedPeriods: [
    { label: "Hibernation", months: [10, 11, 12, 1, 2, 3, 4], severity: "high", description: "Dormice hibernate on or near the ground (leaf litter, base of hedgerows) October to April. Ground disturbance can destroy hibernating animals." },
    { label: "Active / breeding", months: [5, 6, 7, 8, 9], severity: "high", description: "Dormice are active and breeding in hedgerows and woodland. EPS licence required for works affecting habitat." },
  ],
  exclusionZoneM: 20,
  exclusionZoneNote: "20m from known habitat (hedgerows, woodland edge). EPS licence from Natural England required.",
  yearRoundProtection: true,
  habitatFeatures: ["Hedgerows", "Woodland understorey", "Hazel coppice", "Bramble / honeysuckle"],
  category: "mammal", epsSpecies: true,
};

// White-clawed Crayfish
const CRAYFISH: SpeciesProfile = {
  id: "white-clawed-crayfish", group: "white-clawed-crayfish", name: "White-clawed Crayfish (Austropotamobius pallipes)",
  legislation: [
    "Wildlife and Countryside Act 1981 (Schedule 5)",
    "NERC Act 2006 (Section 41)",
  ],
  prohibitions: [
    "Intentionally take from the wild (without licence)",
    "Offer for sale",
  ],
  restrictedPeriods: [
    { label: "Breeding / egg-bearing", months: [11, 12, 1, 2, 3, 4, 5], severity: "high", description: "Females carry eggs November to May. Watercourse disturbance during this period is highest risk." },
    { label: "Active / juvenile dispersal", months: [6, 7, 8, 9, 10], severity: "moderate", description: "Juveniles released and dispersing. In-channel works should be avoided or mitigated." },
  ],
  exclusionZoneM: 10,
  exclusionZoneNote: "Avoid all in-channel works within 100m upstream and 50m downstream of known populations. 10m from bank for land-based works.",
  yearRoundProtection: true,
  habitatFeatures: ["Clean rivers and streams", "Under stones and tree roots", "Limestone streams"],
  category: "invertebrate", epsSpecies: false,
};

// Atlantic Salmon
const ATLANTIC_SALMON: SpeciesProfile = {
  id: "atlantic-salmon", group: "atlantic-salmon", name: "Atlantic Salmon (Salmo salar)",
  legislation: [
    "Salmon and Freshwater Fisheries Act 1975",
    "Conservation of Habitats and Species Regulations 2017 (Annex II — river SAC designations)",
    "NERC Act 2006 (Section 41)",
  ],
  prohibitions: [
    "Obstruct the passage of salmon",
    "Use any device to prevent free passage",
    "Pollute waters containing salmon",
  ],
  restrictedPeriods: [
    { label: "Spawning migration / spawning", months: [10, 11, 12, 1, 2], severity: "high", description: "Salmon migrate upstream and spawn October-February. In-channel works, dewatering, and silt disturbance must be avoided." },
    { label: "Smolt migration", months: [3, 4, 5], severity: "moderate", description: "Juvenile smolts migrate downstream to sea. Temporary barriers and abstractions should be avoided." },
  ],
  exclusionZoneM: 0,
  exclusionZoneNote: "No fixed land-based exclusion zone. In-channel works timing is critical — consult Environment Agency.",
  yearRoundProtection: false,
  habitatFeatures: ["Clean gravel-bed rivers", "Spawning redds", "Migratory routes"],
  category: "fish", epsSpecies: false,
};

// Freshwater Pearl Mussel
const PEARL_MUSSEL: SpeciesProfile = {
  id: "freshwater-pearl-mussel", group: "freshwater-pearl-mussel", name: "Freshwater Pearl Mussel (Margaritifera margaritifera)",
  legislation: [
    "Wildlife and Countryside Act 1981 (Schedule 5)",
    "Conservation of Habitats and Species Regulations 2017 (Annex II / Annex V)",
    "NERC Act 2006 (Section 41)",
  ],
  prohibitions: [
    "Intentionally kill, injure, or take",
    "Intentionally or recklessly damage or destroy habitat",
    "Disturb",
    "Possess",
  ],
  restrictedPeriods: [
    { label: "Glochidial release / host fish dependency", months: [7, 8, 9, 10], severity: "high", description: "Glochidia (larvae) are released and attach to host fish (salmon/trout) gills. Siltation and chemical pollution are critical threats." },
    { label: "Over-wintering / juvenile settlement", months: [11, 12, 1, 2, 3, 4, 5, 6], severity: "high", description: "Juveniles settle in river substrate. Any disturbance to the riverbed can be devastating to this critically endangered species." },
  ],
  exclusionZoneM: 0,
  exclusionZoneNote: "No fixed land-based exclusion zone. All in-channel and near-channel works in rivers with known populations require Environment Agency / Natural England consultation. Species is critically endangered.",
  yearRoundProtection: true,
  habitatFeatures: ["Clean, fast-flowing rivers", "Stable gravel/sand substrate", "Rivers with salmon/trout populations"],
  category: "invertebrate", epsSpecies: false,
};

// Lamprey species
const LAMPREY: SpeciesProfile = {
  id: "lamprey", group: "lamprey", name: "Lamprey species (Brook, River, Sea Lamprey)",
  legislation: [
    "Conservation of Habitats and Species Regulations 2017 (Annex II — SAC designations)",
    "NERC Act 2006 (Section 41)",
  ],
  prohibitions: [
    "Damage or destroy habitat within designated SAC rivers",
    "Obstruct passage of migratory lamprey",
  ],
  restrictedPeriods: [
    { label: "Spawning", months: [3, 4, 5, 6, 7], severity: "high", description: "Lamprey spawn in gravelly shallows March-July. In-channel works and siltation must be avoided." },
    { label: "Larval phase (ammocoetes)", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], severity: "moderate", description: "Larvae (ammocoetes) live buried in fine sediment for 3-5 years. Dredging and substrate disturbance can be lethal." },
  ],
  exclusionZoneM: 0,
  exclusionZoneNote: "No fixed land-based exclusion zone. All in-channel works on SAC rivers require Habitats Regulations Assessment. Consult Environment Agency.",
  yearRoundProtection: true,
  habitatFeatures: ["Gravelly shallows (spawning)", "Fine sediment deposits (larval)", "Migratory routes"],
  category: "fish", epsSpecies: false,
};

// Invasive Plants
const INVASIVE_PLANTS: SpeciesProfile[] = [
  {
    id: "japanese-knotweed", group: "invasive-plants", name: "Japanese Knotweed (Reynoutria japonica)",
    legislation: ["Wildlife and Countryside Act 1981 (Schedule 9 — invasive non-native)", "Environmental Protection Act 1990"],
    prohibitions: ["Cause to grow in the wild", "Disposal of contaminated soil to unlicensed site (controlled waste)"],
    restrictedPeriods: [
      { label: "Active growing season", months: [4, 5, 6, 7, 8, 9, 10], severity: "moderate", description: "Knotweed actively grows April-October. Excavation can spread rhizome fragments. Treatment with herbicide is most effective August-October." },
    ],
    exclusionZoneM: 7, exclusionZoneNote: "Rhizomes can extend 7m from visible above-ground growth and 3m deep. All soil within 7m may be contaminated.",
    yearRoundProtection: true, habitatFeatures: ["Riverbanks", "Disturbed ground", "Railway embankments", "Demolition sites"],
    category: "plant", epsSpecies: false,
  },
  {
    id: "giant-hogweed", group: "invasive-plants", name: "Giant Hogweed (Heracleum mantegazzianum)",
    legislation: ["Wildlife and Countryside Act 1981 (Schedule 9)", "Health and Safety at Work Act 1974 (sap is a health hazard)"],
    prohibitions: ["Cause to grow in the wild", "Risk to operatives from phototoxic sap (COSHH obligation)"],
    restrictedPeriods: [
      { label: "Active growth / seeding", months: [4, 5, 6, 7, 8, 9], severity: "high", description: "Sap causes severe burns under UV light. Full PPE required for any disturbance. Seeding June-September can spread the plant." },
    ],
    exclusionZoneM: 5, exclusionZoneNote: "5m from visible plants. Sap contact causes photodermatitis — serious burns under sunlight. Full PPE including face shield required.",
    yearRoundProtection: true, habitatFeatures: ["Riverbanks", "Waste ground", "Road verges"],
    category: "plant", epsSpecies: false,
  },
  {
    id: "himalayan-balsam", group: "invasive-plants", name: "Himalayan Balsam (Impatiens glandulifera)",
    legislation: ["Wildlife and Countryside Act 1981 (Schedule 9)"],
    prohibitions: ["Cause to grow in the wild"],
    restrictedPeriods: [
      { label: "Seeding period", months: [7, 8, 9, 10], severity: "moderate", description: "Explosive seed pods July-October. Works near watercourses risk spreading seeds downstream. Pull before flowering (June) for best control." },
    ],
    exclusionZoneM: 3, exclusionZoneNote: "Seeds can be propelled up to 7m. 3m buffer minimum from visible stands.",
    yearRoundProtection: false, habitatFeatures: ["Riverbanks", "Damp ground", "Woodland edge"],
    category: "plant", epsSpecies: false,
  },
];

// Protected Plants (WCA Schedule 8)
const PROTECTED_PLANTS: SpeciesProfile[] = [
  {
    id: "bluebell", group: "protected-plants", name: "Bluebell (Hyacinthoides non-scripta)",
    legislation: ["Wildlife and Countryside Act 1981 (Schedule 8)"],
    prohibitions: ["Intentionally pick, uproot, or destroy (on any land)", "Sell wild bluebells or their bulbs"],
    restrictedPeriods: [
      { label: "Flowering / visible", months: [4, 5, 6], severity: "moderate", description: "Bluebells flower April-June. Bulbs are present year-round but visible growth aids identification and avoidance." },
    ],
    exclusionZoneM: 5, exclusionZoneNote: "5m buffer from bluebell colonies where practicable. Translocation may be possible under ecological supervision.",
    yearRoundProtection: true, habitatFeatures: ["Ancient woodland", "Hedgerows", "Shaded banks"],
    category: "plant", epsSpecies: false,
  },
];

// TPO Trees
const TPO_TREES: SpeciesProfile = {
  id: "tpo-trees", group: "tpo-trees", name: "Trees with Tree Preservation Orders (TPO)",
  legislation: [
    "Town and Country Planning Act 1990 (Section 198-214)",
    "Town and Country Planning (Tree Preservation) (England) Regulations 2012",
  ],
  prohibitions: [
    "Cut down, top, lop, uproot, wilfully damage, or wilfully destroy a TPO tree without LPA consent",
    "Failure to comply can result in unlimited fines",
  ],
  restrictedPeriods: [
    { label: "Bird nesting season (additional constraint)", months: [3, 4, 5, 6, 7, 8], severity: "moderate", description: "TPO consent is required year-round. Nesting season adds bird protection constraints. 6 weeks LPA notification/consent period." },
  ],
  exclusionZoneM: 15,
  exclusionZoneNote: "Root Protection Area (RPA) defined by BS 5837:2012 — typically 12x stem diameter at 1.5m height. No excavation, storage, or vehicle access within RPA without arboricultural supervision.",
  yearRoundProtection: true,
  habitatFeatures: ["Individual specimen trees", "Groups or woodland areas covered by TPO", "Conservation area trees (6 weeks notice to LPA for any works)"],
  category: "plant", epsSpecies: false,
};

// ─── Complete Species List ───────────────────────────────────
export const ALL_SPECIES: SpeciesProfile[] = [
  ...BATS,
  GCN,
  NESTING_BIRDS,
  BARN_OWLS,
  BADGERS,
  WATER_VOLES,
  OTTERS,
  ...REPTILES,
  RED_SQUIRRELS,
  DORMICE,
  CRAYFISH,
  ATLANTIC_SALMON,
  PEARL_MUSSEL,
  LAMPREY,
  ...INVASIVE_PLANTS,
  ...PROTECTED_PLANTS,
  TPO_TREES,
];

// Group labels for the multi-select checklist
export const SPECIES_GROUPS: { group: SpeciesGroup; label: string; species: SpeciesProfile[] }[] = [
  { group: "bats", label: "Bats", species: BATS },
  { group: "great-crested-newts", label: "Great Crested Newts", species: [GCN] },
  { group: "nesting-birds", label: "Nesting Birds", species: [NESTING_BIRDS] },
  { group: "barn-owls", label: "Barn Owls", species: [BARN_OWLS] },
  { group: "badgers", label: "Badgers", species: [BADGERS] },
  { group: "water-voles", label: "Water Voles", species: [WATER_VOLES] },
  { group: "otters", label: "Otters", species: [OTTERS] },
  { group: "reptiles", label: "Reptiles", species: REPTILES },
  { group: "red-squirrels", label: "Red Squirrels", species: [RED_SQUIRRELS] },
  { group: "dormice", label: "Dormice", species: [DORMICE] },
  { group: "white-clawed-crayfish", label: "White-clawed Crayfish", species: [CRAYFISH] },
  { group: "atlantic-salmon", label: "Atlantic Salmon", species: [ATLANTIC_SALMON] },
  { group: "freshwater-pearl-mussel", label: "Freshwater Pearl Mussel", species: [PEARL_MUSSEL] },
  { group: "lamprey", label: "Lamprey", species: [LAMPREY] },
  { group: "invasive-plants", label: "Invasive Plants", species: INVASIVE_PLANTS },
  { group: "protected-plants", label: "Protected Plants", species: PROTECTED_PLANTS },
  { group: "tpo-trees", label: "TPO Trees", species: [TPO_TREES] },
];

// ─── Assessment Logic ────────────────────────────────────────

function monthsOverlap(periodMonths: Month[], worksMonths: Month[]): boolean {
  return periodMonths.some(m => worksMonths.includes(m));
}

function getWorksMonths(startMonth: Month, endMonth: Month): Month[] {
  const months: Month[] = [];
  let m = startMonth;
  for (let i = 0; i < 12; i++) {
    months.push(m);
    if (m === endMonth) break;
    m = ((m % 12) + 1) as Month;
  }
  return months;
}

function getActionsForConflict(
  species: SpeciesProfile,
  conflictingPeriods: RestrictedPeriod[],
  worksTypes: WorksType[],
): { actions: string[]; licenceRequired: boolean; surveyRequired: boolean; eclerkRequired: boolean } {
  const actions: string[] = [];
  let licenceRequired = false;
  let surveyRequired = false;
  let eclerkRequired = false;

  const hasGroundDisturbance = worksTypes.some(w => w.groundDisturbance);
  const hasVegetationRemoval = worksTypes.some(w => w.vegetationRemoval);
  const hasWatercourseImpact = worksTypes.some(w => w.watercourseImpact);
  const hasNoise = worksTypes.some(w => w.noiseDisturbance);
  const hasLighting = worksTypes.some(w => w.lightingImpact);
  const highSeverity = conflictingPeriods.some(p => p.severity === "high");

  // EPS species always need licence for disturbance
  if (species.epsSpecies && highSeverity) {
    licenceRequired = true;
    actions.push(`A European Protected Species (EPS) Licence from Natural England is required before any works that could disturb ${species.name} or damage/destroy their habitat.`);
  }

  // Group-specific actions
  switch (species.group) {
    case "bats":
      surveyRequired = true;
      actions.push("Commission bat activity surveys (emergence/re-entry surveys) by a licensed bat ecologist. Surveys are valid April-September only (minimum 2 visits, at least one dusk and one dawn).");
      if (hasLighting) {
        actions.push("Prepare a lighting design to avoid illumination of roost entrances, flight lines, and foraging habitat. Use low-level, directional, warm-white (<2700K) lighting.");
      }
      if (hasGroundDisturbance || hasVegetationRemoval) {
        actions.push("Maintain vegetation buffers around known roost features. Avoid tree felling during bat activity season without prior survey.");
      }
      eclerkRequired = true;
      actions.push("Appoint an Ecological Clerk of Works (ECoW) to supervise works near confirmed roost locations.");
      break;

    case "great-crested-newts":
      surveyRequired = true;
      if (hasGroundDisturbance || hasWatercourseImpact) {
        actions.push("Commission eDNA survey of waterbodies within 250m (valid March-June) or traditional presence/absence surveys (4 visits, mid-March to mid-June).");
        actions.push("If GCN confirmed: apply for EPS licence or register under Natural England District Level Licensing (DLL) scheme.");
        actions.push("Install temporary amphibian fencing around 50m core zone before ground-breaking works commence.");
        eclerkRequired = true;
      } else {
        actions.push("Commission eDNA survey of waterbodies within 250m (valid March-June) as a precaution if ponds are present nearby.");
      }
      break;

    case "nesting-birds":
      surveyRequired = true;
      if (hasVegetationRemoval) {
        actions.push("Pre-commencement nesting bird check by a qualified ecologist within 48 hours before vegetation clearance. If active nests found, maintain exclusion zone until chicks fledge.");
        actions.push("Ideally clear vegetation outside the nesting season (October-February). If clearance during March-August is unavoidable, ecologist must supervise.");
      }
      if (hasGroundDisturbance) {
        actions.push("Check for ground-nesting species (skylark, lapwing) before stripping topsoil during March-August.");
      }
      break;

    case "barn-owls":
      surveyRequired = true;
      actions.push("Commission barn owl survey by a licensed surveyor before demolition or building works. Survey all structures and trees within 100m.");
      if (hasNoise) {
        actions.push("Maintain 50m exclusion zone around confirmed nest site during March-August. Schedule noisy works outside nesting season where possible.");
      }
      actions.push("If nest displaced, install a barn owl nest box (Barn Owl Trust approved design) as mitigation.");
      break;

    case "badgers":
      surveyRequired = true;
      actions.push("Commission badger survey within works footprint plus 30m buffer. Survey for sett entrances, latrines, paths, hair, and footprints.");
      if (hasGroundDisturbance && highSeverity) {
        licenceRequired = true;
        actions.push("A licence from Natural England is required to close or disturb a badger sett. Sett closure licences are generally only granted July-November.");
      }
      if (hasNoise) {
        actions.push("No heavy machinery, vibration, or piling within 30m of an active sett without a licence. 20m for light hand works.");
      }
      break;

    case "water-voles":
      surveyRequired = true;
      actions.push("Commission water vole survey (2 visits: April-June and July-September) of all watercourses within works area.");
      if (hasWatercourseImpact || hasGroundDisturbance) {
        actions.push("If water voles confirmed: apply for a conservation licence for displacement/translocation. Minimum 5m buffer from bank top.");
        licenceRequired = true;
        eclerkRequired = true;
      }
      break;

    case "otters":
      surveyRequired = true;
      actions.push("Commission otter survey of all watercourses within 250m. Survey for spraints, footprints, slides, holts, and couches.");
      if (hasWatercourseImpact) {
        actions.push("Maintain 30m exclusion zone around confirmed holts. EPS licence required if holt disturbance is unavoidable.");
        eclerkRequired = true;
      }
      if (hasLighting) {
        actions.push("Avoid light spill on watercourses — otters are primarily nocturnal.");
      }
      break;

    case "reptiles":
      if (species.epsSpecies) {
        surveyRequired = true;
        actions.push("Commission presence/absence reptile survey (7 visits using refugia/felt mats, April-September). EPS licence required for sand lizard / smooth snake.");
        eclerkRequired = true;
      } else {
        if (hasVegetationRemoval || hasGroundDisturbance) {
          surveyRequired = true;
          actions.push("Commission reptile survey (7 visits using refugia/felt mats, April-September) to establish population size.");
          actions.push("Implement phased habitat manipulation: directional strimming to 150mm, then to 50mm over 2-3 weeks to displace reptiles. Works supervised by ecologist.");
          actions.push("Provide receptor habitat with log/rubble refugia before clearance begins.");
        }
      }
      break;

    case "red-squirrels":
      surveyRequired = true;
      actions.push("Commission red squirrel drey survey before tree felling. Check all trees for dreys within works area plus 20m buffer.");
      if (hasVegetationRemoval) {
        actions.push("Fell trees outside breeding season where possible (avoid Feb-Sep). If unavoidable, licensed ecologist to check dreys are unoccupied.");
      }
      break;

    case "dormice":
      surveyRequired = true;
      actions.push("Commission dormouse survey using nest tubes/boxes (minimum 6 months monitoring, May-November). eDNA survey of hazel may be an alternative.");
      if (hasVegetationRemoval) {
        actions.push("EPS licence required for any hedgerow removal or woodland clearance within known dormouse habitat. Two-stage clearance: cut to 150mm in winter, grub out in spring under licence.");
        eclerkRequired = true;
      }
      break;

    case "white-clawed-crayfish":
      surveyRequired = true;
      if (hasWatercourseImpact) {
        actions.push("Commission white-clawed crayfish survey (August-October optimal). Manual search and trapping by licensed surveyor.");
        actions.push("Implement biosecurity protocol: Check-Clean-Dry for all equipment entering/leaving watercourse to prevent spread of crayfish plague.");
        actions.push("Translocation may be required — licence from Natural England needed.");
        licenceRequired = true;
      }
      break;

    case "atlantic-salmon":
      if (hasWatercourseImpact) {
        surveyRequired = true;
        actions.push("Consult Environment Agency regarding in-channel works timing. Avoid spawning season (Oct-Feb) and smolt migration (Mar-May).");
        actions.push("Install silt curtains/settlement ponds to prevent sediment release. No dewatering without fish rescue.");
        actions.push("Maintain fish passage at all times — temporary dams must include fish pass provision.");
      }
      break;

    case "freshwater-pearl-mussel":
      if (hasWatercourseImpact) {
        surveyRequired = true;
        licenceRequired = true;
        eclerkRequired = true;
        actions.push("Critically endangered species — consult Natural England and Environment Agency before any works. Full Habitats Regulations Assessment may be required.");
        actions.push("Zero siltation tolerance — install comprehensive sediment management. Any mortality could constitute a criminal offence.");
      }
      break;

    case "lamprey":
      if (hasWatercourseImpact) {
        surveyRequired = true;
        actions.push("Consult Environment Agency. Avoid in-channel works during spawning (Mar-Jul). Minimise substrate disturbance to protect ammocoetes.");
        actions.push("Habitats Regulations Assessment required if works affect an SAC river designated for lamprey.");
      }
      break;

    case "invasive-plants":
      if (species.id === "japanese-knotweed") {
        actions.push("Prepare Japanese Knotweed Management Plan. Options: herbicide treatment (glyphosate, 3-5 year programme), excavation and burial (on-site cell or removal to licensed landfill), or root barrier installation.");
        actions.push("All soil within 7m of visible growth is potentially contaminated — controlled waste under Environmental Protection Act 1990. Requires Waste Transfer Note for disposal.");
        if (hasGroundDisturbance) {
          actions.push("Do not excavate without a management plan — fragmentation spreads the plant. Even a 1cm rhizome fragment can regenerate.");
        }
      } else if (species.id === "giant-hogweed") {
        actions.push("COSHH assessment required — sap causes severe photodermatitis (burns under UV light). Full PPE including face shield, chemical-resistant gloves, and Tyvek suit.");
        actions.push("Treatment: stem injection with glyphosate (spring), or cut and burn (risk of sap exposure). Do not strim — creates aerosol sap spray.");
      } else if (species.id === "himalayan-balsam") {
        actions.push("Hand-pull before flowering (June) for effective control. Do not strim near watercourses during seeding (Jul-Oct) — seeds spread downstream.");
      }
      break;

    case "protected-plants":
      surveyRequired = true;
      actions.push("Commission botanical survey to map extent of protected plant populations. Translocation under ecological supervision may be possible.");
      if (hasGroundDisturbance) {
        actions.push("Avoid disturbance of Schedule 8 plant colonies. If unavoidable, consult Natural England for advice on mitigation and potential licence requirements.");
      }
      break;

    case "tpo-trees":
      actions.push("Submit application to Local Planning Authority (LPA) for consent to carry out works to TPO trees. Allow minimum 8 weeks for determination.");
      actions.push("Prepare Arboricultural Impact Assessment (AIA) per BS 5837:2012. Define Root Protection Areas (RPA) for all retained trees.");
      actions.push("Install protective fencing at RPA boundary before works commence. No excavation, material storage, or vehicle access within RPA without arboricultural supervision.");
      if (hasGroundDisturbance) {
        actions.push("Where excavation within RPA is unavoidable, use hand-digging or air-spade under arboricultural supervision. No machinery within RPA.");
      }
      break;
  }

  return { actions, licenceRequired, surveyRequired, eclerkRequired };
}

export function assessConflicts(
  selectedSpeciesIds: string[],
  startMonth: Month,
  endMonth: Month,
  worksTypeIds: string[],
): AssessmentResult {
  const worksMonths = getWorksMonths(startMonth, endMonth);
  const selectedWorks = WORKS_TYPES.filter(w => worksTypeIds.includes(w.id));
  const selectedSpecies = ALL_SPECIES.filter(s => selectedSpeciesIds.includes(s.id));

  const conflicts: ConflictResult[] = selectedSpecies.map(species => {
    const conflictingPeriods = species.restrictedPeriods.filter(
      p => monthsOverlap(p.months, worksMonths)
    );

    const { actions, licenceRequired, surveyRequired, eclerkRequired } =
      getActionsForConflict(species, conflictingPeriods, selectedWorks);

    let trafficLight: TrafficLight = "green";
    if (conflictingPeriods.length > 0) {
      const hasHighSeverity = conflictingPeriods.some(p => p.severity === "high");
      if (licenceRequired || (species.epsSpecies && hasHighSeverity)) {
        trafficLight = "red";
      } else if (surveyRequired || eclerkRequired || hasHighSeverity) {
        trafficLight = "amber";
      } else {
        trafficLight = "yellow";
      }
    } else if (species.yearRoundProtection) {
      // No conflict with restricted periods but species is protected year-round
      trafficLight = "yellow";
      actions.push(`${species.name} is protected year-round. Precautionary measures should be in place even outside restricted periods.`);
    }

    return { species, trafficLight, conflictingPeriods, actions, licenceRequired, surveyRequired, eclerkRequired };
  });

  // Overall traffic light = worst case
  let overallTrafficLight: TrafficLight = "green";
  for (const c of conflicts) {
    if (c.trafficLight === "red") { overallTrafficLight = "red"; break; }
    if (c.trafficLight === "amber") overallTrafficLight = "amber";
    if (c.trafficLight === "yellow" && overallTrafficLight === "green") overallTrafficLight = "yellow";
  }

  // Find optimal window — months where NO high-severity conflicts exist
  const optimalMonths: Month[] = [];
  for (let m = 1; m <= 12; m++) {
    const mo = m as Month;
    const hasHighConflict = selectedSpecies.some(sp =>
      sp.restrictedPeriods.some(p => p.severity === "high" && p.months.includes(mo))
    );
    if (!hasHighConflict) optimalMonths.push(mo);
  }

  const conflictCount = conflicts.filter(c => c.trafficLight !== "green").length;
  const licenceCount = conflicts.filter(c => c.licenceRequired).length;
  const surveyCount = conflicts.filter(c => c.surveyRequired).length;

  let summary = `Assessment of ${selectedSpecies.length} species against ${worksMonths.length}-month works programme (${MONTH_NAMES[startMonth]}-${MONTH_NAMES[endMonth]}). `;
  if (conflictCount === 0) {
    summary += "No ecological conflicts identified.";
  } else {
    summary += `${conflictCount} species with constraints. ${licenceCount > 0 ? `${licenceCount} require licensing. ` : ""}${surveyCount > 0 ? `${surveyCount} require pre-commencement surveys.` : ""}`;
  }

  return {
    conflicts,
    overallTrafficLight,
    totalSpecies: selectedSpecies.length,
    conflictCount,
    licenceCount,
    surveyCount,
    optimalWindow: optimalMonths.length > 0 && optimalMonths.length < 12 ? optimalMonths : null,
    summary,
  };
}

// ─── Helpers ─────────────────────────────────────────────────
export function getCalendarData(species: SpeciesProfile[]): { id: string; name: string; periods: { months: Month[]; severity: "high" | "moderate"; label: string }[] }[] {
  return species.map(sp => ({
    id: sp.id,
    name: sp.name.length > 40 ? (sp.commonName || sp.name.split("(")[0].trim()) : sp.name,
    periods: sp.restrictedPeriods.map(p => ({ months: p.months, severity: p.severity, label: p.label })),
  }));
}
