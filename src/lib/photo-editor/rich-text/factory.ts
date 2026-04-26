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
