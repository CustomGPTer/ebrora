// src/lib/photo-editor/canvas/viewport.ts
//
// Pure-logic viewport math (Session 7).
//
// `Viewport` is a translate + zoom + rotate transform applied on top of
// the fit-to-viewport scale that CanvasShell already computes. So the
// effective on-screen transform of the canvas is:
//
//     stage.scale = fitScale × viewport.zoom
//     stage.translate = (centreOffset.x + viewport.translateX,
//                        centreOffset.y + viewport.translateY)
//     stage.rotation = viewport.rotation (radians)
//
// Because the fit-to-viewport scale is recomputed on container resize,
// viewport.zoom of 1 always means "fits the available area". This lets
// the user pan/zoom/rotate without the editor ever having to know
// anything about pixel-space dimensions of the project.
//
// Pan/zoom/rotate are NEVER undoable (per Session 7 locked decisions)
// and are NOT persisted with saved projects. Re-opening a project starts
// at the default viewport (zoom 1, no offset, no rotation) and the
// canvas auto-fits to the available area.

import type { Point, Size, Viewport } from "../types";

export const VIEWPORT_MIN_ZOOM = 0.1;
export const VIEWPORT_MAX_ZOOM = 8;

/** Threshold (radians) below which two-finger rotation is ignored.
 *  Prevents accidental rotation during straight pinch-zoom gestures.
 *  ~5° in radians. */
export const ROTATION_DEAD_ZONE = (5 * Math.PI) / 180;

/** Clamp zoom to [VIEWPORT_MIN_ZOOM, VIEWPORT_MAX_ZOOM]. */
export function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return 1;
  return Math.min(VIEWPORT_MAX_ZOOM, Math.max(VIEWPORT_MIN_ZOOM, z));
}

/** Normalise rotation to [-π, π]. */
export function normaliseRotation(r: number): number {
  if (!Number.isFinite(r)) return 0;
  let n = r % (Math.PI * 2);
  if (n > Math.PI) n -= Math.PI * 2;
  if (n < -Math.PI) n += Math.PI * 2;
  return n;
}

/** Clamp a translate to keep at least minVisibleFraction of the canvas
 *  bbox inside the available viewport area. canvasSize is the on-screen
 *  size at the current zoom (already includes fitScale × zoom). */
export function clampTranslate(
  translate: Point,
  canvasSize: Size,
  viewportSize: Size,
  minVisibleFraction = 0.1,
): Point {
  const minVisibleX = canvasSize.width * minVisibleFraction;
  const minVisibleY = canvasSize.height * minVisibleFraction;
  // The Stage's natural position when translate = (0,0) is centred.
  // Bounds: how far can we offset before less than minVisible is on
  // screen? When the canvas is smaller than the viewport, the bound is
  // a small range around centre; when larger, the bound expands so the
  // whole canvas is reachable.
  const halfCanvasW = canvasSize.width / 2;
  const halfCanvasH = canvasSize.height / 2;
  const halfViewportW = viewportSize.width / 2;
  const halfViewportH = viewportSize.height / 2;
  const maxX = Math.max(0, halfCanvasW + halfViewportW - minVisibleX);
  const maxY = Math.max(0, halfCanvasH + halfViewportH - minVisibleY);
  return {
    x: Math.min(maxX, Math.max(-maxX, translate.x)),
    y: Math.min(maxY, Math.max(-maxY, translate.y)),
  };
}

/** Default viewport: identity. */
export function defaultViewport(): Viewport {
  return { translateX: 0, translateY: 0, zoom: 1, rotation: 0 };
}

/** Reset to fit-to-screen — same as default for now; here as a hook for
 *  Session 8 when we may add per-project default views. */
export function fitToScreen(): Viewport {
  return defaultViewport();
}

// ─── Zoom around an anchor ──────────────────────────────────────

/** Apply a zoom factor to a viewport such that the given anchor point
 *  (in screen-pixel coords relative to the canvas centre, i.e. the
 *  CanvasShell container's centre) stays under the same screen pixel
 *  before and after the zoom.
 *
 *  Math: the on-screen position of a canvas point P is
 *      P_screen = centre + translate + rotate(P_canvas × zoom)
 *  We want P_screen unchanged when zoom changes by factor F:
 *      centre + t' + R(P × z') = centre + t + R(P × z)
 *      t' = t + R(P × z - P × z') = t + R(P × z)(1 - F)
 *  Where R is the current rotation. Since the anchor in our coordinate
 *  system already accounts for the rotation (it's measured in
 *  centre-relative screen coords), the simpler form is:
 *      t' = anchor + (t - anchor) × F
 */
export function applyZoomAround(
  viewport: Viewport,
  anchor: Point,
  factor: number,
): Viewport {
  const targetZoom = clampZoom(viewport.zoom * factor);
  // Recompute factor in case clamping kicked in.
  const effectiveFactor = targetZoom / viewport.zoom;
  return {
    ...viewport,
    zoom: targetZoom,
    translateX: anchor.x + (viewport.translateX - anchor.x) * effectiveFactor,
    translateY: anchor.y + (viewport.translateY - anchor.y) * effectiveFactor,
  };
}

/** Apply an absolute zoom level around an anchor (used by zoom-to-100%
 *  and reset-zoom buttons). */
export function applyZoomLevelAround(
  viewport: Viewport,
  anchor: Point,
  targetZoom: number,
): Viewport {
  const clamped = clampZoom(targetZoom);
  if (viewport.zoom === 0) return { ...viewport, zoom: clamped };
  return applyZoomAround(viewport, anchor, clamped / viewport.zoom);
}

// ─── Rotate around an anchor ────────────────────────────────────

/** Apply a delta rotation around an anchor point. The anchor is in the
 *  same centre-relative screen coords as in applyZoomAround. */
export function applyRotateAround(
  viewport: Viewport,
  anchor: Point,
  deltaRotation: number,
): Viewport {
  if (deltaRotation === 0) return viewport;
  const cos = Math.cos(deltaRotation);
  const sin = Math.sin(deltaRotation);
  const dx = viewport.translateX - anchor.x;
  const dy = viewport.translateY - anchor.y;
  return {
    ...viewport,
    rotation: normaliseRotation(viewport.rotation + deltaRotation),
    translateX: anchor.x + dx * cos - dy * sin,
    translateY: anchor.y + dx * sin + dy * cos,
  };
}

// ─── Translation helpers ────────────────────────────────────────

/** Pan by an absolute delta in screen pixels. Caller can clamp
 *  afterwards via clampTranslate. */
export function applyPan(viewport: Viewport, dx: number, dy: number): Viewport {
  return {
    ...viewport,
    translateX: viewport.translateX + dx,
    translateY: viewport.translateY + dy,
  };
}
