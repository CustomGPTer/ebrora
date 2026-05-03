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

/** Build a CSS filter-chain string from a filter spec, suitable for
 *  assignment to a `CanvasRenderingContext2D.filter`. Returns `null`
 *  when the spec produces no filters — caller can skip the offscreen
 *  bake entirely.
 *
 *  The math mirrors how `ImageNode`'s perspective source canvas builds
 *  its filter (and used to inline this same chain). CSS filters are a
 *  close-enough approximation of Konva's flat-path filter chain — the
 *  two aren't pixel-identical (CSS `brightness(...)` is multiplicative,
 *  Konva's `Brighten` is additive, etc.), but they match well enough
 *  for typical use, which is the same trade-off the on-stage perspective
 *  path already accepts.
 *
 *  Used by:
 *    • `ImageNode` perspective source canvas (on-stage, was inlined
 *      pre-May-2026; refactored to call this helper).
 *    • Export pipeline (`paintBackground` photo case + `paintImageLayer`)
 *      so background and image filters survive PNG / JPEG / PDF export
 *      and the Save & Share preview matches the canvas. */
export function buildCssFilterString(spec: ImageFilterSpec): string | null {
  const parts: string[] = [];
  const a = spec.adjust;
  // Brightness folds in exposure at half-weight, mirroring the Konva
  // attribute mapping in `applyImageFilterAttrs` above.
  const bri = (a.brightness + a.exposure / 2) / 100;
  if (bri !== 0) parts.push(`brightness(${1 + bri})`);
  if (a.contrast !== 0) parts.push(`contrast(${1 + a.contrast / 100})`);
  if (a.saturation !== 0) parts.push(`saturate(${1 + a.saturation / 100})`);
  if (spec.effect === "mono") parts.push("grayscale(1)");
  else if (spec.effect === "sepia") parts.push("sepia(1)");
  else if (spec.effect === "invert") parts.push("invert(1)");
  if (spec.blur.radius > 0) parts.push(`blur(${spec.blur.radius}px)`);
  return parts.length > 0 ? parts.join(" ") : null;
}
