// src/components/photo-editor/tools/CropTool.tsx
//
// Full-screen modal for cropping the project's background photo.
// Mirrors the reference Add Text app's Crop screen (Image 5 from the
// design brief): image fills the working area, crop frame on top with
// a rule-of-thirds grid + 4 corner handles, aspect-ratio buttons in
// the bottom bar.
//
// Implementation notes:
//   • Pure DOM / CSS — no Konva. The preview is a sized <img> and the
//     crop frame is an absolutely-positioned div over it. Dragging the
//     corners updates the frame's rect in IMAGE-NATURAL coordinates,
//     which is what bg.crop wants to store. The rendered DOM coords
//     are derived by scaling natural coords by the image's display
//     scale.
//   • Aspect ratios:
//       - Free      → no constraint, drag any corner freely
//       - Original  → match the image's natural aspect ratio
//       - Square    → 1:1
//       - 3:4       → portrait poster
//       - 4:3       → landscape poster
//       - 4:5       → Instagram portrait
//       - 9:16      → story
//       - 16:9      → wide
//     When a constrained ratio is active, dragging any corner adjusts
//     the OPPOSITE corner symmetrically so the ratio is preserved.
//   • Snapping is intentionally minimal — we only clamp to the image
//     bounds (0..naturalWidth, 0..naturalHeight) and to a 16-px
//     minimum on each side so the user can't crop to nothing.
//   • Apply (✓) writes bg.crop on a SET_BACKGROUND dispatch. Cancel
//     leaves the project untouched.
//
// Why DOM / CSS rather than Konva? The crop frame is a UI overlay, not
// a canvas-painted element. Konva would mean a second Stage just for
// crop interaction, plus Konva-event-to-screen-coord plumbing. The DOM
// approach is far simpler — pointermove on the corner handles, ratio
// math in pure JS, done. The committed crop is later rendered through
// Konva by CanvasStage's Batch-5 PhotoRect rewrite.

"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ToolModal } from "./ToolModal";
import { useEditor } from "../context/EditorContext";
import type { Background, Rect } from "@/lib/photo-editor/types";

interface CropToolProps {
  open: boolean;
  onClose: () => void;
}

interface AspectChoice {
  id: string;
  label: string;
  /** width / height. null = "Free" (no constraint). "natural" sentinel
   *  means "match the image's natural aspect ratio." */
  ratio: number | null | "natural";
}

const ASPECTS: AspectChoice[] = [
  { id: "free", label: "Free", ratio: null },
  { id: "natural", label: "Original", ratio: "natural" },
  { id: "1-1", label: "1:1", ratio: 1 },
  { id: "3-4", label: "3:4", ratio: 3 / 4 },
  { id: "4-3", label: "4:3", ratio: 4 / 3 },
  { id: "4-5", label: "4:5", ratio: 4 / 5 },
  { id: "9-16", label: "9:16", ratio: 9 / 16 },
  { id: "16-9", label: "16:9", ratio: 16 / 9 },
];

const MIN_CROP = 16; // pixels in image-natural space

