// src/data/cable-trench-depth-checker.ts
// Cable Trench Depth & Separation Checker — NJUG Vol 1, NRSWA 1991, ENA TS 09-1/09-2, IGEM/TD/3, Water UK, BT/Openreach specs

// ─── Surface Types ───────────────────────────────────────────
export type SurfaceType =
  | "footway"
  | "verge"
  | "unmade"
  | "private"
  | "carriageway-minor"
  | "carriageway-b"
  | "carriageway-a"
  | "carriageway-trunk"
  | "carriageway-motorway";

export interface SurfaceInfo {
  id: SurfaceType;
  label: string;
  shortLabel: string;
  group: "footway" | "carriageway" | "other";
  description: string;
}

export const SURFACE_TYPES: SurfaceInfo[] = [
  { id: "footway", label: "Footway / Footpath", shortLabel: "Footway", group: "footway", description: "Pedestrian footway or footpath" },
  { id: "verge", label: "Verge / Grass Strip", shortLabel: "Verge", group: "other", description: "Highway verge adjacent to carriageway" },
  { id: "unmade", label: "Unmade Ground", shortLabel: "Unmade", group: "other", description: "Unsealed or unpaved surface" },
  { id: "private", label: "Private Land / Off-road", shortLabel: "Private", group: "other", description: "Private land, agricultural, or off-highway" },
  { id: "carriageway-minor", label: "Carriageway — Minor / Unclassified Road", shortLabel: "Minor Rd", group: "carriageway", description: "Unclassified or minor local roads" },
  { id: "carriageway-b", label: "Carriageway — B Road", shortLabel: "B Road", group: "carriageway", description: "B-classified road" },
  { id: "carriageway-a", label: "Carriageway — A Road", shortLabel: "A Road", group: "carriageway", description: "A-classified road" },
  { id: "carriageway-trunk", label: "Carriageway — Trunk Road", shortLabel: "Trunk Rd", group: "carriageway", description: "Trunk road (Highways England / National Highways)" },
  { id: "carriageway-motorway", label: "Carriageway — Motorway", shortLabel: "Motorway", group: "carriageway", description: "Motorway hard shoulder or verge" },
];

// ─── Service Types ───────────────────────────────────────────
export type ServiceId =
  | "lv-electricity"
  | "hv-electricity"
  | "gas-lp"
  | "gas-mp-hp"
  | "water-potable"
  | "drainage"
  | "bt-copper"
  | "fibre-optic"
  | "cable-tv"
  | "street-lighting";

export interface ServiceType {
  id: ServiceId;
  label: string;
  shortLabel: string;
  siteColour: string;       // UK site marking colour
  siteColourHex: string;    // hex for SVG/PDF
  defaultDiameter: number;  // mm
  minDiameterMm: number;
  maxDiameterMm: number;
  standard: string;         // governing standard
  markerTapeColour: string;
  tileProtection: boolean;  // typically requires tile
  backfillSpec: string;
  specialRequirements: string[];
}

