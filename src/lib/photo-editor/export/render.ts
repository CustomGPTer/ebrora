// src/lib/photo-editor/export/render.ts
//
// Off-screen export renderer (Session 8).
//
// Walks the project at native (or up-sampled) resolution and paints into
// a fresh HTMLCanvasElement. Returned canvas can then be encoded as PNG,
// JPEG, or embedded into a PDF. The pipeline mirrors the on-stage paint
// order documented in HANDOVER-7 §11 #21 — background → layers in
// layerOrder — but explicitly skips the chrome layers (SelectionFrame,
// TextEditOverlay) since those are UI, not document content.
//
// Every layer kind is repainted from scratch using the same primitives
// that drive the on-screen render, so output is identical to what the
// user sees on the canvas (modulo overlay chrome) regardless of the
// current viewport / zoom / rotation.
//
// Pure logic — no React, no Konva, no DOM events. Takes a Project plus a
// resolution multiplier and a list of pre-loaded image sources, returns
// an HTMLCanvasElement at the requested output dimensions.
//
// Image / sticker sources MUST be pre-loaded by the caller and supplied
// in the `images` Map keyed by `src`. Loading is async and we want this
// function to be synchronous-render-friendly so the caller can show a
// progress overlay around the await for image loading without blocking
// the actual paint.

import type {
  AnyLayer,
  Background,
  ImageLayer,
  LineProps,
  Project,
  Rect,
  ShapeLayer,
  StickerLayer,
  TextLayer,
} from "../types";
import { layoutText, paintTextBackground, renderTextToCanvas } from "../rich-text/engine";
import {
  computeBentBounds,
  createBendContext,
} from "../rich-text/bend";
import { getTextureMap } from "../rich-text/textures";
import {
  expandPerspectiveCorners,
  isIdentityPerspective,
  renderPerspectiveImage,
} from "../canvas/perspective-render";
import { buildCssFilterString } from "../canvas/image-filters";
import { applyEraseStrokes } from "../canvas/erase-render";
import {
  findShape,
  isBuiltInShape,
} from "../shapes/catalogue";

/** Resolution multiplier applied on top of project dimensions. */
export type ExportResolution = 1 | 2 | 4;

/** Maximum allowed output dimension on either axis. Below most
 *  browsers' 16384 px canvas limits but well above what mobile devices
 *  can reliably allocate. Mirrors MAX_CANVAS_DIMENSION but applies to
 *  output specifically. */
export const MAX_EXPORT_DIMENSION = 8000;

export interface ExportRenderRequest {
  /** Source project — content is read but not mutated. */
  project: Project;
  /** Output multiplier — output dims = project dims × multiplier (clamped). */
  multiplier: ExportResolution;
  /** Pre-loaded HTMLImageElements keyed by their `src` URL. The caller
   *  resolves every image / sticker / photo background asset before
   *  calling so the paint pass is fully synchronous. */
  images: Map<string, HTMLImageElement>;
  /** Optional flag — when true and the project background is
   *  "transparent", produces a fully transparent canvas (suitable for
   *  PNG export). When false the background paints onto a white solid,
   *  which JPEG / PDF callers want. Defaults to true. */
  preserveTransparency?: boolean;
}

export interface ExportRenderResult {
  canvas: HTMLCanvasElement;
  /** True when the requested output dimensions had to be clamped down
   *  to fit MAX_EXPORT_DIMENSION. The caller surfaces this in the UI. */
  clamped: boolean;
  /** Final output dimensions — may be smaller than requested when
   *  clamped. */
  outputWidth: number;
  outputHeight: number;
}

/** Render the project to an off-screen canvas at the requested
 *  resolution. Always returns a canvas; never throws on per-layer
 *  errors (a missing image renders as a blank rect, a missing shape
 *  renders as a placeholder, identical to the on-stage behaviour). */
export function renderProjectToCanvas(
  request: ExportRenderRequest,
): ExportRenderResult {
  const { project, multiplier, images } = request;
  const preserveTransparency = request.preserveTransparency ?? true;

  // Clamp output to MAX_EXPORT_DIMENSION on the longest axis. Maintain
  // aspect ratio when clamping so a 16000×9000 request becomes
  // 8000×4500, not 8000×8000.
  const desiredW = project.width * multiplier;
  const desiredH = project.height * multiplier;
  const clampScale =
    Math.max(desiredW, desiredH) > MAX_EXPORT_DIMENSION
      ? MAX_EXPORT_DIMENSION / Math.max(desiredW, desiredH)
      : 1;
  const outputW = Math.max(1, Math.round(desiredW * clampScale));
  const outputH = Math.max(1, Math.round(desiredH * clampScale));
  const effectiveScale = multiplier * clampScale;

  const canvas = document.createElement("canvas");
  canvas.width = outputW;
  canvas.height = outputH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      canvas,
      clamped: clampScale < 1,
      outputWidth: outputW,
      outputHeight: outputH,
    };
  }

  // Apply the resolution multiplier as a top-level scale so the rest of
  // the painting code can work in project-pixel coords.
  ctx.scale(effectiveScale, effectiveScale);

  // ── Background ────────────────────────────────────────────────
  paintBackground(ctx, project, images, preserveTransparency);

  // ── Layers in z-order ─────────────────────────────────────────
  const ordered = orderLayers(project.layers, project.layerOrder);
  for (const layer of ordered) {
    if (!layer.visible) continue;
    paintLayer(ctx, layer, images);
  }

  return {
    canvas,
    clamped: clampScale < 1,
    outputWidth: outputW,
    outputHeight: outputH,
  };
}

