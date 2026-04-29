// src/lib/photo-editor/rich-text/engine.ts
//
// Top-level rich-text engine. Two responsibilities:
//   • layoutText(layer)            — pure-logic layout (delegates to layout.ts)
//   • renderTextToCanvas(ctx, …)   — paint a laid-out text layer onto a 2D canvas
//
// Render pipeline per glyph:
//   1. Highlight rectangle (drawn before glyphs so it sits behind)
//   2. Shadow params (set on ctx, painted with the fill in step 4)
//   3. Stroke (drawn first so the fill sits on top — Add-Text-style "outlined" look)
//   4. Fill (solid, gradient, or texture)
//   5. Decoration lines (underline / strikethrough — drawn after glyphs so they sit on top)

import type { GlyphRun, TextLayer } from "../types";
import { fontStringForRun } from "./measure";
import {
  layoutTextLayer,
  type LaidGlyph,
  type LaidLine,
  type LayoutResult,
} from "./layout";
import { bendPoint, createBendContext, type BendContext } from "./bend";

export type { LaidGlyph, LaidLine, LayoutResult };

/** Re-export for callers that just want a layout. */
export function layoutText(layer: TextLayer): LayoutResult {
  return layoutTextLayer(layer);
}

export interface RenderTextOptions {
  /** Pre-loaded HTMLImageElement / HTMLCanvasElement / ImageBitmap for any
   *  texture references, keyed by texture src. If a texture is referenced
   *  but not present, the engine falls back to the run's solid fill. */
  textures?: Map<string, CanvasImageSource>;
  /** When true, draws faint debug overlays (line bounding boxes, baselines).
   *  Useful in the engine sandbox; off by default. */
  debug?: boolean;
}

/** Paint a laid-out text layer onto a 2D canvas context.
 *
 *  Coordinates are layer-local (0,0 = top-left of the layer's bounding
 *  box). The caller is responsible for translating to the layer's
 *  position on the canvas before calling.
 *
 *  The context's transform is left untouched after the call (we save /
 *  restore around the entire pass). */
export function renderTextToCanvas(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  layout: LayoutResult,
  options: RenderTextOptions = {}
): void {
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Build the bend context once. Null means flat — the fast path that
  // skips all per-glyph transform work and uses the existing line-level
  // grouping for highlights and decorations.
  const bend = createBendContext(
    layer.styling.bend?.amount ?? 0,
    layer.width
  );

  // Pass 1: highlights.
  for (const line of layout.lines) {
    if (bend) {
      drawHighlightsForLineBent(ctx, line, bend);
    } else {
      drawHighlightsForLine(ctx, line);
    }
  }

  // Pass 2: glyphs.
  for (const line of layout.lines) {
    for (const glyph of line.glyphs) {
      if (bend) {
        drawGlyphBent(ctx, glyph, options, bend);
      } else {
        drawGlyph(ctx, glyph, options, glyph.x, glyph.y);
      }
    }
  }

  // Pass 3: decorations.
  for (const line of layout.lines) {
    if (bend) {
      drawDecorationsForLineBent(ctx, line, bend);
    } else {
      drawDecorationsForLine(ctx, line);
    }
  }

  if (options.debug) {
    drawDebugOverlay(ctx, layout);
  }

  ctx.restore();
}

// ─── Highlight ──────────────────────────────────────────────────