export const SERVICE_TYPES: ServiceType[] = [
  {
    id: "lv-electricity", label: "LV Electricity (up to 1kV)", shortLabel: "LV Elec",
    siteColour: "Black", siteColourHex: "#1a1a1a",
    defaultDiameter: 50, minDiameterMm: 20, maxDiameterMm: 150,
    standard: "ENA TS 09-1 / BS 7671",
    markerTapeColour: "Black/Yellow",
    tileProtection: true,
    backfillSpec: "Selected backfill or fine gravel surround, no sharp objects",
    specialRequirements: ["Cable tile or marker tape required", "Minimum 75mm fine fill above and below cable"],
  },
  {
    id: "hv-electricity", label: "HV Electricity (above 1kV)", shortLabel: "HV Elec",
    siteColour: "Black", siteColourHex: "#333333",
    defaultDiameter: 80, minDiameterMm: 40, maxDiameterMm: 200,
    standard: "ENA TS 09-2 / BS 7671",
    markerTapeColour: "Black/Yellow",
    tileProtection: true,
    backfillSpec: "Cement-bound sand (CBS) or fine gravel surround",
    specialRequirements: ["Cable tile mandatory", "Marker tape above tile", "HV warning labels at surface", "Minimum 100mm fine fill surround"],
  },
  {
    id: "gas-lp", label: "Gas — Low Pressure (LP)", shortLabel: "Gas LP",
    siteColour: "Yellow", siteColourHex: "#EAB308",
    defaultDiameter: 63, minDiameterMm: 25, maxDiameterMm: 180,
    standard: "IGEM/TD/3 Edition 5",
    markerTapeColour: "Yellow",
    tileProtection: false,
    backfillSpec: "Granular surround 100mm all round (not selected backfill)",
    specialRequirements: ["Granular fill surround mandatory", "Marker tape at 300mm below surface", "PE pipe: no sharp stones in contact zone"],
  },
  {
    id: "gas-mp-hp", label: "Gas — Medium/High Pressure (MP/HP)", shortLabel: "Gas MP/HP",
    siteColour: "Yellow", siteColourHex: "#CA8A04",
    defaultDiameter: 180, minDiameterMm: 63, maxDiameterMm: 600,
    standard: "IGEM/TD/3 Edition 5 / IGEM/TD/1",
    markerTapeColour: "Yellow",
    tileProtection: true,
    backfillSpec: "Granular surround 150mm all round, concrete slab protection for HP",
    specialRequirements: ["Concrete slab protection for HP mains", "Granular surround mandatory", "MP/HP requires design by gas transporter", "Cathodic protection testing may be required"],
  },
  {
    id: "water-potable", label: "Potable Water", shortLabel: "Water",
    siteColour: "Blue", siteColourHex: "#2563EB",
    defaultDiameter: 100, minDiameterMm: 25, maxDiameterMm: 600,
    standard: "Water UK / WIS 4-08-01",
    markerTapeColour: "Blue",
    tileProtection: false,
    backfillSpec: "Selected granular fill or pea gravel bedding, 100mm surround",
    specialRequirements: ["Minimum 750mm cover for frost protection", "Larger mains (300mm+) may require 1200mm+ cover", "No contaminated backfill near potable water"],
  },
  {
    id: "drainage", label: "Foul / Surface Water Drainage", shortLabel: "Drainage",
    siteColour: "Brown/Orange", siteColourHex: "#B45309",
    defaultDiameter: 150, minDiameterMm: 100, maxDiameterMm: 600,
    standard: "BS EN 1610 / Sewers for Adoption 8th Ed",
    markerTapeColour: "N/A (not typically marker taped)",
    tileProtection: false,
    backfillSpec: "Granular bed and surround per BS EN 1610 Class S/B/N depending on ground",
    specialRequirements: ["Bedding class depends on ground conditions and traffic loading", "Haunching or full surround in Class S/B", "Cover depends on pipe class and traffic loading"],
  },
  {
    id: "bt-copper", label: "BT / Openreach Copper", shortLabel: "BT Copper",
    siteColour: "Green", siteColourHex: "#16A34A",
    defaultDiameter: 54, minDiameterMm: 30, maxDiameterMm: 110,
    standard: "BT / Openreach Specifications (SIN 350/351)",
    markerTapeColour: "Green",
    tileProtection: false,
    backfillSpec: "Selected fill, no stones >25mm in contact zone",
    specialRequirements: ["Typically in duct (54mm or 96mm)", "Draw rope must be left in duct", "Marker tape required"],
  },
  {
    id: "fibre-optic", label: "Fibre Optic", shortLabel: "Fibre",
    siteColour: "Green", siteColourHex: "#15803D",
    defaultDiameter: 40, minDiameterMm: 12, maxDiameterMm: 110,
    standard: "PIA Specification / Openreach / DCMS",
    markerTapeColour: "Green",
    tileProtection: false,
    backfillSpec: "Selected fill, duct protection where shallow",
    specialRequirements: ["Typically in micro-duct or standard duct", "May use existing BT duct via PIA", "Marker tape required"],
  },
  {
    id: "cable-tv", label: "Cable TV / Virgin Media", shortLabel: "Cable TV",
    siteColour: "Green", siteColourHex: "#059669",
    defaultDiameter: 50, minDiameterMm: 25, maxDiameterMm: 96,
    standard: "Virgin Media Network Specifications",
    markerTapeColour: "Green",
    tileProtection: false,
    backfillSpec: "Selected fill, duct system standard",
    specialRequirements: ["Typically in duct", "Marker tape required", "Treat same as BT telecoms for separation"],
  },
  {
    id: "street-lighting", label: "Street Lighting Cable", shortLabel: "St Lighting",
    siteColour: "Black", siteColourHex: "#525252",
    defaultDiameter: 32, minDiameterMm: 16, maxDiameterMm: 63,
    standard: "BS 5489 / ENA TS 09-1",
    markerTapeColour: "Black/Yellow",
    tileProtection: false,
    backfillSpec: "Selected fill, fine material surround",
    specialRequirements: ["Usually shallow run between columns", "Cable tile recommended in carriageway", "May share trench with LV electricity"],
  },
];

