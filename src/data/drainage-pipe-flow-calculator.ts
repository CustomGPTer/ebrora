// src/data/drainage-pipe-flow-calculator.ts

export const GRAVITY = 9.81; // m/s2
export const KINEMATIC_VISCOSITY = 1.141e-6; // m2/s at 15C

// ─── Pipe Materials ──────────────────────────────────────────
export interface PipeMaterial {
  id: string;
  name: string;
  ks: number; // roughness mm
  manningN: number;
  notes: string;
}

export const PIPE_MATERIALS: PipeMaterial[] = [
  { id: "clay", name: "Vitrified clay", ks: 0.03, manningN: 0.012, notes: "BS EN 295. Standard foul/surface water drainage." },
  { id: "upvc", name: "PVC-U (uPVC)", ks: 0.03, manningN: 0.011, notes: "BS EN 1401. Smooth bore. Common for domestic." },
  { id: "concrete_new", name: "Concrete (new)", ks: 0.15, manningN: 0.013, notes: "BS EN 1916. Spun or precast concrete pipe." },
  { id: "concrete_aged", name: "Concrete (aged/rough)", ks: 0.6, manningN: 0.015, notes: "Aged concrete with deposit buildup." },
  { id: "ductile_iron", name: "Ductile iron (cement lined)", ks: 0.03, manningN: 0.012, notes: "BS EN 545/598. Lined bore." },
  { id: "ductile_iron_unlined", name: "Ductile iron (unlined)", ks: 0.15, manningN: 0.014, notes: "Corrodes internally over time." },
  { id: "grp", name: "GRP (fibreglass)", ks: 0.03, manningN: 0.011, notes: "BS EN 14364. Smooth bore, corrosion resistant." },
  { id: "hdpe", name: "HDPE (polyethylene)", ks: 0.03, manningN: 0.011, notes: "BS EN 12201. Flexible, fusion welded joints." },
  { id: "pp", name: "Polypropylene (PP)", ks: 0.03, manningN: 0.011, notes: "BS EN 1852. Structured wall systems." },
  { id: "brick", name: "Brick sewer", ks: 3.0, manningN: 0.017, notes: "Legacy Victorian/Edwardian sewers. Very rough." },
  { id: "corrugated", name: "Corrugated (twinwall)", ks: 0.3, manningN: 0.012, notes: "Smooth inner wall. Land drainage / surface water." },
  { id: "steel", name: "Steel (coated)", ks: 0.06, manningN: 0.012, notes: "Epoxy or cement lined steel pipe." },
];

// ─── Common Pipe Sizes ───────────────────────────────────────
export const PIPE_SIZES = [100, 150, 225, 300, 375, 450, 525, 600, 750, 900, 1050, 1200]; // mm

// ─── Building Regs Part H Minimum Gradients ──────────────────
export interface PartHGradient {
  diameterMM: number;
  minGradient: number; // 1:X
  notes: string;
}

export const PART_H_GRADIENTS: PartHGradient[] = [
  { diameterMM: 75,  minGradient: 40,  notes: "Waste pipe (individual appliance) — 1:40 min per ADH Table 6" },
  // ADH Table 6: 100mm pipe is 1:40 min for flows <1 L/s (no WC, low-flow branch),
  // or 1:80 min for flows ≥1 L/s with at least one WC (WC flush provides scouring).
  // Defaulting to 1:80 (the normal domestic case with a WC); user should tighten to
  // 1:40 manually if designing a low-flow branch without a WC discharging into it.
  { diameterMM: 100, minGradient: 80,  notes: "1:80 min where flow ≥1 L/s and ≥1 WC connected (normal domestic case); tighten to 1:40 for low-flow branches <1 L/s with no WC" },
  { diameterMM: 150, minGradient: 150, notes: "1:150 min per ADH Table 6 (requires ≥5 WC or flow ≥1 L/s); 1:80 or steeper preferred for self-cleansing" },
  { diameterMM: 225, minGradient: 225, notes: "Larger sewers — check self-cleansing velocity at minimum flow (see BS EN 16933-2)" },
];

