// src/components/photo-editor/erase/BrushSizeIndicator.tsx
//
// Visual brush preview — a hollow circle that follows the cursor inside
// the EraseTool modal. Rendered as a positioned <div> on top of the
// Konva stage rather than a Konva node so it doesn't interfere with
// pointer event capture and never enters the off-screen text bitmap.
//
// The indicator's diameter is the brush size in layer-local pixels
// scaled by the modal's display scale (stage-scale × text-layer scale).
// The caller resolves that maths and passes the visible diameter
// directly — keeping this component purely presentational.

"use client";

interface BrushSizeIndicatorProps {
  /** Visible diameter on screen in CSS pixels. */
  diameter: number;
  /** Pointer position relative to the indicator's positioning parent. */
  x: number;
  y: number;
  /** When false, the indicator hides (used when the pointer leaves the
   *  stage). */
  visible: boolean;
}

export function BrushSizeIndicator({
  diameter,
  x,
  y,
  visible,
}: BrushSizeIndicatorProps) {
  if (!visible) return null;
  const r = diameter / 2;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: diameter,
        height: diameter,
        borderRadius: "50%",
        border: "1.5px solid #FFFFFF",
        boxShadow: "0 0 0 1.5px rgba(0,0,0,0.6)",
        pointerEvents: "none",
        // Keep above Konva canvas (which is z-index auto inside its
        // wrapper); this lives in the same wrapper so the stacking
        // context is local.
        zIndex: 2,
      }}
    />
  );
}