// ─── Cover Depth Database (mm) ──────────────────────────────
// Indexed by [serviceId][surfaceGroup]
// surfaceGroup: footway | carriageway-minor | carriageway-b | carriageway-a | carriageway-trunk | carriageway-motorway | verge | unmade | private

interface CoverDepthEntry {
  depth: number; // mm from finished surface to top of service
  note?: string;
}

type CoverDepthMap = Record<ServiceId, Record<string, CoverDepthEntry>>;

export const COVER_DEPTHS: CoverDepthMap = {
  "lv-electricity": {
    footway:               { depth: 450 },
    verge:                 { depth: 450 },
    unmade:                { depth: 450, note: "Same as footway minimum" },
    private:               { depth: 450, note: "Match footway unless traffic loading applies" },
    "carriageway-minor":   { depth: 600 },
    "carriageway-b":       { depth: 600 },
    "carriageway-a":       { depth: 600 },
    "carriageway-trunk":   { depth: 750, note: "Trunk roads may require deeper cover per local authority" },
    "carriageway-motorway":{ depth: 750, note: "Motorway verge/hard shoulder" },
  },
  "hv-electricity": {
    footway:               { depth: 600 },
    verge:                 { depth: 600 },
    unmade:                { depth: 600 },
    private:               { depth: 600 },
    "carriageway-minor":   { depth: 750 },
    "carriageway-b":       { depth: 750 },
    "carriageway-a":       { depth: 750 },
    "carriageway-trunk":   { depth: 900, note: "National Highways standard" },
    "carriageway-motorway":{ depth: 900, note: "Subject to specific DNO requirements" },
  },
  "gas-lp": {
    footway:               { depth: 375 },
    verge:                 { depth: 375 },
    unmade:                { depth: 375 },
    private:               { depth: 375 },
    "carriageway-minor":   { depth: 600 },
    "carriageway-b":       { depth: 600 },
    "carriageway-a":       { depth: 600 },
    "carriageway-trunk":   { depth: 750, note: "IGEM/TD/3 recommendation for trunk" },
    "carriageway-motorway":{ depth: 750 },
  },
  "gas-mp-hp": {
    footway:               { depth: 600 },
    verge:                 { depth: 600 },
    unmade:                { depth: 600 },
    private:               { depth: 600 },
    "carriageway-minor":   { depth: 750 },
    "carriageway-b":       { depth: 750 },
    "carriageway-a":       { depth: 900, note: "HP mains on A roads" },
    "carriageway-trunk":   { depth: 1100, note: "HP mains under trunk roads" },
    "carriageway-motorway":{ depth: 1200, note: "Subject to gas transporter design" },
  },
  "water-potable": {
    footway:               { depth: 750, note: "Frost protection depth" },
    verge:                 { depth: 750 },
    unmade:                { depth: 750 },
    private:               { depth: 750 },
    "carriageway-minor":   { depth: 900 },
    "carriageway-b":       { depth: 900 },
    "carriageway-a":       { depth: 900 },
    "carriageway-trunk":   { depth: 1050, note: "Larger mains may require up to 1350mm" },
    "carriageway-motorway":{ depth: 1200, note: "Water mains under motorway" },
  },
  "drainage": {
    footway:               { depth: 600, note: "Minimum, depends on pipe class and loading" },
    verge:                 { depth: 600 },
    unmade:                { depth: 600 },
    private:               { depth: 500, note: "Reduced if no traffic" },
    "carriageway-minor":   { depth: 900, note: "BS EN 1610 Table NA.2" },
    "carriageway-b":       { depth: 900 },
    "carriageway-a":       { depth: 1050, note: "Heavy traffic loading" },
    "carriageway-trunk":   { depth: 1200 },
    "carriageway-motorway":{ depth: 1200 },
  },
  "bt-copper": {
    footway:               { depth: 350 },
    verge:                 { depth: 350 },
    unmade:                { depth: 350 },
    private:               { depth: 350 },
    "carriageway-minor":   { depth: 600 },
    "carriageway-b":       { depth: 600 },
    "carriageway-a":       { depth: 600 },
    "carriageway-trunk":   { depth: 600, note: "In duct with concrete surround" },
    "carriageway-motorway":{ depth: 750 },
  },
  "fibre-optic": {
    footway:               { depth: 350 },
    verge:                 { depth: 350 },
    unmade:                { depth: 300, note: "Micro-duct may be shallower" },
    private:               { depth: 300 },
    "carriageway-minor":   { depth: 600 },
    "carriageway-b":       { depth: 600 },
    "carriageway-a":       { depth: 600 },
    "carriageway-trunk":   { depth: 600 },
    "carriageway-motorway":{ depth: 750 },
  },
  "cable-tv": {
    footway:               { depth: 350 },
    verge:                 { depth: 350 },
    unmade:                { depth: 350 },
    private:               { depth: 350 },
    "carriageway-minor":   { depth: 600 },
    "carriageway-b":       { depth: 600 },
    "carriageway-a":       { depth: 600 },
    "carriageway-trunk":   { depth: 600 },
    "carriageway-motorway":{ depth: 750 },
  },
  "street-lighting": {
    footway:               { depth: 500 },
    verge:                 { depth: 500 },
    unmade:                { depth: 500 },
    private:               { depth: 450 },
    "carriageway-minor":   { depth: 600 },
    "carriageway-b":       { depth: 600 },
    "carriageway-a":       { depth: 600 },
    "carriageway-trunk":   { depth: 600 },
    "carriageway-motorway":{ depth: 750 },
  },
};

