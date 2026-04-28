// src/components/photo-editor/canvas/SelectionTools.tsx
//
// Per-selection contextual UI — DOM overlay above the canvas. Renders
// six action icons positioned at the corners and edges of the selected
// layer's bbox:
//
//     [✕]            [↕]            [⟳]
//      ┌─────────────────────────────┐
//      │                             │
//     [⇄]            ‹bbox›
//      │                             │
//      └─────────────────────────────┘
//                   [⧉]            [⤡]
//
//   • ✕  top-left      Delete            (tap)
//   • ↕  top-centre    Flip vertical     (tap)
//   • ⟳  top-right     Rotate            (drag — pointer rotates the layer)
//   • ⇄  middle-left   Flip horizontal   (tap)
//   • ⧉  bottom-centre Duplicate         (tap)
//   • ⤡  bottom-right  Resize            (drag — locked aspect ratio)
//
// Drag math runs in DOM-pixel space because we receive pointer client
// coords directly. The layer's geometric centre (in DOM coords) is the
// pivot for both rotate and resize. Konva.Transformer is reduced to a
// dashed border (see SelectionFrame); all transform interaction lives
// here. Phase 1 — Apr 2026.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  FlipHorizontal,
  FlipVertical,
  Maximize2 as ResizeIcon,
  RotateCw,
  X,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import type { AnyLayer } from "@/lib/photo-editor/types";

interface SelectionToolsProps {
  stageLeft: number;
  stageTop: number;
  stageWidth: number;
  stageHeight: number;
  stageScale: number;
}

const ICON_SIZE = 32;