// ─── Proportional Depth Ratios ───────────────────────────────
export const PROPORTIONAL_DEPTHS = [0.1, 0.25, 0.333, 0.5, 0.75, 1.0]; // d/D ratios

// ─── Circular Pipe Geometry ──────────────────────────────────
/** Angle theta (radians) for depth ratio d/D in circular pipe */
function thetaFromDepthRatio(dOverD: number): number {
  if (dOverD <= 0) return 0;
  if (dOverD >= 1) return 2 * Math.PI;
  return 2 * Math.acos(1 - 2 * dOverD);
}

/** Wetted area for partial fill in circular pipe */
export function wettedArea(diameterM: number, dOverD: number): number {
  const theta = thetaFromDepthRatio(dOverD);
  const r = diameterM / 2;
  return (r * r / 2) * (theta - Math.sin(theta));
}

/** Wetted perimeter for partial fill */
export function wettedPerimeter(diameterM: number, dOverD: number): number {
  const theta = thetaFromDepthRatio(dOverD);
  return (diameterM / 2) * theta;
}

/** Hydraulic radius R = A/P */
export function hydraulicRadius(diameterM: number, dOverD: number): number {
  const A = wettedArea(diameterM, dOverD);
  const P = wettedPerimeter(diameterM, dOverD);
  if (P <= 0) return 0;
  return A / P;
}

// ─── Colebrook-White Equation ────────────────────────────────
/** Full-bore velocity using Colebrook-White */
export function colebrookWhiteVelocity(
  diameterMM: number,
  gradient: number, // as decimal e.g. 0.01 for 1:100
  ksMM: number,
): number {
  const D = diameterMM / 1000; // m
  const ks = ksMM / 1000; // m
  const Sf = gradient;
  if (D <= 0 || Sf <= 0) return 0;

  const sqrt2gDSf = Math.sqrt(2 * GRAVITY * D * Sf);
  if (sqrt2gDSf <= 0) return 0;

  const term1 = ks / (3.7 * D);
  const term2 = (2.51 * KINEMATIC_VISCOSITY) / (D * sqrt2gDSf);

  if (term1 + term2 <= 0) return 0;

  const V = -2 * sqrt2gDSf * Math.log10(term1 + term2);
  return Math.max(0, V);
}

/** Proportional velocity using Colebrook-White at partial depth */
export function colebrookWhitePartialVelocity(
  diameterMM: number,
  gradient: number,
  ksMM: number,
  dOverD: number,
): number {
  if (dOverD >= 1) return colebrookWhiteVelocity(diameterMM, gradient, ksMM);
  if (dOverD <= 0) return 0;

  const D = diameterMM / 1000;
  const ks = ksMM / 1000;
  const R = hydraulicRadius(D, dOverD);
  if (R <= 0) return 0;

  const Sf = gradient;
  const sqrt2gRSf4 = Math.sqrt(2 * GRAVITY * 4 * R * Sf);
  if (sqrt2gRSf4 <= 0) return 0;

  const term1 = ks / (3.7 * 4 * R);
  const term2 = (2.51 * KINEMATIC_VISCOSITY) / (4 * R * sqrt2gRSf4);
  if (term1 + term2 <= 0) return 0;

  return Math.max(0, -2 * sqrt2gRSf4 * Math.log10(term1 + term2));
}

// ─── Manning's Equation ──────────────────────────────────────
/** Full-bore velocity using Manning's */
export function manningVelocity(
  diameterMM: number,
  gradient: number,
  manningN: number,
): number {
  const D = diameterMM / 1000;
  const R = D / 4; // hydraulic radius for full bore = D/4
  if (R <= 0 || manningN <= 0 || gradient <= 0) return 0;
  return (1 / manningN) * Math.pow(R, 2 / 3) * Math.sqrt(gradient);
}