// ─── Separation Distance Database (mm) ──────────────────────
// Minimum horizontal separation between parallel services
// Keyed as "serviceA--serviceB" (sorted alphabetically) with distance in mm

export interface SeparationRule {
  serviceA: string;   // service group
  serviceB: string;   // service group
  minSeparation: number; // mm parallel
  withProtection?: number; // mm if tile/mechanical protection used
  crossingMinVertical: number; // mm vertical at crossing
  note: string;
  standard: string;
}

// Service groups for separation: electricity, hv-electricity, gas, water, telecoms, drainage, street-lighting
type ServiceGroup = "lv-electricity" | "hv-electricity" | "gas" | "water" | "telecoms" | "drainage" | "street-lighting";

function getServiceGroup(id: ServiceId): ServiceGroup {
  switch (id) {
    case "lv-electricity": return "lv-electricity";
    case "hv-electricity": return "hv-electricity";
    case "gas-lp":
    case "gas-mp-hp": return "gas";
    case "water-potable": return "water";
    case "bt-copper":
    case "fibre-optic":
    case "cable-tv": return "telecoms";
    case "drainage": return "drainage";
    case "street-lighting": return "street-lighting";
  }
}

// Separation rules — NJUG Vol 1 Table 1 and utility-specific standards
const SEPARATION_RULES: SeparationRule[] = [
  // Electricity to Gas
  { serviceA: "lv-electricity", serviceB: "gas", minSeparation: 250, withProtection: 150, crossingMinVertical: 100, note: "NJUG Vol 1. Mechanical protection (tile) if less than 250mm.", standard: "NJUG Vol 1 / ENA TS 09-1" },
  { serviceA: "hv-electricity", serviceB: "gas", minSeparation: 600, withProtection: 300, crossingMinVertical: 150, note: "HV to gas requires greater separation. Tile protection mandatory.", standard: "ENA TS 09-2 / IGEM/TD/3" },
  // Electricity to Water
  { serviceA: "lv-electricity", serviceB: "water", minSeparation: 350, withProtection: 200, crossingMinVertical: 100, note: "NJUG Vol 1.", standard: "NJUG Vol 1" },
  { serviceA: "hv-electricity", serviceB: "water", minSeparation: 600, withProtection: 350, crossingMinVertical: 150, note: "HV to water: increased separation.", standard: "ENA TS 09-2" },
  // Electricity to Telecoms
  { serviceA: "lv-electricity", serviceB: "telecoms", minSeparation: 300, withProtection: 100, crossingMinVertical: 100, note: "With tile protection can reduce to 100mm.", standard: "NJUG Vol 1 / BT SIN 351" },
  { serviceA: "hv-electricity", serviceB: "telecoms", minSeparation: 450, withProtection: 300, crossingMinVertical: 150, note: "HV to telecoms: maintain 300mm minimum even with protection.", standard: "ENA TS 09-2" },
  // Electricity to Drainage
  { serviceA: "lv-electricity", serviceB: "drainage", minSeparation: 250, crossingMinVertical: 100, note: "Avoid placing cables directly above or below drainage.", standard: "NJUG Vol 1" },
  { serviceA: "hv-electricity", serviceB: "drainage", minSeparation: 500, crossingMinVertical: 150, note: "HV cables must not be in drainage zone of influence.", standard: "ENA TS 09-2" },
  // Gas to Water
  { serviceA: "gas", serviceB: "water", minSeparation: 250, withProtection: 150, crossingMinVertical: 100, note: "NJUG Vol 1.", standard: "NJUG Vol 1 / IGEM/TD/3" },
  // Gas to Telecoms
  { serviceA: "gas", serviceB: "telecoms", minSeparation: 250, withProtection: 150, crossingMinVertical: 100, note: "NJUG Vol 1.", standard: "NJUG Vol 1" },
  // Gas to Drainage
  { serviceA: "gas", serviceB: "drainage", minSeparation: 250, crossingMinVertical: 100, note: "Gas pipes should not enter drainage bedding zone.", standard: "IGEM/TD/3" },
  // Water to Telecoms
  { serviceA: "water", serviceB: "telecoms", minSeparation: 250, withProtection: 150, crossingMinVertical: 100, note: "NJUG Vol 1.", standard: "NJUG Vol 1" },
  // Water to Drainage
  { serviceA: "water", serviceB: "drainage", minSeparation: 300, crossingMinVertical: 150, note: "Potable water must be above foul drainage at crossings.", standard: "Water UK / WIS" },
  // Telecoms to Drainage
  { serviceA: "telecoms", serviceB: "drainage", minSeparation: 200, crossingMinVertical: 100, note: "Telecoms ducts to be clear of drainage zone.", standard: "NJUG Vol 1" },
  // Street Lighting — treated as LV electricity for separation
  { serviceA: "street-lighting", serviceB: "gas", minSeparation: 250, withProtection: 150, crossingMinVertical: 100, note: "Treated as LV electricity for separation.", standard: "NJUG Vol 1" },
  { serviceA: "street-lighting", serviceB: "water", minSeparation: 350, withProtection: 200, crossingMinVertical: 100, note: "Treated as LV electricity.", standard: "NJUG Vol 1" },
  { serviceA: "street-lighting", serviceB: "telecoms", minSeparation: 300, withProtection: 100, crossingMinVertical: 100, note: "Treated as LV electricity.", standard: "NJUG Vol 1" },
  { serviceA: "street-lighting", serviceB: "drainage", minSeparation: 250, crossingMinVertical: 100, note: "Treated as LV electricity.", standard: "NJUG Vol 1" },
  // Same-type separations
  { serviceA: "lv-electricity", serviceB: "hv-electricity", minSeparation: 300, crossingMinVertical: 150, note: "LV/HV in same trench requires tile separation.", standard: "ENA TS 09-1/09-2" },
  { serviceA: "lv-electricity", serviceB: "lv-electricity", minSeparation: 75, crossingMinVertical: 50, note: "Same circuit group cables. Different circuits: 150mm.", standard: "ENA TS 09-1" },
  { serviceA: "hv-electricity", serviceB: "hv-electricity", minSeparation: 150, crossingMinVertical: 100, note: "HV to HV: trefoil or flat formation per DNO spec.", standard: "ENA TS 09-2" },
  { serviceA: "gas", serviceB: "gas", minSeparation: 150, crossingMinVertical: 75, note: "Parallel gas pipes in same trench.", standard: "IGEM/TD/3" },
  { serviceA: "telecoms", serviceB: "telecoms", minSeparation: 50, crossingMinVertical: 50, note: "Telecoms ducts can be bundled.", standard: "BT SIN 351" },
  { serviceA: "lv-electricity", serviceB: "street-lighting", minSeparation: 75, crossingMinVertical: 50, note: "Can share trench with common earth.", standard: "ENA TS 09-1" },
  { serviceA: "water", serviceB: "water", minSeparation: 150, crossingMinVertical: 100, note: "Parallel water mains.", standard: "Water UK" },
  { serviceA: "drainage", serviceB: "drainage", minSeparation: 150, crossingMinVertical: 100, note: "Parallel drains — maintain adequate haunching.", standard: "BS EN 1610" },
];