function drawHighlightsForLine(
  ctx: CanvasRenderingContext2D,
  line: LaidLine
): void {
  // Group consecutive glyphs that share the same enabled highlight, then
  // paint one rect per group.
  let groupStart = -1;
  let groupRun: GlyphRun | null = null;

  function flush(endIndex: number) {
    if (groupStart < 0 || !groupRun) return;
    const first = line.glyphs[groupStart];
    const last = line.glyphs[endIndex - 1];
    const x = first.x;
    const y = line.baselineY - line.ascent;
    const w = last.x + last.width - first.x;
    const h = line.height;
    ctx.save();
    ctx.globalAlpha = clamp01(groupRun.highlight.opacity);
    ctx.fillStyle = groupRun.highlight.color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    groupStart = -1;
    groupRun = null;
  }

  for (let i = 0; i < line.glyphs.length; i++) {
    const g = line.glyphs[i];
    if (g.run.highlight.enabled) {
      if (groupRun && sameHighlight(g.run, groupRun)) {
        // continue group
      } else {
        flush(i);
        groupStart = i;
        groupRun = g.run;
      }
    } else {
      flush(i);
    }
  }
  flush(line.glyphs.length);
}

function sameHighlight(a: GlyphRun, b: GlyphRun): boolean {
  return (
    a.highlight.color === b.highlight.color &&
    a.highlight.opacity === b.highlight.opacity
  );
}

/** Bent highlight pass — paints a small rotated rect per highlighted
 *  glyph instead of one merged rect per group. The line-level grouping
 *  optimisation in {@link drawHighlightsForLine} is bypassed because
 *  consecutive glyphs along an arc no longer share an axis-aligned
 *  bounding box. Visually the per-glyph rects abut tightly enough that
 *  the merge isn't missed. */
function drawHighlightsForLineBent(
  ctx: CanvasRenderingContext2D,
  line: LaidLine,
  bend: BendContext
): void {
  for (const g of line.glyphs) {
    if (!g.run.highlight.enabled) continue;
    const cx = g.x + g.width / 2;
    const bp = bendPoint(bend, cx, g.y);
    ctx.save();
    ctx.translate(bp.x, bp.y);
    ctx.rotate(bp.angle);
    ctx.globalAlpha = clamp01(g.run.highlight.opacity);
    ctx.fillStyle = g.run.highlight.color;
    // Per-glyph rect spans the full line height so multiple lines stack
    // correctly. Width-wise we use the glyph's advance to keep adjacent
    // rects flush.
    ctx.fillRect(-g.width / 2, -line.ascent, g.width, line.height);
    ctx.restore();
  }
}

// ─── Glyph (stroke + fill + shadow) ─────────────────────────────

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: LaidGlyph,
  options: RenderTextOptions,
  /** Where to paint the glyph in the current ctx frame. The canvas's
   *  fillText / strokeText draw the glyph with its left edge at x and
   *  baseline at y. Flat-mode callers pass (glyph.x, glyph.y); bent-mode
   *  callers translate+rotate the ctx and pass (-glyph.width/2, 0). */
  localX: number,
  localY: number
): void {
  const run = glyph.run;

  ctx.save();
  ctx.font = fontStringForRun(run);
  ctx.globalAlpha = clamp01(run.opacity);

  // Shadow — applies to whatever we draw next (stroke + fill).
  if (run.shadow.enabled) {
    ctx.shadowColor = withAlpha(run.shadow.color, run.shadow.opacity);
    ctx.shadowBlur = run.shadow.blur;
    ctx.shadowOffsetX = run.shadow.offsetX;
    ctx.shadowOffsetY = run.shadow.offsetY;
  }

  // Stroke first — we double the stroke width so the visible outline is
  // exactly half stroke-width wide once the fill paints over the inner
  // half. Matches Add Text's "outlined" look.
  if (run.stroke.enabled && run.stroke.width > 0) {
    ctx.save();
    ctx.lineWidth = run.stroke.width * 2;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeStyle = withAlpha(run.stroke.color, run.stroke.opacity);
    ctx.strokeText(glyph.char, localX, localY);
    ctx.restore();
  }

  // Fill — solid, gradient, or texture (mutually exclusive).
  ctx.fillStyle = resolveFillStyle(ctx, run, glyph, options, localX, localY);
  ctx.fillText(glyph.char, localX, localY);

  ctx.restore();
}

