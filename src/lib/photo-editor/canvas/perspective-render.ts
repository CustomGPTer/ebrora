// src/lib/photo-editor/canvas/perspective-render.ts
//
// Phase 2 — 4-point perspective warp for ImageLayer.
//
// Konva has no native perspective primitive (it's a 2D library), so we
// render the warp via the standard "triangle subdivision with affine
// per-triangle drawImage" technique:
//
//   1. Subdivide the source rectangle (the un-warped image) into an
//      MxN grid of cells.
//   2. Subdivide the destination quad (the four perspective corners)
//      into the same MxN grid using bilinear interpolation along its
//      edges + diagonals.
//   3. Each cell is two triangles. For each pair, compute the unique
//      affine transform that maps the source triangle to the dest
//      triangle, clip the canvas to the dest triangle, apply the
//      affine, and drawImage.
//
// At low subdivision counts (e.g., 2 = single quad split diagonally)
// the result looks like a kite — wrong perspective. Higher counts
// approximate true projective transform progressively. 16×16 (= 512
// triangles) is the sweet spot: visually crisp, performant on modern
// devices. Bumping to 32×32 (= 2048 triangles) doubles the memory /
// CPU cost for diminishing visual return.
//
// Per-triangle affine maths:
//   Given source triangle (s1, s2, s3) and dest triangle (d1, d2, d3),
//   solve the 6×6 system for the 6 coefficients of the affine [a c e;
//   b d f]. Two independent 3×3 sub-systems (one for x, one for y) via
//   Cramer's rule keeps the maths cheap and dependency-free.

import type { Point } from "../types";

/** Number of subdivisions along each axis. 16 means a 16×16 grid =
 *  256 cells = 512 triangles. */
const MESH_RESOLUTION = 16;

/** A 2D affine transform expressed as Canvas2D's setTransform args. */
interface Affine {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/** Compute the affine transform that maps the three source points to
 *  the three destination points. Returns null when the source triangle
 *  is degenerate (zero area) — caller should skip rendering it. */
function affineFromTriangles(
  sx1: number,
  sy1: number,
  sx2: number,
  sy2: number,
  sx3: number,
  sy3: number,
  dx1: number,
  dy1: number,
  dx2: number,
  dy2: number,
  dx3: number,
  dy3: number,
): Affine | null {
  const det = (sx1 - sx3) * (sy2 - sy3) - (sx2 - sx3) * (sy1 - sy3);
  if (Math.abs(det) < 1e-9) return null;
  const invDet = 1 / det;
  const a =
    ((dx1 - dx3) * (sy2 - sy3) - (dx2 - dx3) * (sy1 - sy3)) * invDet;
  const c =
    ((sx1 - sx3) * (dx2 - dx3) - (sx2 - sx3) * (dx1 - dx3)) * invDet;
  const e = dx3 - a * sx3 - c * sy3;
  const b =
    ((dy1 - dy3) * (sy2 - sy3) - (dy2 - dy3) * (sy1 - sy3)) * invDet;
  const d =
    ((sx1 - sx3) * (dy2 - dy3) - (sx2 - sx3) * (dy1 - dy3)) * invDet;
  const f = dy3 - b * sx3 - d * sy3;
  return { a, b, c, d, e, f };
}

/** Bilinear interpolation across the destination quad. The four corners
 *  are passed in order TL, TR, BR, BL (matching ImageLayer.perspective).
 *  u and v are normalised parameters in [0, 1]: u=0 is left edge, u=1
 *  is right edge, v=0 is top edge, v=1 is bottom edge. */
function bilinear(
  corners: readonly [Point, Point, Point, Point],
  u: number,
  v: number,
): Point {
  const [tl, tr, br, bl] = corners;
  // Top edge between tl and tr at parameter u
  const topX = tl.x * (1 - u) + tr.x * u;
  const topY = tl.y * (1 - u) + tr.y * u;
  // Bottom edge between bl and br at parameter u
  const botX = bl.x * (1 - u) + br.x * u;
  const botY = bl.y * (1 - u) + br.y * u;
  // Vertical interpolation between top and bottom
  return {
    x: topX * (1 - v) + botX * v,
    y: topY * (1 - v) + botY * v,
  };
}

/** Render an image with a 4-point perspective warp into the given
 *  Canvas2D context. The image is treated as occupying the rectangle
 *  (0, 0, srcWidth, srcHeight) in source space; that rectangle is
 *  warped to the four destination points (in the context's current
 *  coordinate system). The function does NOT save / restore the
 *  context — caller is responsible for ctx.save() before and
 *  ctx.restore() after.
 *
 *  Destination corners must be in TL, TR, BR, BL order.
 *
 *  resolution defaults to MESH_RESOLUTION (16). Pass a smaller value
 *  during interactive drags for cheaper redraws. */
export function renderPerspectiveImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
  destCorners: readonly [Point, Point, Point, Point],
  resolution: number = MESH_RESOLUTION,
): void {
  if (srcWidth <= 0 || srcHeight <= 0) return;
  const N = Math.max(2, Math.floor(resolution));

  // Pre-compute the destination grid: (N+1) × (N+1) points sampled by
  // bilinear interpolation across the destination quad.
  const grid: Point[][] = new Array(N + 1);
  for (let row = 0; row <= N; row++) {
    grid[row] = new Array(N + 1);
    const v = row / N;
    for (let col = 0; col <= N; col++) {
      const u = col / N;
      grid[row][col] = bilinear(destCorners, u, v);
    }
  }

  // Cell size in source space.
  const cellW = srcWidth / N;
  const cellH = srcHeight / N;

  // Tiny overdraw to hide seams between adjacent triangles — at exactly
  // the cell edge, anti-aliasing gaps become visible as 1px hairlines.
  // 0.5 source-pixel inflation is enough to fully cover the seam.
  const SEAM_PAD = 0.5;

  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      // Source rectangle for this cell:
      //   sTL = (col*cellW,        row*cellH)
      //   sTR = ((col+1)*cellW,    row*cellH)
      //   sBR = ((col+1)*cellW,    (row+1)*cellH)
      //   sBL = (col*cellW,        (row+1)*cellH)
      const sx0 = col * cellW;
      const sy0 = row * cellH;
      const sx1 = (col + 1) * cellW;
      const sy1 = (row + 1) * cellH;

      // Destination quad corners for this cell (from precomputed grid).
      const dTL = grid[row][col];
      const dTR = grid[row][col + 1];
      const dBR = grid[row + 1][col + 1];
      const dBL = grid[row + 1][col];

      // ── Triangle 1: sTL, sTR, sBR  →  dTL, dTR, dBR ──
      drawTriangle(
        ctx,
        image,
        sx0,
        sy0,
        sx1,
        sy0,
        sx1,
        sy1,
        dTL.x,
        dTL.y,
        dTR.x,
        dTR.y,
        dBR.x,
        dBR.y,
        SEAM_PAD,
      );

      // ── Triangle 2: sTL, sBR, sBL  →  dTL, dBR, dBL ──
      drawTriangle(
        ctx,
        image,
        sx0,
        sy0,
        sx1,
        sy1,
        sx0,
        sy1,
        dTL.x,
        dTL.y,
        dBR.x,
        dBR.y,
        dBL.x,
        dBL.y,
        SEAM_PAD,
      );
    }
  }
}

