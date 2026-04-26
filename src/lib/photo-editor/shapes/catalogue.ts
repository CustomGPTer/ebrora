// src/lib/photo-editor/shapes/catalogue.ts
//
// Custom shape catalogue — ~60 hand-authored SVG paths across five
// categories. Each entry owns its own viewBox; ShapeNode scales the path
// to fill the layer's width × height at render time via Konva.Path's
// scaleX / scaleY.
//
// Path conventions:
//   • Most shapes use a 100×100 viewBox so the math reads as percentages.
//   • Shapes with a strongly non-square natural aspect (banners, wave,
//     divider) declare a wider viewBox AND set defaultSize so they land
//     on canvas at a sensible aspect.
//   • Paths use uppercase command letters (absolute coords) throughout to
//     keep them legible. No SMIL, no transforms — straight `d` strings.
//   • Stars / polygons are pre-computed at integer-rounded coords; tiny
//     visual rounding is acceptable.
//
// Built-in shapeIds (rect / ellipse / circle / line / triangle / star)
// stay handled by ShapeNode's existing primitive switch — they don't go
// through this catalogue. The catalogue is the data source for the new
// "custom-svg" branch ShapeNode adds in Session 6.
//
// All shape ids must be unique across the catalogue. They form the
// `shapeId` field on ShapeLayer.

export type ShapeCategoryId =
  | "geometric"
  | "arrows"
  | "badges"
  | "frames"
  | "decorative";

export interface ShapeCategory {
  id: ShapeCategoryId;
  label: string;
  count: number;
}

export interface ShapeEntry {
  id: string;
  label: string;
  category: ShapeCategoryId;
  /** SVG viewBox — "minX minY width height". */
  viewBox: string;
  /** SVG path `d` attribute. Stroke + fill applied at render time. */
  path: string;
  /** Optional default layer dimensions (in canvas pixels) when the user
   *  taps the shape in the panel. Falls back to 240×240. */
  defaultSize?: { width: number; height: number };
}

// ─── Geometric ──────────────────────────────────────────────────
//
// 18 entries. The handover lists rectangle / square / ellipse / circle
// among them — those overlap with ShapeNode's built-in primitives, so we
// don't ship them again here (they're available via the legacy stub
// shape ids `rect`, `ellipse`, etc., and the panel can surface them
// alongside the catalogue).
//
// What's here: pentagon / hexagon / octagon, the three star variants,
// heart, diamond, parallelogram, trapezoid, ring, arc, half-circle,
// pill, plus, cross, chevron-block, and rounded-rect.

