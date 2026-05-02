// src/components/photo-editor/context/CanvasPickerContext.tsx
//
// Coordinates a one-shot "drag a magnifier loupe and release to
// pick a colour" mode. Used as the fallback path in ColorPanel's
// EyedropperRow for browsers that don't expose the system
// `window.EyeDropper` API — every mobile browser, plus Safari and
// Firefox on desktop.
//
// Flow:
//   1. EyedropperRow calls `requestPick(callback)`. `isPicking`
//      becomes true.
//   2. CanvasPickerOverlay (mounted in EditorShell) sees `isPicking`
//      flip and rasterises the stage, spawns a draggable magnifier
//      loupe at the canvas centre, and captures all viewport pointer
//      events. The overlay drives the entire UX from here — drag to
//      reposition the sample point, release to commit.
//   3. On release the overlay calls `completePick("#RRGGBB")` which
//      fires the stored callback and exits pick mode.
//   4. The user may cancel at any time via the banner — `cancelPick`
//      clears the pending callback without firing it.
//
// Only one pick is in flight at a time. `requestPick` replaces any
// existing pending callback; there is no queue.
//
// Why a separate context (vs. wedging this into EditorContext):
//   The pick lifecycle is fully transient and only matters to a
//   couple of components. Keeping it isolated avoids re-rendering
//   the entire editor tree every time pick mode toggles, and makes
//   the feature self-contained for any future deletion / extraction.

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Hex string in the form `#RRGGBB` (uppercase). */
type PickCallback = (hex: string) => void;

interface CanvasPickerApi {
  /** True while a pick is in flight. */
  isPicking: boolean;
  /** Engage pick mode with a callback to fire on the next canvas tap. */
  requestPick: (cb: PickCallback) => void;
  /** Exit pick mode without firing the callback. */
  cancelPick: () => void;
  /** Stage-only: fire the stored callback with the sampled hex and
   *  exit pick mode. No-op when nothing is pending. */
  completePick: (hex: string) => void;
}

const CanvasPickerContext = createContext<CanvasPickerApi | null>(null);

export function CanvasPickerProvider({ children }: { children: ReactNode }) {
  // Stored as a single-element holder so React's setState identity
  // check still flips when the same callback is requested twice in a
  // row. Wrapping in `() => cb` for the setter is the standard React
  // dance to store a function value as state without React invoking
  // it as an updater.
  const [pending, setPending] = useState<PickCallback | null>(null);

  const requestPick = useCallback((cb: PickCallback) => {
    setPending(() => cb);
  }, []);

  const cancelPick = useCallback(() => {
    setPending(null);
  }, []);

  const completePick = useCallback((hex: string) => {
    // Fire the previous callback (if any) inside the updater so a
    // callback that itself calls `requestPick` (re-engaging the
    // picker for a follow-up pick) doesn't get clobbered by the
    // null-out below.
    setPending((prev) => {
      if (prev) prev(hex);
      return null;
    });
  }, []);

  const api = useMemo<CanvasPickerApi>(
    () => ({
      isPicking: pending !== null,
      requestPick,
      cancelPick,
      completePick,
    }),
    [pending, requestPick, cancelPick, completePick],
  );

  return (
    <CanvasPickerContext.Provider value={api}>
      {children}
    </CanvasPickerContext.Provider>
  );
}

export function useCanvasPicker(): CanvasPickerApi {
  const ctx = useContext(CanvasPickerContext);
  if (!ctx) {
    throw new Error(
      "useCanvasPicker must be used inside <CanvasPickerProvider>",
    );
  }
  return ctx;
}