// ─── Background ─────────────────────────────────────────────────

function paintBackground(
  ctx: CanvasRenderingContext2D,
  project: Project,
  images: Map<string, HTMLImageElement>,
  preserveTransparency: boolean,
): void {
  const { background, width, height } = project;

  switch (background.kind) {
    case "transparent": {
      if (!preserveTransparency) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
      }
      // Otherwise leave the canvas alpha at 0.
      return;
    }
    case "solid": {
      ctx.fillStyle = background.color;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    case "gradient": {
      const stops =
        background.gradient.stops.length > 0
          ? background.gradient.stops
          : DEFAULT_GRADIENT_STOPS;
      const angleRad = ((background.gradient.angle - 90) * Math.PI) / 180;
      const radius = Math.max(width, height) / 2;
      const cx = width / 2;
      const cy = height / 2;
      const grad = ctx.createLinearGradient(
        cx - Math.cos(angleRad) * radius,
        cy - Math.sin(angleRad) * radius,
        cx + Math.cos(angleRad) * radius,
        cy + Math.sin(angleRad) * radius,
      );
      for (const stop of stops) {
        grad.addColorStop(clamp01(stop.position), stop.color);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    case "photo": {
      const img = images.get(background.src);
      if (!img) {
        if (!preserveTransparency) {
          // Image not loaded (CORS, etc) — paint white fallback so JPEG /
          // PDF don't end up with a black void.
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }
        return;
      }

      // Bake crop + filters into an offscreen canvas. PhotoRect on stage
      // does the same via Konva's cropX/Y/W/H attributes plus a Konva
      // filter chain via node.cache(); we use CSS filters here as the
      // close-enough approximation that ImageNode's perspective path
      // already accepts. When neither crop nor filters apply, bakeImage
      // returns null and we pass img through directly for performance.
      const filterStr = buildCssFilterString({
        adjust: project.filters.adjust,
        effect: project.filters.effect,
        blur: project.filters.blur,
      });
      const baked = bakeImage(img, background.crop, filterStr);
      const source: CanvasImageSource = baked ?? img;

      // Photo backgrounds support flip + rotation flags. Apply via
      // canvas transform around the centre. The (cropped + filtered)
      // source then stretches to fill the canvas dims, mirroring
      // KonvaImage's natural width / height behaviour on stage.
      ctx.save();
      ctx.translate(width / 2, height / 2);
      if (background.rotation) {
        ctx.rotate((background.rotation * Math.PI) / 180);
      }
      const sx = background.flip.horizontal ? -1 : 1;
      const sy = background.flip.vertical ? -1 : 1;
      ctx.scale(sx, sy);
      ctx.drawImage(source, -width / 2, -height / 2, width, height);
      ctx.restore();
      return;
    }
  }
}

const DEFAULT_GRADIENT_STOPS = [
  { position: 0, color: "#cccccc" },
  { position: 1, color: "#888888" },
];

const exhaustiveBackgroundCheck = (_: never): void => {
  /* compile-time exhaustiveness */
};

// ─── Layers ─────────────────────────────────────────────────────

function paintLayer(
  ctx: CanvasRenderingContext2D,
  layer: AnyLayer,
  images: Map<string, HTMLImageElement>,
): void {
  ctx.save();
  ctx.globalAlpha = clamp01(layer.opacity);
  ctx.globalCompositeOperation = mapBlendMode(layer.blendMode);

  // Apply layer transform. Order: translate → rotate → skew → scale.
  // Mirrors Konva's transform composition (see ShapeNode / RichTextNode
  // setting x/y/rotation/skewX/skewY/scaleX/scaleY on a Konva.Group).
  ctx.translate(layer.transform.x, layer.transform.y);
  if (layer.transform.rotation) {
    ctx.rotate((layer.transform.rotation * Math.PI) / 180);
  }
  if (layer.transform.skewX || layer.transform.skewY) {
    // Konva skew is in degrees, applied as transform matrix entries.
    const sxRad = (layer.transform.skewX * Math.PI) / 180;
    const syRad = (layer.transform.skewY * Math.PI) / 180;
    ctx.transform(1, Math.tan(syRad), Math.tan(sxRad), 1, 0, 0);
  }
  ctx.scale(layer.transform.scaleX, layer.transform.scaleY);

  switch (layer.kind) {
    case "text":
      paintTextLayer(ctx, layer);
      break;
    case "image":
      paintImageLayer(ctx, layer, images);
      break;
    case "shape":
      paintShapeLayer(ctx, layer);
      break;
    case "sticker":
      paintStickerLayer(ctx, layer, images);
      break;
    default:
      // Exhaustiveness check — silence linter on unknown.
      break;
  }

  ctx.restore();
}

// ─── Text ───────────────────────────────────────────────────────

/** Mirrors RichTextNode's RENDER_PADDING. The on-stage bitmap is
 *  oversized by this amount on each side so heavy strokes / shadows /
 *  italic overhang don't clip; the export pipeline does the same. */
const RENDER_PADDING = 24;

function paintTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
): void {
  const layout = layoutText(layer);

  // Mirror RichTextNode's extent calc so the off-screen bitmap covers
  // everything that paints into it. Three sources of overflow past the
  // flat (0, 0)→(layout.width, layout.height) bbox:
  //   • Wrap-box width (layer.width) — represents the dotted selection
  //     frame area. Centre / right alignment puts glyphs inside this box.
  //   • Aligned glyph rect (layout.bounds) — under center / right /
  //     justify alignment the leftmost glyph offset (bounds.x) can be
  //     negative; under justify-multi-line the rendered width can exceed
  //     layout.width.
  //   • Bend's bent-bounds — bent glyphs swing above (∩-shaped) or
  //     below (∪-shaped) the flat baseline, ending well outside the flat
  //     bbox at strong bend amounts. Without including this, bent text
  //     clips on export — visible as missing or fragmented glyphs in PNG
  //     / JPEG / PDF output (May 2026 bug fix).
  //   • Text-background rect — sized to the aligned glyph rect plus
  //     widthDelta / heightDelta padding; can pull edges past the flat
  //     bbox on every side.
  //
  // We clamp minX to ≤ 0 so layer-local (0, 0) — the layer's anchor for
  // transform.x / .y — always falls within (or to the right of) the
  // bitmap left edge. anchorX / anchorY shift painting so that origin
  // lands inside the bitmap regardless of how far negative the extent
  // pushes it.
  const alignedMinX = layout.bounds.x;
  const alignedMaxX = layout.bounds.x + layout.bounds.width;

  let minX = Math.min(0, alignedMinX);
  let minY = 0;
  let maxX = Math.max(layout.width, alignedMaxX, layer.width);
  let maxY = layout.height;

  const bend = createBendContext(
    layer.styling.bend?.amount ?? 0,
    layer.width,
  );
  if (bend) {
    const b = computeBentBounds(bend, layout);
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }

  const bg = layer.background;
  if (bg && bg.opacity > 0) {
    minX = Math.min(minX, layout.bounds.x - bg.widthDelta);
    minY = Math.min(minY, -bg.heightDelta);
    maxX = Math.max(
      maxX,
      layout.bounds.x + layout.bounds.width + bg.widthDelta,
    );
    maxY = Math.max(maxY, layout.height + bg.heightDelta);
  }

  const logicalW = Math.max(
    1,
    Math.ceil(maxX - minX + RENDER_PADDING * 2),
  );
  const logicalH = Math.max(
    1,
    Math.ceil(maxY - minY + RENDER_PADDING * 2),
  );
  const anchorX = RENDER_PADDING - minX;
  const anchorY = RENDER_PADDING - minY;

  // Render into a per-layer off-screen so the destination-out erase
  // pass only affects this layer's pixels and not anything painted
  // beneath it. (If we painted directly onto the export canvas, the
  // erase pass would punch holes through the background and lower
  // layers — the on-stage code avoids this by rendering text into its
  // own RichTextNode bitmap, and we mirror that.)
  const bitmap = document.createElement("canvas");
  bitmap.width = logicalW;
  bitmap.height = logicalH;
  const bctx = bitmap.getContext("2d");
  if (!bctx) return;

  bctx.save();
  bctx.translate(anchorX, anchorY);
  // Background underlay first so glyphs sit on top. Mirrors the
  // on-stage RichTextNode paint order.
  paintTextBackground(bctx, layer, layout);
  // Pass the texture map so glyph runs styled with TextureFill render
  // their pattern instead of silently falling back to solid `fill`.
  // The texture map is module-cached (textures.ts builds the canvases
  // lazily on first call), so this is essentially free after the first
  // export.
  renderTextToCanvas(bctx, layer, layout, { textures: getTextureMap() });
  if (layer.erase.length > 0) {
    applyEraseStrokes(bctx, layer.erase);
  }
  bctx.restore();

  // Decide whether to draw flat or warp through perspective. Identity
  // perspective short-circuits to the flat path so we don't pay the
  // mesh-warp cost for a no-op. The flat path also covers the bend-
  // only case: bend is already baked into the bitmap, so drawImage
  // alone produces the right result.
  const W = layout.width;
  const H = layout.height;
  const usePerspective =
    layer.perspective !== null &&
    !isIdentityPerspective(layer.perspective, W, H);

  if (!usePerspective) {
    // Flat path — draw the bitmap so layer-local (0, 0) lands at the
    // export canvas's current origin (which the caller has already
    // translated to the layer's transform.x / .y). The anchor offsets
    // shift the bitmap left / up by however much the extent pushed
    // minX / minY into negative space.
    ctx.drawImage(bitmap, -anchorX, -anchorY);
    return;
  }

  // Perspective path — expand the source rect AND the destination
  // corners so the warp covers the full painted extent (bent apex,
  // bg padding, alignment overflow) instead of clipping at (0,0)→(W,H).
  // Mirrors the on-stage RichTextNode perspective branch byte-for-byte
  // so editor preview and export are pixel-identical (modulo native
  // canvas vs Konva's filter chain rounding).
  const corners = layer.perspective!;
  const extent = { minX, minY, maxX, maxY };
  const expanded = expandPerspectiveCorners(corners, W, H, extent);
  renderPerspectiveImage(
    ctx,
    bitmap,
    maxX - minX,
    maxY - minY,
    expanded,
    undefined,
    anchorX + minX,
    anchorY + minY,
  );
}

// ─── Image ──────────────────────────────────────────────────────

function paintImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: ImageLayer,
  images: Map<string, HTMLImageElement>,
): void {
  const img = images.get(layer.src);
  if (!img) return; // Missing image — silent skip, same as on-stage.

  // Display dimensions of the (possibly cropped) image. Used both as
  // the un-warped paint rect and as the (W, H) input to the identity-
  // perspective check.
  const displayW = layer.crop ? layer.crop.width : layer.naturalWidth;
  const displayH = layer.crop ? layer.crop.height : layer.naturalHeight;

  // Resolve to a renderable source. ImageNode on stage applies filters
  // in two different ways depending on path: the flat path uses Konva's
  // filter chain via node.cache(); the perspective path bakes filters
  // into a source canvas via CSS filter before warping. The export uses
  // the CSS-filter approach for BOTH paths so the two stay consistent
  // (and so any future filter parity work has one place to land).
  //
  // After baking, the source rect to sample is the entire baked canvas
  // at (0, 0). Without baking, we either sample the crop sub-region of
  // the raw img, or the entire raw img.
  const filterStr = buildCssFilterString({
    adjust: layer.adjust,
    effect: layer.filterEffect,
    blur: layer.blur,
  });
  const baked = bakeImage(img, layer.crop, filterStr);

  let source: CanvasImageSource;
  let srcX: number;
  let srcY: number;
  let srcW: number;
  let srcH: number;
  if (baked) {
    source = baked;
    srcX = 0;
    srcY = 0;
    srcW = baked.width;
    srcH = baked.height;
  } else if (layer.crop) {
    source = img;
    srcX = layer.crop.x;
    srcY = layer.crop.y;
    srcW = layer.crop.width;
    srcH = layer.crop.height;
  } else {
    source = img;
    srcX = 0;
    srcY = 0;
    srcW = layer.naturalWidth;
    srcH = layer.naturalHeight;
  }

  const usePerspective =
    layer.perspective !== null &&
    !isIdentityPerspective(layer.perspective, displayW, displayH);

  if (!usePerspective) {
    // Flat path — paint the source rect to (0, 0, displayW, displayH).
    // 9-arg drawImage handles both the baked-canvas and crop-sub-region
    // cases uniformly.
    ctx.drawImage(source, srcX, srcY, srcW, srcH, 0, 0, displayW, displayH);
    paintImageStrokeFlat(ctx, layer, displayW, displayH);
    return;
  }

  // Perspective path — warp the (cropped + filtered) source rectangle
  // onto the four destination corners. Mirrors ImageNode's KonvaShape
  // sceneFunc call on stage. The renderer's srcX / srcY / srcWidth /
  // srcHeight params let us point at the correct sub-region of the
  // source without an extra intermediate canvas.
  renderPerspectiveImage(
    ctx,
    source,
    displayW,
    displayH,
    layer.perspective!,
    undefined,
    srcX,
    srcY,
  );
  paintImageStrokePerspective(ctx, layer, layer.perspective!);
}

