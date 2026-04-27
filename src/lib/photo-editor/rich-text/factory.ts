// src/lib/photo-editor/rich-text/factory.ts
//
// Factory helpers for creating new TextLayers and GlyphRuns with
// sensible defaults. Used by the Add Text toolbar action, by the Style
// tool when applying a saved style, and by the engine sandbox.

import type {
  GlyphRun,
  TextLayer,
  TextLayerStyling,
  Transform,
} from "../types";
import { IDENTITY_TRANSFORM } from "../types";
import { newId } from "../util/id";

/** Default text styling — left-aligned, no extra spacing, line-height 1.2. */
export function defaultTextStyling(): TextLayerStyling {
  return {
    align: "left",
    letterSpacing: 0,
    lineHeight: 1.2,
  };
}

/** Default GlyphRun — black, sans-serif 96px, no stroke / shadow / highlight. */
export function defaultGlyphRun(overrides: Partial<GlyphRun> = {}): GlyphRun {
  const base: GlyphRun = {
    text: "",
    fontFamily: "sans-serif",
    fontWeight: 400,
    fontStyle: "normal",
    fontSize: 96,
    decoration: "none",
    fill: "#111827",
    opacity: 1,
    gradient: {
      enabled: false,
      angle: 0,
      stops: [
        { position: 0, color: "#FFFFFF" },
        { position: 1, color: "#1B5B50" },
      ],
    },
    texture: {
      enabled: false,
      src: "",
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    },
    stroke: {
      enabled: false,
      color: "#000000",
      width: 4,
      opacity: 1,
    },
    highlight: {
      enabled: false,
      color: "#FACC15",
      opacity: 1,
    },
    shadow: {
      enabled: false,
      color: "#000000",
      opacity: 0.5,
      blur: 8,
      offsetX: 4,
      offsetY: 4,
    },
  };
  return { ...base, ...overrides };
}

export interface CreateTextLayerOptions {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  fill?: string;
  width?: number;
  align?: TextLayerStyling["align"];
  transform?: Partial<Transform>;
  name?: string;
  /** Skip the default-run path — pass a fully-specified runs array. */
  runs?: GlyphRun[];
}

/** Create a new TextLayer. With no opts, returns a layer holding the
 *  word "Text" in default sans-serif at 96px. */
export function createTextLayer(opts: CreateTextLayerOptions = {}): TextLayer {
  const runs: GlyphRun[] =
    opts.runs ??
    [
      defaultGlyphRun({
        text: opts.text ?? "Text",
        fontFamily: opts.fontFamily ?? "sans-serif",
        fontSize: opts.fontSize ?? 96,
        fontWeight: opts.fontWeight ?? 400,
        fontStyle: opts.fontStyle ?? "normal",
        fill: opts.fill ?? "#111827",
      }),
    ];

  const styling = defaultTextStyling();
  if (opts.align) styling.align = opts.align;

  return {
    id: newId("text"),
    kind: "text",
    name: opts.name ?? "Text",
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: { ...IDENTITY_TRANSFORM, ...opts.transform },
    width: opts.width ?? 800,
    styling,
    runs,
    erase: [],
  };
}

/** Fraction of the canvas width that a freshly-added text layer should
 *  span, before the user resizes it. 40% lands big enough to read on a
 *  phone preview but leaves obvious room either side, so it's clearly
 *  a movable / resizable layer rather than the whole canvas. The cap
 *  is a SOFT default — the user can drag-scale beyond 40% afterwards. */
export const NEW_TEXT_WIDTH_FRACTION = 0.4;

/** Heuristic font-size to text-box-width ratio. Picked empirically to
 *  fit the placeholder string "your text here" on one line at the
 *  default sans-serif weight. Used by createDefaultTextForCanvas to
 *  derive a fontSize from the target box width. */
const FONT_SIZE_PER_BOX_WIDTH = 0.18;

/** Lower / upper bounds for the auto-sized fontSize so tiny canvases
 *  (e.g. 200×200 stickers) don't render text at sub-readable size, and
 *  huge canvases (e.g. 8000×8000 print) don't blow up to 1000+ px. */
const MIN_AUTO_FONT_SIZE = 24;
const MAX_AUTO_FONT_SIZE = 200;

/** Build a TextLayer pre-sized for a canvas of the given dimensions.
 *  Used by every Add Text entry-point so the new layer lands at a
 *  consistent ~40% of canvas width and proportional font size,
 *  regardless of whether the canvas is 1080² square, a portrait crop,
 *  or a wide banner.
 *
 *  Soft cap only — once the layer exists the user is free to drag-
 *  resize it beyond the 40%. */
export function createDefaultTextForCanvas(
  canvasWidth: number,
  canvasHeight: number,
  opts: Omit<CreateTextLayerOptions, "width" | "fontSize"> = {},
): TextLayer {
  const targetWidth = Math.max(40, canvasWidth * NEW_TEXT_WIDTH_FRACTION);
  const rawFontSize = targetWidth * FONT_SIZE_PER_BOX_WIDTH;
  const fontSize = clamp(
    Math.round(rawFontSize),
    MIN_AUTO_FONT_SIZE,
    MAX_AUTO_FONT_SIZE,
  );
  // Don't let the box exceed the canvas height either — important on
  // very wide / very short banners where 40% of width could still
  // dominate vertically.
  const widthCappedByHeight = Math.min(
    targetWidth,
    canvasHeight * 0.9,
  );
  return createTextLayer({
    ...opts,
    width: Math.round(widthCappedByHeight),
    fontSize,
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