export function CropTool({ open, onClose }: CropToolProps) {
  const { state, dispatch } = useEditor();
  const bg = state.project.background;
  const photoBg = bg.kind === "photo" ? bg : null;

  // Rect we're editing — in IMAGE-NATURAL coords. Initialised from
  // bg.crop or the full-image rect.
  const [crop, setCrop] = useState<Rect | null>(null);
  const [aspectId, setAspectId] = useState<string>("free");

  // Re-snapshot from the project whenever the modal opens.
  useEffect(() => {
    if (!open || !photoBg) return;
    const initial: Rect = photoBg.crop ?? {
      x: 0,
      y: 0,
      width: photoBg.naturalWidth,
      height: photoBg.naturalHeight,
    };
    setCrop(initial);
    setAspectId("free");
  }, [open, photoBg]);

  // Apply / cancel ─────────────────────────────────────────────────
  const handleApply = useCallback(() => {
    if (!photoBg || !crop) {
      onClose();
      return;
    }
    // If the crop covers the entire image, treat as "uncropped" and
    // store null instead. Cleaner state and avoids redundant Konva
    // crop attributes downstream.
    const isFull =
      crop.x === 0 &&
      crop.y === 0 &&
      crop.width === photoBg.naturalWidth &&
      crop.height === photoBg.naturalHeight;
    const next: Background = {
      ...photoBg,
      crop: isFull ? null : { ...crop },
    };
    dispatch({ type: "SET_BACKGROUND", background: next });
    onClose();
  }, [crop, dispatch, onClose, photoBg]);

  if (!open) return null;
  if (!photoBg) {
    return (
      <ToolModal open={open} title="Crop" onCancel={onClose} onApply={onClose}>
        <div className="flex-1 flex items-center justify-center p-6">
          <p
            className="text-center max-w-sm"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Crop works on a photo background. Tap Replace in the dock
            to add a photo first.
          </p>
        </div>
      </ToolModal>
    );
  }

  // Resolve current aspect ratio to a number (or null for "Free").
  const aspect = resolveAspect(aspectId, photoBg.naturalWidth, photoBg.naturalHeight);

  function applyAspect(id: string) {
    setAspectId(id);
    if (!crop) return;
    const ratio = resolveAspect(
      id,
      photoBg!.naturalWidth,
      photoBg!.naturalHeight,
    );
    if (ratio === null) return;
    // Re-shape the current crop to fit the new ratio, anchored at the
    // crop's centre, clamped to image bounds.
    const cx = crop.x + crop.width / 2;
    const cy = crop.y + crop.height / 2;
    let w = crop.width;
    let h = w / ratio;
    if (h > photoBg!.naturalHeight) {
      h = photoBg!.naturalHeight;
      w = h * ratio;
    }
    if (w > photoBg!.naturalWidth) {
      w = photoBg!.naturalWidth;
      h = w / ratio;
    }
    const next: Rect = {
      x: clamp(cx - w / 2, 0, photoBg!.naturalWidth - w),
      y: clamp(cy - h / 2, 0, photoBg!.naturalHeight - h),
      width: w,
      height: h,
    };
    setCrop(next);
  }

  return (
    <ToolModal
      open={open}
      title="Crop"
      onCancel={onClose}
      onApply={handleApply}
      bottom={
        <AspectButtons
          activeId={aspectId}
          onPick={(id) => applyAspect(id)}
        />
      }
    >
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        {crop && (
          <CropStage
            src={photoBg.src}
            naturalWidth={photoBg.naturalWidth}
            naturalHeight={photoBg.naturalHeight}
            crop={crop}
            aspect={aspect}
            onChange={setCrop}
          />
        )}
      </div>
    </ToolModal>
  );
}

// ─── Crop stage — image + crop frame with corner drag ──────────

interface CropStageProps {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  crop: Rect;
  aspect: number | null;
  onChange: (next: Rect) => void;
}

