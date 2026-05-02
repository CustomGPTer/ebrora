// src/lib/photo-editor/types.ts
//
// Core type system for the Ebrora Photo Editor.
// All canvas state, persistence, exports, and batch mode flow through these types.
// Pure types — no React, no DOM, no external deps.
//
// Structure decisions documented inline. The biggest architectural call —
// per-letter / per-word styling (Q1 in scope review) — drives the GlyphRun
// model below. A TextLayer is a list of GlyphRuns, each carrying its own
// font / colour / stroke / shadow / highlight / opacity. The rich-text
// engine in /lib/photo-editor/rich-text/ lays these out at render time;
// this file just defines the data shape.

// ─── IDs ────────────────────────────────────────────────────────

/** Unique id for a layer or document object. Stable across saves. */
export type Id = string;

// ─── Subscription tier ──────────────────────────────────────────

/** Mirrors session.user.subscriptionTier from NextAuth. */
export type Tier = "FREE" | "STARTER" | "STANDARD" | "PROFESSIONAL" | "UNLIMITED";

/** Paid tiers unlock white-label exports (no watermark) and custom font upload. */
export const PAID_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  "STARTER",
  "STANDARD",
  "PROFESSIONAL",
  "UNLIMITED",
]);

export function isPaid(tier: Tier): boolean {
  return PAID_TIERS.has(tier);
}

// ─── Geometry primitives ────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

/** 2D affine transform applied to a layer. No 3D — Q2 / Q3 cut. */
export interface Transform {
  /** Translation in canvas pixels. */
  x: number;
  y: number;
  /** Per-axis scale. 1 = no scale. */
  scaleX: number;
  scaleY: number;
  /** Rotation in degrees, clockwise. */
  rotation: number;
  /** Skew in degrees (Free Transform handles). */
  skewX: number;
  skewY: number;
}

export const IDENTITY_TRANSFORM: Transform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  skewX: 0,
  skewY: 0,
};

// ─── Colour & paint ─────────────────────────────────────────────

/** Any CSS-parseable colour string ("#fff", "rgb(...)", "hsl(...)"). */
export type ColorString = string;

export interface Stroke {
  color: ColorString;
  /** Width in canvas pixels. 0 = no stroke (renderer short-circuits). */
  width: number;
  /** 0–1. */
  opacity: number;
}

