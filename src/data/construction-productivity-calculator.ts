// src/data/construction-productivity-calculator.ts
// Construction Productivity Calculator — 9 task types
// Base rates: Jon's Excel cross-referenced with Spon's, CIRIA, and UK industry norms
// All rates overridable via Advanced Settings

// ─── Common Types ────────────────────────────────────────────────

export interface FactorOption {
  label: string;
  value: number;
}

export interface TaskField {
  id: string;
  label: string;
  type: "select" | "number";
  options?: FactorOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  helpText?: string;
}

export interface TaskConfig {
  id: string;
  name: string;
  icon: string;
  unit: string; // output unit e.g. "kg/day", "m/day"
  baseRate: number;
  baseRateLabel: string;
  baseRateUnit: string;
  standardWorkday: number;
  efficiencyFactor: number;
  safetyFactor: number;
  /** Whether output scales by gang count (vs per-man) */
  gangBased: boolean;
  gangLabel?: string; // e.g. "gangs", "rigs"
  fields: TaskField[];
}

export interface TaskInputs {
  shiftHours: number;
  skilledOps: number;
  generalOps: number;
  region: string;
  constraints: string;
  [key: string]: string | number;
}

// ─── Shared Factor Tables ────────────────────────────────────────

export const REGION_OPTIONS: FactorOption[] = [
  { label: "UK Baseline (Default)", value: 1 },
  { label: "High Productivity Benchmark", value: 1.1 },
  { label: "Low Productivity / Restricted", value: 0.9 },
];

export const CONSTRAINT_OPTIONS: FactorOption[] = [
  { label: "Normal (Default)", value: 1 },
  { label: "Moderate Constraints", value: 0.9 },
  { label: "Severe Constraints", value: 0.8 },
];

export function getSkillFactor(skilled: number, general: number): number {
  const total = skilled + general;
  if (total === 0) return 0;
  const ratio = skilled / total;
  // Range 0.65–1.00 (35 % spread) reflects the 30–40 % productivity gap
  // commonly cited between fully-skilled and fully-unskilled crews in UK
  // productivity studies (CIRIA, Spon's).
  if (ratio >= 0.6) return 1.00;
  if (ratio >= 0.5) return 0.92;
  if (ratio >= 0.4) return 0.85;
  if (ratio >= 0.3) return 0.75;
  return 0.65;
}

// ─── 9 Task Configurations ───────────────────────────────────────

