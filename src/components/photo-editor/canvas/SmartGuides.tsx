// src/components/photo-editor/canvas/SmartGuides.tsx
//
// Renders the active smart-guide lines on the canvas as Konva.Line
// nodes. Full canvas extent, listening=false so taps pass through.
// Phase 1 — Apr 2026.
//
// May 2026 — colour changed from Ebrora teal to white, thickness
// from 1px to 1.15px (15% thicker). Teal blended into mid-tone
// canvas content; white reads cleanly on any background, helped by
// the slight thickness bump.
//
// Mobile-fixes batch 1 (May 2026) — thickness widened again from
// 1.15px → 2px. Earlier value still got lost against busy photo
// backgrounds; 2px is bold enough that the line reads at a glance
// even on a small mobile canvas while remaining sub-pixel-aliased
// enough not to feel chunky on desktop.
//
// Mobile-fixes batch 3 (May 2026) — canvas-centre H/V lines now
// render at 4px while every other guide (canvas edges, layer
// alignment to other layers' edges/centres) stays at 2px. Pairs
// with Issue 10's centre-line hysteresis (the 9/15 px sticky lock):
// the thicker line gives a clear visual cue that the box has
// snapped to centre — versus a regular alignment guide which
// signals proximity but releases freely.
//
// Detection: each guide value is compared against the canvas
// centre (canvasWidth / 2 or canvasHeight / 2). The 0.5 px
// tolerance handles fractional rounding without false-flagging
// layer edges that just happen to coincide with the centre — and
// even when they DO coincide (e.g. a layer whose left edge sits
// exactly at canvasWidth / 2), drawing that guide at 4 px is
// still visually accurate, since the guide IS at the canvas centre.

"use client";

import { Line } from "react-konva";
import { useSmartGuides } from "./SmartGuidesContext";

const GUIDE_COLOR = "#FFFFFF";
const EDGE_GUIDE_WIDTH = 2;
const CENTRE_GUIDE_WIDTH = 4;

interface SmartGuidesProps {
  canvasWidth: number;
  canvasHeight: number;
}

/** True when a guide value sits at the canvas-centre line. The 0.5
 *  tolerance covers fractional rounding from the snap math. */
function isCanvasCentre(value: number, canvasExtent: number): boolean {
  return Math.abs(value - canvasExtent / 2) < 0.5;
}

export function SmartGuides({ canvasWidth, canvasHeight }: SmartGuidesProps) {
  const { verticalXs, horizontalYs } = useSmartGuides();

  if (verticalXs.length === 0 && horizontalYs.length === 0) {
    return null;
  }

  return (
    <>
      {verticalXs.map((x, i) => (
        <Line
          key={`v-${i}-${x}`}
          listening={false}
          points={[x, 0, x, canvasHeight]}
          stroke={GUIDE_COLOR}
          strokeWidth={
            isCanvasCentre(x, canvasWidth)
              ? CENTRE_GUIDE_WIDTH
              : EDGE_GUIDE_WIDTH
          }
          perfectDrawEnabled={false}
        />
      ))}
      {horizontalYs.map((y, i) => (
        <Line
          key={`h-${i}-${y}`}
          listening={false}
          points={[0, y, canvasWidth, y]}
          stroke={GUIDE_COLOR}
          strokeWidth={
            isCanvasCentre(y, canvasHeight)
              ? CENTRE_GUIDE_WIDTH
              : EDGE_GUIDE_WIDTH
          }
          perfectDrawEnabled={false}
        />
      ))}
    </>
  );
}
