// src/data/printable-paper.ts
// Comprehensive printable paper definitions — 200+ variations
// Categories: Square Grid, Dot Grid, Isometric, Hexagonal, Lined & Ruled,
// Engineering & Section, Logarithmic & Specialist, Polar & Radial, Surveying

// ─── Types ───────────────────────────────────────────────────────

export type PaperCategoryId =
  | "square-grid"
  | "dot-grid"
  | "isometric"
  | "hexagonal"
  | "lined-ruled"
  | "engineering-section"
  | "logarithmic-specialist"
  | "polar-radial"
  | "surveying";

export type PageSize = "a4" | "a3";
export type Orientation = "portrait" | "landscape";
export type MarginSize = "none" | "narrow" | "standard";
export type TitleBlockStyle = "none" | "corner" | "strip";
export type ScaleRulerPosition = "none" | "left" | "bottom" | "l-shape";
export type PaperTint = "white" | "cream" | "yellow" | "green" | "blue";

export interface PaperCategory {
  id: PaperCategoryId;
  label: string;
  description: string;
  icon: string;
  types: PaperType[];
}

export interface PaperType {
  id: string;
  name: string;
  description: string;
  defaultSpacing: number;
  spacingOptions: number[];
  allowCustomSpacing: boolean;
  minSpacing: number;
  maxSpacing: number;
  drawFn: string; // function name key for drawing logic
}

export interface PaperConfig {
  typeId: string;
  categoryId: PaperCategoryId;
  spacing: number;
  pageSize: PageSize;
  orientation: Orientation;
  marginSize: MarginSize;
  gridColor: string;
  paperTint: PaperTint;
  titleBlock: TitleBlockStyle;
  scaleRuler: ScaleRulerPosition;
  pageCount: number;
  titleBlockFields: {
    project: string;
    title: string;
    drawnBy: string;
    checkedBy: string;
    date: string;
    scale: string;
    revision: string;
    sheetNo: string;
    company: string;
  };
}

// ─── Page dimensions (mm) ────────────────────────────────────────

export const PAGE_DIMS: Record<PageSize, Record<Orientation, { w: number; h: number }>> = {
  a4: { portrait: { w: 210, h: 297 }, landscape: { w: 297, h: 210 } },
  a3: { portrait: { w: 297, h: 420 }, landscape: { w: 420, h: 297 } },
};

export const MARGINS: Record<MarginSize, number> = {
  none: 3,
  narrow: 5,
  standard: 10,
};

// ─── Colour presets ──────────────────────────────────────────────

export const GRID_COLOR_PRESETS = [
  { label: "Light Blue", value: "#A8D4E6" },
  { label: "Blue", value: "#5B9BD5" },
  { label: "Grey", value: "#B0B0B0" },
  { label: "Light Grey", value: "#D0D0D0" },
  { label: "Green", value: "#7FBF7F" },
  { label: "Sage", value: "#9CAF88" },
  { label: "Red", value: "#E07070" },
  { label: "Orange", value: "#E8A060" },
  { label: "Black", value: "#404040" },
  { label: "Cyan", value: "#70C8D0" },
  { label: "Purple", value: "#B090D0" },
  { label: "Teal", value: "#70B0A0" },
];

export const PAPER_TINT_COLORS: Record<PaperTint, string> = {
  white: "#FFFFFF",
  cream: "#FFF8ED",
  yellow: "#FFFDE0",
  green: "#F0F8F0",
  blue: "#F0F5FF",
};

export const PAPER_TINT_LABELS: Record<PaperTint, string> = {
  white: "White",
  cream: "Cream",
  yellow: "Yellow (Engineering Pad)",
  green: "Green (Computation Pad)",
  blue: "Light Blue",
};

// ─── Page count options ──────────────────────────────────────────

export const PAGE_COUNT_OPTIONS = [1, 10, 25, 50, 100];