export function getSeparation(idA: ServiceId, idB: ServiceId): SeparationRule | null {
  const groupA = getServiceGroup(idA);
  const groupB = getServiceGroup(idB);
  // Try exact match first, then by group
  for (const rule of SEPARATION_RULES) {
    if ((rule.serviceA === groupA && rule.serviceB === groupB) ||
        (rule.serviceA === groupB && rule.serviceB === groupA)) {
      return rule;
    }
    // Also try exact service ids
    if ((rule.serviceA === idA && rule.serviceB === groupB) ||
        (rule.serviceA === groupB && rule.serviceB === idA) ||
        (rule.serviceA === groupA && rule.serviceB === idB) ||
        (rule.serviceA === idB && rule.serviceB === groupA)) {
      return rule;
    }
  }
  // Default fallback
  return { serviceA: groupA, serviceB: groupB, minSeparation: 250, crossingMinVertical: 100, note: "Default NJUG minimum separation.", standard: "NJUG Vol 1" };
}

// ─── Service Entry (user input) ──────────────────────────────
export interface ServiceEntry {
  id: string; // unique entry id
  serviceId: ServiceId;
  quantity: number;
  diameterMm: number;
}

// ─── Trench Arrangement Result ───────────────────────────────
export interface ArrangedService {
  entryId: string;
  serviceId: ServiceId;
  index: number;        // which of the quantity (0-based)
  label: string;
  xCentre: number;      // mm from left trench wall
  topOfService: number;  // mm from finished surface (cover depth)
  bottomOfService: number;
  diameterMm: number;
  coverDepth: number;    // required min cover
  actualCover: number;   // as arranged
  coverPass: boolean;
  colourHex: string;
}

