// src/components/photo-editor/canvas/BezierControlHandles.tsx
//
// DOM-overlay handles for the cubic bezier control points of a selected
// `line-curved` layer. Mounted by CanvasShell whenever the sole-
// selected layer is a curved line.
//
// Two square handles render at the screen positions of the bezier's
// control points c1 and c2. The endpoints (P0 = top-left, P3 =
// bottom-right of the layer's bbox) are NOT user-editable here —
// they're fixed at the bbox corners and move with the standard
// selection chrome (rotate / stretch / move). To reshape the curve,
// drag c1 or c2.
//
// Storage: `lineProps.bezier = { c1: {u, v}, c2: {u, v} }` in
// normalised bbox coords. Default fallback when unset = the same
// S-curve ShapeNode renders, so the handles always have a sensible
// initial position.
//
// Math notes:
//   • Layer-local point P → DOM point: apply the layer's transform
//     (translate + rotate + scale around 0,0), then the stage
//     transform (scale + viewport rotation + DOM offset). We use
//     the same toDom helper SelectionTools uses (replicated inline).
//   • Pointer DOM → layer-local: invert that pipeline. We only need
//     the result in normalised bbox coords (u, v) to update lineProps.
//     We compute by walking the inverse: subtract DOM offset, un-
//     rotate viewport, divide by stageScale → stage coords; then
//     subtract layer.transform.x/y, un-rotate by layer rotation,
//     divide by layer scale → layer-local; finally divide by
//     width/height to normalise.
//
// May 2026 — Carve-out 2 build.

"use client";

import { useMemo, useRef } from "react";
import { useEditor } from "../context/EditorContext";
import type { AnyLayer, LineProps, NormPoint, ShapeLayer } from "@/lib/photo-editor/types";

interface BezierControlHandlesProps {
  stageLeft: number;
  stageTop: number;
  stageWidth: number;
  stageHeight: number;
  stageScale: number;
}

const DEFAULT_BEZIER: { c1: NormPoint; c2: NormPoint } = {
  c1: { u: 0.25, v: 0.05 },
  c2: { u: 0.75, v: 0.95 },
};

const HANDLE_SIZE = 22;

