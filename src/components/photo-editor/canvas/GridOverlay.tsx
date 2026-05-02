// src/components/photo-editor/canvas/GridOverlay.tsx
//
// Visual-only grid overlay drawn above the canvas frame in DOM space
// (not inside Konva, so it never bakes into the export). Toggled by
// the grid icon in EditorTopBar — the icon now cycles four states:
//
//   off → 16 px → 32 px → 64 px → off
//
// Grid lines are rendered as a single SVG with two <pattern>s so the
// browser can repeat them efficiently across the stage rect. Lines are
// 1px hairlines at fixed DOM pixel widths (NOT scaled with the stage)
// so they read consistently at every zoom level. The overlay sits at
// `pointer-events: none` and z-index above the Konva stage but below
// the SelectionTools chrome.
//
// May 2026 — Width + Grid + Lines build.

"use client";

import { useEditor } from "../context/EditorContext";

interface GridOverlayProps {
  /** Stage's left / top in container coords. */
  stageLeft: number;
  stageTop: number;
  /** Stage's rendered DOM width / height (already includes effective
   *  scale — `project.width * effectiveScale`). */
  stageWidth: number;
  stageHeight: number;
  /** Effective scale (fit × viewport zoom). Used to convert the user-
   *  picked canvas-space grid size into DOM pixels. */
  stageScale: number;
}

const MAJOR_EVERY = 4; // every Nth line is the heavier "major" stroke

export function GridOverlay({
  stageLeft,
  stageTop,
  stageWidth,
  stageHeight,
  stageScale,
}: GridOverlayProps) {
  const { state } = useEditor();

  if (!state.gridVisible) return null;

  // gridSize may be undefined on projects saved before this build —
  // fall back to the same 24 px default that createInitialEditorState
  // uses so the overlay renders something sensible. The cycle handler
  // refreshes gridSize on the next tap regardless.
  const gridSize = state.gridSize && state.gridSize > 0 ? state.gridSize : 24;
  const sizeDom = Math.max(4, gridSize * stageScale);
  const majorSize = sizeDom * MAJOR_EVERY;

  // Pattern ids must be unique enough that two overlays on the same
  // page don't collide. The viewport translate doesn't move the
  // pattern origin (the pattern is positioned from the SVG's local
  // origin = stageLeft / stageTop), so this is fine.
  const minorId = `pe-grid-minor-${gridSize}`;
  const majorId = `pe-grid-major-${gridSize}`;

  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        left: stageLeft,
        top: stageTop,
        width: stageWidth,
        height: stageHeight,
        pointerEvents: "none",
        zIndex: 5,
      }}
      width={stageWidth}
      height={stageHeight}
    >
      <defs>
        <pattern
          id={minorId}
          width={sizeDom}
          height={sizeDom}
          patternUnits="userSpaceOnUse"
        >
          {/* Two crossing 1px lines per cell — drawn slightly off-
              centre so they don't disappear under a 1px aliasing
              quirk on integer multiples. */}
          <path
            d={`M ${sizeDom} 0 L 0 0 0 ${sizeDom}`}
            fill="none"
            stroke="rgba(80,80,80,0.20)"
            strokeWidth={1}
          />
        </pattern>
        <pattern
          id={majorId}
          width={majorSize}
          height={majorSize}
          patternUnits="userSpaceOnUse"
        >
          <rect width={majorSize} height={majorSize} fill={`url(#${minorId})`} />
          <path
            d={`M ${majorSize} 0 L 0 0 0 ${majorSize}`}
            fill="none"
            stroke="rgba(80,80,80,0.40)"
            strokeWidth={1.25}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${majorId})`} />
    </svg>
  );
}