/** Paint a glyph in bent mode. The ctx is transformed so the glyph's
 *  bent-baseline-centre sits at the origin and its baseline is rotated
 *  to follow the arc tangent; we then draw at local (-w/2, 0). Shadows,
 *  gradients, and patterns inherit the rotation, which is what we want
 *  visually — they're "stuck to" the glyph as it warps. */
function drawGlyphBent(
  ctx: CanvasRenderingContext2D,
  glyph: LaidGlyph,
  options: RenderTextOptions,
  bend: BendContext
): void {
  const cx = glyph.x + glyph.width / 2;
  const bp = bendPoint(bend, cx, glyph.y);

  ctx.save();
  ctx.translate(bp.x, bp.y);
  ctx.rotate(bp.angle);
  drawGlyph(ctx, glyph, options, -glyph.width / 2, 0);
  ctx.restore();
}

function resolveFillStyle(
  ctx: CanvasRenderingContext2D,
  run: GlyphRun,
  glyph: LaidGlyph,
  options: RenderTextOptions,
  /** Local-frame anchor — same (x, y) the caller will pass to fillText.
   *  Gradient endpoints are computed in this frame so they sit correctly
   *  inside whatever transform (translate+rotate, in bend mode) is on the
   *  ctx when the fill is committed. */
  localX: number,
  localY: number
): string | CanvasGradient | CanvasPattern {
  // Texture takes precedence when both gradient and texture are enabled.
  if (run.texture.enabled && run.texture.src) {
    const img = options.textures?.get(run.texture.src);
    if (img) {
      const pat = ctx.createPattern(img, "repeat");
      if (pat) {
        const t = run.texture;
        const matrix = new DOMMatrix()
          .translate(t.offsetX, t.offsetY)
          .scale(t.scale, t.scale)
          .rotate(t.rotation);
        if (typeof pat.setTransform === "function") {
          pat.setTransform(matrix);
        }
        return pat;
      }
    }
    // Texture not loaded — fall through to gradient / solid.
  }

  if (run.gradient.enabled && run.gradient.stops.length > 0) {
    // Per-glyph gradient: each character gets the full gradient range
    // across its bounding box. (For "gradient across whole text" we'd
    // need a different mode; defer until the Gradient tool defines it.)
    const angleRad = ((run.gradient.angle - 90) * Math.PI) / 180;
    const cx = localX + glyph.width / 2;
    const cy = localY - glyph.ascent / 2;
    const radius = Math.max(glyph.width, glyph.ascent + glyph.descent) / 2;
    const sx = cx - Math.cos(angleRad) * radius;
    const sy = cy - Math.sin(angleRad) * radius;
    const ex = cx + Math.cos(angleRad) * radius;
    const ey = cy + Math.sin(angleRad) * radius;
    const grad = ctx.createLinearGradient(sx, sy, ex, ey);
    for (const stop of run.gradient.stops) {
      grad.addColorStop(clamp01(stop.position), stop.color);
    }
    return grad;
  }

  return run.fill;
}

// ─── Decorations (underline / strikethrough) ────────────────────

