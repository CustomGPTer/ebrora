// src/components/photo-editor/canvas/CanvasShell.tsx
//
// Holds the grey "canvas area" container; mounts the Konva Stage and
// the DOM overlays (SelectionTools, GridOverlay, BezierControlHandles,
// FreehandDrawOverlay) that float above it.
//
// Computes the visual canvas-frame placement and effective scale from
// the project dimensions, the available container size, and the editor
// viewport (pan / zoom / rotate). The Stage now spans the entire grey
// area at scale 1, so layer overhangs render naturally outside the
// canvas frame.
//
// Architecture (mobile-fixes batch 2 — issue 7):
//
//   <div container = grey area, full size, position relative>
//     <div canvas-frame  = visual white card; pointer-events: none;
//                          z-index 0; positioned + rotated to match
//                          the canvas's place in the grey area>
//     <CanvasStage      = Konva Stage spans the whole container at
//                          scale 1; viewport scale + rotation live on
//                          a Konva.Group inside (layerGroupRef); the
//                          Stage z-index is 1 so it sits above the
//                          frame visual but below the DOM overlays>
//     <GridOverlay …>   = z-index 2
//     <SelectionTools …>
//     <BezierControlHandles …>
//     <FreehandDrawOverlay …>
//   </div>
//
// Why split the canvas frame out of Konva: the original architecture
// rendered the white card via CSS (box-shadow: var(--pe-shadow-lg),
// borderRadius: 2). Reimplementing that in Konva costs scale-aware
// shadow / corner-radius math that adds nothing visual. The DOM div
// is unchanged from before; only the Stage's role and size differ.
//
// Existing batch 1 (May 2026): grey-area pointerdown deselects.
// Existing batch 4: SelectionTools mounts as a DOM overlay above.
// Existing batch 7: stageScale prop forwarding so SelectionTools can
//                   convert un-scaled drawing-space bboxes to DOM px.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasStage } from "./CanvasStage";
import { SelectionTools } from "./SelectionTools";
import { GridOverlay } from "./GridOverlay";
import { BezierControlHandles } from "./BezierControlHandles";
import { FreehandDrawOverlay } from "./FreehandDrawOverlay";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import {
  VIEWPORT_MIN_ZOOM,
  VIEWPORT_MAX_ZOOM,
} from "@/lib/photo-editor/canvas/viewport";

const PADDING = 24;

export function CanvasShell() {
  const { state, dispatch } = useEditor();
  const { state: mobileEdit, endEditing } = useMobileEdit();
  const { project, viewport } = state;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ w: width, h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Grey-area pointerdown: deselect, but commit any in-progress text
  // edit first so the user doesn't lose typed content. The handler
  // fires only when the event's actual target is the container div
  // itself; clicks that bubble up from the Stage / overlays / corner
  // buttons hit those children first and never reach this code path
  // because each of them either stops propagation or is a non-container
  // target.
  const handleGreyPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (mobileEdit.editingLayerId !== null) {
        endEditing(true);
      }
      if (state.selection.length > 0) {
        dispatch({ type: "SET_SELECTION", ids: [] });
      }
    },
    [dispatch, endEditing, mobileEdit.editingLayerId, state.selection.length],
  );

  const availW = Math.max(0, containerSize.w - PADDING * 2);
  const availH = Math.max(0, containerSize.h - PADDING * 2);

  const fitScale =
    availW > 0 && availH > 0
      ? Math.min(availW / project.width, availH / project.height, 1)
      : 1;

  const viewportZoom = Math.min(
    VIEWPORT_MAX_ZOOM,
    Math.max(VIEWPORT_MIN_ZOOM, viewport.zoom)
  );

  const effectiveScale = fitScale * viewportZoom;

  const stageW = Math.round(project.width * effectiveScale);
  const stageH = Math.round(project.height * effectiveScale);

  const centreX = containerSize.w / 2;
  const centreY = containerSize.h / 2;

  const stageLeft = Math.round(centreX - stageW / 2 + viewport.translateX);
  const stageTop = Math.round(centreY - stageH / 2 + viewport.translateY);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden"
      style={{ background: "var(--pe-canvas-bg)" }}
      onPointerDown={handleGreyPointerDown}
    >
      {containerSize.w > 0 && stageW > 0 && stageH > 0 && (
        <>
          {/* Visual canvas frame — white card with shadow + 2px corner
              radius, rotated to match the viewport. Non-interactive
              (pointer-events: none) so the Konva Stage above receives
              all gestures including those over the frame area. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: stageLeft,
              top: stageTop,
              width: stageW,
              height: stageH,
              transform: `rotate(${viewport.rotation}rad)`,
              transformOrigin: "center center",
              boxShadow: "var(--pe-shadow-lg)",
              background: "#FFFFFF",
              borderRadius: 2,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Konva Stage — covers the entire grey container at scale 1
              so layers can render past the canvas-frame edges. Issue 7. */}
          <CanvasStage
            containerWidth={containerSize.w}
            containerHeight={containerSize.h}
            canvasLeft={stageLeft}
            canvasTop={stageTop}
            canvasScale={effectiveScale}
            canvasAreaRef={containerRef}
          />

          <GridOverlay
            stageLeft={stageLeft}
            stageTop={stageTop}
            stageWidth={stageW}
            stageHeight={stageH}
            stageScale={effectiveScale}
          />

          <SelectionTools
            stageLeft={stageLeft}
            stageTop={stageTop}
            stageWidth={stageW}
            stageHeight={stageH}
            stageScale={effectiveScale}
          />

          <BezierControlHandles
            stageLeft={stageLeft}
            stageTop={stageTop}
            stageWidth={stageW}
            stageHeight={stageH}
            stageScale={effectiveScale}
          />

          <FreehandDrawOverlay
            stageLeft={stageLeft}
            stageTop={stageTop}
            stageWidth={stageW}
            stageHeight={stageH}
            stageScale={effectiveScale}
          />
        </>
      )}
    </div>
  );
}