const GEOMETRIC: readonly ShapeEntry[] = [
  {
    id: "pentagon",
    label: "Pentagon",
    category: "geometric",
    viewBox: "0 0 100 100",
    path: "M50 4 L96 38 L78 92 L22 92 L4 38 Z",
  },
  {
    id: "hexagon",
    label: "Hexagon",
    category: "geometric",
    viewBox: "0 0 100 100",
    path: "M25 7 L75 7 L97 50 L75 93 L25 93 L3 50 Z",
  },
  {
    id: "octagon",
    label: "Octagon",
    category: "geometric",
    viewBox: "0 0 100 100",
    path: "M30 4 L70 4 L96 30 L96 70 L70 96 L30 96 L4 70 L4 30 Z",
  },
  {
    id: "star-5",
    label: "Star 5-point",
    category: "geometric",
    viewBox: "0 0 100 100",
    path:
      "M50 4 L61 37 L96 37 L68 58 L79 92 L50 71 L21 92 L32 58 L4 37 L39 37 Z",
  },
  {
    id: "star-6",
    label: "Star 6-point",
    category: "geometric",
    viewBox: "0 0 100 100",
    path:
      "M50 4 L62 32 L93 32 L68 53 L78 84 L50 65 L22 84 L32 53 L7 32 L38 32 Z",
  },
  {
    id: "star-8",
    label: "Star 8-point",
    category: "geometric",
    viewBox: "0 0 100 100",
    path:
      "M50 4 L60 25 L84 16 L75 40 L96 50 L75 60 L84 84 L60 75 L50 96 L40 75 L16 84 L25 60 L4 50 L25 40 L16 16 L40 25 Z",
  },
  {
    id: "heart",
    label: "Heart",
    category: "geometric",
    viewBox: "0 0 100 100",
    path:
      "M50 90 C50 90 8 64 8 36 C8 18 22 8 36 14 C42 16 47 21 50 28 C53 21 58 16 64 14 C78 8 92 18 92 36 C92 64 50 90 50 90 Z",
  },
  {
    id: "diamond",
    label: "Diamond",
    category: "geometric",
    viewBox: "0 0 100 100",
    path: "M50 4 L96 50 L50 96 L4 50 Z",
  },
  {
    id: "parallelogram",
    label: "Parallelogram",
    category: "geometric",
    viewBox: "0 0 100 100",
    path: "M22 18 L96 18 L78 82 L4 82 Z",
  },
  {
    id: "trapezoid",
    label: "Trapezoid",
    category: "geometric",
    viewBox: "0 0 100 100",
    path: "M22 22 L78 22 L96 82 L4 82 Z",
  },
  {
    id: "ring",
    label: "Ring",
    category: "geometric",
    viewBox: "0 0 100 100",
    // Outer circle followed by inner circle with reverse winding (even-odd).
    path:
      "M50 4 A46 46 0 1 0 50 96 A46 46 0 1 0 50 4 Z M50 26 A24 24 0 1 1 50 74 A24 24 0 1 1 50 26 Z",
  },
  {
    id: "arc",
    label: "Arc",
    category: "geometric",
    viewBox: "0 0 100 100",
    path: "M6 90 A44 44 0 0 1 94 90 L78 90 A28 28 0 0 0 22 90 Z",
  },
  {
    id: "half-circle",
    label: "Half circle",
    category: "geometric",
    viewBox: "0 0 100 100",
    path: "M4 50 A46 46 0 0 1 96 50 L4 50 Z",
  },
  {
    id: "pill",
    label: "Pill",
    category: "geometric",
    viewBox: "0 0 100 100",
    path: "M30 14 L70 14 A36 36 0 0 1 70 86 L30 86 A36 36 0 0 1 30 14 Z",
    defaultSize: { width: 320, height: 160 },
  },
  {
    id: "rounded-rect",
    label: "Rounded rectangle",
    category: "geometric",
    viewBox: "0 0 100 100",
    path:
      "M16 6 L84 6 A10 10 0 0 1 94 16 L94 84 A10 10 0 0 1 84 94 L16 94 A10 10 0 0 1 6 84 L6 16 A10 10 0 0 1 16 6 Z",
  },
  {
    id: "plus",
    label: "Plus",
    category: "geometric",
    viewBox: "0 0 100 100",
    path:
      "M38 6 L62 6 L62 38 L94 38 L94 62 L62 62 L62 94 L38 94 L38 62 L6 62 L6 38 L38 38 Z",
  },
  {
    id: "cross",
    label: "Cross",
    category: "geometric",
    viewBox: "0 0 100 100",
    path:
      "M40 6 L60 6 L60 40 L94 40 L94 60 L60 60 L60 94 L40 94 L40 60 L6 60 L6 40 L40 40 Z",
  },
  {
    id: "chevron-block",
    label: "Chevron block",
    category: "geometric",
    viewBox: "0 0 100 100",
    path: "M4 4 L72 4 L96 50 L72 96 L4 96 L28 50 Z",
  },
];

// ─── Arrows ─────────────────────────────────────────────────────
//
// 12 entries. Wide arrows (left/right/up/down) use a 100×100 box; their
// natural aspect on canvas is rectangular so we ship a defaultSize that
// looks balanced when first inserted. Diagonal arrows are square.

