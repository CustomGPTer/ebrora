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

"use client";

import { Line } from "react-konva";
import { useSmartGuides } from "./SmartGuidesContext";

const GUIDE_COLOR = "#FFFFFF";
const GUIDE_WIDTH = 2;

interface SmartGuidesProps {
  canvasWidth: number;
  canvasHeight: number;
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
          strokeWidth={GUIDE_WIDTH}
          perfectDrawEnabled={false}
        />
      ))}
      {horizontalYs.map((y, i) => (
        <Line
          key={`h-${i}-${y}`}
          listening={false}
          points={[0, y, canvasWidth, y]}
          stroke={GUIDE_COLOR}
          strokeWidth={GUIDE_WIDTH}
          perfectDrawEnabled={false}
        />
      ))}
    </>
  );
}
