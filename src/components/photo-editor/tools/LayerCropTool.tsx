// src/components/photo-editor/tools/LayerCropTool.tsx
//
// Full-screen modal for cropping the SELECTED image layer's `crop`
// field — same UX as CropTool (which crops the project background)
// but applied to ImageLayer.crop on the currently-selected layer.
//
// Key differences vs CropTool:
//   • The image source is layer.src (with naturalWidth/naturalHeight
//     from the layer), not bg.src.
//   • Apply dispatches UPDATE_LAYER with the new crop rect; it does
//     NOT change the project canvas dimensions (background crop does).
//     The layer's visible size in the project is `crop.width ×
//     crop.height`, which is what ImageNode already reads.
//   • If the user un-crops fully (covers the whole image) we store
//     `crop: null` for cleaner state, matching the same convention
//     CropTool uses for the background.
//   • No aspect-ratio chips for v1 — Free crop only. The reference
//     pattern users want is "trim away the edges of this image",
//     which is the Free flow. Aspect chips can be added later if
//     needed; the geometry helpers here already support them.
//
// Apr 2026 — built alongside the per-layer Adjust / Filter / Blur
// panels.

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
import type { AnyLayer, ImageLayer, Rect } from "@/lib/photo-editor/types";

interface LayerCropToolProps {
  open: boolean;
  onClose: () => void;
}

const MIN_CROP = 16;

export function LayerCropTool({ open, onClose }: LayerCropToolProps) {
  const { state, dispatch } = useEditor();

  const layer = useMemo<ImageLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "image") return null;
    return found as ImageLayer;
  }, [state.selection, state.project.layers]);

  const [crop, setCrop] = useState<Rect | null>(null);

  // Re-snapshot from the layer whenever the modal opens.
  useEffect(() => {
    if (!open || !layer) return;
    const initial: Rect = layer.crop ?? {
      x: 0,
      y: 0,
      width: layer.naturalWidth,
      height: layer.naturalHeight,
    };
    setCrop(initial);
  }, [open, layer]);

  const handleApply = useCallback(() => {
    if (!layer || !crop) {
      onClose();
      return;
    }
    const isFull =
      crop.x === 0 &&
      crop.y === 0 &&
      crop.width === layer.naturalWidth &&
      crop.height === layer.naturalHeight;
    const nextCrop: Rect | null = isFull ? null : { ...crop };
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { crop: nextCrop } as Partial<AnyLayer>,
    });
    onClose();
  }, [crop, dispatch, layer, onClose]);

  if (!open) return null;

  if (!layer) {
    return (
      <ToolModal
        open={open}
        title="Crop"
        onCancel={onClose}
        onApply={onClose}
      >
        <div className="flex-1 flex items-center justify-center p-6">
          <p
            className="text-center max-w-sm"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Select an image layer to crop. Tap an image on the canvas
            first, then tap Crop again.
          </p>
        </div>
      </ToolModal>
    );
  }

  return (
    <ToolModal
      open={open}
      title="Crop image"
      onCancel={onClose}
      onApply={handleApply}
    >
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        {crop && (
          <CropStage
            src={layer.src}
            naturalWidth={layer.naturalWidth}
            naturalHeight={layer.naturalHeight}
            crop={crop}
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
  onChange: (next: Rect) => void;
}

function CropStage({
  src,
  naturalWidth,
  naturalHeight,
  crop,
  onChange,
}: CropStageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

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

  const scale = displaySize.w > 0 ? displaySize.w / naturalWidth : 0;

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
          onChange={onChange}
        />
      )}
    </div>
  );
}

