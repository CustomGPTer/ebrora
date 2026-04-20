// src/data/concrete-volume-calculator.ts
// Concrete Volume Calculator — PAID tier, white-label PDF

export type ShapeType =
  | "rectangular-slab"
  | "circular-base"
  | "round-column"
  | "square-column"
  | "beam"
  | "trapezoidal"
  | "ring-beam"
  | "pile-cap"
  | "steps";

export interface ShapeDef {
  id: ShapeType;
  label: string;
  icon: string;
  inputs: ShapeInput[];
}

export interface ShapeInput {
  id: string;
  label: string;
  unit: string;
  step: number;
  placeholder: string;
}

export interface ConcreteRow {
  id: string;
  label: string;
  shape: ShapeType;
  values: Record<string, number | null>;
  netVolume: number;
  overrideVolume: number | null;
}

export interface ConcreteMix {
  designation: string;
  strength: string;
  description: string;
}

// ─── Shape Definitions ───────────────────────────────────────────

export const SHAPES: ShapeDef[] = [
  {
    id: "rectangular-slab",
    label: "Rectangular Slab",
    icon: "▬",
    inputs: [
      { id: "length", label: "Length", unit: "m", step: 0.01, placeholder: "10" },
      { id: "width", label: "Width", unit: "m", step: 0.01, placeholder: "5" },
      { id: "depth", label: "Depth / Thickness", unit: "m", step: 0.01, placeholder: "0.15" },
    ],
  },
  {
    id: "circular-base",
    label: "Circular Base",
    icon: "●",
    inputs: [
      { id: "diameter", label: "Diameter", unit: "m", step: 0.01, placeholder: "3" },
      { id: "depth", label: "Depth / Thickness", unit: "m", step: 0.01, placeholder: "0.3" },
    ],
  },
  {
    id: "round-column",
    label: "Round Column",
    icon: "◯",
    inputs: [
      { id: "diameter", label: "Diameter", unit: "m", step: 0.01, placeholder: "0.5" },
      { id: "height", label: "Height", unit: "m", step: 0.01, placeholder: "3" },
      { id: "quantity", label: "Number of Columns", unit: "no.", step: 1, placeholder: "4" },
    ],
  },
  {
    id: "square-column",
    label: "Square Column",
    icon: "□",
    inputs: [
      { id: "sideA", label: "Side A", unit: "m", step: 0.01, placeholder: "0.4" },
      { id: "sideB", label: "Side B", unit: "m", step: 0.01, placeholder: "0.4" },
      { id: "height", label: "Height", unit: "m", step: 0.01, placeholder: "3" },
      { id: "quantity", label: "Number of Columns", unit: "no.", step: 1, placeholder: "6" },
    ],
  },
  {
    id: "beam",
    label: "Beam",
    icon: "═",
    inputs: [
      { id: "length", label: "Length", unit: "m", step: 0.01, placeholder: "6" },
      { id: "width", label: "Width", unit: "m", step: 0.01, placeholder: "0.3" },
      { id: "depth", label: "Depth", unit: "m", step: 0.01, placeholder: "0.5" },
      { id: "quantity", label: "Number of Beams", unit: "no.", step: 1, placeholder: "4" },
    ],
  },
  {
    id: "trapezoidal",
    label: "Trapezoidal Section",
    icon: "⏢",
    inputs: [
      { id: "topWidth", label: "Top Width", unit: "m", step: 0.01, placeholder: "2" },
      { id: "bottomWidth", label: "Bottom Width", unit: "m", step: 0.01, placeholder: "3" },
      { id: "depth", label: "Depth", unit: "m", step: 0.01, placeholder: "0.5" },
      { id: "length", label: "Length", unit: "m", step: 0.01, placeholder: "10" },
    ],
  },
  {
    id: "ring-beam",
    label: "Ring Beam",
    icon: "◎",
    inputs: [
      { id: "outerDiameter", label: "Outer Diameter", unit: "m", step: 0.01, placeholder: "5" },
      { id: "innerDiameter", label: "Inner Diameter", unit: "m", step: 0.01, placeholder: "4" },
      { id: "depth", label: "Depth", unit: "m", step: 0.01, placeholder: "0.5" },
    ],
  },
  {
    id: "pile-cap",
    label: "Pile Cap",
    icon: "⊞",
    inputs: [
      { id: "length", label: "Length", unit: "m", step: 0.01, placeholder: "2" },
      { id: "width", label: "Width", unit: "m", step: 0.01, placeholder: "2" },
      { id: "depth", label: "Depth", unit: "m", step: 0.01, placeholder: "0.75" },
      { id: "quantity", label: "Number of Pile Caps", unit: "no.", step: 1, placeholder: "8" },
    ],
  },
  {
    id: "steps",
    label: "Steps / Stairs",
    icon: "⊟",
    inputs: [
      { id: "stepWidth", label: "Step Width (tread)", unit: "m", step: 0.01, placeholder: "1.2" },
      { id: "riser", label: "Riser Height", unit: "m", step: 0.01, placeholder: "0.15" },
      { id: "going", label: "Going (tread depth)", unit: "m", step: 0.01, placeholder: "0.25" },
      { id: "numberOfSteps", label: "Number of Steps", unit: "no.", step: 1, placeholder: "12" },
      { id: "waistThickness", label: "Waist Thickness (⊥ to slope)", unit: "m", step: 0.01, placeholder: "0.15" },
    ],
  },
];

