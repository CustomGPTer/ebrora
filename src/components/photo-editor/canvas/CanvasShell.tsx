// src/components/photo-editor/canvas/CanvasShell.tsx
//
// Wraps the Konva Stage with the visible canvas frame.
//
// Session 7: the CanvasShell now also reads `state.viewport` and
// composes it with the fit-to-viewport scale so user pan / zoom /
// rotate are visible. The arithmetic:
//
//     effectiveScale = fitScale × viewport.zoom
//     stageWidth     = round(project.width × effectiveScale)
//     stageHeight    = round(project.height × effectiveScale)
//     left           = round(centreX − stageW/2 + viewport.translateX)
//     top            = round(centreY − stageH/2 + viewport.translateY)
//     rotation (rad) = viewport.rotation, applied via CSS transform on
//                      the wrapper div with origin at the wrapper centre
//
// Rotation is applied at the DOM level (CSS transform) rather than as
// Konva.Stage rotation because the Stage's rotation rotates the
// drawing-space, but the Stage itself is still a fixed-size canvas
// element — rotated content gets cropped at the canvas bounds. Doing
// the rotation in CSS rotates the bounding canvas too, which is what
// the user expects.
//
// Batch 4 (April 2026): the SelectionTools DOM overlay mounts as a
// sibling of the stage div inside the same canvas-area container. It
// reads the bbox of the selected layer in stage-local coordinates and
// is positioned in container-local coordinates, so it needs the same
// stage-placement values (stageLeft / stageTop / stageWidth / stageHeight)
// that we use for placing the stage itself. We pass them down as props
// rather than fishing them back out of CSS.

"use client";

import { useEffect, useRef, useState } from "react";
import { CanvasStage } from "./CanvasStage";
import { SelectionTools } from "./SelectionTools";
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

  // Cap fit at 1:1 so a small canvas doesn't get blown up; otherwise
  // shrink to fit the smaller of width / height ratios.
  const fitScale =
    availW > 0 && availH > 0
      ? Math.min(availW / project.width, availH / project.height, 1)
      : 1;

  // Defensive clamp on viewport.zoom so a malformed dispatch can't
  // blow up the math.
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
              // Ensure pinch / wheel events don't trigger native page
              // zoom or scroll.
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

          {/* Selection action toolbar — DOM layer above the canvas.
              Lives in container coords (un-rotated); we hide it when
              viewport rotation is non-zero (handled inside the
              component) so the math stays simple. */}
          <SelectionTools
            stageLeft={stageLeft}
            stageTop={stageTop}
            stageWidth={stageW}
            stageHeight={stageH}
          />
        </>
      )}
    </div>
  );
}
