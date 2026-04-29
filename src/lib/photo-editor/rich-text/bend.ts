// src/lib/photo-editor/rich-text/bend.ts
//
// Pure-logic helpers for Bend — the per-glyph arc warp applied at paint
// time when `layer.styling.bend.amount !== 0`. New for Batch D2a.
//
// Architecture choice (rejected the handover's Konva.TextPath plan):
// this codebase paints text via a custom canvas engine (see engine.ts),
// not Konva.Text. Bend therefore lives in the engine's render passes,
// not in a Konva node migration. The engine builds a BendContext once
// per layout, then routes highlight / glyph / decoration paints through
// per-glyph bent transforms.
//
// Math summary
// ────────────
// Inputs:
//   • amount t ∈ [-100, 100] — UI value
//   • W — layer wrap width (canvas pixels)
//
// Normalisations:
//   • tn = t / 100 ∈ [-1, 1]
//   • θ = π · |tn|     — subtended angle of the arc, [0, π]
//   • r = W / θ        — arc radius, chosen so arc length == W
//                        (text isn't compressed/stretched along the arc)
//
// For a flat point (x, y_b) sitting on the layer's baseline:
//   • φ = θ · (x/W − 0.5)            ∈ [-θ/2, θ/2]
//   • bentX = W/2 + r · sin(φ)
//   • bentY = y_b − sign(tn) · r · (cos(φ) − cos(θ/2))
//   • rotation α = sign(tn) · φ        (CW positive, canvas convention)
//
// For tn > 0 the arc is ∩-shaped (rainbow): centre is above the baseline,
// edges sit on y_b and the apex is at y_b − r·(1 − cos(θ/2)). For tn < 0
// the arc is ∪-shaped (smile): edges on y_b, apex BELOW at
// y_b + r·(1 − cos(θ/2)).
//
// Glyphs are painted by translating the ctx to (bentX, bentY), rotating
// by α, then drawing the glyph at local-x = -glyph.width/2 (centred on
// the bent point) with local-y = 0 (so the baseline stays correct).
// Highlights and decorations are painted per-glyph in the bent frame —
// the line-level grouping in engine.ts is bypassed when bend is active.
//
// Bend applies uniformly to ALL lines of a multi-line layer, sharing the
// same arc geometry. (More sophisticated per-line arcs were considered
// and rejected: the visual result of common multi-line bend usage is
// indistinguishable to most users, and per-line arcs complicate hit-test
// in ways we don't need yet.)

import type { LayoutResult } from "./layout";

/** Frozen geometry derived from a TextLayer's bend amount + wrap width.
 *  Build once per render via {@link createBendContext}, then reuse for
 *  every glyph / highlight / decoration paint. */
export interface BendContext {
  /** Layer wrap width in canvas pixels. */
  width: number;
  /** Subtended angle of the full arc in radians. Always positive. */
  theta: number;
  /** Arc radius in canvas pixels. Always positive. */
  radius: number;
  /** +1 for ∩-shape (positive amount), -1 for ∪-shape (negative). */
  direction: 1 | -1;
  /** Half-angle, cached. */
  halfTheta: number;
  /** cos(theta/2), cached. */
  cosHalfTheta: number;
}

/** Result of bending a single point — the bent canvas-local coordinates
 *  and the tangent rotation that a glyph painted at this point should
 *  receive (in radians, CW positive in canvas space). */
export interface BentPoint {
  x: number;
  y: number;
  /** Rotation in radians for the glyph at this point. */
  angle: number;
}

/** Build a BendContext from a styling.bend.amount value (-100..100) and a
 *  layer wrap width. Returns null when bend is effectively zero — callers
 *  use the null branch as a fast "no bend" path that skips all bend math
 *  and uses the flat layout directly. */
export function createBendContext(
  amount: number,
  width: number
): BendContext | null {
  // Treat anything in (-0.5, 0.5) as flat — the UI slider step is 1, so
  // this is equivalent to amount === 0 in practice. The tolerance also
  // protects against pathological subtended angles when the user lands
  // on a non-zero value via gesture inertia.
  const t = clampAmount(amount) / 100;
  if (Math.abs(t) < 0.005) return null;
  if (width <= 0) return null;

  const theta = Math.PI * Math.abs(t);
  const radius = width / theta;
  const direction: 1 | -1 = t > 0 ? 1 : -1;

  return {
    width,
    theta,
    radius,
    direction,
    halfTheta: theta / 2,
    cosHalfTheta: Math.cos(theta / 2),
  };
}

/** Clamp a UI bend amount to its valid range. */
export function clampAmount(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  if (amount > 100) return 100;
  if (amount < -100) return -100;
  return amount;
}

/** Map a flat (x, y) point on a baseline to its bent equivalent + the
 *  tangent rotation a glyph painted there should use. */
export function bendPoint(
  ctx: BendContext,
  x: number,
  baselineY: number
): BentPoint {
  const phi = ctx.theta * (x / ctx.width - 0.5);
  const bx = ctx.width / 2 + ctx.radius * Math.sin(phi);
  const by =
    baselineY -
    ctx.direction * ctx.radius * (Math.cos(phi) - ctx.cosHalfTheta);
  const angle = ctx.direction * phi;
  return { x: bx, y: by, angle };
}

/** Compute the axis-aligned bounding box of the bent text. Used by the
 *  Konva render node to size its off-screen canvas correctly. Sampling
 *  every laid glyph's 4 corners pre-bend, transforming each through the
 *  bend, and taking min/max — this is exact for the corner positions of
 *  rotated rectangles and tight enough that we don't need to oversample
 *  curve segments separately. */
export function computeBentBounds(
  bend: BendContext,
  layout: LayoutResult
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const line of layout.lines) {
    for (const g of line.glyphs) {
      // Centre point of the glyph on its flat baseline — this is the
      // anchor we bend, and the glyph paints rotated around it.
      const cx = g.x + g.width / 2;
      const bp = bendPoint(bend, cx, g.y);

      // The glyph's local rectangle in its rotated frame:
      //   x ∈ [-w/2, w/2]
      //   y ∈ [-ascent, descent]
      const halfW = g.width / 2;
      const cosA = Math.cos(bp.angle);
      const sinA = Math.sin(bp.angle);

      const corners: Array<[number, number]> = [
        [-halfW, -g.ascent],
        [halfW, -g.ascent],
        [halfW, g.descent],
        [-halfW, g.descent],
      ];

      for (const [lx, ly] of corners) {
        const wx = bp.x + lx * cosA - ly * sinA;
        const wy = bp.y + lx * sinA + ly * cosA;
        if (wx < minX) minX = wx;
        if (wy < minY) minY = wy;
        if (wx > maxX) maxX = wx;
        if (wy > maxY) maxY = wy;
      }
    }
  }

  // Empty layout fallback — give back something sensible.
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  return { minX, minY, maxX, maxY };
}
