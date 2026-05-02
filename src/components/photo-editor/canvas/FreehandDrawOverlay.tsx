// src/components/photo-editor/canvas/FreehandDrawOverlay.tsx
//
// Full-canvas pointer-capturing overlay, mounted only when
// state.freehandDrawingFor identifies a freehand line layer in
// re-draw mode. The user drags across the canvas; we record DOM
// pointer positions, simplify them, normalise into bbox-relative
// coords, and write the result into the layer's
// lineProps.freehandPoints. The layer's bbox (transform.x/y +
// width/height) is also updated to match the new path's extents
// so the path fits its bounding box exactly.
//
// Lifecycle:
//
//   1. User selects a freehand line. LineStylePanel renders a
//      "Redraw" button. Tap dispatches SET_FREEHAND_DRAWING with
//      the layer id.
//   2. CanvasShell mounts this overlay (a transparent div sized to
//      the visible canvas area). The overlay sits at a high z-index
//      so it intercepts every pointer event.
//   3. User taps + drags. Live points are stored in state-free refs
//      and rendered as an SVG path that follows the finger.
//   4. On pointerup with at least 2 distinct points: simplify, fit
//      bbox, normalise, dispatch UPDATE_LAYER, then dispatch
//      SET_FREEHAND_DRAWING(null) to exit.
//   5. On pointerup with too few points (a tap): just exit drawing
//      mode without changing the layer.
//   6. Tap "Cancel" (small button at top-right) → exit without
//      changing.
//
// May 2026 — Carve-out 2 build.

"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor } from "../context/EditorContext";
import type {
  AnyLayer,
  LineProps,
  NormPoint,
  ShapeLayer,
} from "@/lib/photo-editor/types";

interface FreehandDrawOverlayProps {
  /** Visible canvas area (the same rect SelectionTools / GridOverlay
   *  use). The overlay covers this rect to capture pointer events. */
  stageLeft: number;
  stageTop: number;
  stageWidth: number;
  stageHeight: number;
  stageScale: number;
}

const MIN_POINTS_FOR_PATH = 2;
const SIMPLIFY_TOLERANCE = 1.5;