function CropFrame({
  imageRef,
  cropDisplay,
  scale,
  naturalWidth,
  naturalHeight,
  onChange,
}: {
  imageRef: React.RefObject<HTMLImageElement | null>;
  cropDisplay: { x: number; y: number; width: number; height: number };
  scale: number;
  naturalWidth: number;
  naturalHeight: number;
  onChange: (next: Rect) => void;
}) {
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
    [cropDisplay, imageRef, scale],
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
        naturalWidth,
        naturalHeight,
      );
      onChange(next);
    },
    [imageRef, naturalHeight, naturalWidth, onChange, scale],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragStateRef.current === null) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    dragStateRef.current = null;
  }, []);

  const left = imgOffset.left + cropDisplay.x;
  const top = imgOffset.top + cropDisplay.y;
  const width = cropDisplay.width;
  const height = cropDisplay.height;

  return (
    <>
      {/* Dim outside the crop area */}
      <DimOverlay
        imgOffset={imgOffset}
        cropDisplay={cropDisplay}
        imageRef={imageRef}
      />

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
        {/* Rule-of-thirds grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.55 }}
        >
          <div
            style={{
              position: "absolute",
              left: "33.333%",
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(255,255,255,0.9)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "66.667%",
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(255,255,255,0.9)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "33.333%",
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(255,255,255,0.9)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "66.667%",
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(255,255,255,0.9)",
            }}
          />
        </div>

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

function DimOverlay({
  imgOffset,
  cropDisplay,
  imageRef,
}: {
  imgOffset: { left: number; top: number };
  cropDisplay: { x: number; y: number; width: number; height: number };
  imageRef: React.RefObject<HTMLImageElement | null>;
}) {
  const el = imageRef.current;
  const imgW = el?.getBoundingClientRect().width ?? 0;
  const imgH = el?.getBoundingClientRect().height ?? 0;

  const dim = "rgba(0, 0, 0, 0.55)";
  return (
    <>
      {/* Top */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: imgOffset.left,
          top: imgOffset.top,
          width: imgW,
          height: cropDisplay.y,
          background: dim,
        }}
      />
      {/* Bottom */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: imgOffset.left,
          top: imgOffset.top + cropDisplay.y + cropDisplay.height,
          width: imgW,
          height: Math.max(0, imgH - cropDisplay.y - cropDisplay.height),
          background: dim,
        }}
      />
      {/* Left */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: imgOffset.left,
          top: imgOffset.top + cropDisplay.y,
          width: cropDisplay.x,
          height: cropDisplay.height,
          background: dim,
        }}
      />
      {/* Right */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: imgOffset.left + cropDisplay.x + cropDisplay.width,
          top: imgOffset.top + cropDisplay.y,
          width: Math.max(0, imgW - cropDisplay.x - cropDisplay.width),
          height: cropDisplay.height,
          background: dim,
        }}
      />
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
  const positions: Record<string, React.CSSProperties> = {
    tl: { left: -10, top: -10 },
    tr: { right: -10, top: -10 },
    bl: { left: -10, bottom: -10 },
    br: { right: -10, bottom: -10 },
  };
  const cursor =
    corner === "tl" || corner === "br" ? "nwse-resize" : "nesw-resize";
  return (
    <div
      role="button"
      aria-label={`Resize ${corner} corner`}
      className="absolute pointer-events-auto"
      style={{
        ...positions[corner],
        width: 24,
        height: 24,
        borderRadius: 12,
        background: "rgba(255,255,255,0.98)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        cursor,
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
}

// ─── Geometry helpers ──────────────────────────────────────────

function pointerToNatural(
  e: React.PointerEvent,
  imageEl: HTMLImageElement,
  scale: number,
): { x: number; y: number } {
  const rect = imageEl.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  return { x: px / scale, y: py / scale };
}

function computeNewCrop(
  start: Rect,
  corner: "tl" | "tr" | "bl" | "br",
  dx: number,
  dy: number,
  naturalW: number,
  naturalH: number,
): Rect {
  let { x, y, width, height } = start;
  const right = x + width;
  const bottom = y + height;

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
    width = clamp(width + dx, MIN_CROP, naturalW - x);
    height = clamp(height + dy, MIN_CROP, naturalH - y);
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(MIN_CROP, Math.round(width)),
    height: Math.max(MIN_CROP, Math.round(height)),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
