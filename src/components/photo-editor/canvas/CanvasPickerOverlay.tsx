// src/components/photo-editor/canvas/CanvasPickerOverlay.tsx
//
// Floating banner shown while CanvasPickerContext.isPicking is true.
// Pinned to the top of the viewport above the editor's other chrome
// (z-[400] — same tier as the toast in EditorShell) with a Cancel
// button.
//
// The wrapper itself uses `pointer-events-none` so taps that land on
// the banner's empty space fall through to the canvas underneath
// (matters when the banner happens to overlap the canvas top edge on
// short screens). Only the Cancel button reclaims pointer events.

"use client";

import { Pipette, X } from "lucide-react";
import { useCanvasPicker } from "../context/CanvasPickerContext";

export function CanvasPickerOverlay() {
  const { isPicking, cancelPick } = useCanvasPicker();
  if (!isPicking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-full text-sm flex items-center gap-3 pointer-events-none"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 64px)",
        background: "rgba(17, 24, 39, 0.92)",
        color: "#FFFFFF",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      <Pipette
        className="w-4 h-4 flex-none"
        strokeWidth={2}
        aria-hidden
      />
      <span>Tap the canvas to sample a colour</span>
      <button
        type="button"
        onClick={cancelPick}
        aria-label="Cancel colour pick"
        className="inline-flex items-center justify-center rounded-full pointer-events-auto"
        style={{
          width: 24,
          height: 24,
          background: "rgba(255,255,255,0.16)",
        }}
      >
        <X className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