const ARROWS: readonly ShapeEntry[] = [
  {
    id: "arrow-right",
    label: "Arrow right",
    category: "arrows",
    viewBox: "0 0 100 100",
    path: "M4 38 L60 38 L60 18 L96 50 L60 82 L60 62 L4 62 Z",
    defaultSize: { width: 320, height: 160 },
  },
  {
    id: "arrow-left",
    label: "Arrow left",
    category: "arrows",
    viewBox: "0 0 100 100",
    path: "M96 38 L40 38 L40 18 L4 50 L40 82 L40 62 L96 62 Z",
    defaultSize: { width: 320, height: 160 },
  },
  {
    id: "arrow-up",
    label: "Arrow up",
    category: "arrows",
    viewBox: "0 0 100 100",
    path: "M62 96 L62 40 L82 40 L50 4 L18 40 L38 40 L38 96 Z",
    defaultSize: { width: 160, height: 320 },
  },
  {
    id: "arrow-down",
    label: "Arrow down",
    category: "arrows",
    viewBox: "0 0 100 100",
    path: "M62 4 L62 60 L82 60 L50 96 L18 60 L38 60 L38 4 Z",
    defaultSize: { width: 160, height: 320 },
  },
  {
    id: "arrow-up-right",
    label: "Arrow up-right",
    category: "arrows",
    viewBox: "0 0 100 100",
    path: "M30 96 L66 60 L48 42 L96 30 L84 78 L66 60 L30 96 Z",
  },
  {
    id: "arrow-down-left",
    label: "Arrow down-left",
    category: "arrows",
    viewBox: "0 0 100 100",
    path: "M70 4 L34 40 L52 58 L4 70 L16 22 L34 40 L70 4 Z",
  },
  {
    id: "double-arrow-h",
    label: "Double arrow horizontal",
    category: "arrows",
    viewBox: "0 0 100 100",
    path:
      "M4 50 L24 30 L24 42 L76 42 L76 30 L96 50 L76 70 L76 58 L24 58 L24 70 Z",
    defaultSize: { width: 360, height: 120 },
  },
  {
    id: "double-arrow-v",
    label: "Double arrow vertical",
    category: "arrows",
    viewBox: "0 0 100 100",
    path:
      "M50 4 L70 24 L58 24 L58 76 L70 76 L50 96 L30 76 L42 76 L42 24 L30 24 Z",
    defaultSize: { width: 120, height: 360 },
  },
  {
    id: "curved-arrow-right",
    label: "Curved arrow right",
    category: "arrows",
    viewBox: "0 0 100 100",
    path:
      "M10 90 C10 50 40 22 70 22 L70 6 L96 32 L70 56 L70 42 C50 42 30 60 30 90 Z",
  },
  {
    id: "u-turn",
    label: "U-turn",
    category: "arrows",
    viewBox: "0 0 100 100",
    path:
      "M16 90 L16 50 A24 24 0 0 1 64 50 L64 70 L48 70 L70 96 L92 70 L76 70 L76 50 A36 36 0 0 0 4 50 L4 90 Z",
  },
  {
    id: "chevron-right",
    label: "Chevron right",
    category: "arrows",
    viewBox: "0 0 100 100",
    path: "M28 8 L68 50 L28 92 L40 92 L80 50 L40 8 Z",
  },
  {
    id: "chevron-left",
    label: "Chevron left",
    category: "arrows",
    viewBox: "0 0 100 100",
    path: "M72 8 L32 50 L72 92 L60 92 L20 50 L60 8 Z",
  },
];

// ─── Badges ─────────────────────────────────────────────────────
//
// 8 entries. Banners are wide; badges are roughly square. The shield
// uses a slightly taller aspect.

