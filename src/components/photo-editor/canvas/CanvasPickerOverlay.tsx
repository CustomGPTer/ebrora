// src/components/photo-editor/canvas/CanvasPickerOverlay.tsx
//
// In-app eyedropper UI. Active whenever CanvasPickerContext.isPicking
// is true (set when ColorPanel's "Tap canvas to sample" button is
// pressed on a non-Chromium browser).
//
// Anatomy (mounted only while picking):
//   1. Cancel banner — small pill at the top of the viewport with a
//      hint and an × close button.
//   2. Drag overlay — a transparent fixed-position layer covering the
//      entire viewport that captures pointer events with
//      `touch-action: none`. Sits below the banner in z-order so the
//      cancel button always wins.
//   3. Loupe — a circular magnifier (zoomed-in view of the pixels
//      under the sample crosshair) plus a hex-code pill below it.
//      Pure visual element, pointer-events: none — taps fall through
//      to the drag overlay underneath.
//
// Workflow (the user-facing UX):
//   • Pick mode engages → loupe spawns at the centre of the canvas
//     showing whatever is there, banner appears.
//   • User touches anywhere → loupe jumps to (touch + offset above)
//     so it sits visible above the finger, sample point follows.
//     If the finger is too close to the top edge to fit the loupe
//     above, it flips below.
//   • Drag → loupe + sample point track the finger, magnifier and
//     hex update live.
//   • Release → commit the colour at the current sample point and
//     exit pick mode.
//   • × button → exit without committing.
//
// Sampling strategy:
//   `stage.toCanvas({ pixelRatio: 1 })` rasterises the entire scene
//   into an HTMLCanvasElement at display size. We do this ONCE on
//   pick-mode entry and cache it — the user's drag motion shouldn't
//   re-rasterise the whole scene every frame, and nothing in the
//   project is expected to change during a single pick gesture
//   (touch is captured by this overlay so the underlying canvas
//   doesn't receive any mutations). All sampling and the loupe's
//   magnified view read from this cached canvas.
//
// Coordinate spaces:
//   • Viewport coords (clientX, clientY) — what we get from
//     pointer events. Used for positioning the loupe via
//     position: fixed.
//   • Stage display coords (sx, sy) — pixels into the cached
//     canvas. Computed as (clientX - stageRect.left, clientY -
//     stageRect.top).
//   stageRect is captured once on entry from
//   `stage.container().getBoundingClientRect()`.

"use client";

import { useEffect, useRef, useState } from "react";
import { Pipette, X } from "lucide-react";
import { useCanvasPicker } from "../context/CanvasPickerContext";
import { useEditor } from "../context/EditorContext";

// ─── Loupe geometry ─────────────────────────────────────────────
// Tuned for a phone-sized viewport. The diameter is large enough
// for the magnified pixels to read clearly without dominating the
// canvas; the zoom factor is high enough to land on the exact
// pixel you want.

/** Outer diameter of the loupe in CSS pixels. */
const LOUPE_DIAMETER = 132;
const LOUPE_RADIUS = LOUPE_DIAMETER / 2;

/** Pixel zoom factor inside the loupe. 8× means each source pixel
 *  becomes an 8×8 block — easy to target with a fingertip even at
 *  the central crosshair. */
const ZOOM = 8;

/** Side length (in source pixels) of the region drawn into the
 *  loupe. Equal to LOUPE_DIAMETER / ZOOM rounded down so the central
 *  pixel sits cleanly under the crosshair. */
const SOURCE_SIDE = Math.floor(LOUPE_DIAMETER / ZOOM);

/** How far above the finger the loupe sits when there's room. The
 *  full loupe fits inside this distance so the finger never overlaps
 *  the magnified view. */
const VERTICAL_OFFSET = 90;

/** Border thickness of the loupe ring. Tinted with the live colour
 *  so the user can see "what they'll commit" peripherally without
 *  reading the hex pill. */
const LOUPE_BORDER = 4;

interface PickState {
  /** Viewport-space coords of the loupe centre (== sample point). */
  x: number;
  y: number;
  /** Hex string at the sample point, or null when the sample point
   *  is off-canvas / fully transparent. */
  hex: string | null;
}