/** Partial depth velocity using Manning's */
export function manningPartialVelocity(
  diameterMM: number,
  gradient: number,
  manningN: number,
  dOverD: number,
): number {
  if (dOverD >= 1) return manningVelocity(diameterMM, gradient, manningN);
  if (dOverD <= 0) return 0;
  const D = diameterMM / 1000;
  const R = hydraulicRadius(D, dOverD);
  if (R <= 0 || manningN <= 0) return 0;
  return (1 / manningN) * Math.pow(R, 2 / 3) * Math.sqrt(gradient);
}

// ─── Flow Rate ───────────────────────────────────────────────
export function flowRate(velocityMS: number, areaSqM: number): number {
  return velocityMS * areaSqM * 1000; // litres/second
}

// ─── Full Bore Area ──────────────────────────────────────────
export function fullBoreArea(diameterMM: number): number {
  const D = diameterMM / 1000;
  return Math.PI * D * D / 4;
}

// ─── Design Checks ───────────────────────────────────────────
export interface DesignCheck {
  id: string;
  label: string;
  value: string;
  threshold: string;
  pass: boolean;
  regulation: string;
}

export function runDesignChecks(
  diameterMM: number,
  gradient: number,
  fullBoreVelocity: number,
  velocity1_3: number, // velocity at 1/3 depth
): DesignCheck[] {
  const checks: DesignCheck[] = [];

  // Self-cleansing velocity at 1/3 depth
  checks.push({
    id: "self_cleanse",
    label: "Self-cleansing velocity (1/3 depth)",
    value: `${velocity1_3.toFixed(2)} m/s`,
    threshold: ">= 0.75 m/s",
    pass: velocity1_3 >= 0.75,
    regulation: "Sewers for Adoption (SfA) / BS EN 752",
  });

  // Maximum velocity
  checks.push({
    id: "max_velocity",
    label: "Maximum velocity (full bore)",
    value: `${fullBoreVelocity.toFixed(2)} m/s`,
    threshold: "<= 3.0 m/s (to prevent erosion)",
    pass: fullBoreVelocity <= 3.0,
    regulation: "BS EN 752 / Sewers for Adoption",
  });

  // Part H minimum gradient
  const partH = PART_H_GRADIENTS.find(p => p.diameterMM >= diameterMM);
  if (partH) {
    const gradientOneInX = gradient > 0 ? 1 / gradient : 0;
    checks.push({
      id: "part_h_gradient",
      label: `Building Regs Part H min gradient (${partH.diameterMM}mm)`,
      value: `1:${gradientOneInX.toFixed(0)}`,
      threshold: `>= 1:${partH.minGradient}`,
      pass: gradientOneInX <= partH.minGradient,
      regulation: "Building Regulations Approved Document H",
    });
  }

  // Minimum design-flow velocity (BS EN 16933-2). This is a general minimum
  // that applies primarily to surface water / combined sewers which actually
  // run at or near full bore during design storms. Foul sewers are assessed
  // by the self-cleansing check at 1/3 depth above (0.75 m/s), as foul
  // sewers almost never run full bore. Retained here as an informational
  // sanity check on the full-bore velocity regardless of sewer type.
  checks.push({
    id: "min_velocity",
    label: "Minimum full-bore velocity (design flow — surface water / combined)",
    value: `${fullBoreVelocity.toFixed(2)} m/s`,
    threshold: ">= 0.7 m/s (foul sewers use self-cleansing check above)",
    pass: fullBoreVelocity >= 0.7,
    regulation: "BS EN 16933-2 / Sewerage Sector Guidance Appendix C",
  });

  return checks;
}

// ─── Proportional Flow Result ────────────────────────────────
export interface ProportionalResult {
  depthRatio: number;
  depthLabel: string;
  depthMM: number;
  velocity: number;
  flowLPS: number;
  areaM2: number;
}

export type CalcMethod = "colebrook_white" | "manning";