const BADGES: readonly ShapeEntry[] = [
  {
    id: "ribbon-banner",
    label: "Ribbon banner",
    category: "badges",
    viewBox: "0 0 200 60",
    path:
      "M0 30 L20 8 L180 8 L200 30 L180 52 L20 52 Z M20 8 L36 30 L20 52 Z M180 8 L164 30 L180 52 Z",
    defaultSize: { width: 480, height: 144 },
  },
  {
    id: "scroll-banner",
    label: "Scroll banner",
    category: "badges",
    viewBox: "0 0 200 80",
    path:
      "M0 12 Q12 4 24 12 L176 12 Q188 4 200 12 L188 40 Q200 60 176 68 L24 68 Q0 60 12 40 Z",
    defaultSize: { width: 480, height: 192 },
  },
  {
    id: "sale-tag",
    label: "Sale tag",
    category: "badges",
    viewBox: "0 0 100 100",
    path:
      "M4 30 L42 4 L96 4 L96 58 L70 96 L4 30 Z M76 24 A8 8 0 1 1 76 40 A8 8 0 1 1 76 24 Z",
  },
  {
    id: "hex-badge",
    label: "Hex badge",
    category: "badges",
    viewBox: "0 0 100 100",
    path:
      "M50 4 L92 28 L92 72 L50 96 L8 72 L8 28 Z M50 16 L82 34 L82 66 L50 84 L18 66 L18 34 Z",
  },
  {
    id: "starburst-badge",
    label: "Starburst badge",
    category: "badges",
    viewBox: "0 0 100 100",
    // 12-point starburst: alternating long / short radii.
    path:
      "M50 2 L57 18 L70 8 L68 25 L84 18 L76 33 L92 32 L80 44 L96 50 L80 56 L92 68 L76 67 L84 82 L68 75 L70 92 L57 82 L50 98 L43 82 L30 92 L32 75 L16 82 L24 67 L8 68 L20 56 L4 50 L20 44 L8 32 L24 33 L16 18 L32 25 L30 8 L43 18 Z",
  },
  {
    id: "shield",
    label: "Shield",
    category: "badges",
    viewBox: "0 0 100 100",
    path:
      "M50 4 L92 14 L92 50 C92 74 74 90 50 96 C26 90 8 74 8 50 L8 14 Z",
  },
  {
    id: "seal",
    label: "Seal",
    category: "badges",
    viewBox: "0 0 100 100",
    // 16-point seal — wavy round edge.
    path:
      "M50 4 L56 8 L62 4 L66 10 L72 8 L74 14 L82 14 L82 22 L88 26 L84 32 L92 36 L86 42 L92 48 L84 54 L92 60 L82 64 L82 72 L74 72 L72 80 L66 78 L62 84 L56 80 L50 86 L44 80 L38 84 L34 78 L28 80 L26 72 L18 72 L18 64 L8 60 L16 54 L8 48 L14 42 L8 36 L16 32 L12 26 L18 22 L18 14 L26 14 L28 8 L34 10 L38 4 L44 8 Z",
  },
  {
    id: "certificate-frame",
    label: "Certificate frame",
    category: "badges",
    viewBox: "0 0 200 140",
    path:
      "M4 4 L196 4 L196 116 L120 116 L100 136 L80 116 L4 116 Z M14 14 L186 14 L186 106 L14 106 Z",
    defaultSize: { width: 480, height: 336 },
  },
];

// ─── Frames ─────────────────────────────────────────────────────
//
// 10 entries. Frames have a hollow centre — the user's content sits
// behind / inside the frame. They render as filled paths with even-odd
// winding for the inner cut-out, OR as outlined-only shapes (no inner
// cut-out, just a stroke) for the line-style frames.