export const TASKS: TaskConfig[] = [
  // ── 1. Steel Fixing ─────────────────────────────────
  {
    id: "steel-fixing",
    name: "Steel Fixing",
    icon: "🔩",
    unit: "kg/day",
    baseRate: 900,
    baseRateLabel: "Steel fixing",
    baseRateUnit: "kg per man-day",
    standardWorkday: 8,
    efficiencyFactor: 0.75,
    safetyFactor: 0.95,
    gangBased: false,
    fields: [
      { id: "barDiameter", label: "Bar Diameter", type: "select", options: [
        { label: "6mm", value: 1.3 }, { label: "8mm", value: 1.15 }, { label: "10mm", value: 1 },
        { label: "12mm", value: 0.9 }, { label: "16mm", value: 0.8 }, { label: "20mm", value: 0.7 },
        { label: "25mm", value: 0.6 }, { label: "32mm", value: 0.5 },
      ]},
      { id: "elementType", label: "Element Type", type: "select", options: [
        { label: "Slab/Base", value: 1 }, { label: "Wall", value: 0.9 },
        { label: "Beam", value: 0.8 }, { label: "Column", value: 0.7 },
      ]},
      { id: "congestion", label: "Congestion Level", type: "select", options: [
        { label: "Low congestion", value: 0.95 }, { label: "Normal (Default)", value: 0.85 },
        { label: "High congestion", value: 0.75 },
      ]},
      { id: "floorsAbove", label: "Floors Above Ground", type: "number", min: 0, max: 30, step: 1, unit: "floors", placeholder: "0", helpText: "Height penalty: -5% per floor (min factor 0.5)" },
      { id: "craneAssist", label: "Crane Assistance", type: "select", options: [
        { label: "Yes", value: 1.35 }, { label: "No", value: 1 },
      ]},
      { id: "rebarType", label: "Rebar Type", type: "select", options: [
        { label: "Standard Black Bar", value: 1 }, { label: "Epoxy-Coated", value: 0.95 },
      ]},
    ],
  },

  // ── 2. Pipe Laying ──────────────────────────────────
  {
    id: "pipe-laying",
    name: "Pipe Laying",
    icon: "🔧",
    unit: "m/day",
    baseRate: 40,
    baseRateLabel: "Pipe laying",
    baseRateUnit: "m per man-day",
    standardWorkday: 8,
    efficiencyFactor: 0.75,
    safetyFactor: 0.95,
    gangBased: false,
    fields: [
      { id: "pipeDiameter", label: "Pipe Diameter Range", type: "select", options: [
        { label: "<100mm", value: 1.2 }, { label: "100–200mm", value: 1 },
        { label: "201–300mm", value: 0.8 }, { label: "301–500mm", value: 0.6 },
        { label: ">500mm", value: 0.4 },
      ]},
      { id: "pipeMaterial", label: "Pipe Material", type: "select", options: [
        { label: "PVC/Plastic", value: 1 }, { label: "Concrete", value: 0.8 },
        { label: "Ductile Iron/Steel", value: 0.7 },
      ]},
      { id: "groundType", label: "Ground Type", type: "select", options: [
        { label: "Soft/Loose", value: 1.2 }, { label: "Average", value: 1 },
        { label: "Hard/Clay", value: 0.8 }, { label: "Rocky", value: 0.6 },
        { label: "Made Ground", value: 0.7 }, { label: "Peat/Waterlogged", value: 0.5 },
      ]},
      { id: "trenchDepth", label: "Trench Depth to Invert", type: "number", min: 0.3, max: 6, step: 0.1, unit: "m", placeholder: "1.0", helpText: "Base 1.0 m; -10% per additional metre (min factor 0.4)" },
      { id: "jointType", label: "Joint Type", type: "select", options: [
        { label: "Glued/Solvent", value: 1 }, { label: "Welded", value: 0.85 },
        { label: "Gasketed", value: 0.9 },
      ]},
      { id: "pipeLength", label: "Pipe Stick Length", type: "select", options: [
        { label: "3 m", value: 0.9 }, { label: "6 m", value: 1 }, { label: "12 m", value: 1.1 },
      ]},
      { id: "trenchPlant", label: "Plant (Trench/Handling)", type: "select", options: [
        { label: "Hand Dig / No Excavator", value: 1 }, { label: "Mini Excavator (3–5t)", value: 1.2 },
        { label: "Excavator (8–13t)", value: 1.5 }, { label: "Excavator (20t+)", value: 1.6 },
      ]},
    ],
  },

  // ── 3. Muck Shift ───────────────────────────────────
  {
    id: "muck-shift",
    name: "Muck Shift",
    icon: "🚜",
    unit: "m³/day (bank)",
    baseRate: 55,
    baseRateLabel: "Primary plant base rate",
    baseRateUnit: "m³/hr (bank)",
    standardWorkday: 8,
    efficiencyFactor: 0.75,
    safetyFactor: 0.95,
    gangBased: false,
    fields: [
      { id: "groundType", label: "Ground Type", type: "select", options: [
        { label: "Soft/Loose", value: 1.2 }, { label: "Average", value: 1 },
        { label: "Hard/Clay", value: 0.8 }, { label: "Rocky", value: 0.6 },
        { label: "Made Ground", value: 0.7 }, { label: "Peat/Waterlogged", value: 0.5 },
      ]},
      { id: "primaryPlant", label: "Primary Plant", type: "select", options: [
        { label: "Excavator (5t) – trench/utility", value: 20 },
        { label: "Excavator (13t) – general", value: 35 },
        { label: "Excavator (20t+) – bulk", value: 55 },
        { label: "Wheel Loader (2.5 m³) – stockpile", value: 60 },
        { label: "Dozer (D6 class) – push/strip", value: 40 },
        { label: "Dozer (D8 class) – bulk push", value: 70 },
      ]},
      { id: "truckType", label: "Dump Truck Type", type: "select", options: [
        { label: "6-Wheeler (10–12t)", value: 1 }, { label: "8-Wheeler (16–18t)", value: 1.2 },
        { label: "Articulated Dump Truck (ADT)", value: 1.6 },
      ]},
      { id: "truckCount", label: "Number of Trucks", type: "number", min: 1, max: 12, step: 1, unit: "trucks", placeholder: "2", helpText: "Diminishing returns beyond 3 trucks" },
      { id: "haulDistance", label: "Haul Distance (one-way)", type: "number", min: 0, max: 2000, step: 50, unit: "m", placeholder: "100", helpText: "Penalty per 100m (min factor 0.4)" },
      { id: "moisture", label: "Moisture Condition", type: "select", options: [
        { label: "Normal (Default)", value: 1 }, { label: "Wet/Sticky", value: 0.9 },
      ]},
      { id: "terrain", label: "Terrain", type: "select", options: [
        { label: "Flat", value: 1 }, { label: "Steep/Restricted", value: 0.75 },
      ]},
    ],
  },

  // ── 4. Formwork ─────────────────────────────────────
  {
    id: "formwork",
    name: "Formwork",
    icon: "📐",
    unit: "m²/day",
    baseRate: 20,
    baseRateLabel: "Formwork",
    baseRateUnit: "m² per man-day",
    standardWorkday: 8,
    efficiencyFactor: 0.75,
    safetyFactor: 0.95,
    gangBased: false,
    fields: [
      { id: "formworkType", label: "Formwork Type", type: "select", options: [
        { label: "Conventional Timber/Plywood", value: 1 }, { label: "Aluminum/System/Mivan", value: 1.5 },
        { label: "Steel", value: 1.3 }, { label: "Plastic Modular", value: 1.8 },
        { label: "Tableform", value: 1.6 }, { label: "Fabric", value: 1.2 },
      ]},
      { id: "elementType", label: "Element Type", type: "select", options: [
        { label: "Slab/Base", value: 1 }, { label: "Wall", value: 0.9 },
        { label: "Beam", value: 0.8 }, { label: "Column", value: 0.7 },
      ]},
      { id: "reuseCycles", label: "Reuse Cycles Available", type: "select", options: [
        { label: "Yes", value: 1.1 }, { label: "No", value: 1 },
      ]},
      { id: "plannedArea", label: "Planned Formwork Area", type: "number", min: 1, max: 10000, step: 10, unit: "m²", placeholder: "100", helpText: "Scale bonus: +5% per 100 m² (max 1.25×)" },
      { id: "weatherproofing", label: "Weatherproofing Required", type: "select", options: [
        { label: "No", value: 1 }, { label: "Yes", value: 0.95 },
      ]},
    ],
  },

  // ── 5. Concrete Pouring ─────────────────────────────
  {
    id: "concrete-pouring",
    name: "Concrete Pouring",
    icon: "🏗️",
    unit: "m³/day",
    baseRate: 50,
    baseRateLabel: "Concrete placing",
    baseRateUnit: "m³ per gang-day",
    standardWorkday: 8,
    efficiencyFactor: 0.75,
    safetyFactor: 0.95,
    gangBased: true,
    gangLabel: "gangs",
    fields: [
      { id: "gangCount", label: "Number of Concrete Gangs", type: "number", min: 1, max: 6, step: 1, unit: "gangs", placeholder: "1" },
      { id: "placingMethod", label: "Placing Method", type: "select", options: [
        { label: "Manual/Bucket", value: 1 }, { label: "Concrete Pump", value: 3 },
        { label: "Boom Pump", value: 5 },
      ]},
      { id: "pourType", label: "Pour Type", type: "select", options: [
        { label: "Slab/Floor", value: 1 }, { label: "Wall/Column", value: 0.8 },
      ]},
      { id: "pourVolume", label: "Planned Pour Volume", type: "number", min: 1, max: 5000, step: 10, unit: "m³", placeholder: "50", helpText: "Scale bonus: +10% per 100 m³ (max 1.3×)" },
      { id: "mixType", label: "Mix Type", type: "select", options: [
        { label: "Ready-mix", value: 1.2 }, { label: "Site-mixed", value: 1 },
      ]},
      { id: "vibration", label: "Vibration Method", type: "select", options: [
        { label: "Mechanical", value: 1.1 }, { label: "Manual", value: 1 },
      ]},
    ],
  },

  // ── 6. Kerb Laying ──────────────────────────────────
  {
    id: "kerb-laying",
    name: "Kerb Laying",
    icon: "🛤️",
    unit: "m/day",
    baseRate: 150,
    baseRateLabel: "Kerb laying",
    baseRateUnit: "m per gang-day",
    standardWorkday: 8,
    efficiencyFactor: 0.75,
    safetyFactor: 0.95,
    gangBased: true,
    gangLabel: "gangs",
    fields: [
      { id: "gangCount", label: "Number of Kerb Gangs", type: "number", min: 1, max: 6, step: 1, unit: "gangs", placeholder: "1" },
      { id: "kerbType", label: "Kerb Type", type: "select", options: [
        { label: "Precast (PC)", value: 1 }, { label: "In-situ (INS)", value: 0.7 },
        { label: "Radius/Curved (R)", value: 0.85 }, { label: "Half Batter (HB2)", value: 0.95 },
        { label: "Bullnose (BN)", value: 0.9 }, { label: "Full Batter (HB1)", value: 0.92 },
        { label: "Drop Kerb (DB)", value: 0.8 },
      ]},
      { id: "terrain", label: "Terrain", type: "select", options: [
        { label: "Flat", value: 1 }, { label: "Sloped", value: 0.8 },
      ]},
      { id: "runLength", label: "Continuous Run Length", type: "number", min: 1, max: 5000, step: 10, unit: "m", placeholder: "100", helpText: "Repetition bonus: +5% per 100 m (max 1.25×)" },
      { id: "jointSpacing", label: "Joint Spacing", type: "select", options: [
        { label: "Normal spacing", value: 1 }, { label: "Close joints / many cuts", value: 0.9 },
      ]},
    ],
  },

  // ── 7. Piling ───────────────────────────────────────
  {
    id: "piling",
    name: "Piling",
    icon: "🏭",
    unit: "piles/day",
    baseRate: 8,
    baseRateLabel: "Piling",
    baseRateUnit: "piles per rig-day",
    standardWorkday: 8,
    efficiencyFactor: 0.75,
    safetyFactor: 0.95,
    gangBased: true,
    gangLabel: "rigs",
    fields: [
      { id: "gangCount", label: "Number of Rigs", type: "number", min: 1, max: 6, step: 1, unit: "rigs", placeholder: "1" },
      { id: "pilingMethod", label: "Piling Method", type: "select", options: [
        { label: "Bored", value: 1 }, { label: "Driven Precast", value: 3 },
        { label: "CFA", value: 1.8 }, { label: "Micropile", value: 0.7 },
      ]},
      { id: "diameterBand", label: "Diameter Band", type: "select", options: [
        { label: "<400mm", value: 1.5 }, { label: "400–800mm", value: 1 },
        { label: ">800mm", value: 0.6 },
      ]},
      { id: "pileDepth", label: "Pile Depth", type: "number", min: 3, max: 60, step: 1, unit: "m", placeholder: "20", helpText: "Base 20 m; -20% per 10 m beyond (min 0.4×)" },
      { id: "soilType", label: "Soil Type", type: "select", options: [
        { label: "Soft", value: 1.2 }, { label: "Average", value: 1 }, { label: "Hard", value: 0.7 },
      ]},
      { id: "rigPower", label: "Rig Power", type: "select", options: [
        { label: "Standard", value: 1 }, { label: "High-power", value: 1.2 },
      ]},
      { id: "obstruction", label: "Obstruction Present?", type: "select", options: [
        { label: "No", value: 1 }, { label: "Yes", value: 0.8 },
      ]},
    ],
  },

  // ── 8. Road Base Laying ─────────────────────────────
  {
    id: "road-base-laying",
    name: "Road Base Laying",
    icon: "🛣️",
    unit: "m²/day",
    baseRate: 800,
    baseRateLabel: "Road base laying",
    baseRateUnit: "m² per gang-day",
    standardWorkday: 8,
    efficiencyFactor: 0.75,
    safetyFactor: 0.95,
    gangBased: true,
    gangLabel: "gangs",
    fields: [
      { id: "gangCount", label: "Number of Gangs", type: "number", min: 1, max: 6, step: 1, unit: "gangs", placeholder: "1" },
      { id: "equipment", label: "Equipment", type: "select", options: [
        { label: "Manual spreading", value: 0.5 }, { label: "Grader + Roller", value: 1 },
        { label: "Excavator + Roller", value: 0.8 },
      ]},
      { id: "materialType", label: "Material Type", type: "select", options: [
        { label: "Granular", value: 1 }, { label: "Stabilized", value: 0.9 },
      ]},
      { id: "layerThickness", label: "Layer Thickness", type: "number", min: 50, max: 600, step: 25, unit: "mm", placeholder: "200", helpText: "Base 200 mm; -10% per 100 mm beyond (min 0.5×)" },
      { id: "roadWidth", label: "Road Width", type: "number", min: 2, max: 30, step: 0.5, unit: "m", placeholder: "6", helpText: "Bonus factor 1.1× if width > 10 m" },
      { id: "moisture", label: "Moisture Condition", type: "select", options: [
        { label: "Optimal", value: 1 }, { label: "Dry", value: 0.95 }, { label: "Wet", value: 0.85 },
      ]},
    ],
  },

  // ── 9. Asphalt Laying ───────────────────────────────
  {
    id: "asphalt-laying",
    name: "Asphalt Laying",
    icon: "🏗️",
    unit: "m²/day",
    baseRate: 3000,
    baseRateLabel: "Asphalt laying",
    baseRateUnit: "m² per gang-day",
    standardWorkday: 8,
    efficiencyFactor: 0.75,
    safetyFactor: 0.95,
    gangBased: true,
    gangLabel: "gangs",
    fields: [
      { id: "gangCount", label: "Number of Gangs", type: "number", min: 1, max: 6, step: 1, unit: "gangs", placeholder: "1" },
      { id: "layingMethod", label: "Laying Method", type: "select", options: [
        { label: "Mechanical Paver", value: 1 }, { label: "Manual", value: 0.3 },
      ]},
      { id: "thicknessBand", label: "Layer Thickness Band", type: "select", options: [
        { label: "<50mm", value: 1.2 }, { label: "50–100mm", value: 1 },
        { label: ">100mm", value: 0.8 },
      ]},
      { id: "weather", label: "Weather/Temperature", type: "select", options: [
        { label: "Optimal", value: 1 }, { label: "Poor/Cold", value: 0.8 },
      ]},
      { id: "mixType", label: "Mix Type", type: "select", options: [
        { label: "Hot Mix", value: 1 }, { label: "Cold Mix", value: 0.75 },
        { label: "Warm Mix", value: 1.05 },
      ]},
    ],
  },
];

export function createDefaultInputs(task: TaskConfig): TaskInputs {
  const inputs: TaskInputs = {
    shiftHours: 8,
    skilledOps: 2,
    generalOps: 2,
    region: "UK Baseline (Default)",
    constraints: "Normal (Default)",
  };
  task.fields.forEach(f => {
    if (f.type === "select" && f.options) {
      inputs[f.id] = f.options[0].label;
    } else {
      inputs[f.id] = f.placeholder ? parseFloat(f.placeholder) : 0;
    }
  });
  return inputs;
}
