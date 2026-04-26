// src/components/photo-editor/canvas/CanvasStage.tsx
//
// The Konva Stage. Background sits in its own non-listening Layer; all
// overlay layers (text / image / shape / sticker) plus the selection
// transformer sit in a second Layer that *does* listen for hit-testing
// so taps on layers select them.
//
// New in Session 3:
//   • LayerRenderer paints every layer in z-order via the per-kind nodes
//   • SelectionFrame attaches a Konva Transformer to selected layer ids
//   • GestureLayer is mounted next to the Stage as a placeholder for
//     Session 7's gesture handlers (pinch zoom, two-finger rotate,
//     long-press for context menu, pan-mode toggle)
//
// Tapping the stage *outside* any layer clears the selection — we detect
// that via Konva's native event target (e.target === stage means the tap
// landed on the empty area, not a node).

"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEditor } from "../context/EditorContext";
import { LayerRenderer } from "./LayerRenderer";
import { SelectionFrame } from "./SelectionFrame";
import { GestureLayer } from "./GestureLayer";
import type { Background, GradientFill } from "@/lib/photo-editor/types";

interface CanvasStageProps {
  stageWidth: number;
  stageHeight: number;
  scale: number;
  /** Ref to the un-rotated canvas-area container in CanvasShell.
   *  GestureLayer uses it as the stable reference frame for computing
   *  centre-relative anchor coordinates for pinch / wheel gestures. */
  canvasAreaRef: RefObject<HTMLDivElement>;
}

export function CanvasStage({
  stageWidth,
  stageHeight,
  scale,
  canvasAreaRef,
}: CanvasStageProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const { state, dispatch, stageRef: contextStageRef } = useEditor();

  // Mirror the local stage ref into the EditorContext so callers
  // (EditorShell thumbnail generation, ExportPanel) can find the stage
  // without relying on the Konva.stages[0] global. Synced via effect
  // because the ref is populated after the Stage component mounts.
  useEffect(() => {
    contextStageRef.current = stageRef.current;
    return () => {
      // Only clear if we still own the reference — defensive against
      // out-of-order unmounts during fast route changes.
      if (contextStageRef.current === stageRef.current) {
        contextStageRef.current = null;
      }
    };
  }, [contextStageRef]);

  function handleStageClick(
    e: KonvaEventObject<MouseEvent | TouchEvent>
  ) {
    // If the tap landed on the Stage itself (empty area), clear selection.
    // Hits on layer nodes have `e.target` set to that node, not the stage.
    const stage = stageRef.current;
    if (!stage) return;
    if (e.target === stage) {
      if (state.selection.length > 0) {
        dispatch({ type: "SET_SELECTION", ids: [] });
      }
    }
  }

  return (
    <>
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
      >
        <Layer listening={false}>
          <BackgroundNode />
        </Layer>
        <Layer>
          <LayerRenderer />
          <SelectionFrame />
        </Layer>
      </Stage>
      <GestureLayer
        stageRef={stageRef}
        canvasAreaRef={canvasAreaRef}
        panMode={state.panMode}
      />
    </>
  );
}

// ─── Background ─────────────────────────────────────────────────

function BackgroundNode() {
  const { state } = useEditor();
  const { project } = state;
  const bg: Background = project.background;

  switch (bg.kind) {
    case "transparent":
      return (
        <CheckerboardRect width={project.width} height={project.height} />
      );

    case "solid":
      return (
        <Rect
          x={0}
          y={0}
          width={project.width}
          height={project.height}
          fill={bg.color}
        />
      );

    case "gradient":
      return (
        <GradientRect
          width={project.width}
          height={project.height}
          gradient={bg.gradient}
        />
      );

    case "photo":
      return (
        <PhotoRect
          src={bg.src}
          width={project.width}
          height={project.height}
        />
      );
  }
}

// ─── Photo ──────────────────────────────────────────────────────

function PhotoRect({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const [img] = useImage(src, "anonymous");
  if (!img) return null;
  return (
    <KonvaImage image={img} x={0} y={0} width={width} height={height} />
  );
}

// ─── Gradient ───────────────────────────────────────────────────
//
// Linear gradient applied as a fill on a single Rect. We translate the
// editor's angle (0° = left → right) into Konva's startPoint / endPoint
// vector pair.

function GradientRect({
  width,
  height,
  gradient,
}: {
  width: number;
  height: number;
  gradient: GradientFill;
}) {
  const stops = gradient.stops.length > 0 ? gradient.stops : DEFAULT_STOPS;
  const colorStops: (number | string)[] = [];
  for (const s of stops) {
    colorStops.push(s.position, s.color);
  }

  const angleRad = ((gradient.angle - 90) * Math.PI) / 180;
  const radius = Math.max(width, height) / 2;
  const cx = width / 2;
  const cy = height / 2;
  const start = {
    x: cx - Math.cos(angleRad) * radius,
    y: cy - Math.sin(angleRad) * radius,
  };
  const end = {
    x: cx + Math.cos(angleRad) * radius,
    y: cy + Math.sin(angleRad) * radius,
  };

  return (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      fillLinearGradientStartPoint={start}
      fillLinearGradientEndPoint={end}
      fillLinearGradientColorStops={colorStops}
    />
  );
}

const DEFAULT_STOPS = [
  { position: 0, color: "#cccccc" },
  { position: 1, color: "#888888" },
];

// ─── Transparent (checkerboard) ─────────────────────────────────
//
// Show a soft checkerboard so users can tell at a glance the canvas is
// transparent. The pattern is drawn at canvas coordinates so it scales
// correctly with the fit-to-viewport stage scale.

function CheckerboardRect({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const tile = 24;
  const cols = Math.ceil(width / tile);
  const rows = Math.ceil(height / tile);
  const tiles: JSX.Element[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isDark = (r + c) % 2 === 0;
      tiles.push(
        <Rect
          key={`${r}-${c}`}
          x={c * tile}
          y={r * tile}
          width={tile}
          height={tile}
          fill={isDark ? "#FFFFFF" : "#E5E7EB"}
        />
      );
    }
  }
  return <>{tiles}</>;
}
