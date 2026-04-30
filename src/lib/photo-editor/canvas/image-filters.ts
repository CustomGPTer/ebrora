// src/lib/photo-editor/canvas/image-filters.ts
//
// Shared filter chain logic for both the project background and any
// ImageLayer. Both data shapes have the same fields (adjust/effect/blur)
// — this is the single resolver they both call. Apr 2026, when image
// layers gained the same filter capabilities the background already had.

import Konva from "konva";

export type KonvaFilter = (this: Konva.Node, imageData: ImageData) => void;

export interface ImageFilterSpec {
  adjust: {
    brightness: number;
    contrast: number;
    saturation: number;
    exposure: number;
  };
  effect: string | null;
  blur: { radius: number; kind: "gaussian" | "radial" };
}

/** Resolve a filter spec to an ordered Konva filter chain. Empty array
 *  means "no filters" — the caller should clearCache() to skip the
 *  offscreen-canvas hop. */
export function resolveImageFilterChain(f: ImageFilterSpec): KonvaFilter[] {
  const chain: KonvaFilter[] = [];
  const a = f.adjust;
  if (a.brightness !== 0 || a.exposure !== 0) {
    chain.push(Konva.Filters.Brighten);
  }
  if (a.contrast !== 0) {
    chain.push(Konva.Filters.Contrast);
  }
  if (a.saturation !== 0) {
    chain.push(Konva.Filters.HSL);
  }
  if (f.effect === "mono") chain.push(Konva.Filters.Grayscale);
  else if (f.effect === "sepia") chain.push(Konva.Filters.Sepia);
  else if (f.effect === "invert") chain.push(Konva.Filters.Invert);
  if (f.blur.radius > 0) {
    chain.push(Konva.Filters.Blur);
  }
  return chain;
}

/** Apply the filter spec's attribute values to a Konva.Image node.
 *  Caller is responsible for calling node.filters(chain), node.cache()
 *  / clearCache(), and batchDraw(). */
export function applyImageFilterAttrs(
  node: Konva.Image,
  f: ImageFilterSpec,
): void {
  node.brightness((f.adjust.brightness + f.adjust.exposure / 2) / 100);
  node.contrast(f.adjust.contrast);
  node.saturation(f.adjust.saturation / 100);
  node.hue(0);
  node.luminance(0);
  if (f.blur.radius > 0) {
    node.blurRadius(f.blur.radius);
  } else {
    node.blurRadius(0);
  }
}

/** Available filter effect presets. Used by the panel to render the
 *  preset list. */
export const FILTER_EFFECT_PRESETS: ReadonlyArray<{
  id: string | null;
  label: string;
}> = [
  { id: null, label: "Original" },
  { id: "mono", label: "Mono" },
  { id: "sepia", label: "Sepia" },
  { id: "invert", label: "Invert" },
];