/** Stroke an image layer's flat rect — runs after the flat drawImage
 *  and mirrors ImageNode's KonvaImage stroke props (lines ~205–215 of
 *  ImageNode.tsx). The stroke scales with the layer's transform on
 *  stage (KonvaImage doesn't set `strokeScaleEnabled={false}`) and the
 *  export inherits that scaling because paintLayer applies
 *  `ctx.scale(transform.scaleX, transform.scaleY)` before this is
 *  called — so we just use `stroke.width` directly. */
function paintImageStrokeFlat(
  ctx: CanvasRenderingContext2D,
  layer: ImageLayer,
  displayW: number,
  displayH: number,
): void {
  const stroke = layer.stroke;
  if (!stroke || stroke.width <= 0 || stroke.opacity <= 0) return;
  ctx.save();
  ctx.strokeStyle = stroke.color ?? "#000000";
  ctx.lineWidth = stroke.width;
  // Compose with whatever globalAlpha paintLayer set for layer.opacity.
  // Stage's flat KonvaImage actually ignores stroke opacity entirely
  // (Konva doesn't have a strokeOpacity attr), so honouring it on
  // export is strictly more correct — only visible diff between paths
  // is when 0 < stroke.opacity < 1, which the stage UI doesn't even
  // produce as a continuous range today.
  ctx.globalAlpha = clamp01(stroke.opacity) * (ctx.globalAlpha || 1);
  ctx.strokeRect(0, 0, displayW, displayH);
  ctx.restore();
}