export function FreehandDrawOverlay({
  stageLeft,
  stageTop,
  stageWidth,
  stageHeight,
  stageScale,
}: FreehandDrawOverlayProps) {
  const { state, dispatch } = useEditor();
  const layerId = state.freehandDrawingFor;

  // Live preview path rendered as the user drags. We keep the points
  // in a ref (write-heavy) and trigger re-render via setTick so the
  // SVG path follows the finger.
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const drawingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const [, setTick] = useState(0);

  // Stage geometry for DOM ↔ stage conversion.
  const cosR = Math.cos(state.viewport.rotation);
  const sinR = Math.sin(state.viewport.rotation);
  const pivotX = stageWidth / stageScale / 2;
  const pivotY = stageHeight / stageScale / 2;

  function fromDom(p: { x: number; y: number }): { x: number; y: number } {
    const rotX = p.x - stageLeft - stageWidth / 2;
    const rotY = p.y - stageTop - stageHeight / 2;
    const lx = rotX * cosR + rotY * sinR;
    const ly = -rotX * sinR + rotY * cosR;
    return {
      x: lx / stageScale + pivotX,
      y: ly / stageScale + pivotY,
    };
  }

  // Reset captured path whenever we (re-)enter drawing mode for a
  // different layer.
  useEffect(() => {
    pointsRef.current = [];
    drawingRef.current = false;
    pointerIdRef.current = null;
    setTick((t) => t + 1);
  }, [layerId]);

  if (!layerId) return null;

  const layer = state.project.layers.find((l) => l.id === layerId);
  if (!layer || layer.kind !== "shape") {
    // Layer was deleted mid-draw — exit the mode silently.
    dispatch({ type: "SET_FREEHAND_DRAWING", layerId: null });
    return null;
  }

  function commitPath() {
    if (!layer) return;
    const raw = pointsRef.current;
    if (raw.length < MIN_POINTS_FOR_PATH) {
      // Just a tap — don't replace the layer's path.
      dispatch({ type: "SET_FREEHAND_DRAWING", layerId: null });
      return;
    }

    // Convert DOM points → stage (project-pixel) coords.
    const stagePts = raw.map(fromDom);

    // Simplify (Ramer-Douglas-Peucker) so we don't store a thousand
    // points for a 200-px stroke.
    const simplified = simplifyRDP(stagePts, SIMPLIFY_TOLERANCE);
    if (simplified.length < MIN_POINTS_FOR_PATH) {
      dispatch({ type: "SET_FREEHAND_DRAWING", layerId: null });
      return;
    }

    // Fit bbox in stage coords with a small padding so the path's
    // stroke (drawn at thickness ≈ 4px) doesn't sit on the bbox edge.
    const PAD = 6;
    let minX = simplified[0].x;
    let minY = simplified[0].y;
    let maxX = minX;
    let maxY = minY;
    for (const p of simplified) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    minX -= PAD;
    minY -= PAD;
    maxX += PAD;
    maxY += PAD;
    const bboxW = Math.max(8, maxX - minX);
    const bboxH = Math.max(8, maxY - minY);

    // Normalise: each point becomes (u, v) in [0..1] of bbox.
    const normPoints: NormPoint[] = simplified.map((p) => ({
      u: (p.x - minX) / bboxW,
      v: (p.y - minY) / bboxH,
    }));

    const props: LineProps = (layer as ShapeLayer).lineProps ?? {
      arrowStart: false,
      arrowEnd: false,
      arrowStyle: "triangle",
    };

    // Reset transform.scaleX / Y back to 1, transform.rotation to 0
    // — the new bbox is freshly fitted, so we don't want stale
    // scaling skewing it. Position is the new bbox top-left.
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: {
        width: bboxW,
        height: bboxH,
        transform: {
          ...layer.transform,
          x: minX,
          y: minY,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
        },
        lineProps: { ...props, freehandPoints: normPoints },
      } as Partial<AnyLayer>,
    });

    dispatch({ type: "SET_FREEHAND_DRAWING", layerId: null });
  }

  function cancel() {
    pointsRef.current = [];
    drawingRef.current = false;
    pointerIdRef.current = null;
    dispatch({ type: "SET_FREEHAND_DRAWING", layerId: null });
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (drawingRef.current) return;
    e.preventDefault();
    drawingRef.current = true;
    pointerIdRef.current = e.pointerId;
    pointsRef.current = [{ x: e.clientX, y: e.clientY }];
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setTick((t) => t + 1);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drawingRef.current || pointerIdRef.current !== e.pointerId) return;
    pointsRef.current.push({ x: e.clientX, y: e.clientY });
    setTick((t) => t + 1);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!drawingRef.current || pointerIdRef.current !== e.pointerId) return;
    drawingRef.current = false;
    pointerIdRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    commitPath();
  }

  // Build the live preview SVG path in DOM coords (we're already
  // in DOM space here).
  const preview = pointsRef.current;
  const pathD =
    preview.length === 0
      ? ""
      : `M ${preview[0].x} ${preview[0].y} ` +
        preview
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(" ");

  return (
    <>
      {/* Pointer-capturing layer over the canvas frame. We use the
          ENTIRE viewport (not just stage) so a stroke that strays
          beyond the canvas still tracks the finger; the bbox snap
          step bounds it back. */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.05)",
          touchAction: "none",
          zIndex: 240,
          cursor: "crosshair",
        }}
      />

      {/* Live preview SVG (in front of the capture layer). */}
      <svg
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 241,
        }}
      >
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="#1B5B50"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>

      {/* Hint banner + cancel — top-centre. */}
      <div
        style={{
          position: "fixed",
          top: "max(env(safe-area-inset-top, 0px), 12px)",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 242,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(20, 20, 20, 0.85)",
            color: "#FFFFFF",
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 13,
            boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
          }}
        >
          <span>Drag to draw your line</span>
          <button
            type="button"
            onClick={cancel}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              pointerEvents: "auto",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#FFFFFF",
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Path simplification (Ramer-Douglas-Peucker) ────────────────
//
// Recursive algorithm: take the line segment from the first to the
// last point; find the point in between with the greatest perp-
// endicular distance from that segment; if it exceeds tolerance,
// recurse on both halves. Otherwise drop the middle entirely.
//
// Iterative implementation to avoid stack issues on long strokes.

function simplifyRDP(
  pts: { x: number; y: number }[],
  tol: number,
): { x: number; y: number }[] {
  if (pts.length < 3) return pts.slice();

  const keep = new Array<boolean>(pts.length).fill(false);
  keep[0] = true;
  keep[pts.length - 1] = true;

  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxDist = 0;
    let idx = -1;
    for (let i = first + 1; i < last; i++) {
      const d = perpDistance(pts[i], pts[first], pts[last]);
      if (d > maxDist) {
        maxDist = d;
        idx = i;
      }
    }
    if (maxDist > tol && idx !== -1) {
      keep[idx] = true;
      stack.push([first, idx], [idx, last]);
    }
  }

  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (keep[i]) out.push(pts[i]);
  }
  return out;
}

function perpDistance(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    // a == b; distance is just |p - a|.
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return Math.hypot(ex, ey);
  }
  // Project p onto line, clamp to segment, take Euclidean distance.
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  const tc = Math.max(0, Math.min(1, t));
  const projX = a.x + tc * dx;
  const projY = a.y + tc * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}
