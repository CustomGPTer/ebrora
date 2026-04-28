// src/components/photo-editor/canvas/GestureLayer.tsx
//
// Gesture handling for the canvas (Session 7).
//
// Wires:
//   • Single pointer on a layer → leave for Konva's native drag
//   • Single pointer on the underlay (empty canvas / canvas
//     background) → no-op. One-finger viewport panning is
//     deliberately disabled so the underlay can't be dragged.
//   • Two pointers → pinch zoom + rotate around midpoint, with a 5°
//     rotation dead-zone to prevent accidental rotate during pinch.
//     Rotation snaps to the four cardinal angles (0°, 90°, 180°,
//     270°) within a 5° lock zone, with an 8° release zone for
//     hysteresis (so finger jitter doesn't unsnap).
//   • Wheel without ctrl/meta → pan vertically; shift+wheel → pan
//     horizontally
//   • Wheel with ctrl or meta (also fires on macOS trackpad pinch
//     where the browser sends ctrlKey: true) → zoom around cursor
//
// Listeners attach to the un-rotated canvas-area container so two-
// pointer gestures and wheel events work even when the user's cursor
// is just outside the rotated stage div. Single-pointer gestures use
// Konva's hit-testing to decide drag-layer-vs-no-op.
//
// All gesture-driven state changes go through SET_VIEWPORT, which is
// non-undoable (HANDOVER §8.4 — viewport is ephemeral). preventDefault
// is only called when the gesture is actually consumed; pointer events
// over a layer or wheel events that would no-op fall through to the
// browser / Konva.

"use client";

import { useEffect, useRef, type RefObject } from "react";
import type Konva from "konva";
import { useEditor } from "../context/EditorContext";
import {
  applyPan,
  applyRotateAround,
  applyZoomAround,
  ROTATION_DEAD_ZONE,
  VIEWPORT_MAX_ZOOM,
  VIEWPORT_MIN_ZOOM,
} from "@/lib/photo-editor/canvas/viewport";
import type { Viewport } from "@/lib/photo-editor/types";

interface GestureLayerProps {
  stageRef: RefObject<Konva.Stage>;
  canvasAreaRef: RefObject<HTMLDivElement>;
  /** Forwarded from EditorState.panMode — kept for backward compatibility
   *  with the Session 3 wiring; gesture logic in v1 doesn't read it
   *  because pan-on-empty is auto-routed via Konva hit-testing. */
  panMode?: boolean;
}

interface PointerState {
  /** clientX/Y at last move. Updated continuously. */
  x: number;
  y: number;
}

interface PanState {
  /** Last clientX/Y, used to compute the per-frame delta. */
  lastX: number;
  lastY: number;
  /** Pointer id we are tracking. */
  pointerId: number;
}

interface PinchState {
  /** Initial finger distance. */
  startDist: number;
  /** Initial finger angle (radians). */
  startAngle: number;
  /** Initial midpoint in centre-relative-screen-pixels. */
  anchor: { x: number; y: number };
  /** Viewport snapshot at gesture start. */
  startViewport: Viewport;
  /** Whether we've crossed the rotation dead-zone yet this gesture.
   *  Once crossed, the cumulative rotation is committed to the viewport
   *  on every move; before crossing, only zoom + translate move. */
  rotationActive: boolean;
  /** Currently locked to a cardinal angle (in radians, expressed as
   *  the absolute target rotation including the gesture-start
   *  rotation). null = not snapped. While snapped the viewport's
   *  rotation is forced to this exact value; finger movement past
   *  the release zone clears it back to free rotation. */
  snappedToCardinal: number | null;
}

// ─── Cardinal-angle snap thresholds ─────────────────────────────
// Lock when finger angle gets within ±5° of a cardinal (0°, 90°, 180°,
// 270°). Once snapped, hold until the user clearly rotates more than
// ±8° from the cardinal — the wider release window provides hysteresis
// so finger jitter on a touchscreen doesn't constantly toggle the snap.

const CARDINAL_SNAP_LOCK = (5 * Math.PI) / 180; // 5°
const CARDINAL_SNAP_RELEASE = (8 * Math.PI) / 180; // 8°
const HALF_PI = Math.PI / 2;

const WHEEL_ZOOM_FACTOR = 0.0015; // sensitivity for ctrl-wheel zoom
const WHEEL_PAN_FACTOR = 1.0; // 1 wheel-pixel = 1 screen-pixel of pan