export function BezierControlHandles({
  stageLeft,
  stageTop,
  stageWidth,
  stageHeight,
  stageScale,
}: BezierControlHandlesProps) {
  const { state, dispatch } = useEditor();

  const layer = useMemo<ShapeLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "shape") return null;
    const shp = found as ShapeLayer;
    if (shp.shapeId !== "line-curved") return null;
    return shp;
  }, [state.selection, state.project.layers]);

  // Stage geometry helpers — same pipeline as SelectionTools.
  const cosR = Math.cos(state.viewport.rotation);
  const sinR = Math.sin(state.viewport.rotation);
  const pivotX = stageWidth / stageScale / 2;
  const pivotY = stageHeight / stageScale / 2;

  // stageCoord (project-pixel space) → DOM coord.
  function toDom(p: { x: number; y: number }): { x: number; y: number } {
    const lx = (p.x - pivotX) * stageScale;
    const ly = (p.y - pivotY) * stageScale;
    const rotX = lx * cosR - ly * sinR;
    const rotY = lx * sinR + ly * cosR;
    return {
      x: stageLeft + stageWidth / 2 + rotX,
      y: stageTop + stageHeight / 2 + rotY,
    };
  }

  // Inverse: DOM coord → stage coord (project-pixel space).
  function fromDom(p: { x: number; y: number }): { x: number; y: number } {
    const rotX = p.x - stageLeft - stageWidth / 2;
    const rotY = p.y - stageTop - stageHeight / 2;
    // un-rotate (rotation is by -viewport.rotation)
    const lx = rotX * cosR + rotY * sinR;
    const ly = -rotX * sinR + rotY * cosR;
    return {
      x: lx / stageScale + pivotX,
      y: ly / stageScale + pivotY,
    };
  }

  const dragRef = useRef<{
    which: "c1" | "c2";
    pointerId: number;
  } | null>(null);

  if (!layer) return null;

  const props: LineProps = layer.lineProps ?? {
    arrowStart: false,
    arrowEnd: false,
    arrowStyle: "triangle",
  };
  const bez = props.bezier ?? DEFAULT_BEZIER;

  // Convert the layer's transform (translate + rotate + scale) into a
  // function that takes a layer-local point and returns its
  // stage-coord position. layer-local (lx, ly) →
  //   stage = layer.transform.xy + R(rotation) ∘ S(scaleX, scaleY) (lx, ly)
  const layerRad = (layer.transform.rotation * Math.PI) / 180;
  const cosL = Math.cos(layerRad);
  const sinL = Math.sin(layerRad);

  function layerLocalToStage(lp: { x: number; y: number }): { x: number; y: number } {
    const sx = lp.x * layer!.transform.scaleX;
    const sy = lp.y * layer!.transform.scaleY;
    return {
      x: layer!.transform.x + sx * cosL - sy * sinL,
      y: layer!.transform.y + sx * sinL + sy * cosL,
    };
  }

  function stageToLayerLocal(sp: { x: number; y: number }): { x: number; y: number } {
    // Subtract translation, un-rotate, divide by scale.
    const dx = sp.x - layer!.transform.x;
    const dy = sp.y - layer!.transform.y;
    // un-rotate (-layerRad):
    const ux = dx * cosL + dy * sinL;
    const uy = -dx * sinL + dy * cosL;
    return {
      x: layer!.transform.scaleX !== 0 ? ux / layer!.transform.scaleX : 0,
      y: layer!.transform.scaleY !== 0 ? uy / layer!.transform.scaleY : 0,
    };
  }

  const W = layer.width;
  const H = layer.height;

  // Endpoints in layer-local coords (where the curve starts and ends).
  const p0Local = { x: 0, y: H / 2 };
  const p3Local = { x: W, y: H / 2 };
  const c1Local = { x: bez.c1.u * W, y: bez.c1.v * H };
  const c2Local = { x: bez.c2.u * W, y: bez.c2.v * H };

  const p0Dom = toDom(layerLocalToStage(p0Local));
  const p3Dom = toDom(layerLocalToStage(p3Local));
  const c1Dom = toDom(layerLocalToStage(c1Local));
  const c2Dom = toDom(layerLocalToStage(c2Local));

  function patchBezier(next: { c1: NormPoint; c2: NormPoint }) {
    if (!layer) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: {
        lineProps: { ...props, bezier: next },
      } as Partial<AnyLayer>,
    });
  }

  function onPointerDown(
    which: "c1" | "c2",
    e: React.PointerEvent<HTMLButtonElement>,
  ) {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { which, pointerId: e.pointerId };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!layer) return;
    // DOM → stage → layer-local → normalised.
    const stage = fromDom({ x: e.clientX, y: e.clientY });
    const local = stageToLayerLocal(stage);
    const u = W > 0 ? local.x / W : 0;
    const v = H > 0 ? local.y / H : 0;
    // Clamp loosely — control points outside the bbox are valid (they
    // pull the curve outside it). Keep within ±2 to avoid runaway.
    const cu = Math.max(-2, Math.min(2, u));
    const cv = Math.max(-2, Math.min(2, v));
    const next = { ...bez };
    if (d.which === "c1") next.c1 = { u: cu, v: cv };
    else next.c2 = { u: cu, v: cv };
    patchBezier(next);
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  return (
    <>
      {/* Dashed leader lines from each endpoint to its control point —
          gives the user a visual cue that c1 / c2 attach to P0 / P3.  */}
      <svg
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 19,
        }}
      >
        <line
          x1={p0Dom.x}
          y1={p0Dom.y}
          x2={c1Dom.x}
          y2={c1Dom.y}
          stroke="#1B5B50"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.7}
        />
        <line
          x1={p3Dom.x}
          y1={p3Dom.y}
          x2={c2Dom.x}
          y2={c2Dom.y}
          stroke="#1B5B50"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.7}
        />
      </svg>

      <BezierHandle
        x={c1Dom.x}
        y={c1Dom.y}
        ariaLabel="Curve control 1"
        onPointerDown={(e) => onPointerDown("c1", e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <BezierHandle
        x={c2Dom.x}
        y={c2Dom.y}
        ariaLabel="Curve control 2"
        onPointerDown={(e) => onPointerDown("c2", e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </>
  );
}

function BezierHandle({
  x,
  y,
  ariaLabel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  x: number;
  y: number;
  ariaLabel: string;
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{
        position: "absolute",
        left: x - HANDLE_SIZE / 2,
        top: y - HANDLE_SIZE / 2,
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        background: "#FFFFFF",
        border: "2px solid #1B5B50",
        borderRadius: 4,
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        cursor: "grab",
        touchAction: "none",
        padding: 0,
        zIndex: 20,
      }}
    />
  );
}