// ─── Scale ruler scales ──────────────────────────────────────────

export const SCALE_RULER_SCALES = ["1:1", "1:5", "1:10", "1:20", "1:50", "1:100", "1:200", "1:250", "1:500", "1:1000", "1:1250", "1:2500"];

// ─── Categories & Paper Types ────────────────────────────────────

export const PAPER_CATEGORIES: PaperCategory[] = [
  {
    id: "square-grid",
    label: "Square Grid",
    description: "Standard square grid paper in various spacings from 1mm to 20mm",
    icon: "S",
    types: [
      { id: "sq-1mm", name: "1mm Grid", description: "Fine 1mm square grid", defaultSpacing: 1, spacingOptions: [1], allowCustomSpacing: false, minSpacing: 1, maxSpacing: 1, drawFn: "squareGrid" },
      { id: "sq-2mm", name: "2mm Grid", description: "2mm square grid", defaultSpacing: 2, spacingOptions: [2], allowCustomSpacing: false, minSpacing: 2, maxSpacing: 2, drawFn: "squareGrid" },
      { id: "sq-3mm", name: "3mm Grid", description: "3mm square grid", defaultSpacing: 3, spacingOptions: [3], allowCustomSpacing: false, minSpacing: 3, maxSpacing: 3, drawFn: "squareGrid" },
      { id: "sq-4mm", name: "4mm Grid", description: "4mm square grid", defaultSpacing: 4, spacingOptions: [4], allowCustomSpacing: false, minSpacing: 4, maxSpacing: 4, drawFn: "squareGrid" },
      { id: "sq-5mm", name: "5mm Grid", description: "Standard 5mm square grid - most common", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "squareGrid" },
      { id: "sq-6mm", name: "6mm Grid", description: "6mm square grid", defaultSpacing: 6, spacingOptions: [6], allowCustomSpacing: false, minSpacing: 6, maxSpacing: 6, drawFn: "squareGrid" },
      { id: "sq-7mm", name: "7mm Grid", description: "7mm square grid", defaultSpacing: 7, spacingOptions: [7], allowCustomSpacing: false, minSpacing: 7, maxSpacing: 7, drawFn: "squareGrid" },
      { id: "sq-8mm", name: "8mm Grid", description: "8mm square grid", defaultSpacing: 8, spacingOptions: [8], allowCustomSpacing: false, minSpacing: 8, maxSpacing: 8, drawFn: "squareGrid" },
      { id: "sq-10mm", name: "10mm Grid", description: "10mm square grid - 1cm", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "squareGrid" },
      { id: "sq-15mm", name: "15mm Grid", description: "15mm square grid", defaultSpacing: 15, spacingOptions: [15], allowCustomSpacing: false, minSpacing: 15, maxSpacing: 15, drawFn: "squareGrid" },
      { id: "sq-20mm", name: "20mm Grid", description: "20mm square grid - 2cm", defaultSpacing: 20, spacingOptions: [20], allowCustomSpacing: false, minSpacing: 20, maxSpacing: 20, drawFn: "squareGrid" },
      { id: "sq-custom", name: "Custom Grid", description: "Custom spacing square grid", defaultSpacing: 5, spacingOptions: [], allowCustomSpacing: true, minSpacing: 0.5, maxSpacing: 50, drawFn: "squareGrid" },
    ],
  },
  {
    id: "dot-grid",
    label: "Dot Grid",
    description: "Dot grid paper — clean, minimal dots at regular intervals",
    icon: "D",
    types: [
      { id: "dot-2mm", name: "2mm Dot Grid", description: "Fine 2mm dot grid", defaultSpacing: 2, spacingOptions: [2], allowCustomSpacing: false, minSpacing: 2, maxSpacing: 2, drawFn: "dotGrid" },
      { id: "dot-3mm", name: "3mm Dot Grid", description: "3mm dot grid", defaultSpacing: 3, spacingOptions: [3], allowCustomSpacing: false, minSpacing: 3, maxSpacing: 3, drawFn: "dotGrid" },
      { id: "dot-4mm", name: "4mm Dot Grid", description: "4mm dot grid", defaultSpacing: 4, spacingOptions: [4], allowCustomSpacing: false, minSpacing: 4, maxSpacing: 4, drawFn: "dotGrid" },
      { id: "dot-5mm", name: "5mm Dot Grid", description: "Standard 5mm dot grid", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "dotGrid" },
      { id: "dot-6mm", name: "6mm Dot Grid", description: "6mm dot grid", defaultSpacing: 6, spacingOptions: [6], allowCustomSpacing: false, minSpacing: 6, maxSpacing: 6, drawFn: "dotGrid" },
      { id: "dot-8mm", name: "8mm Dot Grid", description: "8mm dot grid", defaultSpacing: 8, spacingOptions: [8], allowCustomSpacing: false, minSpacing: 8, maxSpacing: 8, drawFn: "dotGrid" },
      { id: "dot-10mm", name: "10mm Dot Grid", description: "10mm dot grid", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "dotGrid" },
      { id: "dot-custom", name: "Custom Dot Grid", description: "Custom spacing dot grid", defaultSpacing: 5, spacingOptions: [], allowCustomSpacing: true, minSpacing: 1, maxSpacing: 30, drawFn: "dotGrid" },
    ],
  },
  {
    id: "isometric",
    label: "Isometric",
    description: "Isometric grid and dot paper for 3D sketching and axonometric drawings",
    icon: "I",
    types: [
      { id: "iso-5mm", name: "5mm Isometric Grid", description: "5mm isometric triangle grid", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "isometricGrid" },
      { id: "iso-7mm", name: "7mm Isometric Grid", description: "7mm isometric grid", defaultSpacing: 7, spacingOptions: [7], allowCustomSpacing: false, minSpacing: 7, maxSpacing: 7, drawFn: "isometricGrid" },
      { id: "iso-10mm", name: "10mm Isometric Grid", description: "10mm isometric grid", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "isometricGrid" },
      { id: "iso-dot-5mm", name: "5mm Isometric Dot", description: "5mm isometric dot grid", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "isometricDot" },
      { id: "iso-dot-10mm", name: "10mm Isometric Dot", description: "10mm isometric dot grid", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "isometricDot" },
      { id: "iso-custom", name: "Custom Isometric", description: "Custom spacing isometric grid", defaultSpacing: 10, spacingOptions: [], allowCustomSpacing: true, minSpacing: 3, maxSpacing: 30, drawFn: "isometricGrid" },
    ],
  },
  {
    id: "hexagonal",
    label: "Hexagonal",
    description: "Hexagonal grid paper for mapping, tiling, and organic patterns",
    icon: "H",
    types: [
      { id: "hex-5mm", name: "5mm Hexagonal", description: "5mm hexagonal grid", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "hexGrid" },
      { id: "hex-8mm", name: "8mm Hexagonal", description: "8mm hexagonal grid", defaultSpacing: 8, spacingOptions: [8], allowCustomSpacing: false, minSpacing: 8, maxSpacing: 8, drawFn: "hexGrid" },
      { id: "hex-10mm", name: "10mm Hexagonal", description: "10mm hexagonal grid", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "hexGrid" },
      { id: "hex-15mm", name: "15mm Hexagonal", description: "15mm hexagonal grid", defaultSpacing: 15, spacingOptions: [15], allowCustomSpacing: false, minSpacing: 15, maxSpacing: 15, drawFn: "hexGrid" },
      { id: "hex-20mm", name: "20mm Hexagonal", description: "20mm hexagonal grid", defaultSpacing: 20, spacingOptions: [20], allowCustomSpacing: false, minSpacing: 20, maxSpacing: 20, drawFn: "hexGrid" },
      { id: "hex-custom", name: "Custom Hexagonal", description: "Custom spacing hexagonal grid", defaultSpacing: 10, spacingOptions: [], allowCustomSpacing: true, minSpacing: 3, maxSpacing: 40, drawFn: "hexGrid" },
    ],
  },
  {
    id: "lined-ruled",
    label: "Lined & Ruled",
    description: "Lined and ruled paper — narrow, wide, college, Cornell notes, Gregg",
    icon: "L",
    types: [
      { id: "lined-5mm", name: "5mm Ruled", description: "5mm line spacing", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "lined" },
      { id: "lined-6mm", name: "6mm Ruled", description: "6mm line spacing - narrow ruled", defaultSpacing: 6, spacingOptions: [6], allowCustomSpacing: false, minSpacing: 6, maxSpacing: 6, drawFn: "lined" },
      { id: "lined-7mm", name: "7mm Ruled", description: "7mm line spacing - college ruled", defaultSpacing: 7, spacingOptions: [7], allowCustomSpacing: false, minSpacing: 7, maxSpacing: 7, drawFn: "lined" },
      { id: "lined-8mm", name: "8mm Ruled", description: "8mm line spacing - standard ruled", defaultSpacing: 8, spacingOptions: [8], allowCustomSpacing: false, minSpacing: 8, maxSpacing: 8, drawFn: "lined" },
      { id: "lined-9mm", name: "9mm Ruled", description: "9mm line spacing - wide ruled", defaultSpacing: 9, spacingOptions: [9], allowCustomSpacing: false, minSpacing: 9, maxSpacing: 9, drawFn: "lined" },
      { id: "lined-10mm", name: "10mm Ruled", description: "10mm line spacing - extra wide", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "lined" },
      { id: "lined-cornell", name: "Cornell Notes", description: "Cornell note-taking system with cue column and summary area", defaultSpacing: 7, spacingOptions: [7], allowCustomSpacing: false, minSpacing: 7, maxSpacing: 7, drawFn: "cornell" },
      { id: "lined-gregg", name: "Gregg Ruled", description: "Gregg ruled with centre vertical line for steno", defaultSpacing: 8, spacingOptions: [8], allowCustomSpacing: false, minSpacing: 8, maxSpacing: 8, drawFn: "gregg" },
      { id: "lined-music", name: "Music Staves", description: "Standard 5-line music staff paper", defaultSpacing: 8, spacingOptions: [8], allowCustomSpacing: false, minSpacing: 8, maxSpacing: 8, drawFn: "musicStaves" },
      { id: "lined-custom", name: "Custom Ruled", description: "Custom line spacing", defaultSpacing: 7, spacingOptions: [], allowCustomSpacing: true, minSpacing: 3, maxSpacing: 20, drawFn: "lined" },
    ],
  },
  {
    id: "engineering-section",
    label: "Engineering & Section",
    description: "Engineering computation paper, cross-section paper with bold grid lines",
    icon: "E",
    types: [
      { id: "eng-1-5", name: "1mm/5mm Section", description: "1mm fine grid with 5mm bold lines - UK standard", defaultSpacing: 1, spacingOptions: [1], allowCustomSpacing: false, minSpacing: 1, maxSpacing: 1, drawFn: "sectionGrid" },
      { id: "eng-1-5-10", name: "1mm/5mm/10mm Section", description: "1mm fine, 5mm medium, 10mm heavy bold lines", defaultSpacing: 1, spacingOptions: [1], allowCustomSpacing: false, minSpacing: 1, maxSpacing: 1, drawFn: "sectionGridTriple" },
      { id: "eng-2-10", name: "2mm/10mm Section", description: "2mm fine grid with 10mm bold lines", defaultSpacing: 2, spacingOptions: [2], allowCustomSpacing: false, minSpacing: 2, maxSpacing: 2, drawFn: "sectionGrid" },
      { id: "eng-5-10", name: "5mm/10mm Section", description: "5mm grid with 10mm bold lines", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "sectionGrid" },
      { id: "eng-5-25", name: "5mm/25mm Section", description: "5mm grid with 25mm bold lines", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "sectionGridCustomBold" },
      { id: "eng-computation", name: "Computation Pad", description: "Yellow engineering computation paper with 5mm grid and header area", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "computationPad" },
      { id: "eng-cross-section", name: "Cross-Section Paper", description: "Asymmetric cross-section paper for road/rail profiles", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "crossSection" },
    ],
  },
  {
    id: "logarithmic-specialist",
    label: "Logarithmic & Specialist",
    description: "Semi-log, log-log, probability, Weibull, Smith chart, and triangular paper",
    icon: "X",
    types: [
      { id: "log-semi-1", name: "Semi-Log (1 cycle)", description: "Semi-logarithmic - 1 decade on Y axis", defaultSpacing: 1, spacingOptions: [1], allowCustomSpacing: false, minSpacing: 1, maxSpacing: 1, drawFn: "semiLog" },
      { id: "log-semi-2", name: "Semi-Log (2 cycle)", description: "Semi-logarithmic - 2 decades on Y axis", defaultSpacing: 2, spacingOptions: [2], allowCustomSpacing: false, minSpacing: 2, maxSpacing: 2, drawFn: "semiLog" },
      { id: "log-semi-3", name: "Semi-Log (3 cycle)", description: "Semi-logarithmic - 3 decades on Y axis", defaultSpacing: 3, spacingOptions: [3], allowCustomSpacing: false, minSpacing: 3, maxSpacing: 3, drawFn: "semiLog" },
      { id: "log-semi-4", name: "Semi-Log (4 cycle)", description: "Semi-logarithmic - 4 decades on Y axis", defaultSpacing: 4, spacingOptions: [4], allowCustomSpacing: false, minSpacing: 4, maxSpacing: 4, drawFn: "semiLog" },
      { id: "log-semi-5", name: "Semi-Log (5 cycle)", description: "Semi-logarithmic - 5 decades on Y axis", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "semiLog" },
      { id: "log-log-2x2", name: "Log-Log (2x2)", description: "Full logarithmic - 2 decades each axis", defaultSpacing: 2, spacingOptions: [2], allowCustomSpacing: false, minSpacing: 2, maxSpacing: 2, drawFn: "logLog" },
      { id: "log-log-3x3", name: "Log-Log (3x3)", description: "Full logarithmic - 3 decades each axis", defaultSpacing: 3, spacingOptions: [3], allowCustomSpacing: false, minSpacing: 3, maxSpacing: 3, drawFn: "logLog" },
      { id: "log-log-4x4", name: "Log-Log (4x4)", description: "Full logarithmic - 4 decades each axis", defaultSpacing: 4, spacingOptions: [4], allowCustomSpacing: false, minSpacing: 4, maxSpacing: 4, drawFn: "logLog" },
      { id: "spec-probability", name: "Normal Probability", description: "Normal (Gaussian) probability paper", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "normalProbability" },
      { id: "spec-weibull", name: "Weibull Probability", description: "Weibull probability paper for reliability analysis", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "weibullProbability" },
      { id: "spec-gumbel", name: "Gumbel Probability", description: "Gumbel extreme value probability paper", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "gumbelProbability" },
      { id: "spec-smith", name: "Smith Chart", description: "Smith chart for impedance/admittance (RF engineering)", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "smithChart" },
      { id: "spec-triangular", name: "Triangular (Ternary)", description: "Equilateral triangular paper for ternary phase diagrams", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "triangular" },
      { id: "spec-perspective-1pt", name: "1-Point Perspective", description: "One-point perspective grid", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "perspective1pt" },
      { id: "spec-perspective-2pt", name: "2-Point Perspective", description: "Two-point perspective grid", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "perspective2pt" },
    ],
  },
  {
    id: "polar-radial",
    label: "Polar & Radial",
    description: "Polar coordinate paper, radial grids, compass roses",
    icon: "P",
    types: [
      { id: "polar-10deg", name: "Polar 10 Degree", description: "Polar grid with 10-degree divisions", defaultSpacing: 10, spacingOptions: [10], allowCustomSpacing: false, minSpacing: 10, maxSpacing: 10, drawFn: "polarGrid" },
      { id: "polar-15deg", name: "Polar 15 Degree", description: "Polar grid with 15-degree divisions", defaultSpacing: 15, spacingOptions: [15], allowCustomSpacing: false, minSpacing: 15, maxSpacing: 15, drawFn: "polarGrid" },
      { id: "polar-30deg", name: "Polar 30 Degree", description: "Polar grid with 30-degree divisions", defaultSpacing: 30, spacingOptions: [30], allowCustomSpacing: false, minSpacing: 30, maxSpacing: 30, drawFn: "polarGrid" },
      { id: "polar-5deg", name: "Polar 5 Degree (Fine)", description: "Polar grid with 5-degree divisions - fine detail", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "polarGrid" },
      { id: "polar-compass", name: "Compass Rose", description: "Compass rose with cardinal and ordinal directions", defaultSpacing: 15, spacingOptions: [15], allowCustomSpacing: false, minSpacing: 15, maxSpacing: 15, drawFn: "compassRose" },
      { id: "polar-custom", name: "Custom Polar", description: "Custom degree divisions", defaultSpacing: 10, spacingOptions: [], allowCustomSpacing: true, minSpacing: 1, maxSpacing: 45, drawFn: "polarGrid" },
    ],
  },
  {
    id: "surveying",
    label: "Surveying",
    description: "Level book, chainbook, traverse, and setting-out record sheets",
    icon: "V",
    types: [
      { id: "surv-level", name: "Level Book", description: "Standard level book page with BS/IS/FS/HPC/RL columns", defaultSpacing: 8, spacingOptions: [8], allowCustomSpacing: false, minSpacing: 8, maxSpacing: 8, drawFn: "levelBook" },
      { id: "surv-level-rise-fall", name: "Level Book (Rise & Fall)", description: "Level book with rise and fall method columns", defaultSpacing: 8, spacingOptions: [8], allowCustomSpacing: false, minSpacing: 8, maxSpacing: 8, drawFn: "levelBookRiseFall" },
      { id: "surv-chainbook", name: "Chainbook", description: "Field chainbook page for linear survey notes", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "chainbook" },
      { id: "surv-traverse", name: "Traverse Sheet", description: "Traverse computation sheet with angle/distance/easting/northing columns", defaultSpacing: 8, spacingOptions: [8], allowCustomSpacing: false, minSpacing: 8, maxSpacing: 8, drawFn: "traverseSheet" },
      { id: "surv-setting-out", name: "Setting Out Record", description: "Setting out record with point/easting/northing/level/checked columns", defaultSpacing: 8, spacingOptions: [8], allowCustomSpacing: false, minSpacing: 8, maxSpacing: 8, drawFn: "settingOutRecord" },
      { id: "surv-cross-section", name: "Cross-Section Survey", description: "Cross-section survey sheet with chainage and offset columns", defaultSpacing: 5, spacingOptions: [5], allowCustomSpacing: false, minSpacing: 5, maxSpacing: 5, drawFn: "crossSectionSurvey" },
    ],
  },
];