export function SelectionTools({
  stageLeft,
  stageTop,
  stageWidth,
  stageHeight,
  stageScale,
}: SelectionToolsProps) {
  const { state, dispatch, stageRef } = useEditor();
  const { state: mobileEdit } = useMobileEdit();

  const [tick, setTick] = useState(0);

  const selectedLayer = useMemo<AnyLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    return (
      state.project.layers.find((l) => l.id === state.selection[0]) ?? null
    );
  }, [state.selection, state.project.layers]);

  const hidden =
    selectedLayer === null ||
    selectedLayer.locked ||
    !selectedLayer.visible ||
    mobileEdit.editingLayerId === selectedLayer.id ||
    stageScale <= 0;

  useEffect(() => {
    if (hidden) return;
    const stage = stageRef.current;
    if (!stage) return;
    const handler = () => setTick((t) => t + 1);
    stage.on("dragmove", handler);
    stage.on("transform", handler);
    return () => {
      stage.off("dragmove", handler);
      stage.off("transform", handler);
    };
  }, [hidden, stageRef]);

  // Force the geom useMemo to re-evaluate AFTER the React commit phase
  // when selection or the layer list changes. The geom computation runs
  // during render (it's a useMemo) and calls stage.findOne() to locate
  // the selected layer's Konva node — but on the same render that adds
  // a brand-new layer, react-konva hasn't yet committed the new node
  // to the Konva tree, so findOne returns null and geom resolves to
  // null (no icons). SelectionFrame works around this by doing its
  // findOne in a useEffect (post-commit); we get the same behaviour by
  // bumping `tick` here, which causes one extra render after commit
  // with the node now present. Negligible cost and cures the "icons
  // missing on freshly-added shape" symptom.
  useEffect(() => {
    setTick((t) => t + 1);
  }, [state.selection, state.project.layers]);

  // Box geometry — four corner points in DOM-pixel space (within the
  // canvas-area container). Handles non-zero viewport rotation.
  //
  // Approach: get the layer's four local-rect corners in stage-local
  // (canvas-pixel) space via the layer node's absolute transform.
  // Then convert each stage-local point to DOM space by applying the
  // stage's (stageScale, viewport.rotation) transform around its
  // pivot. The stage-pivot in DOM space is (stageLeft + stageWidth/2,
  // stageTop + stageHeight/2) because CanvasStage centres the stage
  // div within the canvas area.
  const geom = useMemo(() => {
    if (hidden) return null;
    const stage = stageRef.current;
    if (!stage) return null;
    const node = stage.findOne(`#${selectedLayer!.id}`);
    if (!node) return null;
    // Layer's local rect (pre-transform). For text/image/sticker the
    // outermost node is a Konva.Image (Shape) — getClientRect with
    // skipTransform returns the same {x: 0, y: 0, width, height} as
    // getSelfRect would. For shape layers the outermost node is a
    // Konva.Group (see ShapeNode.tsx) which does NOT define
    // getSelfRect() in Konva 9.x; getClientRect works on any node and
    // returns the union of children's bounds in group-local space —
    // i.e. the visible Path's bbox, which is what we want here.
    // skipStroke=true keeps the rect tight to the geometry (matching
    // the old getSelfRect behaviour for Shapes).
    let selfRect = node.getClientRect({
      skipTransform: true,
      skipShadow: true,
      skipStroke: true,
    });
    if (
      !selfRect ||
      !Number.isFinite(selfRect.width) ||
      !Number.isFinite(selfRect.height) ||
      selfRect.width <= 0 ||
      selfRect.height <= 0
    ) {
      // Fallback: if the node has no rendered children yet (e.g. an
      // image still loading or a shape catalogue path that hasn't
      // mounted), derive from the layer's own width/height so the
      // selection UI doesn't disappear.
      const w = (selectedLayer as { width?: number }).width;
      const h = (selectedLayer as { height?: number }).height;
      if (
        typeof w === "number" &&
        typeof h === "number" &&
        Number.isFinite(w) &&
        Number.isFinite(h) &&
        w > 0 &&
        h > 0
      ) {
        selfRect = { x: 0, y: 0, width: w, height: h };
      } else {
        return null;
      }
    }
    // Layer's transform up to (but excluding) the stage. This gives
    // points in PROJECT-pixel space — we then multiply by stageScale
    // and rotate by viewport.rotation to land in DOM coords.
    // Calling getAbsoluteTransform() WITHOUT a top arg would include
    // the stage's scale, double-applying stageScale below.
    const layerTr = node.getAbsoluteTransform(stage);
    const stageLocal = {
      tl: layerTr.point({ x: selfRect.x, y: selfRect.y }),
      tr: layerTr.point({
        x: selfRect.x + selfRect.width,
        y: selfRect.y,
      }),
      br: layerTr.point({
        x: selfRect.x + selfRect.width,
        y: selfRect.y + selfRect.height,
      }),
      bl: layerTr.point({
        x: selfRect.x,
        y: selfRect.y + selfRect.height,
      }),
    };
    // Stage-local coords from Konva are in PROJECT-pixel space (the
    // Konva Stage has no rotation; only stage scale = stageScale is
    // applied at render time when Konva paints). To get DOM coords:
    //   1. The pivot in stage-local (project-pixel) space is
    //      (projectWidth/2, projectHeight/2) — equivalently
    //      (stageWidth / stageScale / 2, stageHeight / stageScale / 2).
    //   2. Translate so pivot is at origin.
    //   3. Scale by stageScale → rotate by viewport.rotation. (Order
    //      matters: the CSS rotate is on the OUTER stage div, AFTER
    //      Konva's scale, so in math-space: rotate(scale(point))).
    //   4. Re-translate to the centre of the DOM stage box.
    const cosR = Math.cos(state.viewport.rotation);
    const sinR = Math.sin(state.viewport.rotation);
    const pivotX = stageWidth / stageScale / 2;
    const pivotY = stageHeight / stageScale / 2;
    const toDom = (p: { x: number; y: number }) => {
      const lx = (p.x - pivotX) * stageScale;
      const ly = (p.y - pivotY) * stageScale;
      const rotX = lx * cosR - ly * sinR;
      const rotY = lx * sinR + ly * cosR;
      return {
        x: stageLeft + stageWidth / 2 + rotX,
        y: stageTop + stageHeight / 2 + rotY,
      };
    };
    return {
      tl: toDom(stageLocal.tl),
      tr: toDom(stageLocal.tr),
      br: toDom(stageLocal.br),
      bl: toDom(stageLocal.bl),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hidden,
    selectedLayer,
    stageRef,
    tick,
    stageScale,
    state.project.layers,
    state.viewport.translateX,
    state.viewport.translateY,
    state.viewport.zoom,
    state.viewport.rotation,
    stageLeft,
    stageTop,
    stageWidth,
    stageHeight,
  ]);

  const rotateRef = useRef<{
    startAngle: number;
    layerStartRotation: number;
    centreX: number;
    centreY: number;
    pointerId: number;
  } | null>(null);
  const resizeRef = useRef<{
    startDist: number;
    layerStartScaleX: number;
    layerStartScaleY: number;
    centreX: number;
    centreY: number;
    pointerId: number;
  } | null>(null);

  if (!geom || !selectedLayer) return null;

  // Geometric centre = average of the four corners. Works for any
  // rotation / aspect ratio.
  const centreXDom = (geom.tl.x + geom.tr.x + geom.br.x + geom.bl.x) / 4;
  const centreYDom = (geom.tl.y + geom.tr.y + geom.br.y + geom.bl.y) / 4;

  const onDelete = () =>
    dispatch({ type: "REMOVE_LAYER", id: selectedLayer.id });
  const onDuplicate = () =>
    dispatch({ type: "DUPLICATE_LAYER", id: selectedLayer.id });
  const onFlipH = () => {
    const next = { ...selectedLayer.transform };
    next.scaleX = -next.scaleX;
    dispatch({
      type: "UPDATE_LAYER",
      id: selectedLayer.id,
      patch: { transform: next },
    });
  };
  const onFlipV = () => {
    const next = { ...selectedLayer.transform };
    next.scaleY = -next.scaleY;
    dispatch({
      type: "UPDATE_LAYER",
      id: selectedLayer.id,
      patch: { transform: next },
    });
  };

  // ── Rotate drag ──────────────────────────────────────────────
  const onRotatePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedLayer) return;
    const startAngle = Math.atan2(
      e.clientY - centreYDom,
      e.clientX - centreXDom,
    );
    rotateRef.current = {
      startAngle,
      layerStartRotation: selectedLayer.transform.rotation,
      centreX: centreXDom,
      centreY: centreYDom,
      pointerId: e.pointerId,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onRotatePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = rotateRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    const angle = Math.atan2(e.clientY - r.centreY, e.clientX - r.centreX);
    const deltaDeg = ((angle - r.startAngle) * 180) / Math.PI;
    const newRotation = r.layerStartRotation + deltaDeg;
    dispatch({
      type: "UPDATE_LAYER",
      id: selectedLayer.id,
      patch: {
        transform: { ...selectedLayer.transform, rotation: newRotation },
      },
    });
  };

  const onRotatePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = rotateRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    rotateRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* element may have already lost capture */
    }
  };

  // ── Resize drag (locked aspect ratio) ────────────────────────
  const onResizePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedLayer) return;
    const dx = e.clientX - centreXDom;
    const dy = e.clientY - centreYDom;
    const startDist = Math.max(1, Math.hypot(dx, dy));
    resizeRef.current = {
      startDist,
      layerStartScaleX: selectedLayer.transform.scaleX,
      layerStartScaleY: selectedLayer.transform.scaleY,
      centreX: centreXDom,
      centreY: centreYDom,
      pointerId: e.pointerId,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onResizePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = resizeRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    const dx = e.clientX - r.centreX;
    const dy = e.clientY - r.centreY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const factor = dist / r.startDist;
    const newScaleX =
      Math.sign(r.layerStartScaleX || 1) *
      Math.abs(r.layerStartScaleX) *
      factor;
    const newScaleY =
      Math.sign(r.layerStartScaleY || 1) *
      Math.abs(r.layerStartScaleY) *
      factor;
    const MIN_SCALE = 0.05;
    const clampedX =
      Math.abs(newScaleX) < MIN_SCALE
        ? Math.sign(newScaleX || 1) * MIN_SCALE
        : newScaleX;
    const clampedY =
      Math.abs(newScaleY) < MIN_SCALE
        ? Math.sign(newScaleY || 1) * MIN_SCALE
        : newScaleY;
    dispatch({
      type: "UPDATE_LAYER",
      id: selectedLayer.id,
      patch: {
        transform: {
          ...selectedLayer.transform,
          scaleX: clampedX,
          scaleY: clampedY,
        },
      },
    });
  };

  const onResizePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = resizeRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    resizeRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  // Position icons at the actual rotated corner positions and edge
  // midpoints — not at AABB corners. This makes the icons sit
  // visually on the layer's edges at any rotation.
  const topMidX = (geom.tl.x + geom.tr.x) / 2;
  const topMidY = (geom.tl.y + geom.tr.y) / 2;
  const leftMidX = (geom.tl.x + geom.bl.x) / 2;
  const leftMidY = (geom.tl.y + geom.bl.y) / 2;
  const bottomMidX = (geom.bl.x + geom.br.x) / 2;
  const bottomMidY = (geom.bl.y + geom.br.y) / 2;

  return (
    <>
      <CornerBtn
        x={geom.tl.x}
        y={geom.tl.y}
        ariaLabel="Delete"
        onClick={onDelete}
        danger
      >
        <X className="w-4 h-4" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={topMidX}
        y={topMidY}
        ariaLabel="Flip vertically"
        onClick={onFlipV}
      >
        <FlipVertical className="w-4 h-4" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={geom.tr.x}
        y={geom.tr.y}
        ariaLabel="Rotate"
        drag
        onPointerDown={onRotatePointerDown}
        onPointerMove={onRotatePointerMove}
        onPointerUp={onRotatePointerUp}
        onPointerCancel={onRotatePointerUp}
      >
        <RotateCw className="w-4 h-4" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={leftMidX}
        y={leftMidY}
        ariaLabel="Flip horizontally"
        onClick={onFlipH}
      >
        <FlipHorizontal className="w-4 h-4" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={bottomMidX}
        y={bottomMidY}
        ariaLabel="Duplicate"
        onClick={onDuplicate}
      >
        <Copy className="w-4 h-4" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={geom.br.x}
        y={geom.br.y}
        ariaLabel="Resize"
        drag
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
      >
        <ResizeIcon className="w-4 h-4" strokeWidth={2.25} />
      </CornerBtn>
    </>
  );
}

interface CornerBtnProps {
  x: number;
  y: number;
  ariaLabel: string;
  onClick?: () => void;
  drag?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  danger?: boolean;
}

function CornerBtn({
  x,
  y,
  ariaLabel,
  onClick,
  drag = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  children,
  danger = false,
}: CornerBtnProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="absolute z-30 inline-flex items-center justify-center rounded-full"
      style={{
        left: x,
        top: y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        transform: "translate(-50%, -50%)",
        background: "rgba(255, 255, 255, 0.96)",
        color: danger ? "#B91C1C" : "#1B5B50",
        boxShadow: "0 1px 3px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)",
        cursor: drag ? "grab" : "pointer",
        touchAction: drag ? "none" : "auto",
      }}
    >
      {children}
    </button>
  );
}