export interface Shadow {
  color: ColorString;
  /** 0–1. 0 = no shadow (renderer short-circuits). */
  opacity: number;
  /** Gaussian blur radius in canvas pixels. */
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface Highlight {
  /** Background fill behind the affected glyphs. */
  color: ColorString;
  /** 0–1. 0 = no highlight (renderer short-circuits). */
  opacity: number;
}

export interface GradientStop {
  /** 0–1 along the gradient axis. */
  position: number;
  color: ColorString;
}

export interface GradientFill {
  enabled: boolean;
  /** Linear gradient angle in degrees. 0 = left → right. */
  angle: number;
  stops: GradientStop[];
}

export interface TextureFill {
  enabled: boolean;
  /** Texture source identifier. Post-D2b this is a synthetic ID
   *  (e.g. "brushed-metal", "paper", "noise") that keys into the
   *  `Map<string, CanvasImageSource>` returned by `getTextureMap()`
   *  in `rich-text/textures.ts`. The map is built lazily on first
   *  call. Custom data URLs / remote URLs are not currently
   *  supported by the engine — the resolver looks up `src` in the
   *  texture map and falls back to plain fill if absent. */
  src: string;
  /** Texture transform within the glyph mask. */
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

// ─── Rich-text engine — the GlyphRun model ──────────────────────
//
// A TextLayer's content is an ordered list of GlyphRuns. Each run carries
// its own font / colour / stroke / shadow / highlight. Runs implement the
// "per-letter / per-word styling" feature (Q1 in scope review): a single
// layer can hold any number of runs, and a run can be one character or a
// whole paragraph. Layout (line-breaking, alignment, spacing) is computed
// at render time by /lib/photo-editor/rich-text/layout.ts.

export interface GlyphRun {
  /** The text content of this run. */
  text: string;
  /** Font family name — must match a loaded FontFace. */
  fontFamily: string;
  /** Numeric font weight, 100–900. */
  fontWeight: number;
  /** Font style. */
  fontStyle: "normal" | "italic";
  /** Font size in canvas pixels. */
  fontSize: number;
  /** Text decoration. */
  decoration: "none" | "underline" | "strikethrough" | "underline-strikethrough";
  /** Solid colour fill (used when neither gradient nor texture is enabled). */
  fill: ColorString;
  gradient: GradientFill;
  texture: TextureFill;
  stroke: Stroke;
  highlight: Highlight;
  shadow: Shadow;
  /** 0–1. Per-run opacity, multiplied with layer opacity at render. */
  opacity: number;
}

export interface TextLayerStyling {
  /** Horizontal alignment of all runs in the layer. */
  align: "left" | "center" | "right" | "justify";
  /** Letter spacing (tracking) in canvas pixels. */
  letterSpacing: number;
  /** Line height multiplier (1 = font default). */
  lineHeight: number;
  /** Bend (arc warp) of the text. amount in [-100, 100] where 0 = flat,
   *  +100 = full upward arch (∩, rainbow), -100 = full downward arch (∪,
   *  smile). Engine renders each glyph rotated to the arc tangent when
   *  amount !== 0. New for Batch D2a. */
  bend: { amount: number };
}

// ─── Layers ─────────────────────────────────────────────────────

export type LayerKind = "text" | "image" | "shape" | "sticker";

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion";

export interface BaseLayer {
  id: Id;
  kind: LayerKind;
  name: string;
  visible: boolean;
  locked: boolean;
  /** Per-layer opacity 0–1. */
  opacity: number;
  /** Blend mode applied against everything below this layer. */
  blendMode: BlendMode;
  transform: Transform;
}

export interface TextLayer extends BaseLayer {
  kind: "text";
  /** Width of the text box in canvas pixels (text wraps within this). */
  width: number;
  styling: TextLayerStyling;
  runs: GlyphRun[];
  /** Erase brush strokes applied to this text layer (Q4 — Text Behind). */
  erase: EraseStroke[];
  /** Optional underlay rectangle painted behind the text. Layer-level
   *  (one rect per text layer, not per glyph — for per-glyph fill behind
   *  characters use `GlyphRun.highlight` instead). New for Batch D2b. */
  background: TextBackground;
  /** Optional 4-point perspective warp applied at render time. null = no
   *  warp. The corners are in layer-local coords where (0,0) → (W,H) is
   *  the flat layout bbox. When non-null, RichTextNode renders via a
   *  KonvaShape sceneFunc that warps the layer-local sub-region of the
   *  off-screen text bitmap to the four destination points. New for
   *  Batch D2c. */
  perspective: [Point, Point, Point, Point] | null;
}

/** Layer-level rectangle painted behind a TextLayer's glyphs. Sized as
 *  the flat layout bbox expanded by `widthDelta` / `heightDelta` on each
 *  side, with `roundCorner` rounded corners. Painted into the same
 *  off-screen canvas as the glyphs (before them in z-order), so the
 *  layer's transform applies uniformly to both. */
export interface TextBackground {
  color: ColorString;
  /** 0–1. 0 = no background (renderer short-circuits). */
  opacity: number;
  /** Corner radius in canvas pixels. */
  roundCorner: number;
  /** Padding on the left/right of the text bbox, in canvas pixels. */
  widthDelta: number;
  /** Padding on the top/bottom of the text bbox, in canvas pixels. */
  heightDelta: number;
}

export interface ImageLayer extends BaseLayer {
  kind: "image";
  /** Source image as object URL or data URL. */
  src: string;
  /** Natural pixel dimensions of the source. */
  naturalWidth: number;
  naturalHeight: number;
  /** Cropping rectangle applied before transform. null = uncropped. */
  crop: Rect | null;
  /** 4-point perspective warp (Free Transform). null = unwarped. */
  perspective: [Point, Point, Point, Point] | null;
  /** Optional outer stroke around the image (Phase 1). */
  stroke: Stroke;
  /** Per-layer image adjust (brightness/contrast/saturation/exposure).
   *  All values -100..100; 0 = no change. Apr 2026 — parity with the
   *  project background's BackgroundFilters.adjust. */
  adjust: {
    brightness: number;
    contrast: number;
    saturation: number;
    exposure: number;
  };
  /** Per-layer preset filter id (vintage, mono, etc.) — null = none. */
  filterEffect: string | null;
  /** Per-layer blur. radius 0 = no blur (renderer short-circuits). */
  blur: {
    radius: number; // 0..50
    kind: "gaussian" | "radial";
  };
}

export interface ShapeLayer extends BaseLayer {
  kind: "shape";
  /** Shape catalogue id. */
  shapeId: string;
  /** Filled (colour fill) or outlined (stroke only). */
  variant: "filled" | "outlined";
  fill: ColorString;
  stroke: Stroke;
  /** Width and height in canvas pixels. */
  width: number;
  height: number;
}

export interface StickerLayer extends BaseLayer {
  kind: "sticker";
  /** Twemoji codepoint or sticker catalogue id. */
  stickerId: string;
  /** Resolved SVG / image URL (cached after first load). */
  src: string;
  width: number;
  height: number;
}

/** Erase strokes are stored on the TextLayer they affect, not as a top-
 *  level layer. The brush UX is in /components/photo-editor/canvas/EraseOverlay. */
export interface EraseStroke {
  /** Brush radius in canvas pixels. */
  radius: number;
  /** Path points in the layer's local coordinate space. */
  points: Point[];
}

export type AnyLayer = TextLayer | ImageLayer | ShapeLayer | StickerLayer;

// ─── Canvas background ──────────────────────────────────────────

export type Background =
  | {
      kind: "photo";
      src: string;
      naturalWidth: number;
      naturalHeight: number;
      crop: Rect | null;
      flip: { horizontal: boolean; vertical: boolean };
      rotation: 0 | 90 | 180 | 270;
    }
  | { kind: "gradient"; gradient: GradientFill }
  | { kind: "solid"; color: ColorString }
  | { kind: "transparent" };

// ─── Image-level filters ────────────────────────────────────────
//
// Applied to the BACKGROUND only, not to overlays. Overlays carry their
// own opacity and blend mode.

export interface BackgroundFilters {
  adjust: {
    brightness: number; // -100..100
    contrast: number; // -100..100
    saturation: number; // -100..100
    exposure: number; // -100..100
  };
  /** Preset filter id (vintage, mono, etc.) — null = no filter. */
  effect: string | null;
  blur: {
    radius: number; // 0..50
    kind: "gaussian" | "radial";
  };
}

export const DEFAULT_BACKGROUND_FILTERS: BackgroundFilters = {
  adjust: { brightness: 0, contrast: 0, saturation: 0, exposure: 0 },
  effect: null,
  blur: { radius: 0, kind: "gaussian" },
};

// ─── Saved styles ───────────────────────────────────────────────

/** A reusable text style preset (font + colour + stroke + shadow + ...).
 *  Storing the full runs array preserves per-letter styling within a saved
 *  style — the Style tool replays the runs onto whatever text the user
 *  has selected. */
export interface SavedStyle {
  id: Id;
  name: string;
  runs: GlyphRun[];
  styling: TextLayerStyling;
  createdAt: number;
}

// ─── Project (full canvas state for save/restore) ───────────────

export interface Project {
  id: Id;
  name: string;
  /** Canvas pixel dimensions. */
  width: number;
  height: number;
  background: Background;
  filters: BackgroundFilters;
  layers: AnyLayer[];
  /** Z-order — first id is bottom, last is top. */
  layerOrder: Id[];
  createdAt: number;
  updatedAt: number;
  /** Schema version — bumped when Project shape changes incompatibly. */
  schemaVersion: number;
}

export const PROJECT_SCHEMA_VERSION = 1;

// ─── Export ─────────────────────────────────────────────────────

export type ExportFormat = "png" | "jpg" | "webp" | "pdf";

export interface ExportSpec {
  format: ExportFormat;
  /** 0–1 — used by jpg / webp; ignored by png / pdf. */
  quality: number;
  /** null = use project dimensions. */
  outputSize: Size | null;
  /** Whether to apply the free-tier corner watermark. Resolved at export
   *  time from the user's tier — always true for FREE. */
  watermark: boolean;
  /** Filename without extension. */
  filename: string;
}

// ─── Batch mode ─────────────────────────────────────────────────

export interface BatchPhoto {
  id: Id;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  /** EXIF parsed at intake. null = none / not JPEG. */
  exif: ExifData | null;
  /** Per-photo project. Independent so the user can override stamps per photo. */
  project: Project;
}

export interface BatchProject {
  id: Id;
  name: string;
  photos: BatchPhoto[];
  /** Index of the photo whose stamps are propagated when "Apply to all" is tapped. */
  templatePhotoIndex: number;
  createdAt: number;
  updatedAt: number;
}

// ─── EXIF (parsed on upload) ────────────────────────────────────

export interface ExifData {
  /** ISO 8601 timestamp from DateTimeOriginal. */
  timestamp?: string;
  /** EXIF orientation 1–8. 1 = upright. */
  orientation?: number;
  /** Decimal degrees. */
  latitude?: number;
  longitude?: number;
}

// ─── Tools ──────────────────────────────────────────────────────

/** Every tool the user can activate from the toolbar.
 *  PRIMARY_TOOLS show on the bottom bar; ADVANCED_TOOLS in the side drawer (Q13). */
export type Tool =
  // Text styling
  | "font"
  | "format"
  | "color"
  | "stroke"
  | "highlight"
  | "shadow"
  | "gradient"
  | "texture"
  | "erase"
  | "opacity"
  | "position"
  | "emboss"
  | "free-transform"
  // Layer & content management
  | "background"
  | "layers"
  | "styles"
  | "stickers"
  | "shapes"
  // Image-level
  | "adjust"
  | "effects"
  | "blur"
  | "crop"
  | "flip-rotate"
  | "square-fit";

export const PRIMARY_TOOLS: readonly Tool[] = [
  "font",
  "format",
  "color",
  "stroke",
  "highlight",
  "shadow",
  "position",
];

export const ADVANCED_TOOLS: readonly Tool[] = [
  "gradient",
  "texture",
  "erase",
  "opacity",
  "background",
  "emboss",
  "free-transform",
  "adjust",
  "effects",
  "blur",
  "crop",
  "flip-rotate",
  "square-fit",
  "layers",
  "styles",
  "stickers",
  "shapes",
];

// ─── Viewport (Session 7) ───────────────────────────────────────

/** Viewport state — replaces the flat zoom + pan fields from Sessions 1–6.
 *  translateX / translateY are in screen-pixel space (the displacement
 *  applied to the on-screen Stage). zoom is a multiplier applied on top
 *  of the existing fit-to-viewport scale that CanvasShell still computes
 *  (so zoom = 1 means "fit-to-viewport"; zoom = 2 means "twice fit
 *  scale"). rotation is in radians.
 *
 *  Pan/zoom/rotate are ephemeral within a session and NOT undoable.
 *  They are not persisted with saved projects either — re-opening a
 *  project always starts at fit-to-screen, zoom 1, no rotation. */
export interface Viewport {
  translateX: number;
  translateY: number;
  zoom: number;
  rotation: number;
}

export const DEFAULT_VIEWPORT: Viewport = {
  translateX: 0,
  translateY: 0,
  zoom: 1,
  rotation: 0,
};

// ─── Editor runtime state ───────────────────────────────────────

export interface EditorState {
  project: Project;
  /** Currently active tool, or null = no panel open. */
  activeTool: Tool | null;
  /** ids of selected layers (multi-select supported). */
  selection: Id[];
  /** For text layers, the active glyph-run selection range — null = whole layer. */
  runSelection: { layerId: Id; start: number; end: number } | null;
  /** Viewport (translate + zoom + rotation). Replaces the flat zoom +
   *  pan fields from Sessions 1–6 (Session 7). */
  viewport: Viewport;
  /** True when pan mode is active (legacy flag kept for the gesture
   *  layer; Session 7's gesture handler auto-routes pan-on-empty so the
   *  flag is no longer required for normal operation). */
  panMode: boolean;
  /** True when grid is shown. */
  gridVisible: boolean;
  /** True when snap-to-grid / snap-to-edge is on. */
  snapEnabled: boolean;
}

// ─── History (undo/redo) ────────────────────────────────────────

export interface HistorySnapshot {
  project: Project;
  /** Human-readable label for the action that produced this state. */
  label: string;
  timestamp: number;
}

// ─── Saved projects (Session 7) ─────────────────────────────────

/** Envelope shape persisted to IndexedDB by the saved-projects module.
 *  thumbnail is a JPEG data URL ≤ ~50 KB at ≤ 256×256, generated
 *  best-effort from the canvas at save time. */
export interface SavedProject {
  id: Id;
  name: string;
  createdAt: number;
  updatedAt: number;
  snapshot: Project;
  thumbnail: string;
}

/** Soft-cap on the number of saved projects per browser. The Projects
 *  modal warns the user above SAVED_PROJECTS_WARN_THRESHOLD and refuses
 *  new saves at SAVED_PROJECTS_HARD_CAP. */
export const SAVED_PROJECTS_HARD_CAP = 100;
export const SAVED_PROJECTS_WARN_THRESHOLD = 90;

/** Maximum saved-project thumbnail dimension — enforced by thumbnail.ts. */
export const SAVED_PROJECT_THUMBNAIL_DIMENSION = 256;

// ─── Theme ──────────────────────────────────────────────────────

export type Theme = "light" | "dark";

// ─── Defaults ───────────────────────────────────────────────────

/** Default canvas size for new blank projects (no source photo).
 *  2000×2000 — large enough that text rendered at typical sizes stays
 *  crisp when the result is viewed at full screen, exported for print
 *  on a site noticeboard, or scaled up for a presentation. Replaces
 *  the original 1080×1080 (Instagram square) value, which was fine for
 *  social media but soft for print at any A-size page. Existing saved
 *  projects keep their stored dimensions; this only governs cold-start
 *  blank canvases (Background colour / gradient picker on the home
 *  screen and the Style preset entry tiles). */
export const DEFAULT_CANVAS_SIZE: Size = { width: 2000, height: 2000 };

/** Maximum canvas dimension. Prevents OOM on very large uploads. */
export const MAX_CANVAS_DIMENSION = 8000;

/** Local-storage key prefix — every key the editor writes starts with this. */
export const STORAGE_PREFIX = "ebrora.photo-editor.";
