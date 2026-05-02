// src/components/photo-editor/canvas/CanvasShell.tsx
//
// Wraps the Konva Stage with the visible canvas frame.
//
// Computes the stage placement and effective scale from the project
// dimensions, the available container size, and the editor viewport
// (pan / zoom / rotate). Stage size is scaled so the canvas fits
// inside the available area; scale is then applied as a Konva
// scale on the Stage so layers render at the right pixel size.
//
// Batch 4 mounted SelectionTools alongside the stage div as a DOM
// overlay above the canvas. Batch 7 fixes the bug where it was
// rendering off-screen on mobile by also passing through `stageScale`
// (= effectiveScale) — SelectionTools needs it to convert un-scaled
// drawing-space bboxes into DOM pixels for absolute positioning.

"use client";

import { useEffect, useRef, useState } from "react";
import { CanvasStage } from "./CanvasStage";
import { SelectionTools } from "./SelectionTools";
import { GridOverlay } from "./GridOverlay";
import { BezierControlHandles } from "./BezierControlHandles";
import { FreehandDrawOverlay } from "./FreehandDrawOverlay";
import { useEditor } from "../context/EditorContext";
import {
  VIEWPORT_MIN_ZOOM,
  VIEWPORT_MAX_ZOOM,
} from "@/lib/photo-editor/canvas/viewport";

const PADDING = 24;

export function CanvasShell() {
  const { state } = useEditor();
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
    >
      {containerSize.w > 0 && stageW > 0 && stageH > 0 && (
        <>
          <div
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
              touchAction: "none",
            }}
          >
            <CanvasStage
              stageWidth={stageW}
              stageHeight={stageH}
              scale={effectiveScale}
              canvasAreaRef={containerRef}
            />
          </div>

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