export function GestureLayer({
  stageRef,
  canvasAreaRef,
}: GestureLayerProps) {
  const { state, dispatch } = useEditor();

  // Keep a ref that mirrors the latest viewport so gesture handlers
  // see fresh values without re-attaching listeners on every viewport
  // change. Declared before the effect that uses it.
  const latestViewportRef = useLatestRef(state.viewport);

  useEffect(() => {
    const container = canvasAreaRef.current;
    // stageRef is kept on props for backward compatibility with the
    // Session 7 wiring but is no longer read here — single-pointer
    // hit-testing was removed when one-finger panning was disabled.
    void stageRef;
    if (!container) return;

    const pointers = new Map<number, PointerState>();
    let pan: PanState | null = null;
    let pinch: PinchState | null = null;

    function getViewport(): Viewport {
      // Read latest viewport from the editor state via closure. We
      // refresh by reading from the dispatcher's state at call time.
      // The simplest path: keep a mutable ref that the outer scope
      // updates. But here we use a workaround — every dispatch reads
      // the current value before writing. We can't peek state inside
      // useReducer without a ref, so we cheat by reading from the
      // closure via the mostRecentViewportRef updated on each render.
      return latestViewportRef.current;
    }

    function getAnchorFromClient(
      clientX: number,
      clientY: number,
    ): { x: number; y: number } {
      const rect = container!.getBoundingClientRect();
      // Centre-relative-screen-pixels — the same coordinate system
      // viewport.translateX / translateY are expressed in.
      return {
        x: clientX - rect.left - rect.width / 2,
        y: clientY - rect.top - rect.height / 2,
      };
    }

    function startPinchFromPointers() {
      const arr = Array.from(pointers.values());
      if (arr.length < 2) return;
      const [a, b] = arr;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const startDist = Math.hypot(dx, dy);
      if (startDist < 1) return; // degenerate
      const startAngle = Math.atan2(dy, dx);
      const midClient = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const anchor = getAnchorFromClient(midClient.x, midClient.y);
      pinch = {
        startDist,
        startAngle,
        anchor,
        startViewport: getViewport(),
        rotationActive: false,
        snappedToCardinal: null,
      };
      // A pinch always cancels any in-flight pan.
      pan = null;
    }

    function onPointerDown(e: PointerEvent) {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1) {
        // Single pointer: leave it for Konva's native handling.
        // Hits on a layer become Konva drags; hits on the empty
        // canvas / underlay are intentionally a no-op — one-finger
        // viewport panning is disabled so the underlay can't be
        // dragged. Two-finger gestures still pinch + rotate.
        //
        // We deliberately do NOT setPointerCapture or preventDefault
        // here, so events flow through to Konva (for layer drags)
        // and the page (for normal click handling on overlay UI).
        // Tracking this pointer in `pointers` is still useful so we
        // can promote to a pinch when a second finger lands.
        return;
      } else if (pointers.size === 2) {
        // Promote to pinch+rotate. Capture both pointers so we keep
        // getting moves even if a finger slides off-screen.
        for (const id of pointers.keys()) {
          try {
            container!.setPointerCapture(id);
          } catch {
            // ignore
          }
        }
        startPinchFromPointers();
        e.preventDefault();
      } else {
        // 3+ fingers — ignore extras for v1. Konva's hit testing is
        // already off the table at this point.
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pinch && pointers.size >= 2) {
        const arr = Array.from(pointers.values()).slice(0, 2);
        const [a, b] = arr;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) return;
        const angle = Math.atan2(dy, dx);

        // Zoom from finger distance ratio.
        const factor = dist / pinch.startDist;

        // Rotation from angle delta. Apply the dead-zone: rotation
        // doesn't kick in until the user has rotated more than
        // ROTATION_DEAD_ZONE radians from the start. Once it kicks in,
        // it stays active for the rest of the gesture.
        let dRot = angle - pinch.startAngle;
        // Normalise to [-π, π] so a tiny rotation across the boundary
        // doesn't read as a huge one.
        if (dRot > Math.PI) dRot -= 2 * Math.PI;
        if (dRot < -Math.PI) dRot += 2 * Math.PI;
        if (!pinch.rotationActive && Math.abs(dRot) > ROTATION_DEAD_ZONE) {
          pinch.rotationActive = true;
        }
        let effectiveDRot = pinch.rotationActive ? dRot : 0;

        // Cardinal-angle snap. Once the user is actively rotating,
        // check the would-be absolute viewport rotation against the
        // four cardinal angles (multiples of π/2). Within the lock
        // zone (±5°) we force the rotation to the exact cardinal;
        // once locked, we stay locked until the finger movement
        // crosses the release zone (±8°), giving a hysteresis band
        // that absorbs touchscreen jitter.
        if (pinch.rotationActive) {
          const rawAbsRotation =
            pinch.startViewport.rotation + effectiveDRot;
          const nearestCardinal =
            Math.round(rawAbsRotation / HALF_PI) * HALF_PI;

          if (pinch.snappedToCardinal !== null) {
            // Currently locked. Release if the user has clearly
            // rotated past the cardinal we're locked to.
            const distFromSnap = Math.abs(
              rawAbsRotation - pinch.snappedToCardinal,
            );
            if (distFromSnap > CARDINAL_SNAP_RELEASE) {
              pinch.snappedToCardinal = null;
              // Fall through and use the raw rotation.
            } else {
              // Force rotation to exactly the cardinal target.
              effectiveDRot =
                pinch.snappedToCardinal - pinch.startViewport.rotation;
            }
          } else {
            // Not currently locked. Lock in if we're close enough.
            const distFromCardinal = Math.abs(
              rawAbsRotation - nearestCardinal,
            );
            if (distFromCardinal <= CARDINAL_SNAP_LOCK) {
              pinch.snappedToCardinal = nearestCardinal;
              effectiveDRot =
                nearestCardinal - pinch.startViewport.rotation;
            }
          }
        }

        // Pinch midpoint in clientX/Y — pan along with the midpoint.
        const midClient = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const currentAnchor = getAnchorFromClient(midClient.x, midClient.y);
        const anchorDelta = {
          x: currentAnchor.x - pinch.anchor.x,
          y: currentAnchor.y - pinch.anchor.y,
        };

        let next = applyZoomAround(
          pinch.startViewport,
          pinch.anchor,
          factor,
        );
        next = applyRotateAround(next, pinch.anchor, effectiveDRot);
        next = applyPan(next, anchorDelta.x, anchorDelta.y);

        dispatch({ type: "SET_VIEWPORT", viewport: next });
        e.preventDefault();
        return;
      }

      if (pan && e.pointerId === pan.pointerId) {
        const dx = e.clientX - pan.lastX;
        const dy = e.clientY - pan.lastY;
        if (dx !== 0 || dy !== 0) {
          const next = applyPan(getViewport(), dx, dy);
          dispatch({ type: "SET_VIEWPORT", viewport: next });
        }
        pan.lastX = e.clientX;
        pan.lastY = e.clientY;
        e.preventDefault();
      }
    }

    function endPointer(pointerId: number) {
      pointers.delete(pointerId);
      try {
        container!.releasePointerCapture(pointerId);
      } catch {
        // ignore
      }
      if (pinch) {
        if (pointers.size < 2) {
          // Pinch over. Don't promote a remaining single finger to
          // pan — that would be jarring after a pinch.
          pinch = null;
          pointers.clear();
        }
      } else if (pan && pan.pointerId === pointerId) {
        pan = null;
      }
    }

    function onPointerUp(e: PointerEvent) {
      endPointer(e.pointerId);
    }

    function onPointerCancel(e: PointerEvent) {
      endPointer(e.pointerId);
    }

    function onWheel(e: WheelEvent) {
      const isZoomGesture = e.ctrlKey || e.metaKey;

      if (isZoomGesture) {
        // ctrl/meta-wheel = zoom around cursor. macOS trackpad pinch
        // also routes here (the browser synthesises ctrlKey: true).
        const factor = Math.exp(-e.deltaY * WHEEL_ZOOM_FACTOR);
        const vp = getViewport();
        // Skip when the gesture would no-op against zoom limits.
        const wouldGrow = factor > 1;
        const wouldShrink = factor < 1;
        if (
          (wouldGrow && vp.zoom >= VIEWPORT_MAX_ZOOM) ||
          (wouldShrink && vp.zoom <= VIEWPORT_MIN_ZOOM)
        ) {
          return; // Don't preventDefault — let the page scroll.
        }
        const anchor = getAnchorFromClient(e.clientX, e.clientY);
        const next = applyZoomAround(vp, anchor, factor);
        dispatch({ type: "SET_VIEWPORT", viewport: next });
        e.preventDefault();
        return;
      }

      // Plain wheel = pan vertically. Shift+wheel = pan horizontally.
      // Trackpad two-finger scroll already produces deltaX as well as
      // deltaY without any modifier, so we honour both axes when both
      // are non-zero (real two-axis trackpad pans).
      let dx = -e.deltaX * WHEEL_PAN_FACTOR;
      let dy = -e.deltaY * WHEEL_PAN_FACTOR;
      if (e.shiftKey && dy !== 0 && dx === 0) {
        // Shift on a vertical-only mouse wheel converts vertical
        // motion to horizontal pan.
        dx = dy;
        dy = 0;
      }
      if (dx === 0 && dy === 0) return;
      const next = applyPan(getViewport(), dx, dy);
      dispatch({ type: "SET_VIEWPORT", viewport: next });
      e.preventDefault();
    }

    // Attach. wheel must be `passive: false` so preventDefault works.
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerCancel);
    container.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerCancel);
      container.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRef, canvasAreaRef, dispatch]);

  return null;
}

// ─── Internal: a tiny useRef-tracking-latest helper ─────────────

function useLatestRef<T>(value: T): { current: T } {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
