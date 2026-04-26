// src/lib/photo-editor/canvas/erase-render.ts
//
// Pure-logic helper that applies a list of erase strokes to a 2D canvas
// context using `globalCompositeOperation = "destination-out"` — the
// classic mask-out pattern that powers the "Text Behind" effect.
//
// Caller responsibilities:
//   • Make sure the context is in the layer's local coord space (i.e. the
//     same translation/scale that text was rendered at). RichTextNode
//     already translates by RENDER_PADDING; this helper does NOT add any
//     transform.
//   • Save the prior composite operation if it matters; this helper
//     toggles to "destination-out" while painting and restores
//     "source-over" before returning.
//
// Each stroke is rendered as a round-capped polyline connecting its
// `points`. Stroke width is `radius * 2`. Single-point strokes (a tap
// rather than a drag) paint a circle of `radius`.

import type { EraseStroke } from "../types";

/** Apply a list of erase strokes to the given context. Mutates ctx state
 *  but restores `globalCompositeOperation` to "source-over" before
 *  returning. No-op when `strokes` is empty. */
export function applyEraseStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: readonly EraseStroke[],
): void {
  if (strokes.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Full-opacity erasure — destination-out at any non-zero alpha clips
  // pixels, but we keep this explicit so the user gets predictable
  // results regardless of whatever alpha the caller had set.
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = "#000000";
  ctx.globalAlpha = 1;

  for (const stroke of strokes) {
    paintStroke(ctx, stroke);
  }

  ctx.restore();
}

/** Paint a single stroke. Exported for the EraseTool's live preview, which
 *  needs to render the in-progress stroke separately from the committed
 *  list. The caller is responsible for the surrounding composite op. */
export function paintStroke(
  ctx: CanvasRenderingContext2D,
  stroke: EraseStroke,
): void {
  const { points, radius } = stroke;
  if (points.length === 0 || radius <= 0) return;

  if (points.length === 1) {
    // Single-point stroke — render a filled disc.
    const p = points[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Polyline — round-capped stroke connecting points.
  ctx.lineWidth = radius * 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}