function drawDecorationsForLine(
  ctx: CanvasRenderingContext2D,
  line: LaidLine
): void {
  let groupStart = -1;
  let groupRun: GlyphRun | null = null;

  function flush(endIndex: number) {
    if (groupStart < 0 || !groupRun) return;
    const decoration = groupRun.decoration;
    if (decoration === "none") {
      groupStart = -1;
      groupRun = null;
      return;
    }
    const first = line.glyphs[groupStart];
    const last = line.glyphs[endIndex - 1];
    const x1 = first.x;
    const x2 = last.x + last.width;
    const baselineY = line.baselineY;
    const fontSize = groupRun.fontSize;
    const thickness = Math.max(1, fontSize * 0.06);

    ctx.save();
    ctx.globalAlpha = clamp01(groupRun.opacity);
    ctx.strokeStyle = groupRun.fill;
    ctx.lineWidth = thickness;
    ctx.lineCap = "butt";

    if (decoration === "underline" || decoration === "underline-strikethrough") {
      const y = baselineY + fontSize * 0.12;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
    if (decoration === "strikethrough" || decoration === "underline-strikethrough") {
      const y = baselineY - fontSize * 0.3;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }

    ctx.restore();
    groupStart = -1;
    groupRun = null;
  }

  for (let i = 0; i < line.glyphs.length; i++) {
    const g = line.glyphs[i];
    if (g.run.decoration !== "none") {
      if (groupRun && sameDecoration(g.run, groupRun)) {
        // continue
      } else {
        flush(i);
        groupStart = i;
        groupRun = g.run;
      }
    } else {
      flush(i);
    }
  }
  flush(line.glyphs.length);
}

function sameDecoration(a: GlyphRun, b: GlyphRun): boolean {
  return (
    a.decoration === b.decoration &&
    a.fontSize === b.fontSize &&
    a.fill === b.fill &&
    a.opacity === b.opacity
  );
}

/** Bent decoration pass — paints a per-glyph short underline /
 *  strikethrough segment in the rotated local frame instead of one long
 *  segment per group. Trade-off matches {@link drawHighlightsForLineBent}:
 *  the line-level group merge is bypassed because the segments are no
 *  longer collinear along an arc, but adjacent glyph segments abut
 *  tightly enough that the result reads as continuous. */
function drawDecorationsForLineBent(
  ctx: CanvasRenderingContext2D,
  line: LaidLine,
  bend: BendContext
): void {
  for (const g of line.glyphs) {
    const decoration = g.run.decoration;
    if (decoration === "none") continue;

    const cx = g.x + g.width / 2;
    const bp = bendPoint(bend, cx, g.y);
    const fontSize = g.run.fontSize;
    const thickness = Math.max(1, fontSize * 0.06);

    ctx.save();
    ctx.translate(bp.x, bp.y);
    ctx.rotate(bp.angle);
    ctx.globalAlpha = clamp01(g.run.opacity);
    ctx.strokeStyle = g.run.fill;
    ctx.lineWidth = thickness;
    ctx.lineCap = "butt";

    if (decoration === "underline" || decoration === "underline-strikethrough") {
      const y = fontSize * 0.12;
      ctx.beginPath();
      ctx.moveTo(-g.width / 2, y);
      ctx.lineTo(g.width / 2, y);
      ctx.stroke();
    }
    if (decoration === "strikethrough" || decoration === "underline-strikethrough") {
      const y = -fontSize * 0.3;
      ctx.beginPath();
      ctx.moveTo(-g.width / 2, y);
      ctx.lineTo(g.width / 2, y);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ─── Debug overlay ──────────────────────────────────────────────

function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  layout: LayoutResult
): void {
  ctx.save();
  ctx.lineWidth = 1;

  // Layout bounding box — red.
  ctx.strokeStyle = "rgba(220, 38, 38, 0.5)";
  ctx.strokeRect(0, 0, layout.width, layout.height);

  for (const line of layout.lines) {
    // Baseline — blue.
    ctx.strokeStyle = "rgba(37, 99, 235, 0.6)";
    ctx.beginPath();
    ctx.moveTo(0, line.baselineY);
    ctx.lineTo(layout.width, line.baselineY);
    ctx.stroke();

    // Line bbox — green.
    ctx.strokeStyle = "rgba(22, 163, 74, 0.4)";
    ctx.strokeRect(
      0,
      line.baselineY - line.ascent,
      layout.width,
      line.height
    );
  }
  ctx.restore();
}

// ─── Helpers ────────────────────────────────────────────────────

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Mix `alpha` (0–1) into a CSS colour string. Crude but sufficient —
 *  handles #RRGGBB; for other formats falls back to the original colour
 *  and lets the caller apply globalAlpha. */
function withAlpha(color: string, alpha: number): string {
  if (alpha >= 1) return color;
  if (alpha <= 0) return "transparent";
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