function CropStage({
  src,
  naturalWidth,
  naturalHeight,
  crop,
  aspect,
  onChange,
}: CropStageProps) {
  // Container ref + measured display size of the image (CSS pixels).
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  // Measure the rendered image size whenever it loads or the wrapper
  // resizes. The wrapper is sized with object-fit:contain semantics so
  // the image fits inside without distortion; we read the actual
  // rendered rect to convert between display-pixel events and natural-
  // pixel crop coords.
  useLayoutEffect(() => {
    const el = imageRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setDisplaySize({ w: r.width, h: r.height });
    };
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Conversion factor: natural px → display px.
  const scale = displaySize.w > 0 ? displaySize.w / naturalWidth : 0;

  // Crop rect in display-pixel coordinates (relative to the image).
  const cropDisplay = {
    x: crop.x * scale,
    y: crop.y * scale,
    width: crop.width * scale,
    height: crop.height * scale,
  };

  return (
    <div
      ref={wrapperRef}
      className="relative flex items-center justify-center"
      style={{ width: "min(80vw, 70vh)", height: "min(80vw, 70vh)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={src}
        alt=""
        className="max-w-full max-h-full select-none"
        style={{ objectFit: "contain", touchAction: "none" }}
        draggable={false}
        onLoad={() => {
          const el = imageRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          setDisplaySize({ w: r.width, h: r.height });
        }}
      />

      {scale > 0 && (
        <CropFrame
          imageRef={imageRef}
          cropDisplay={cropDisplay}
          scale={scale}
          naturalWidth={naturalWidth}
          naturalHeight={naturalHeight}
          aspect={aspect}
          onChange={onChange}
        />
      )}
    </div>
  );
}

// ─── Crop frame — rule-of-thirds grid + 4 corner handles ────────

function CropFrame({
  imageRef,
  cropDisplay,
  scale,
  naturalWidth,
  naturalHeight,
  aspect,
  onChange,
}: {
  imageRef: React.RefObject<HTMLImageElement>;
  cropDisplay: { x: number; y: number; width: number; height: number };
  scale: number;
  naturalWidth: number;
  naturalHeight: number;
  aspect: number | null;
  onChange: (next: Rect) => void;
}) {
  // Position of the image element relative to the wrapper (the parent
  // of CropFrame). object-fit:contain centres the image; we read its
  // actual top-left for the absolute-positioning math below.
  const [imgOffset, setImgOffset] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });

  useLayoutEffect(() => {
    const el = imageRef.current;
    const wrapper = el?.parentElement;
    if (!el || !wrapper) return;
    const update = () => {
      const ir = el.getBoundingClientRect();
      const wr = wrapper.getBoundingClientRect();
      setImgOffset({ left: ir.left - wr.left, top: ir.top - wr.top });
    };
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [imageRef]);

  const dragStateRef = useRef<{
    corner: "tl" | "tr" | "bl" | "br";
    startCrop: Rect;
    startPointerNatural: { x: number; y: number };
  } | null>(null);

  const handlePointerDown = useCallback(
    (corner: "tl" | "tr" | "bl" | "br") => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragStateRef.current = {
        corner,
        startCrop: {
          x: cropDisplay.x / scale,
          y: cropDisplay.y / scale,
          width: cropDisplay.width / scale,
          height: cropDisplay.height / scale,
        },
        startPointerNatural: pointerToNatural(
          e,
          imageRef.current!,
          scale,
        ),
      };
    },
    [cropDisplay.height, cropDisplay.width, cropDisplay.x, cropDisplay.y, imageRef, scale],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      e.preventDefault();
      const p = pointerToNatural(e, imageRef.current!, scale);
      const dx = p.x - ds.startPointerNatural.x;
      const dy = p.y - ds.startPointerNatural.y;
      const next = computeNewCrop(
        ds.startCrop,
        ds.corner,
        dx,
        dy,
        aspect,
        naturalWidth,
        naturalHeight,
      );
      onChange(next);
    },
    [aspect, imageRef, naturalHeight, naturalWidth, onChange, scale],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragStateRef.current === null) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    dragStateRef.current = null;
  }, []);

  // Crop frame in wrapper coords (= image offset + crop in display px).
  const left = imgOffset.left + cropDisplay.x;
  const top = imgOffset.top + cropDisplay.y;
  const width = cropDisplay.width;
  const height = cropDisplay.height;

  return (
    <>
      {/* Dim outside the crop area — four absolutely-positioned overlays */}
      <DimOverlay imgOffset={imgOffset} cropDisplay={cropDisplay} imageRef={imageRef} />

      {/* Crop frame */}
      <div
        className="absolute pointer-events-none"
        style={{
          left,
          top,
          width,
          height,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.95)",
        }}
      >
        {/* Rule-of-thirds grid lines */}
        <ThirdsGrid />

        {/* Corner handles */}
        <CornerHandle
          corner="tl"
          onPointerDown={handlePointerDown("tl")}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        <CornerHandle
          corner="tr"
          onPointerDown={handlePointerDown("tr")}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        <CornerHandle
          corner="bl"
          onPointerDown={handlePointerDown("bl")}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        <CornerHandle
          corner="br"
          onPointerDown={handlePointerDown("br")}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </>
  );
}