export interface SeparationCheck {
  serviceA: string;
  serviceB: string;
  required: number;
  actual: number;
  pass: boolean;
  note: string;
  standard: string;
}

export interface TrenchResult {
  arranged: ArrangedService[];
  separationChecks: SeparationCheck[];
  minTrenchWidth: number;   // mm
  minTrenchDepth: number;   // mm
  allPass: boolean;
  widthFits: boolean;
  warnings: string[];
  complianceItems: ComplianceItem[];
}

export interface ComplianceItem {
  label: string;
  required: boolean;
  detail: string;
  category: "marker-tape" | "tile-protection" | "backfill" | "special";
}

// ─── Bedding allowance ───────────────────────────────────────
const BEDDING_BELOW = 100; // 100mm bedding under pipe/cable
const WALL_CLEARANCE = 150; // 150mm from trench wall to nearest service

// ─── Calculate Trench Arrangement ────────────────────────────
export function calculateTrenchArrangement(
  entries: ServiceEntry[],
  surface: SurfaceType,
  hasCrossings: boolean,
  constraintWidthMm: number | null,
): TrenchResult {
  const warnings: string[] = [];

  // Expand entries by quantity into individual services
  const allServices: { entryId: string; serviceId: ServiceId; index: number; diameterMm: number }[] = [];
  for (const entry of entries) {
    for (let i = 0; i < entry.quantity; i++) {
      allServices.push({ entryId: entry.id, serviceId: entry.serviceId, index: i, diameterMm: entry.diameterMm });
    }
  }

  if (allServices.length === 0) {
    return { arranged: [], separationChecks: [], minTrenchWidth: 0, minTrenchDepth: 0, allPass: true, widthFits: true, warnings: [], complianceItems: [] };
  }

  // Get cover depth for each service
  const surfaceKey = surface;
  const servicesWithCover = allServices.map(s => {
    const coverEntry = COVER_DEPTHS[s.serviceId][surfaceKey] ?? COVER_DEPTHS[s.serviceId]["footway"];
    return { ...s, coverDepth: coverEntry.depth, coverNote: coverEntry.note };
  });

  // Sort by cover depth descending (deepest first for optimal arrangement)
  // Secondary sort: larger diameter first
  servicesWithCover.sort((a, b) => {
    if (b.coverDepth !== a.coverDepth) return b.coverDepth - a.coverDepth;
    return b.diameterMm - a.diameterMm;
  });

  // Arrange horizontally with required separations
  const arranged: ArrangedService[] = [];
  let xCursor = WALL_CLEARANCE; // start with wall clearance

  for (let i = 0; i < servicesWithCover.length; i++) {
    const s = servicesWithCover[i];
    const sType = SERVICE_TYPES.find(st => st.id === s.serviceId)!;
    const radius = s.diameterMm / 2;

    // Calculate separation from previous service
    let sepFromPrev = 0;
    if (i > 0) {
      const prev = servicesWithCover[i - 1];
      const rule = getSeparation(prev.serviceId, s.serviceId);
      sepFromPrev = rule ? rule.minSeparation : 250;
      // Add half diameters of both services (edge-to-edge separation)
    }

    const xCentre = i === 0
      ? WALL_CLEARANCE + radius
      : xCursor + sepFromPrev + radius;

    const actualCover = s.coverDepth; // place at minimum required cover
    const topOfService = actualCover;
    const bottomOfService = actualCover + s.diameterMm;

    const svcLabel = sType.shortLabel + (servicesWithCover.filter(sv => sv.serviceId === s.serviceId).length > 1 ? ` #${s.index + 1}` : "");

    arranged.push({
      entryId: s.entryId,
      serviceId: s.serviceId,
      index: s.index,
      label: svcLabel,
      xCentre,
      topOfService,
      bottomOfService,
      diameterMm: s.diameterMm,
      coverDepth: s.coverDepth,
      actualCover,
      coverPass: true,
      colourHex: sType.siteColourHex,
    });

    xCursor = xCentre + radius;
  }

  const minTrenchWidth = xCursor + WALL_CLEARANCE;

  // Calculate trench depth (deepest bottom + bedding)
  const maxBottom = Math.max(...arranged.map(a => a.bottomOfService));
  const minTrenchDepth = maxBottom + BEDDING_BELOW;

  // Separation checks between all pairs
  const separationChecks: SeparationCheck[] = [];
  for (let i = 0; i < arranged.length; i++) {
    for (let j = i + 1; j < arranged.length; j++) {
      const a = arranged[i];
      const b = arranged[j];
      const rule = getSeparation(a.serviceId, b.serviceId);
      const edgeToEdge = Math.abs(b.xCentre - a.xCentre) - (a.diameterMm / 2) - (b.diameterMm / 2);
      const required = rule ? rule.minSeparation : 250;
      separationChecks.push({
        serviceA: a.label,
        serviceB: b.label,
        required,
        actual: Math.round(edgeToEdge),
        pass: edgeToEdge >= required - 1, // 1mm tolerance
        note: rule?.note ?? "",
        standard: rule?.standard ?? "NJUG Vol 1",
      });
    }
  }

  // Width constraint check
  const widthFits = constraintWidthMm === null || minTrenchWidth <= constraintWidthMm;
  if (!widthFits) {
    warnings.push(`Required trench width (${minTrenchWidth}mm) exceeds available width (${constraintWidthMm}mm). Consider a wider trench or splitting services into separate trenches.`);
  }

  // Crossing warnings
  if (hasCrossings) {
    warnings.push("Crossing services detected. Upper service must be protected with marker tape and tiles. Minimum vertical separation of 100-150mm required at crossing point.");
    // Add specific crossing rules
    const serviceGroups = new Set(arranged.map(a => getServiceGroup(a.serviceId)));
    if (serviceGroups.has("water") && serviceGroups.has("drainage")) {
      warnings.push("CRITICAL: Potable water MUST be above foul drainage at all crossing points (Water UK standard).");
    }
    if (serviceGroups.has("hv-electricity")) {
      warnings.push("HV electricity crossings require cable tile protection and minimum 150mm vertical separation.");
    }
  }

  // Motorway/trunk warnings
  if (surface === "carriageway-motorway") {
    warnings.push("Motorway works require National Highways approval and may require additional protection measures (concrete surround, duct encasement).");
  }
  if (surface === "carriageway-trunk") {
    warnings.push("Trunk road: Check with National Highways for specific requirements under DMRB standards.");
  }

  // Build compliance checklist
  const complianceItems: ComplianceItem[] = [];
  const uniqueServices = new Set(arranged.map(a => a.serviceId));

  for (const sid of uniqueServices) {
    const sType = SERVICE_TYPES.find(st => st.id === sid)!;
    // Marker tape
    complianceItems.push({
      label: `${sType.shortLabel} — Marker Tape`,
      required: sType.markerTapeColour !== "N/A (not typically marker taped)",
      detail: sType.markerTapeColour !== "N/A (not typically marker taped)"
        ? `${sType.markerTapeColour} marker tape required at 300mm below finished surface`
        : "Not typically required for drainage",
      category: "marker-tape",
    });
    // Tile protection
    complianceItems.push({
      label: `${sType.shortLabel} — Tile/Slab Protection`,
      required: sType.tileProtection,
      detail: sType.tileProtection
        ? "Cable tile or concrete slab protection required above service"
        : "Not mandatory (recommended in carriageway)",
      category: "tile-protection",
    });
    // Backfill
    complianceItems.push({
      label: `${sType.shortLabel} — Backfill Specification`,
      required: true,
      detail: sType.backfillSpec,
      category: "backfill",
    });
    // Special requirements
    for (const req of sType.specialRequirements) {
      complianceItems.push({
        label: `${sType.shortLabel} — Special`,
        required: true,
        detail: req,
        category: "special",
      });
    }
  }

  const allPass = separationChecks.every(s => s.pass) && arranged.every(a => a.coverPass) && widthFits;

  return { arranged, separationChecks, minTrenchWidth, minTrenchDepth, allPass, widthFits, warnings, complianceItems };
}