export function CanvasPickerOverlay() {
  const { isPicking, cancelPick, completePick } = useCanvasPicker();
  const { stageRef } = useEditor();

  const [pickState, setPickState] = useState<PickState | null>(null);

  /** Cached rasterisation of the stage — built once per pick gesture. */
  const cachedRef = useRef<HTMLCanvasElement | null>(null);
  /** Stage's bounding rect in viewport coords — captured once per
   *  pick gesture; the canvas can't move while pick mode owns the
   *  pointer. */
  const stageRectRef = useRef<DOMRect | null>(null);
  /** True between pointerdown and pointerup. Used so pointermove
   *  only repositions the loupe while a finger is actively down,
   *  not when the finger is hovering on a desktop browser. */
  const draggingRef = useRef(false);
  /** The loupe's <canvas> for the magnified view. */
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ─── Pick-mode lifecycle ──────────────────────────────────────
  // On entering pick mode: rasterise the stage, capture its rect,
  // and seed the loupe at the canvas centre. On exit (isPicking
  // flipping back to false): clear the refs so memory is freed and
  // a re-entry rasterises a fresh canvas.
  useEffect(() => {
    if (!isPicking) {
      cachedRef.current = null;
      stageRectRef.current = null;
      draggingRef.current = false;
      setPickState(null);
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      cancelPick();
      return;
    }

    const container = stage.container();
    const rect = container.getBoundingClientRect();

    let cached: HTMLCanvasElement;
    try {
      cached = stage.toCanvas({ pixelRatio: 1 });
    } catch {
      // Konva failed to rasterise — most likely a CORS-tainted scene
      // that we can't sample from. Bail out cleanly.
      cancelPick();
      return;
    }

    cachedRef.current = cached;
    stageRectRef.current = rect;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setPickState({
      x: cx,
      y: cy,
      hex: sampleCachedAt(cached, cached.width / 2, cached.height / 2),
    });
  }, [isPicking, stageRef, cancelPick]);

  // ─── Loupe magnifier render ───────────────────────────────────
  // Re-paint the loupe canvas any time the sample point moves. The
  // magnified view shows an N×N region of the cached canvas blown
  // up by ZOOM, with a crosshair and a 1-source-pixel highlight box
  // at the dead centre.
  useEffect(() => {
    const cached = cachedRef.current;
    const rect = stageRectRef.current;
    const loupeCanvas = loupeCanvasRef.current;
    if (!pickState || !cached || !rect || !loupeCanvas) return;

    const ctx = loupeCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, LOUPE_DIAMETER, LOUPE_DIAMETER);

    // Neutral fallback so the area outside the canvas (when the
    // sample point is near an edge) doesn't show stale pixels.
    ctx.fillStyle = "#444";
    ctx.fillRect(0, 0, LOUPE_DIAMETER, LOUPE_DIAMETER);

    const sampleX = pickState.x - rect.left;
    const sampleY = pickState.y - rect.top;
    const sx = Math.round(sampleX) - Math.floor(SOURCE_SIDE / 2);
    const sy = Math.round(sampleY) - Math.floor(SOURCE_SIDE / 2);

    // Pixel-perfect zoom — no smoothing.
    ctx.imageSmoothingEnabled = false;

    try {
      ctx.drawImage(
        cached,
        sx,
        sy,
        SOURCE_SIDE,
        SOURCE_SIDE,
        0,
        0,
        LOUPE_DIAMETER,
        LOUPE_DIAMETER,
      );
    } catch {
      // Edge sources can throw on some browsers when sx/sy are
      // negative or out of bounds. The clearRect/fillRect above is
      // a sufficient fallback — leave the panel grey.
    }

    // Crosshair lines
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LOUPE_RADIUS + 0.5, 0);
    ctx.lineTo(LOUPE_RADIUS + 0.5, LOUPE_RADIUS - ZOOM / 2);
    ctx.moveTo(LOUPE_RADIUS + 0.5, LOUPE_RADIUS + ZOOM / 2);
    ctx.lineTo(LOUPE_RADIUS + 0.5, LOUPE_DIAMETER);
    ctx.moveTo(0, LOUPE_RADIUS + 0.5);
    ctx.lineTo(LOUPE_RADIUS - ZOOM / 2, LOUPE_RADIUS + 0.5);
    ctx.moveTo(LOUPE_RADIUS + ZOOM / 2, LOUPE_RADIUS + 0.5);
    ctx.lineTo(LOUPE_DIAMETER, LOUPE_RADIUS + 0.5);
    ctx.stroke();

    // Central pixel highlight — the source pixel that will be
    // committed. Drawn as a black-on-white double stroke so it
    // reads on both light and dark colours.
    const cx = LOUPE_RADIUS - ZOOM / 2;
    const cy = LOUPE_RADIUS - ZOOM / 2;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, ZOOM, ZOOM);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 0.75;
    ctx.strokeRect(cx + 0.75, cy + 0.75, ZOOM - 1.5, ZOOM - 1.5);
  }, [pickState]);

  // ─── Pointer handlers ─────────────────────────────────────────
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateLoupeForTouch(e.clientX, e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    e.preventDefault();
    updateLoupeForTouch(e.clientX, e.clientY);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    e.preventDefault();
    draggingRef.current = false;

    // Read the latest pickState via setter so we don't stale-close
    // over a previous render's value. Functional setter returns the
    // same state unchanged; the side-effect commits the colour.
    setPickState((current) => {
      if (current && current.hex) {
        completePick(current.hex);
      } else {
        cancelPick();
      }
      return current;
    });
  }

  function handlePointerCancel() {
    draggingRef.current = false;
    cancelPick();
  }

  /** Recompute the loupe position and sampled hex from a viewport
   *  pointer position. Pure visual update — does not commit. */
  function updateLoupeForTouch(touchX: number, touchY: number) {
    const cached = cachedRef.current;
    const rect = stageRectRef.current;
    if (!cached || !rect) return;

    const { x, y } = computeLoupePosition(touchX, touchY, rect);
    const sampleX = x - rect.left;
    const sampleY = y - rect.top;
    const hex = sampleCachedAt(cached, sampleX, sampleY);
    setPickState({ x, y, hex });
  }

  if (!isPicking) return null;

  const ringColor = pickState?.hex ?? "rgba(255,255,255,0.6)";

  return (
    <>
      {/* Drag overlay — captures all viewport pointer events. Sits
          below the cancel banner so the × button always wins hit-
          testing. Transparent; the only reason it has any pixels is
          to be a click target. */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="fixed inset-0 z-[399]"
        style={{
          touchAction: "none",
          cursor: "crosshair",
        }}
      />

      {/* Cancel banner */}
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
        <span>Drag to pick — release to apply</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cancelPick();
          }}
          onPointerDown={(e) => e.stopPropagation()}
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

      {/* Loupe — pointer-events: none so taps fall through to the
          drag overlay underneath. */}
      {pickState ? (
        <>
          <div
            className="fixed pointer-events-none z-[400]"
            style={{
              left: pickState.x - LOUPE_RADIUS,
              top: pickState.y - LOUPE_RADIUS,
              width: LOUPE_DIAMETER,
              height: LOUPE_DIAMETER,
              borderRadius: "50%",
              border: `${LOUPE_BORDER}px solid ${ringColor}`,
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.45), 0 8px 32px rgba(0,0,0,0.45)",
              overflow: "hidden",
              background: "#222",
              boxSizing: "border-box",
            }}
          >
            <canvas
              ref={loupeCanvasRef}
              width={LOUPE_DIAMETER}
              height={LOUPE_DIAMETER}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
              }}
            />
          </div>

          {/* Hex pill below the loupe */}
          {pickState.hex ? (
            <div
              className="fixed pointer-events-none z-[400] px-2.5 py-1 rounded-full text-xs font-mono tabular-nums whitespace-nowrap flex items-center gap-1.5"
              style={{
                left: pickState.x,
                top: pickState.y + LOUPE_RADIUS + 12,
                transform: "translateX(-50%)",
                background: "rgba(17, 24, 39, 0.92)",
                color: "#FFFFFF",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              }}
            >
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: 9999,
                  background: pickState.hex,
                  border: "1px solid rgba(255,255,255,0.4)",
                }}
              />
              {pickState.hex}
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