/** Stroke an image layer's warped quad — runs after renderPerspectiveImage
 *  and mirrors ImageNode's perspective sceneFunc stroke pass (lines
 *  309–327 of ImageNode.tsx). Draws a closed polyline through the four
 *  destination corners in TL → TR → BR → BL order, the same order
 *  layer.perspective stores them. */
function paintImageStrokePerspective(
  ctx: CanvasRenderingContext2D,
  layer: ImageLayer,
  corners: readonly [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ],
): void {
  const stroke = layer.stroke;
  if (!stroke || stroke.width <= 0 || stroke.opacity <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  ctx.lineTo(corners[1].x, corners[1].y);
  ctx.lineTo(corners[2].x, corners[2].y);
  ctx.lineTo(corners[3].x, corners[3].y);
  ctx.closePath();
  ctx.strokeStyle = stroke.color ?? "#000000";
  ctx.lineWidth = stroke.width;
  ctx.globalAlpha = clamp01(stroke.opacity) * (ctx.globalAlpha || 1);
  ctx.stroke();
  ctx.restore();
}

// ─── Sticker ────────────────────────────────────────────────────

function paintStickerLayer(
  ctx: CanvasRenderingContext2D,
  layer: StickerLayer,
  images: Map<string, HTMLImageElement>,
): void {
  const img = images.get(layer.src);
  if (!img) return;
  ctx.drawImage(img, 0, 0, layer.width, layer.height);
}

// ─── Shape ──────────────────────────────────────────────────────

function paintShapeLayer(
  ctx: CanvasRenderingContext2D,
  layer: ShapeLayer,
): void {
  const fill = layer.variant === "filled" ? layer.fill : "transparent";
  const stroke = resolveShapeStroke(layer);

  // Layer-scale compensation for strokes. ShapeNode on stage sets
  // `strokeScaleEnabled={false}` on every primitive (rect / ellipse /
  // path / star), so a stroke set to N pixels in the slider always
  // renders N pixels regardless of the layer's transform scale. The
  // export pipeline applies `ctx.scale(layer.transform.scaleX, ...)`
  // before this function runs, so canvas strokes inherit that scaling
  // unless we divide it out — without compensation, a 4 px stroke on a
  // 2× corner-resized shape appears 8 px on export but 4 px on stage.
  //
  // Non-uniform scale (scaleX ≠ scaleY) is approximated by dividing
  // by max(|scaleX|, |scaleY|). True per-edge widths would require
  // un-scaling each edge's geometry independently, which neither
  // Konva nor canvas2d gives us cheaply. The approximation matches
  // the larger axis exactly and underweights the smaller one — same
  // failure mode as Konva's own strokeScaleEnabled in non-uniform
  // contexts.
  const sxAbs = Math.abs(layer.transform.scaleX) || 1;
  const syAbs = Math.abs(layer.transform.scaleY) || 1;
  const layerScale = Math.max(sxAbs, syAbs);

  // Line-category catalogue shapes — branch BEFORE built-in / catalogue
  // lookup so the dash + arrow + bezier + freehand logic always wins
  // for these ids. Mirrors ShapeNode's render order (the `isLineShape`
  // check happens before `isBuiltInShape` and `findShape`, otherwise
  // findShape would return the static SVG `d` from the catalogue and
  // we'd render a placeholder instead of the user's actual line).
  //
  // Note: line shapes use Konva.Line / Konva.Arrow on stage WITHOUT
  // `strokeScaleEnabled={false}` (only the rect / ellipse / path /
  // star primitives have that prop), so line strokes scale with the
  // layer transform on both stage and export — no layerScale division.
  if (isLineShape(layer.shapeId)) {
    paintLineShape(ctx, layer);
    return;
  }

  // Built-in primitives — mirror ShapeNode's per-id rendering.
  if (isBuiltInShape(layer.shapeId)) {
    paintBuiltInShape(ctx, layer, fill, stroke, layerScale);
    return;
  }

  // Catalogue entry — Path2D from the SVG `d` string.
  const entry = findShape(layer.shapeId);
  if (entry) {
    const [vbX, vbY, vbW, vbH] = parseViewBox(entry.viewBox);
    const sx = layer.width / vbW;
    const sy = layer.height / vbH;
    ctx.save();
    ctx.translate(-vbX * sx, -vbY * sy);
    ctx.scale(sx, sy);
    let path: Path2D | null = null;
    try {
      path = new Path2D(entry.path);
    } catch {
      path = null;
    }
    if (path) {
      if (fill !== "transparent") {
        ctx.fillStyle = fill;
        ctx.fill(path, "evenodd");
      }
      if (stroke) {
        ctx.strokeStyle = stroke.color;
        // Compensate for both the viewBox-fit scale (sx/sy applied
        // above to size the catalogue path to the layer) AND the
        // outer layer transform scale (applied by paintLayer before
        // this function runs). Both are multiplicative on the stroke
        // — a slider value of 4 should render 4 pixels regardless of
        // either.
        ctx.lineWidth =
          stroke.width / (Math.max(sx, sy) * layerScale);
        ctx.globalAlpha = clamp01(stroke.opacity) * (ctx.globalAlpha || 1);
        ctx.stroke(path);
      }
    }
    ctx.restore();
    return;
  }

  // Unknown shape id — match ShapeNode's dashed placeholder so the user
  // sees something rather than an invisible layer.
  ctx.save();
  ctx.strokeStyle = "#9CA3AF";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(0, 0, layer.width, layer.height);
  ctx.restore();
}

function paintBuiltInShape(
  ctx: CanvasRenderingContext2D,
  layer: ShapeLayer,
  fill: string,
  stroke: ResolvedStroke | null,
  layerScale: number,
): void {
  const w = layer.width;
  const h = layer.height;

  const applyStroke = (path?: () => void) => {
    if (!stroke) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    // Divide by the layer transform scale so the rendered stroke width
    // matches the slider value, mirroring Konva's
    // `strokeScaleEnabled={false}` on every ShapeNode primitive.
    ctx.lineWidth = stroke.width / layerScale;
    ctx.globalAlpha = clamp01(stroke.opacity) * (ctx.globalAlpha || 1);
    if (path) path();
    ctx.restore();
  };

  switch (layer.shapeId) {
    case "rect":
    case "rectangle":
    case "square": {
      if (fill !== "transparent") {
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, w, h);
      }
      applyStroke(() => ctx.strokeRect(0, 0, w, h));
      return;
    }
    case "ellipse":
    case "circle": {
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      if (fill !== "transparent") {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      applyStroke(() => {
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      return;
    }
    case "line": {
      // ShapeNode draws this as a horizontal stroked line whose width
      // is the layer height. fill is the line colour for built-ins.
      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = fill === "transparent" ? layer.fill : fill;
      ctx.lineWidth = Math.max(2, h);
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    case "triangle": {
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      if (fill !== "transparent") {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      applyStroke(() => {
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.stroke();
      });
      return;
    }
    case "star": {
      const cx = w / 2;
      const cy = h / 2;
      const inner = Math.min(w, h) / 4;
      const outer = Math.min(w, h) / 2;
      const points = 5;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (fill !== "transparent") {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      applyStroke(() => {
        // Re-trace the path for the stroke pass since we already used
        // beginPath + fill above.
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outer : inner;
          const angle = (i * Math.PI) / points - Math.PI / 2;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      });
      return;
    }
  }
}

// ─── Line shapes ────────────────────────────────────────────────
//
// Parallel implementation of `renderLineShape` in
// `src/components/photo-editor/canvas/ShapeNode.tsx`. Both render the
// same six line shape ids (line-straight / line-dashed / line-dotted
// / line-curved / line-freehand / line-double) plus optional
// arrowheads on the straight-style ids. The on-stage version uses
// Konva.Line / Konva.Arrow primitives; this file uses canvas-2d
// directly so the export can produce the same visual output.
//
// SYNC REQUIREMENT — these two implementations must stay aligned.
// Any change to ShapeNode's renderLineShape (thickness math, colour
// resolution, default fallback geometry, arrowhead sizing, dash
// pattern, double-line offset) must be replicated here, and vice
// versa. Both files have a comment block flagging the pairing.
//
// What's deliberately NOT pixel-exact vs stage:
//   • Freehand smoothing — Konva's Line(tension={0.4}) uses a
//     Catmull-Rom-like spline; this file uses canvas-2d quadratic
//     curves through midpoints. Visually close, especially on dense
//     freehand-captured paths, but not pixel-identical at sparse-
//     point peaks.
//   • Default S-curve fallback for line-curved without user-edited
//     bezier control points — Konva's `bezier` mode with the legacy
//     5-point S-curve points renders one cubic ending at point[3] =
//     (w*0.75, h*0.95) rather than reaching the right edge. We
//     render a clean S-curve from (0, h/2) to (w, h/2) instead.
//     Arguably more correct; the default fallback is a placeholder
//     that the user is expected to override with the bezier handles.
//
// Anything else — user-edited bezier, user-captured freehand
// points, dash patterns, double-line offset, arrowhead sizing — is
// a verbatim port of ShapeNode's math.

const LINE_PREFIX = "line-";

/** Mirrors ShapeNode.isLineShape — true when this shape should render
 *  through the line branch instead of falling through to findShape's
 *  static catalogue path. */
function isLineShape(shapeId: string): boolean {
  return shapeId.startsWith(LINE_PREFIX);
}

/** Mirrors ShapeNode.dashFor. Dash pattern in canvas pixels, scaled
 *  to thickness so the pattern reads consistently as the line gets
 *  thicker. Returns undefined for non-dashed line ids (caller leaves
 *  the canvas in default solid-stroke mode). */
function dashForLine(shapeId: string, thickness: number): number[] | undefined {
  const t = Math.max(1, thickness);
  if (shapeId === "line-dashed") return [t * 4, t * 2];
  if (shapeId === "line-dotted") return [t * 0.5, t * 1.5];
  return undefined;
}

const DEFAULT_LINE_PROPS: LineProps = {
  arrowStart: false,
  arrowEnd: false,
  arrowStyle: "triangle",
};

function paintLineShape(
  ctx: CanvasRenderingContext2D,
  layer: ShapeLayer,
): void {
  const { width: w, height: h, shapeId } = layer;
  const props: LineProps = layer.lineProps ?? DEFAULT_LINE_PROPS;

  // Mirrors ShapeNode's thickness / colour resolution exactly.
  const thickness = layer.stroke.width > 0 ? layer.stroke.width : 4;
  const colour =
    layer.stroke.opacity > 0 && layer.stroke.color
      ? layer.stroke.color
      : layer.fill;

  // Default endpoints — horizontal line through the bbox centre. The
  // user rotates / stretches the bbox to angle and length the line.
  const x1 = 0;
  const y1 = h / 2;
  const x2 = w;
  const y2 = h / 2;

  // ── Curved line ─────────────────────────────────────────────
  if (shapeId === "line-curved") {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = colour;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    if (props.bezier) {
      // User-authored bezier control points. Stored in normalised
      // (u, v) ∈ [0, 1] coords so the curve reflows when the bbox
      // resizes. Endpoints (P0 / P3) are fixed at the bbox sides;
      // only c1 and c2 are user-editable.
      const c1x = props.bezier.c1.u * w;
      const c1y = props.bezier.c1.v * h;
      const c2x = props.bezier.c2.u * w;
      const c2y = props.bezier.c2.v * h;
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x2, y2);
    } else {
      // Default S-curve fallback — render a clean cubic from left to
      // right edge. (See the SYNC REQUIREMENT note above for why
      // this differs from Konva's exact 5-point output.)
      ctx.bezierCurveTo(w * 0.25, h * 0.05, w * 0.75, h * 0.95, x2, y2);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  // ── Freehand ────────────────────────────────────────────────
  if (shapeId === "line-freehand") {
    let pts: { x: number; y: number }[];
    if (props.freehandPoints && props.freehandPoints.length >= 2) {
      pts = props.freehandPoints.map((p) => ({ x: p.u * w, y: p.v * h }));
    } else {
      // Default wave fallback — sampled sine, matches the catalogue's
      // static SVG path. Same parameters ShapeNode uses.
      pts = [];
      const steps = 32;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = t * w;
        const y = h / 2 + Math.sin(t * Math.PI * 4) * (h / 2 - 4);
        pts.push({ x, y });
      }
    }
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = colour;
    ctx.lineWidth = thickness;
    paintSmoothPolyline(ctx, pts);
    ctx.restore();
    return;
  }

  // ── Double line ─────────────────────────────────────────────
  if (shapeId === "line-double") {
    const offset = Math.max(thickness * 1.5, 4);
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = colour;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x1, y1 - offset);
    ctx.lineTo(x2, y2 - offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1 + offset);
    ctx.lineTo(x2, y2 + offset);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // ── Straight, dashed, dotted (with optional arrowheads) ─────
  const dash = dashForLine(shapeId, thickness);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = colour;
  ctx.lineWidth = thickness;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();

  // Arrowheads — only the straight-style ids honour them on stage
  // (renderLineShape's `hasArrow` check sits inside the straight /
  // dashed / dotted branch and ignores curved / freehand / double).
  // Arrowhead size scales with thickness so it always reads.
  const arrowLen = Math.max(thickness * 3, 12);
  const arrowWidth = Math.max(thickness * 2.5, 10);
  const arrowFilled = props.arrowStyle === "triangle";
  if (props.arrowEnd) {
    paintArrowhead(ctx, x2, y2, x1, y1, arrowLen, arrowWidth, colour, arrowFilled, thickness);
  }
  if (props.arrowStart) {
    paintArrowhead(ctx, x1, y1, x2, y2, arrowLen, arrowWidth, colour, arrowFilled, thickness);
  }
}

/** Stroke a smooth path through a sequence of points using canvas-2d
 *  quadratic curves through midpoints. Approximation of Konva's
 *  Catmull-Rom-style tension rendering — visually close on dense
 *  paths, slightly different on sparse-point peaks. (See SYNC
 *  REQUIREMENT note above paintLineShape.) */
function paintSmoothPolyline(
  ctx: CanvasRenderingContext2D,
  pts: readonly { x: number; y: number }[],
): void {
  if (pts.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 1) {
    ctx.stroke();
    return;
  }
  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    return;
  }
  // Smooth: walk through points, using each as a quadratic control
  // point with the midpoint between it and the next as the anchor.
  // This produces tangent-continuous curves through the midpoints
  // with the user's points as natural curvature peaks.
  for (let i = 1; i < pts.length - 1; i++) {
    const cx = pts[i].x;
    const cy = pts[i].y;
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(cx, cy, mx, my);
  }
  // Final segment — straight line to the last point.
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
}

/** Draw an arrowhead at (tipX, tipY) pointing away from (fromX, fromY).
 *  The arrowhead is a triangle with tip at the line endpoint and base
 *  perpendicular to the line direction at distance `length` back from
 *  the tip, base width `width`. `filled === true` paints a filled
 *  triangle (Konva.Arrow with fill = colour); false paints the two
 *  open chevron strokes only (Konva.Arrow with fill = "transparent").
 *
 *  Mirrors Konva.Arrow's pointerLength / pointerWidth / arrowStyle
 *  geometry.
 */
function paintArrowhead(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  fromX: number,
  fromY: number,
  length: number,
  width: number,
  colour: string,
  filled: boolean,
  strokeThickness: number,
): void {
  const dx = tipX - fromX;
  const dy = tipY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return;
  // Unit vector along the line, pointing toward the tip.
  const ux = dx / len;
  const uy = dy / len;
  // Back-centre point: `length` units back from the tip along -u.
  const baseCx = tipX - ux * length;
  const baseCy = tipY - uy * length;
  // Perpendicular vector (90° CCW from u).
  const px = -uy;
  const py = ux;
  const halfW = width / 2;
  const baseLx = baseCx + px * halfW;
  const baseLy = baseCy + py * halfW;
  const baseRx = baseCx - px * halfW;
  const baseRy = baseCy - py * halfW;

  ctx.save();
  if (filled) {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseLx, baseLy);
    ctx.lineTo(baseRx, baseRy);
    ctx.closePath();
    ctx.fill();
  } else {
    // Chevron — two open strokes from base corners to tip. Match the
    // line's stroke thickness so the arrow reads as a continuation
    // of the line rather than a thinner detail.
    ctx.strokeStyle = colour;
    ctx.lineWidth = strokeThickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(baseLx, baseLy);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(baseRx, baseRy);
    ctx.stroke();
  }
  ctx.restore();
}

interface ResolvedStroke {
  color: string;
  width: number;
  opacity: number;
}

function resolveShapeStroke(layer: ShapeLayer): ResolvedStroke | null {
  if (layer.stroke.width > 0 && layer.stroke.opacity > 0) {
    return {
      // null colour = inherit from fill (May 2026). Mirrors ShapeNode.
      color: layer.stroke.color ?? layer.fill,
      width: layer.stroke.width,
      opacity: layer.stroke.opacity,
    };
  }
  if (layer.variant === "outlined") {
    // Mirrors ShapeNode: outlined variant always shows an outline at
    // 4px in the layer's fill colour even when explicit stroke is off.
    return { color: layer.fill, width: 4, opacity: 1 };
  }
  return null;
}

function parseViewBox(viewBox: string): [number, number, number, number] {
  const parts = viewBox.split(/[\s,]+/).map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 100, parts[3] || 100];
}

// ─── Helpers ────────────────────────────────────────────────────

function orderLayers(
  layers: readonly AnyLayer[],
  layerOrder: readonly string[],
): AnyLayer[] {
  const byId = new Map<string, AnyLayer>();
  for (const layer of layers) {
    byId.set(layer.id, layer);
  }
  const out: AnyLayer[] = [];
  for (const id of layerOrder) {
    const layer = byId.get(id);
    if (layer) out.push(layer);
  }
  // Append any layers not in layerOrder at the end so they still
  // render — defensive against state desync.
  for (const layer of layers) {
    if (!layerOrder.includes(layer.id)) out.push(layer);
  }
  return out;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function mapBlendMode(
  mode: AnyLayer["blendMode"],
): GlobalCompositeOperation {
  // BlendMode values match canvas globalCompositeOperation strings 1-1
  // for the modes the editor exposes. "normal" maps to "source-over".
  if (mode === "normal") return "source-over";
  return mode as GlobalCompositeOperation;
}

/** Bake an image (optionally cropped, optionally CSS-filtered) into a
 *  fresh offscreen canvas. Returns `null` when neither crop nor filters
 *  apply — caller uses the original image directly for performance.
 *
 *  The returned canvas is sized to the cropped dimensions (or the
 *  image's natural dims when there's no crop), with the cropped +
 *  filtered pixels drawn at (0, 0). drawImage from this canvas can
 *  then stretch the result wherever the caller needs it.
 *
 *  Used by the photo-background paint path and the image-layer paint
 *  path to apply filters that on stage are handled by Konva's filter
 *  chain (background) or by `ImageNode`'s perspective source canvas
 *  (image perspective). Both call sites end up using the CSS-filter
 *  approximation rather than re-implementing Konva's filter math —
 *  same trade-off the on-stage perspective path already accepts. */
function bakeImage(
  img: HTMLImageElement,
  crop: Rect | null,
  filterStr: string | null,
): HTMLCanvasElement | null {
  if (!crop && !filterStr) return null;
  const w = crop ? crop.width : img.naturalWidth || img.width;
  const h = crop ? crop.height : img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(w));
  canvas.height = Math.max(1, Math.floor(h));
  const bctx = canvas.getContext("2d");
  if (!bctx) return null;
  if (filterStr) {
    // CSS filters compose with drawImage — the filter applies to every
    // pixel as it's drawn into the destination canvas.
    bctx.filter = filterStr;
  }
  if (crop) {
    bctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );
  } else {
    bctx.drawImage(img, 0, 0);
  }
  return canvas;
}

// Re-export for callers that want to enumerate available resolutions.
export const EXPORT_RESOLUTIONS: readonly ExportResolution[] = [1, 2, 4];

// Touch the exhaustiveness helper so unused-symbol lint doesn't strip
// it — kept for future Background variant additions.
void exhaustiveBackgroundCheck;

// ─── Image preload helper ───────────────────────────────────────
//
// Walks a project and produces the list of unique image / sticker /
// photo-background URLs that the renderer needs to have loaded before
// it can paint. The caller resolves them all in parallel via
// `loadExportImages` below.

export function collectImageSources(project: Project): string[] {
  const out = new Set<string>();
  if (project.background.kind === "photo") {
    out.add(project.background.src);
  }
  for (const layer of project.layers) {
    if (layer.kind === "image" && layer.src) out.add(layer.src);
    if (layer.kind === "sticker" && layer.src) out.add(layer.src);
    if (layer.kind === "text") {
      for (const run of layer.runs) {
        if (run.texture.enabled && run.texture.src) {
          out.add(run.texture.src);
        }
      }
    }
  }
  return Array.from(out);
}

/** Pre-load every image source in a Map<src, HTMLImageElement>. Each
 *  image is loaded with `crossOrigin="anonymous"` so cross-origin
 *  assets (Twemoji from cdn.jsdelivr.net) end up in a CORS-clean state
 *  that won't taint the export canvas. Failed loads resolve to a
 *  dropped key — the renderer treats missing sources the same as the
 *  on-stage code. */
export async function loadExportImages(
  sources: readonly string[],
): Promise<Map<string, HTMLImageElement>> {
  const out = new Map<string, HTMLImageElement>();
  await Promise.all(
    sources.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            out.set(src, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  );
  return out;
}