// ─── Concrete Mix Database ───────────────────────────────────────

export const CONCRETE_MIXES: ConcreteMix[] = [
  { designation: "C8/10", strength: "10 MPa", description: "Blinding / mass fill / trench fill" },
  { designation: "C12/15", strength: "15 MPa", description: "Strip footings / mass concrete" },
  { designation: "C16/20", strength: "20 MPa", description: "Residential foundations / floor slabs" },
  { designation: "C20/25", strength: "25 MPa", description: "General purpose / light structural" },
  { designation: "C25/30", strength: "30 MPa", description: "Reinforced foundations / ground beams" },
  { designation: "C28/35", strength: "35 MPa", description: "Piling / structural reinforced" },
  { designation: "C30/37", strength: "37 MPa", description: "Pavements / structural slabs" },
  { designation: "C32/40", strength: "40 MPa", description: "Heavily reinforced sections" },
  { designation: "C35/45", strength: "45 MPa", description: "High-performance structural" },
  { designation: "C40/50", strength: "50 MPa", description: "Pre-stressed / high-strength" },
  { designation: "Custom", strength: "—", description: "Enter custom mix designation" },
];

// ─── Defaults ────────────────────────────────────────────────────

export const DEFAULT_WASTE_PERCENT = 7.5;
export const DEFAULT_TRUCK_CAPACITY = 6; // m³

export function genId() { return Math.random().toString(36).slice(2, 10); }

export function createEmptyRow(shape: ShapeType = "rectangular-slab"): ConcreteRow {
  return {
    id: genId(),
    label: "",
    shape,
    values: {},
    netVolume: 0,
    overrideVolume: null,
  };
}

// ─── Volume Calculations ─────────────────────────────────────────

export function calculateShapeVolume(shape: ShapeType, values: Record<string, number | null>): number {
  const v = (key: string) => values[key] ?? 0;

  switch (shape) {
    case "rectangular-slab":
      return v("length") * v("width") * v("depth");
    case "circular-base":
      return Math.PI * Math.pow(v("diameter") / 2, 2) * v("depth");
    case "round-column":
      return Math.PI * Math.pow(v("diameter") / 2, 2) * v("height") * (v("quantity") || 1);
    case "square-column":
      return v("sideA") * v("sideB") * v("height") * (v("quantity") || 1);
    case "beam":
      return v("length") * v("width") * v("depth") * (v("quantity") || 1);
    case "trapezoidal":
      return ((v("topWidth") + v("bottomWidth")) / 2) * v("depth") * v("length");
    case "ring-beam": {
      const outerR = v("outerDiameter") / 2;
      const innerR = v("innerDiameter") / 2;
      return Math.PI * (outerR * outerR - innerR * innerR) * v("depth");
    }
    case "pile-cap":
      return v("length") * v("width") * v("depth") * (v("quantity") || 1);
    case "steps": {
      // Each step (above the waist) is a right-triangular prism: base = going,
      // height = riser, extruded across the stepWidth. Volume per step is
      //   (going × riser) / 2 × stepWidth
      // The previous formula omitted the × 0.5 factor, double-counting the
      // step concrete as a rectangular prism and over-ordering by ~30 % on
      // typical residential flights. FIXED.
      const stepVol = v("stepWidth") * v("going") * v("riser") * (v("numberOfSteps") || 1) * 0.5;
      // Waist is the sloped slab supporting the steps.
      // IMPORTANT: waistThickness is measured PERPENDICULAR to the slope
      // (UK drawing convention). Enter the slab thickness at right-angles to
      // the sloped soffit, not a vertical dimension.
      const stairLength = v("going") * (v("numberOfSteps") || 1);
      const stairHeight = v("riser") * (v("numberOfSteps") || 1);
      const waistLength = Math.sqrt(stairLength ** 2 + stairHeight ** 2);
      const waistVol = v("stepWidth") * waistLength * v("waistThickness");
      return stepVol + waistVol;
    }
    default:
      return 0;
  }
}