/** Render a single textured triangle: clip to the destination triangle,
 *  apply the affine that maps the source triangle to dest, drawImage. */
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sx1: number,
  sy1: number,
  sx2: number,
  sy2: number,
  sx3: number,
  sy3: number,
  dx1: number,
  dy1: number,
  dx2: number,
  dy2: number,
  dx3: number,
  dy3: number,
  seamPad: number,
): void {
  const m = affineFromTriangles(
    sx1,
    sy1,
    sx2,
    sy2,
    sx3,
    sy3,
    dx1,
    dy1,
    dx2,
    dy2,
    dx3,
    dy3,
  );
  if (!m) return;

  ctx.save();
  // Clip to the (slightly inflated) destination triangle. Inflation
  // happens by nudging each vertex outward from the triangle centroid
  // by seamPad in dest-space units — destination units, since clip is
  // applied before the transform.
  const cx = (dx1 + dx2 + dx3) / 3;
  const cy = (dy1 + dy2 + dy3) / 3;
  const inflate = (px: number, py: number): [number, number] => {
    const dx = px - cx;
    const dy = py - cy;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return [px, py];
    const k = (len + seamPad) / len;
    return [cx + dx * k, cy + dy * k];
  };
  const [ix1, iy1] = inflate(dx1, dy1);
  const [ix2, iy2] = inflate(dx2, dy2);
  const [ix3, iy3] = inflate(dx3, dy3);
  ctx.beginPath();
  ctx.moveTo(ix1, iy1);
  ctx.lineTo(ix2, iy2);
  ctx.lineTo(ix3, iy3);
  ctx.closePath();
  ctx.clip();
  // Apply the affine and draw the image. The transform places the
  // un-warped source rectangle so that its sub-rectangle (sx1..sx2,
  // sy1..sy2) lands on the destination triangle.
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  // drawImage paints the entire image from (0,0); the clip region
  // restricts what's actually rendered to the destination triangle.
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

/** True when the four corner points form a non-degenerate quad that's
 *  meaningfully different from the source rectangle. Used by ImageNode
 *  to decide whether to invoke the perspective sceneFunc at all — when
 *  the corners are at (0,0), (w,0), (w,h), (0,h) we can short-circuit
 *  to a plain Konva.Image render. */
export function isIdentityPerspective(
  corners: readonly [Point, Point, Point, Point],
  width: number,
  height: number,
  epsilon: number = 0.5,
): boolean {
  const [tl, tr, br, bl] = corners;
  return (
    Math.abs(tl.x - 0) < epsilon &&
    Math.abs(tl.y - 0) < epsilon &&
    Math.abs(tr.x - width) < epsilon &&
    Math.abs(tr.y - 0) < epsilon &&
    Math.abs(br.x - width) < epsilon &&
    Math.abs(br.y - height) < epsilon &&
    Math.abs(bl.x - 0) < epsilon &&
    Math.abs(bl.y - height) < epsilon
  );
}

/** Compute the bounding box of the four destination corners. Used by
 *  ImageNode to set the Konva.Shape's logical width/height so the
 *  selection chrome and hit-test align with the visible warp. */
export function perspectiveBoundingBox(
  corners: readonly [Point, Point, Point, Point],
): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of corners) {
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.x > maxX) maxX = c.x;
    if (c.y > maxY) maxY = c.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Build an identity perspective (= the un-warped source rectangle),
 *  to use as the starting point when the user enables perspective on
 *  a previously-flat image. */
export function identityPerspective(
  width: number,
  height: number,
): [Point, Point, Point, Point] {
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
}