function ThirdsGrid() {
  // Two horizontal + two vertical thirds lines.
  const lineStyle: React.CSSProperties = {
    position: "absolute",
    background: "rgba(255,255,255,0.45)",
    pointerEvents: "none",
  };
  return (
    <>
      <div style={{ ...lineStyle, top: "33.333%", left: 0, right: 0, height: 1 }} />
      <div style={{ ...lineStyle, top: "66.666%", left: 0, right: 0, height: 1 }} />
      <div style={{ ...lineStyle, left: "33.333%", top: 0, bottom: 0, width: 1 }} />
      <div style={{ ...lineStyle, left: "66.666%", top: 0, bottom: 0, width: 1 }} />
    </>
  );
}

function CornerHandle({
  corner,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}) {
  // Position each handle slightly outside the frame so it's tappable
  // even on a thin crop region.
  const HALF = 12;
  const styles: Record<typeof corner, React.CSSProperties> = {
    tl: { left: -HALF, top: -HALF },
    tr: { right: -HALF, top: -HALF },
    bl: { left: -HALF, bottom: -HALF },
    br: { right: -HALF, bottom: -HALF },
  };
  return (
    <div
      role="slider"
      aria-label={`Resize ${corner}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="absolute pointer-events-auto rounded-full"
      style={{
        ...styles[corner],
        width: HALF * 2,
        height: HALF * 2,
        background: "#FFFFFF",
        boxShadow: "0 2px 6px rgba(0,0,0,0.40)",
        touchAction: "none",
        cursor: cornerToCursor(corner),
      }}
    />
  );
}

// ─── Dim overlay ────────────────────────────────────────────────
//
// Four black-translucent rects covering the area outside the crop
// frame so the user's eye is drawn to the crop region. Done as
// absolutely-positioned divs because a single mask with cutout is
// fiddly with pointer-event suppression.

function DimOverlay({
  imgOffset,
  cropDisplay,
  imageRef,
}: {
  imgOffset: { left: number; top: number };
  cropDisplay: { x: number; y: number; width: number; height: number };
  imageRef: React.RefObject<HTMLImageElement>;
}) {
  const el = imageRef.current;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const imgW = r.width;
  const imgH = r.height;

  const dimStyle: React.CSSProperties = {
    position: "absolute",
    background: "rgba(0,0,0,0.55)",
    pointerEvents: "none",
  };

  return (
    <>
      <div
        style={{
          ...dimStyle,
          left: imgOffset.left,
          top: imgOffset.top,
          width: imgW,
          height: cropDisplay.y,
        }}
      />
      <div
        style={{
          ...dimStyle,
          left: imgOffset.left,
          top: imgOffset.top + cropDisplay.y + cropDisplay.height,
          width: imgW,
          height: imgH - (cropDisplay.y + cropDisplay.height),
        }}
      />
      <div
        style={{
          ...dimStyle,
          left: imgOffset.left,
          top: imgOffset.top + cropDisplay.y,
          width: cropDisplay.x,
          height: cropDisplay.height,
        }}
      />
      <div
        style={{
          ...dimStyle,
          left: imgOffset.left + cropDisplay.x + cropDisplay.width,
          top: imgOffset.top + cropDisplay.y,
          width: imgW - (cropDisplay.x + cropDisplay.width),
          height: cropDisplay.height,
        }}
      />
    </>
  );
}

// ─── Aspect-ratio buttons ───────────────────────────────────────

function AspectButtons({
  activeId,
  onPick,
}: {
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 overflow-x-auto"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {ASPECTS.map((a) => {
        const active = a.id === activeId;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a.id)}
            className="flex-none px-3 py-1.5 rounded-full text-sm transition-colors"
            style={{
              background: active ? "#FFFFFF" : "rgba(255,255,255,0.10)",
              color: active ? "#0F1115" : "#FFFFFF",
              fontWeight: active ? 600 : 500,
            }}
          >
            {a.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Pure helpers ───────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function resolveAspect(
  id: string,
  naturalW: number,
  naturalH: number,
): number | null {
  const choice = ASPECTS.find((a) => a.id === id);
  if (!choice) return null;
  if (choice.ratio === "natural") return naturalW / naturalH;
  return choice.ratio;
}

function pointerToNatural(
  e: React.PointerEvent,
  imgEl: HTMLImageElement,
  scale: number,
): { x: number; y: number } {
  const r = imgEl.getBoundingClientRect();
  const px = e.clientX - r.left;
  const py = e.clientY - r.top;
  return { x: px / scale, y: py / scale };
}

/** Compute the new crop rect after dragging `corner` by (dx, dy)
 *  natural-space pixels. Respects aspect-ratio constraint, clamps to
 *  image bounds, enforces a minimum crop size. */
function computeNewCrop(
  start: Rect,
  corner: "tl" | "tr" | "bl" | "br",
  dx: number,
  dy: number,
  aspect: number | null,
  naturalW: number,
  naturalH: number,
): Rect {
  let { x, y, width, height } = start;
  const right = x + width;
  const bottom = y + height;

  // Apply the corner movement to the matching edges.
  if (corner === "tl") {
    x = clamp(x + dx, 0, right - MIN_CROP);
    y = clamp(y + dy, 0, bottom - MIN_CROP);
    width = right - x;
    height = bottom - y;
  } else if (corner === "tr") {
    width = clamp(width + dx, MIN_CROP, naturalW - x);
    y = clamp(y + dy, 0, bottom - MIN_CROP);
    height = bottom - y;
  } else if (corner === "bl") {
    x = clamp(x + dx, 0, right - MIN_CROP);
    width = right - x;
    height = clamp(height + dy, MIN_CROP, naturalH - y);
  } else {
    // br
    width = clamp(width + dx, MIN_CROP, naturalW - x);
    height = clamp(height + dy, MIN_CROP, naturalH - y);
  }

  if (aspect !== null) {
    // Enforce ratio. Use whichever drag axis moved more (larger |delta|
    // relative to the dimension) as the driver, recompute the other.
    const drivenByWidth = Math.abs(dx) >= Math.abs(dy);
    if (drivenByWidth) {
      height = width / aspect;
    } else {
      width = height * aspect;
    }
    // Re-clamp width / height to image bounds and re-derive x/y so
    // the dragged corner's own position stays as the anchor.
    if (corner === "tl") {
      x = right - width;
      y = bottom - height;
    } else if (corner === "tr") {
      // x stays
      y = bottom - height;
    } else if (corner === "bl") {
      x = right - width;
      // y stays
    }
    // br: x/y stay

    // Final clamp pass — if ratio enforcement drove dimensions out of
    // bounds, shrink uniformly until they fit.
    if (x < 0) {
      width += x;
      height = width / aspect;
      x = 0;
    }
    if (y < 0) {
      height += y;
      width = height * aspect;
      y = 0;
    }
    if (x + width > naturalW) {
      width = naturalW - x;
      height = width / aspect;
    }
    if (y + height > naturalH) {
      height = naturalH - y;
      width = height * aspect;
    }
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(MIN_CROP, Math.round(width)),
    height: Math.max(MIN_CROP, Math.round(height)),
  };
}

function cornerToCursor(corner: "tl" | "tr" | "bl" | "br"): string {
  if (corner === "tl" || corner === "br") return "nwse-resize";
  return "nesw-resize";
}
