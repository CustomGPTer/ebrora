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
  Project,
  ShapeLayer,
  StickerLayer,
  TextLayer,
} from "../types";
import { layoutText, renderTextToCanvas } from "../rich-text/engine";
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
      if (img) {
        // Photo backgrounds support flip + rotation flags. Apply via
        // canvas transform around the centre.
        ctx.save();
        ctx.translate(width / 2, height / 2);
        if (background.rotation) {
          ctx.rotate((background.rotation * Math.PI) / 180);
        }
        const sx = background.flip.horizontal ? -1 : 1;
        const sy = background.flip.vertical ? -1 : 1;
        ctx.scale(sx, sy);
        // Drawn so that the image fills the canvas area regardless of
        // its natural aspect — caller is expected to have set width /
        // height to match the photo aspect, but we stretch to fit if
        // not (mirrors PhotoRect's on-stage behaviour).
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
      } else if (!preserveTransparency) {
        // Image not loaded (CORS, etc) — paint white fallback so JPEG /
        // PDF don't end up with a black void.
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
      }
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
  // Mirror the on-stage extent calc in RichTextNode: take the max of
  // `layout.width` and the aligned glyph rect (`layout.bounds`) so
  // centred / right-aligned / justify-multi-line glyphs that sit past
  // `layout.width` are not clipped on export. Bend / text-background
  // padding are handled in the on-stage path; the export pipeline
  // doesn't render those underlays, so we only need the alignment fix
  // here. Layer-local minX stays at 0 — the bctx.translate(PAD, PAD)
  // and the ctx.drawImage offset below both rely on it.
  const contentMaxX = Math.max(
    layout.width,
    layout.bounds.x + layout.bounds.width,
  );
  const contentMaxY = Math.max(layout.height, layout.bounds.height);
  const w = Math.max(1, Math.ceil(contentMaxX + RENDER_PADDING * 2));
  const h = Math.max(1, Math.ceil(contentMaxY + RENDER_PADDING * 2));

  // Render into a per-layer off-screen so the destination-out erase
  // pass only affects this layer's pixels and not anything painted
  // beneath it. (If we painted directly onto the export canvas, the
  // erase pass would punch holes through the background and lower
  // layers — the on-stage code avoids this by rendering text into its
  // own RichTextNode bitmap, and we mirror that.)
  const bitmap = document.createElement("canvas");
  bitmap.width = w;
  bitmap.height = h;
  const bctx = bitmap.getContext("2d");
  if (!bctx) return;

  bctx.save();
  bctx.translate(RENDER_PADDING, RENDER_PADDING);
  renderTextToCanvas(bctx, layer, layout);
  if (layer.erase.length > 0) {
    applyEraseStrokes(bctx, layer.erase);
  }
  bctx.restore();

  // Draw the bitmap onto the export canvas at the layer's local origin.
  // Subtract RENDER_PADDING so the visible text aligns with the layer's
  // transform.x / transform.y (matching RichTextNode's offsetX/offsetY
  // behaviour).
  ctx.drawImage(bitmap, -RENDER_PADDING, -RENDER_PADDING);
}

// ─── Image ──────────────────────────────────────────────────────

function paintImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: ImageLayer,
  images: Map<string, HTMLImageElement>,
): void {
  const img = images.get(layer.src);
  if (!img) return; // Missing image — silent skip, same as on-stage.

  if (layer.crop) {
    // 9-arg drawImage variant — sub-region of the source rendered into
    // the layer's display rect.
    ctx.drawImage(
      img,
      layer.crop.x,
      layer.crop.y,
      layer.crop.width,
      layer.crop.height,
      0,
      0,
      layer.crop.width,
      layer.crop.height,
    );
  } else {
    ctx.drawImage(img, 0, 0, layer.naturalWidth, layer.naturalHeight);
  }
  // Perspective warp is documented as v1.1 — mirrors ImageNode.tsx
  // which renders flat when layer.perspective is non-null. Skipped here
  // intentionally.
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

  // Built-in primitives — mirror ShapeNode's per-id rendering.
  if (isBuiltInShape(layer.shapeId)) {
    paintBuiltInShape(ctx, layer, fill, stroke);
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
        ctx.lineWidth = stroke.width / Math.max(sx, sy);
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
): void {
  const w = layer.width;
  const h = layer.height;

  const applyStroke = (path?: () => void) => {
    if (!stroke) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
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
