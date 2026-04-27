// src/components/photo-editor/canvas/SmartGuides.tsx
//
// Renders the active smart-guide lines on the canvas as Konva.Line
// nodes. Solid Ebrora teal at 1px, full canvas extent, listening=false
// so taps pass through. Phase 1 — Apr 2026.

"use client";

import { Line } from "react-konva";
import { useSmartGuides } from "./SmartGuidesContext";

const GUIDE_COLOR = "#1B5B50";
const GUIDE_WIDTH = 1;

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