const FRAMES: readonly ShapeEntry[] = [
  {
    id: "frame-thin",
    label: "Thin border",
    category: "frames",
    viewBox: "0 0 100 100",
    path:
      "M0 0 L100 0 L100 100 L0 100 Z M2 2 L2 98 L98 98 L98 2 Z",
  },
  {
    id: "frame-thick",
    label: "Thick border",
    category: "frames",
    viewBox: "0 0 100 100",
    path:
      "M0 0 L100 0 L100 100 L0 100 Z M8 8 L8 92 L92 92 L92 8 Z",
  },
  {
    id: "frame-rounded",
    label: "Rounded border",
    category: "frames",
    viewBox: "0 0 100 100",
    path:
      "M10 0 L90 0 A10 10 0 0 1 100 10 L100 90 A10 10 0 0 1 90 100 L10 100 A10 10 0 0 1 0 90 L0 10 A10 10 0 0 1 10 0 Z M14 4 A10 10 0 0 0 4 14 L4 86 A10 10 0 0 0 14 96 L86 96 A10 10 0 0 0 96 86 L96 14 A10 10 0 0 0 86 4 Z",
  },
  {
    id: "frame-double",
    label: "Double-line border",
    category: "frames",
    viewBox: "0 0 100 100",
    path:
      "M0 0 L100 0 L100 100 L0 100 Z M2 2 L2 98 L98 98 L98 2 Z M6 6 L94 6 L94 94 L6 94 Z M8 8 L8 92 L92 92 L92 8 Z",
  },
  {
    id: "frame-dashed",
    label: "Dashed border",
    category: "frames",
    viewBox: "0 0 100 100",
    // 12 dashes per side.
    path:
      "M0 0 L8 0 L8 4 L0 4 Z M16 0 L24 0 L24 4 L16 4 Z M32 0 L40 0 L40 4 L32 4 Z M48 0 L56 0 L56 4 L48 4 Z M64 0 L72 0 L72 4 L64 4 Z M80 0 L88 0 L88 4 L80 4 Z M96 0 L100 0 L100 8 L96 8 Z M96 16 L100 16 L100 24 L96 24 Z M96 32 L100 32 L100 40 L96 40 Z M96 48 L100 48 L100 56 L96 56 Z M96 64 L100 64 L100 72 L96 72 Z M96 80 L100 80 L100 88 L96 88 Z M96 96 L100 96 L100 100 L92 100 Z M84 96 L92 96 L92 100 L84 100 Z M68 96 L76 96 L76 100 L68 100 Z M52 96 L60 96 L60 100 L52 100 Z M36 96 L44 96 L44 100 L36 100 Z M20 96 L28 96 L28 100 L20 100 Z M4 96 L12 96 L12 100 L0 100 L0 92 L4 92 Z M0 76 L4 76 L4 84 L0 84 Z M0 60 L4 60 L4 68 L0 68 Z M0 44 L4 44 L4 52 L0 52 Z M0 28 L4 28 L4 36 L0 36 Z M0 12 L4 12 L4 20 L0 20 Z",
  },
  {
    id: "frame-corners",
    label: "L-corners",
    category: "frames",
    viewBox: "0 0 100 100",
    path:
      "M0 0 L30 0 L30 4 L4 4 L4 30 L0 30 Z M70 0 L100 0 L100 30 L96 30 L96 4 L70 4 Z M0 70 L4 70 L4 96 L30 96 L30 100 L0 100 Z M70 100 L70 96 L96 96 L96 70 L100 70 L100 100 Z",
  },
  {
    id: "frame-corner-tl",
    label: "Corner top-left",
    category: "frames",
    viewBox: "0 0 100 100",
    path:
      "M0 0 L60 0 L60 4 L4 4 L4 60 L0 60 Z M0 0 L40 0 L40 8 L8 8 L8 40 L0 40 Z",
  },
  {
    id: "frame-corner-tr",
    label: "Corner top-right",
    category: "frames",
    viewBox: "0 0 100 100",
    path:
      "M40 0 L100 0 L100 60 L96 60 L96 4 L40 4 Z M60 0 L100 0 L100 40 L92 40 L92 8 L60 8 Z",
  },
  {
    id: "frame-corner-bl",
    label: "Corner bottom-left",
    category: "frames",
    viewBox: "0 0 100 100",
    path:
      "M0 40 L4 40 L4 96 L60 96 L60 100 L0 100 Z M0 60 L8 60 L8 92 L40 92 L40 100 L0 100 Z",
  },
  {
    id: "frame-corner-br",
    label: "Corner bottom-right",
    category: "frames",
    viewBox: "0 0 100 100",
    path:
      "M96 40 L100 40 L100 100 L40 100 L40 96 L96 96 Z M92 60 L100 60 L100 100 L60 100 L60 92 L92 92 Z",
  },
];

