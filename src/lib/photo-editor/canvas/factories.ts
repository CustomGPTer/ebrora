// src/lib/photo-editor/canvas/factories.ts
//
// Factory helpers for non-text layers — Image, Sticker, Shape. Mirrors
// the pattern of rich-text/factory.ts (createTextLayer + sensible
// defaults). Used by the Add Image / Add Sticker / Add Shape buttons in
// BottomToolbar, and (later) by the Sticker / Shape catalogue panels in
// Session 6.
//
// Each factory returns a fresh layer with:
//   • A unique id from newId()
//   • IDENTITY_TRANSFORM (positioned via centreLayerOnCanvas at the call site)
//   • Sensible visible / locked / opacity / blendMode defaults
//   • Kind-specific defaults documented inline
//
// None of the factories touch state directly. The caller is responsible
// for dispatching ADD_LAYER + SET_SELECTION (see BottomToolbar).

import type {
  ColorString,
  ImageLayer,
  ShapeLayer,
  Stroke,
  StickerLayer,
  Transform,
} from "../types";
import { IDENTITY_TRANSFORM } from "../types";
import { newId } from "../util/id";

// ─── Image ──────────────────────────────────────────────────────

export interface CreateImageLayerOptions {
  /** Image source — typically an object URL from the file picker, or a
   *  data URL. */
  src: string;
  /** Natural pixel dimensions of the image. */
  naturalWidth: number;
  naturalHeight: number;
  /** Display name. Defaults to "Image". */
  name?: string;
  transform?: Partial<Transform>;
}

/** Create a new ImageLayer. The layer is created uncropped, untransformed
 *  (apart from any transform overrides supplied), and unwarped. The
 *  caller centres it on the canvas via centreLayerOnCanvas before
 *  dispatching ADD_LAYER. */
export function createImageLayer(opts: CreateImageLayerOptions): ImageLayer {
  return {
    id: newId("image"),
    kind: "image",
    name: opts.name ?? "Image",
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: { ...IDENTITY_TRANSFORM, ...opts.transform },
    src: opts.src,
    naturalWidth: opts.naturalWidth,
    naturalHeight: opts.naturalHeight,
    crop: null,
    perspective: null,
    stroke: { enabled: false, color: "#000000", width: 4, opacity: 1 },
    adjust: { brightness: 0, contrast: 0, saturation: 0, exposure: 0 },
    filterEffect: null,
    blur: { enabled: false, radius: 0, kind: "gaussian" },
  };
}

// ─── Sticker ────────────────────────────────────────────────────

export interface CreateStickerLayerOptions {
  /** Sticker catalogue id (Session 6 will use Twemoji codepoints; the
   *  Session 5 stub uses a literal id like "smile"). */
  stickerId: string;
  /** Resolved image / SVG URL — passed straight through to StickerNode's
   *  use-image hook. */
  src: string;
  /** Default render size in canvas pixels. Stickers are typically square;
   *  defaults to 200×200 if both are omitted. */
  width?: number;
  height?: number;
  name?: string;
  transform?: Partial<Transform>;
}

/** Create a new StickerLayer. Stickers carry their own width / height
 *  (unlike images, where size is inferred from the natural pixel
 *  dimensions or the crop rect). */
export function createStickerLayer(
  opts: CreateStickerLayerOptions,
): StickerLayer {
  const width = opts.width ?? 200;
  const height = opts.height ?? 200;
  return {
    id: newId("sticker"),
    kind: "sticker",
    name: opts.name ?? "Sticker",
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: { ...IDENTITY_TRANSFORM, ...opts.transform },
    stickerId: opts.stickerId,
    src: opts.src,
    width,
    height,
  };
}

// ─── Shape ──────────────────────────────────────────────────────

export interface CreateShapeLayerOptions {
  /** Shape catalogue id. ShapeNode supports rect / ellipse / line /
   *  triangle / star out of the box; Session 6's custom SVG set will
   *  expand the catalogue. Unknown ids render as a dashed placeholder. */
  shapeId: string;
  /** "filled" — interior fills with `fill`. "outlined" — interior is
   *  transparent, the shape is outlined with the same colour. */
  variant?: ShapeLayer["variant"];
  /** Solid fill / outline colour. */
  fill?: ColorString;
  /** Optional explicit stroke (overrides the default outlined behaviour). */
  stroke?: Partial<Stroke>;
  width?: number;
  height?: number;
  name?: string;
  transform?: Partial<Transform>;
}

const DEFAULT_STROKE: Stroke = {
  enabled: false,
  color: "#000000",
  width: 4,
  opacity: 1,
};

/** Create a new ShapeLayer. Defaults to a 240×240 filled accent-coloured
 *  rectangle if no opts are supplied — sensible for a "tap a shape, get
 *  something visible centred on the canvas" flow. */
export function createShapeLayer(
  opts: CreateShapeLayerOptions,
): ShapeLayer {
  const width = opts.width ?? defaultDimensionFor(opts.shapeId);
  const height = opts.height ?? defaultDimensionFor(opts.shapeId, "height");
  return {
    id: newId("shape"),
    kind: "shape",
    name: opts.name ?? labelForShape(opts.shapeId),
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: { ...IDENTITY_TRANSFORM, ...opts.transform },
    shapeId: opts.shapeId,
    variant: opts.variant ?? "filled",
    fill: opts.fill ?? "#1B5B50",
    stroke: { ...DEFAULT_STROKE, ...(opts.stroke ?? {}) },
    width,
    height,
  };
}

/** Sensible per-shape default size. Lines are short and thin; everything
 *  else defaults square. */
function defaultDimensionFor(
  shapeId: string,
  axis: "width" | "height" = "width",
): number {
  if (shapeId === "line") {
    return axis === "width" ? 320 : 6;
  }
  return 240;
}

/** Human-readable label for a built-in shape id. Falls back to a Title-
 *  Cased version of the id for unknown shapes. */
function labelForShape(shapeId: string): string {
  switch (shapeId) {
    case "rect":
    case "rectangle":
    case "square":
      return "Rectangle";
    case "ellipse":
    case "circle":
      return "Ellipse";
    case "line":
      return "Line";
    case "triangle":
      return "Triangle";
    case "star":
      return "Star";
    default:
      // Capitalise first letter; leave the rest untouched.
      return shapeId.charAt(0).toUpperCase() + shapeId.slice(1);
  }
}