// ─── Default config ──────────────────────────────────────────────

export function defaultConfig(): PaperConfig {
  return {
    typeId: "sq-5mm",
    categoryId: "square-grid",
    spacing: 5,
    pageSize: "a4",
    orientation: "portrait",
    marginSize: "narrow",
    gridColor: "#A8D4E6",
    paperTint: "white",
    titleBlock: "none",
    scaleRuler: "none",
    pageCount: 1,
    titleBlockFields: {
      project: "", title: "", drawnBy: "", checkedBy: "",
      date: "", scale: "", revision: "", sheetNo: "", company: "",
    },
  };
}

// ─── Get category by ID ──────────────────────────────────────────

export function getCategoryById(id: PaperCategoryId): PaperCategory | undefined {
  return PAPER_CATEGORIES.find(c => c.id === id);
}

export function getTypeById(typeId: string): { category: PaperCategory; type: PaperType } | undefined {
  for (const cat of PAPER_CATEGORIES) {
    const t = cat.types.find(tp => tp.id === typeId);
    if (t) return { category: cat, type: t };
  }
  return undefined;
}

// ─── Total variation count ───────────────────────────────────────

export function totalVariationCount(): number {
  const typeCount = PAPER_CATEGORIES.reduce((sum, c) => sum + c.types.length, 0);
  // types x sizes x orientations x margins x tints
  return typeCount * 2 * 2 * 3 * 5;
}