// ─── Decorative ─────────────────────────────────────────────────
//
// 12 entries. Stroke-on-fill organic shapes for accents and dividers.

const DECORATIVE: readonly ShapeEntry[] = [
  {
    id: "wave",
    label: "Wave",
    category: "decorative",
    viewBox: "0 0 200 60",
    path:
      "M0 36 Q25 4 50 36 T100 36 T150 36 T200 36 L200 60 L0 60 Z",
    defaultSize: { width: 480, height: 144 },
  },
  {
    id: "zigzag",
    label: "Zig-zag",
    category: "decorative",
    viewBox: "0 0 200 40",
    path:
      "M0 20 L20 4 L40 20 L60 4 L80 20 L100 4 L120 20 L140 4 L160 20 L180 4 L200 20 L200 36 L180 20 L160 36 L140 20 L120 36 L100 20 L80 36 L60 20 L40 36 L20 20 L0 36 Z",
    defaultSize: { width: 480, height: 96 },
  },
  {
    id: "scribble",
    label: "Scribble",
    category: "decorative",
    viewBox: "0 0 200 60",
    path:
      "M0 30 C20 8 40 52 60 30 C80 8 100 52 120 30 C140 8 160 52 180 30 C190 18 198 24 200 30 L200 36 C198 30 190 24 180 36 C160 58 140 14 120 36 C100 58 80 14 60 36 C40 58 20 14 0 36 Z",
    defaultSize: { width: 480, height: 144 },
  },
  {
    id: "brushstroke",
    label: "Brushstroke",
    category: "decorative",
    viewBox: "0 0 200 60",
    path:
      "M4 40 C40 20 80 24 120 30 C150 34 175 32 196 36 C196 38 196 42 196 44 C172 50 144 50 116 46 C84 42 48 46 12 52 Z",
    defaultSize: { width: 480, height: 144 },
  },
  {
    id: "splatter",
    label: "Splatter",
    category: "decorative",
    viewBox: "0 0 100 100",
    path:
      "M50 30 C40 20 24 22 22 36 C16 38 6 46 12 56 C8 64 14 78 26 76 C30 88 50 88 56 78 C68 84 84 76 80 64 C92 60 92 44 80 40 C84 28 70 18 60 24 C58 14 46 14 50 30 Z M84 14 A4 4 0 1 1 84 22 A4 4 0 1 1 84 14 Z M16 18 A3 3 0 1 1 16 24 A3 3 0 1 1 16 18 Z M90 84 A3 3 0 1 1 90 90 A3 3 0 1 1 90 84 Z M10 86 A2 2 0 1 1 10 90 A2 2 0 1 1 10 86 Z",
  },
  {
    id: "burst",
    label: "Burst",
    category: "decorative",
    viewBox: "0 0 100 100",
    // 16-ray burst.
    path:
      "M50 0 L54 38 L82 8 L66 42 L100 30 L72 50 L100 70 L66 58 L82 92 L54 62 L50 100 L46 62 L18 92 L34 58 L0 70 L28 50 L0 30 L34 42 L18 8 L46 38 Z",
  },
  {
    id: "leaf",
    label: "Leaf",
    category: "decorative",
    viewBox: "0 0 100 100",
    path:
      "M14 86 C14 50 40 14 90 10 C86 60 50 86 14 86 Z M22 78 C40 60 58 42 80 26",
  },
  {
    id: "flower-simple",
    label: "Flower",
    category: "decorative",
    viewBox: "0 0 100 100",
    // 6-petal flower with centre.
    path:
      "M50 6 C66 6 66 38 50 38 C34 38 34 6 50 6 Z M82 24 C92 36 64 56 56 44 C50 32 70 18 82 24 Z M82 76 C72 88 50 64 60 54 C70 44 92 60 82 76 Z M50 94 C34 94 34 62 50 62 C66 62 66 94 50 94 Z M18 76 C8 64 30 44 40 54 C50 64 28 88 18 76 Z M18 24 C30 12 50 32 44 44 C36 56 8 36 18 24 Z M50 42 A8 8 0 1 1 50 58 A8 8 0 1 1 50 42 Z",
  },
  {
    id: "sparkle",
    label: "Sparkle",
    category: "decorative",
    viewBox: "0 0 100 100",
    // 4-point sparkle (sharp diamond cross).
    path: "M50 4 L56 44 L96 50 L56 56 L50 96 L44 56 L4 50 L44 44 Z",
  },
  {
    id: "divider-line",
    label: "Divider line",
    category: "decorative",
    viewBox: "0 0 200 20",
    path:
      "M0 8 L80 8 L80 4 L88 12 L80 20 L80 16 L0 16 Z M120 4 L128 12 L120 20 L200 12 L200 8 L120 4 Z M96 6 L104 14 L100 20 L92 12 Z",
    defaultSize: { width: 480, height: 48 },
  },
  {
    id: "swoosh",
    label: "Swoosh",
    category: "decorative",
    viewBox: "0 0 200 100",
    path:
      "M0 80 C30 80 60 60 100 40 C140 20 170 16 200 16 L200 26 C172 26 144 30 110 48 C76 66 50 90 0 90 Z",
    defaultSize: { width: 480, height: 240 },
  },
  {
    id: "dot-pattern",
    label: "Dot row",
    category: "decorative",
    viewBox: "0 0 200 20",
    path:
      "M10 10 A6 6 0 1 1 10 10.01 Z M40 10 A6 6 0 1 1 40 10.01 Z M70 10 A6 6 0 1 1 70 10.01 Z M100 10 A6 6 0 1 1 100 10.01 Z M130 10 A6 6 0 1 1 130 10.01 Z M160 10 A6 6 0 1 1 160 10.01 Z M190 10 A6 6 0 1 1 190 10.01 Z",
    defaultSize: { width: 480, height: 48 },
  },
];