// ─── Regulatory References ───────────────────────────────────
export const REGULATORY_REFS = [
  { code: "NJUG Vol 1", title: "NJUG Guidelines on the Positioning of Underground Utilities, Volume 1", scope: "Separation distances and cover depths for all utility types" },
  { code: "NRSWA 1991", title: "New Roads and Street Works Act 1991 — Code of Practice", scope: "Statutory obligations for street works and reinstatement" },
  { code: "ENA TS 09-1", title: "Engineering Recommendation TS 09-1 (LV Cables)", scope: "Installation of LV underground cables up to 1kV" },
  { code: "ENA TS 09-2", title: "Engineering Recommendation TS 09-2 (HV Cables)", scope: "Installation of HV underground cables above 1kV" },
  { code: "IGEM/TD/3", title: "IGEM/TD/3 Edition 5 — Steel and PE Pipelines for Gas", scope: "Gas distribution mains — cover depths and separation" },
  { code: "IGEM/TD/1", title: "IGEM/TD/1 — Steel Pipelines and Associated Installations", scope: "HP gas transmission pipelines — additional requirements" },
  { code: "Water UK", title: "Water UK / WIS 4-08-01", scope: "Water main installation standards and frost protection" },
  { code: "BT SIN 351", title: "BT Suppliers Information Note 351", scope: "BT/Openreach duct and cable installation specifications" },
  { code: "BS EN 1610", title: "BS EN 1610 — Construction and Testing of Drains and Sewers", scope: "Drainage pipe bedding, surround, and cover requirements" },
  { code: "BS 5489", title: "BS 5489 — Code of Practice for Road Lighting", scope: "Street lighting cable installation" },
  { code: "SROH", title: "Specification for the Reinstatement of Openings in Highways (4th Ed)", scope: "Reinstatement layers, compaction, and surface standards" },
  { code: "DMRB", title: "Design Manual for Roads and Bridges", scope: "National Highways standards for trunk roads and motorways" },
];