// ─── Position math ────────────────────────────────────────────────

/** Compute the loupe centre for a given finger position. The loupe
 *  sits VERTICAL_OFFSET above the finger by default; if that would
 *  push the loupe off the top of the canvas, it flips to sit below.
 *  X is clamped horizontally to the canvas; Y is clamped to keep the
 *  sample point inside the canvas (never off-edge). */
function computeLoupePosition(
  touchX: number,
  touchY: number,
  rect: DOMRect,
): { x: number; y: number } {
  const aboveY = touchY - VERTICAL_OFFSET;
  // Flip below the finger if the loupe's top edge would clip above
  // the canvas (i.e. fingers near the top of the photo).
  const flipBelow = aboveY - LOUPE_RADIUS < rect.top;
  const candidateY = flipBelow ? touchY + VERTICAL_OFFSET : aboveY;

  const x = clamp(touchX, rect.left, rect.right - 1);
  const y = clamp(candidateY, rect.top, rect.bottom - 1);
  return { x, y };
}

function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

// ─── Pixel sampling ──────────────────────────────────────────────

/** Read the pixel at (x, y) from the cached canvas and return it as
 *  an upper-case `#RRGGBB` string. Returns null for fully-transparent
 *  pixels, out-of-bounds reads, or any other failure path — the
 *  caller treats null as "don't commit". */
function sampleCachedAt(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
): string | null {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let pixel: Uint8ClampedArray;
  try {
    pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  } catch {
    return null;
  }

  if (pixel[3] === 0) return null;
  return rgbToHex(pixel[0], pixel[1], pixel[2]);
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return ("#" + h(r) + h(g) + h(b)).toUpperCase();
}