// ─── Public exports ─────────────────────────────────────────────

export const SHAPE_CATEGORIES: readonly ShapeCategory[] = [
  { id: "geometric",  label: "Geometric",  count: GEOMETRIC.length },
  { id: "arrows",     label: "Arrows",     count: ARROWS.length },
  { id: "badges",     label: "Badges",     count: BADGES.length },
  { id: "frames",     label: "Frames",     count: FRAMES.length },
  { id: "decorative", label: "Decorative", count: DECORATIVE.length },
];

export const SHAPES_BY_CATEGORY: Readonly<Record<ShapeCategoryId, readonly ShapeEntry[]>> = {
  geometric:  GEOMETRIC,
  arrows:     ARROWS,
  badges:     BADGES,
  frames:     FRAMES,
  decorative: DECORATIVE,
};

export const ALL_SHAPES: readonly ShapeEntry[] = [
  ...GEOMETRIC,
  ...ARROWS,
  ...BADGES,
  ...FRAMES,
  ...DECORATIVE,
];

const BY_ID = new Map<string, ShapeEntry>(
  ALL_SHAPES.map((entry) => [entry.id, entry] as const),
);

/** Look up a catalogue entry by shape id. Returns null for shape ids
 *  that aren't in the catalogue (the built-in primitives — rect /
 *  ellipse / line / triangle / star — handled separately by ShapeNode). */
export function findShape(shapeId: string): ShapeEntry | null {
  return BY_ID.get(shapeId) ?? null;
}

/** Built-in primitive shape ids handled by ShapeNode without a catalogue
 *  lookup. These are the legacy ids the Session 5 stub created. */
export const BUILT_IN_SHAPE_IDS: ReadonlySet<string> = new Set<string>([
  "rect",
  "rectangle",
  "square",
  "ellipse",
  "circle",
  "line",
  "triangle",
  "star",
]);

/** Whether a shape id is a built-in primitive (vs. a catalogue entry). */
export function isBuiltInShape(shapeId: string): boolean {
  return BUILT_IN_SHAPE_IDS.has(shapeId);
}