// ─── SEO category slugs ─────────────────────────────────────────

export const CATEGORY_SLUGS: Record<PaperCategoryId, string> = {
  "square-grid": "square-grid",
  "dot-grid": "dot-grid",
  "isometric": "isometric",
  "hexagonal": "hexagonal",
  "lined-ruled": "lined-ruled",
  "engineering-section": "engineering-section",
  "logarithmic-specialist": "logarithmic-specialist",
  "polar-radial": "polar-radial",
  "surveying": "surveying",
};

// ─── FAQ ─────────────────────────────────────────────────────────

export const FAQ_ITEMS = [
  {
    q: "How do I print these papers at the correct scale?",
    a: "In your browser print dialog, set Scale to 100% (or 'Actual Size'). Set margins to 'None' or 'Minimum'. Ensure 'Fit to Page' is NOT selected. This ensures grids print at exactly the specified spacing.",
  },
  {
    q: "What page sizes are available?",
    a: "A4 (210 x 297mm) and A3 (297 x 420mm), both in portrait and landscape orientation.",
  },
  {
    q: "Can I print multiple pages at once?",
    a: "Yes, select the number of pages (1, 10, 25, 50, or 100) before downloading. The PDF will contain that many identical sheets, perfect for printing a pad.",
  },
  {
    q: "What is section paper?",
    a: "Section paper (also called cross-section paper or graph paper) has a fine grid (usually 1mm) with bolder lines at regular intervals (5mm and/or 10mm). It is used for engineering drawings, cross-sections, and technical sketches.",
  },
  {
    q: "What is the difference between semi-log and log-log paper?",
    a: "Semi-log paper has one logarithmic axis and one linear axis. Log-log paper has both axes logarithmic. Semi-log is used for exponential relationships; log-log is used for power-law relationships.",
  },
  {
    q: "What is a Smith chart?",
    a: "A Smith chart is a graphical tool used in RF engineering to represent impedance, admittance, and other parameters of transmission lines and matching circuits.",
  },
  {
    q: "What is a title block?",
    a: "A title block is a bordered panel (usually bottom-right corner or bottom strip) containing project information: project name, drawing title, drawn by, checked by, date, scale, revision, and sheet number. It follows BS EN ISO 5457 standards.",
  },
  {
    q: "Are these papers really free?",
    a: "Yes, completely free with no sign-up required. Generate and download as many sheets as you need. We only include a small 'ebrora.com' watermark in light grey.",
  },
  {
    q: "Can I use these for commercial projects?",
    a: "Yes. These papers are free for personal and commercial use. Print them for site use, include them in project folders, or distribute to your team.",
  },
  {
    q: "What is a level book page?",
    a: "A level book page is a tabular form used by surveyors for recording levelling observations. It includes columns for backsight (BS), intermediate sight (IS), foresight (FS), height of plane of collimation (HPC), reduced level (RL), distance, and remarks.",
  },
];
