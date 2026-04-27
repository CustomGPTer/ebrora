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
    state.viewport.rotation !== 0 ||
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

  const bboxDom = useMemo(() => {
    if (hidden) return null;
    const stage = stageRef.current;
    if (!stage) return null;
    const node = stage.findOne(`#${selectedLayer!.id}`);
    if (!node) return null;
    const rect = node.getClientRect({ relativeTo: stage });
    if (
      !Number.isFinite(rect.x) ||
      !Number.isFinite(rect.y) ||
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return null;
    }
    return {
      x: rect.x * stageScale,
      y: rect.y * stageScale,
      width: rect.width * stageScale,
      height: rect.height * stageScale,
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

  if (!bboxDom || !selectedLayer) return null;

  const centreXDom = stageLeft + bboxDom.x + bboxDom.width / 2;
  const centreYDom = stageTop + bboxDom.y + bboxDom.height / 2;

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

  const left = stageLeft + bboxDom.x;
  const top = stageTop + bboxDom.y;
  const right = left + bboxDom.width;
  const bottom = top + bboxDom.height;
  const midX = left + bboxDom.width / 2;
  const midY = top + bboxDom.height / 2;

  return (
    <>
      <CornerBtn x={left} y={top} ariaLabel="Delete" onClick={onDelete} danger>
        <X className="w-4 h-4" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={midX}
        y={top}
        ariaLabel="Flip vertically"
        onClick={onFlipV}
      >
        <FlipVertical className="w-4 h-4" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={right}
        y={top}
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
        x={left}
        y={midY}
        ariaLabel="Flip horizontally"
        onClick={onFlipH}
      >
        <FlipHorizontal className="w-4 h-4" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={midX}
        y={bottom}
        ariaLabel="Duplicate"
        onClick={onDuplicate}
      >
        <Copy className="w-4 h-4" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={right}
        y={bottom}
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
