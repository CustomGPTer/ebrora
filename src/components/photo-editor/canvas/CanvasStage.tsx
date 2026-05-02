// src/components/photo-editor/canvas/CanvasStage.tsx
//
// The Konva Stage. Background sits in its own non-listening Layer; all
// overlay layers (text / image / shape / sticker) plus the selection
// transformer sit in a second Layer that *does* listen for hit-testing
// so taps on layers select them.
//
// Background rendering:
//   • "transparent" → soft checkerboard
//   • "solid"       → filled Rect
//   • "gradient"    → linear gradient Rect
//   • "photo"       → the photo, with bg.crop / bg.flip / bg.rotation
//                     (Batch 5) AND state.filters applied via the Konva
//                     filter chain (Batch 6).
//
// Filter chain (Batch 6):
//   The PhotoRect node is `cache()`-ed once per image-load so Konva
//   captures unfiltered pixel data. Filter attrs (brightness, contrast,
//   saturation, etc) are then changed via setters; Konva's Factory
//   wires `afterSetFilter` on every filter attr to mark `_filterUpToDate
//   = false`, so the next batchDraw re-runs filters from the cached
//   pixels. We don't need to re-cache on every slider tick.
//
// Tapping the stage *outside* any layer clears the selection.

"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import Konva from "konva";
import type { Filter as KonvaFilter, KonvaEventObject } from "konva/lib/Node";
import { useEditor } from "../context/EditorContext";
import { useCanvasPicker } from "../context/CanvasPickerContext";
import { LayerRenderer } from "./LayerRenderer";
import { SelectionFrame } from "./SelectionFrame";
import { GestureLayer } from "./GestureLayer";
import { SmartGuides } from "./SmartGuides";
import type {
  Background,
  BackgroundFilters,
  GradientFill,
} from "@/lib/photo-editor/types";

interface CanvasStageProps {
  stageWidth: number;
  stageHeight: number;
  scale: number;
  canvasAreaRef: RefObject<HTMLDivElement>;
}

export function CanvasStage({
  stageWidth,
  stageHeight,
  scale,
  canvasAreaRef,
}: CanvasStageProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const { state, dispatch, stageRef: contextStageRef } = useEditor();
  const picker = useCanvasPicker();

  useEffect(() => {
    contextStageRef.current = stageRef.current;
    return () => {
      if (contextStageRef.current === stageRef.current) {
        contextStageRef.current = null;
      }
    };
  }, [contextStageRef]);

  function handleStageClick(e: KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    // ── Colour-pick interception ────────────────────────────────
    // When the canvas picker is active (the in-app eyedropper
    // fallback used on browsers without window.EyeDropper), any tap
    // anywhere on the stage — empty area OR a layer — samples the
    // pixel under the pointer and exits pick mode. We stop the
    // event from bubbling so the layer's own onSelect doesn't fire,
    // since the user's intent is "sample this pixel", not "select
    // this layer".
    if (picker.isPicking) {
      e.cancelBubble = true;
      const hex = sampleStagePixel(stage);
      if (hex) {
        picker.completePick(hex);
      } else {
        picker.cancelPick();
      }
      return;
    }

    if (e.target === stage) {
      if (state.selection.length > 0) {
        dispatch({ type: "SET_SELECTION", ids: [] });
      }
    }
  }

  return (
    <>
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
      >
        <Layer listening={false}>
          <BackgroundNode />
        </Layer>
        <Layer>
          <LayerRenderer />
          <SmartGuides
            canvasWidth={state.project.width}
            canvasHeight={state.project.height}
          />
          <SelectionFrame />
        </Layer>
      </Stage>
      <GestureLayer
        stageRef={stageRef}
        canvasAreaRef={canvasAreaRef}
        panMode={state.panMode}
      />
    </>
  );
}

// ─── Background ─────────────────────────────────────────────────

function BackgroundNode() {
  const { state } = useEditor();
  const { project } = state;
  const bg: Background = project.background;

  switch (bg.kind) {
    case "transparent":
      return (
        <CheckerboardRect width={project.width} height={project.height} />
      );

    case "solid":
      return (
        <Rect
          x={0}
          y={0}
          width={project.width}
          height={project.height}
          fill={bg.color}
        />
      );

    case "gradient":
      return (
        <GradientRect
          width={project.width}
          height={project.height}
          gradient={bg.gradient}
        />
      );

    case "photo":
      return (
        <PhotoRect
          bg={bg}
          projectWidth={project.width}
          projectHeight={project.height}
          filters={project.filters}
        />
      );
  }
}

// ─── Photo background — Batch 5 + 6 ─────────────────────────────
//
// Batch 5 added crop / flip / rotation rendering.
// Batch 6 adds the filter chain.
//
// Konva.Image fields used:
//   • image                                          → the loaded HTMLImage
//   • x, y                                           → destination origin
//   • width, height                                  → destination size
//   • offsetX, offsetY (when transforms are needed)  → rotate around centre
//   • cropX, cropY, cropWidth, cropHeight            → source crop rect
//   • scaleX, scaleY                                 → flip
//   • rotation                                       → degrees
//   • filters[]                                      → Konva filter chain
//   • brightness / contrast / saturation / hue / luminance / blurRadius
//                                                    → filter attrs
//
// Cache lifecycle:
//   • cache() is called once when an image is first loaded into Konva,
//     so the node holds an offscreen canvas of the un-filtered pixels.
//   • Every slider change updates a filter attr — Konva's Factory
//     `afterSetFilter` callback flags the cache as stale, and the next
//     batchDraw re-runs filters against the cached pixels.
//   • When `image` itself changes (user replaced the photo), we
//     clearCache() and re-cache against the new image.
//   • If the filter chain becomes empty (no effects, no adjustments)
//     we clearCache() so the node renders directly without the cache
//     hop — slightly cheaper for the no-filter common case.

function PhotoRect({
  bg,
  projectWidth,
  projectHeight,
  filters,
}: {
  bg: Extract<Background, { kind: "photo" }>;
  projectWidth: number;
  projectHeight: number;
  filters: BackgroundFilters;
}) {
  const [img] = useImage(bg.src, "anonymous");
  const imageNodeRef = useRef<Konva.Image>(null);

  // Apply / refresh the Konva filter chain. We resolve the chain
  // every time `filters` changes; setters fire `afterSetFilter` so a
  // simple batchDraw refreshes the rendered output.
  useEffect(() => {
    const node = imageNodeRef.current;
    if (!node || !img) return;

    const chain = resolveFilterChain(filters);

    // Update attrs first, then assign the chain. (Order matters when
    // the chain is empty — we want to set the attrs before clearing
    // the cache so the next render picks the new identity values.)
    node.brightness((filters.adjust.brightness + filters.adjust.exposure / 2) / 100);
    node.contrast(filters.adjust.contrast);
    node.saturation(filters.adjust.saturation / 100);
    node.hue(0);
    node.luminance(0);
    if (filters.blur.radius > 0) {
      node.blurRadius(filters.blur.radius);
    } else {
      node.blurRadius(0);
    }

    node.filters(chain);

    if (chain.length > 0) {
      // Cache the node so filters apply. Cache once; Konva's
      // afterSetFilter mechanism handles re-application on attr change.
      // We re-cache only when the chain transitions from empty → non-
      // empty or when we have a new image source (covered by the
      // `img` dep).
      if (!node.isCached()) {
        node.cache();
      }
    } else if (node.isCached()) {
      node.clearCache();
    }

    node.getLayer()?.batchDraw();
  }, [img, filters, projectWidth, projectHeight]);

  if (!img) return null;

  const cropAttrs = bg.crop
    ? {
        cropX: bg.crop.x,
        cropY: bg.crop.y,
        cropWidth: bg.crop.width,
        cropHeight: bg.crop.height,
      }
    : {};

  const flipScaleX = bg.flip.horizontal ? -1 : 1;
  const flipScaleY = bg.flip.vertical ? -1 : 1;
  const hasRotation = bg.rotation !== 0;
  const hasFlip = flipScaleX !== 1 || flipScaleY !== 1;

  if (!hasRotation && !hasFlip) {
    return (
      <KonvaImage
        ref={imageNodeRef}
        image={img}
        x={0}
        y={0}
        width={projectWidth}
        height={projectHeight}
        {...cropAttrs}
      />
    );
  }

  return (
    <KonvaImage
      ref={imageNodeRef}
      image={img}
      x={projectWidth / 2}
      y={projectHeight / 2}
      offsetX={projectWidth / 2}
      offsetY={projectHeight / 2}
      width={projectWidth}
      height={projectHeight}
      scaleX={flipScaleX}
      scaleY={flipScaleY}
      rotation={bg.rotation}
      {...cropAttrs}
    />
  );
}

/** Resolve the BackgroundFilters object to an ordered Konva filter
 *  chain. Empty array means "no filters" — the caller should
 *  clearCache() in that case to skip the offscreen-canvas hop. */
function resolveFilterChain(f: BackgroundFilters): Array<KonvaFilter> {
  const chain: Array<KonvaFilter> = [];
  const a = f.adjust;
  if (a.brightness !== 0 || a.exposure !== 0) {
    chain.push(Konva.Filters.Brighten);
  }
  if (a.contrast !== 0) {
    chain.push(Konva.Filters.Contrast);
  }
  if (a.saturation !== 0) {
    // HSL covers saturation/hue/luminance — we only use saturation here.
    chain.push(Konva.Filters.HSL);
  }
  if (f.effect === "mono") chain.push(Konva.Filters.Grayscale);
  else if (f.effect === "sepia") chain.push(Konva.Filters.Sepia);
  else if (f.effect === "invert") chain.push(Konva.Filters.Invert);
  if (f.blur.radius > 0) {
    chain.push(Konva.Filters.Blur);
  }
  return chain;
}

// ─── Gradient ───────────────────────────────────────────────────

function GradientRect({
  width,
  height,
  gradient,
}: {
  width: number;
  height: number;
  gradient: GradientFill;
}) {
  const stops = gradient.stops.length > 0 ? gradient.stops : DEFAULT_STOPS;
  const colorStops: (number | string)[] = [];
  for (const s of stops) {
    colorStops.push(s.position, s.color);
  }

  const angleRad = ((gradient.angle - 90) * Math.PI) / 180;
  const radius = Math.max(width, height) / 2;
  const cx = width / 2;
  const cy = height / 2;
  const start = {
    x: cx - Math.cos(angleRad) * radius,
    y: cy - Math.sin(angleRad) * radius,
  };
  const end = {
    x: cx + Math.cos(angleRad) * radius,
    y: cy + Math.sin(angleRad) * radius,
  };

  return (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      fillLinearGradientStartPoint={start}
      fillLinearGradientEndPoint={end}
      fillLinearGradientColorStops={colorStops}
    />
  );
}

const DEFAULT_STOPS = [
  { position: 0, color: "#cccccc" },
  { position: 1, color: "#888888" },
];

// ─── Transparent (checkerboard) ─────────────────────────────────

function CheckerboardRect({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const tile = 24;
  const cols = Math.ceil(width / tile);
  const rows = Math.ceil(height / tile);
  const tiles: JSX.Element[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isDark = (r + c) % 2 === 0;
      tiles.push(
        <Rect
          key={`${r}-${c}`}
          x={c * tile}
          y={r * tile}
          width={tile}
          height={tile}
          fill={isDark ? "#FFFFFF" : "#E5E7EB"}
        />
      );
    }
  }
  return <>{tiles}</>;
}

// ─── Pixel sampling for the in-app eyedropper ──────────────────
//
// Rasterises the stage to an HTMLCanvasElement and reads the pixel
// directly under the pointer position. Returns `#RRGGBB` (uppercase)
// or null on any failure (no pointer, toCanvas threw, CORS-tainted
// canvas, out-of-bounds — all of which the caller should treat as
// "cancel the pick" rather than fire it with bogus data).
//
// Why direct sampling without coordinate transforms: Konva's
// stage.getPointerPosition() returns coords in display space (CSS
// pixels relative to the stage's top-left), and stage.toCanvas()
// rasterises the stage at its display size. Both share the same
// coordinate frame so we can sample at (round(pos.x), round(pos.y))
// directly.
//
// Every image source in the editor (photo backgrounds, image
// layers, stickers) loads with crossOrigin="anonymous", so the
// rasterised canvas should not be CORS-tainted in practice. The
// try/catch around getImageData is defence-in-depth for any
// future asset loaded without that flag.

function sampleStagePixel(stage: Konva.Stage): string | null {
  const pos = stage.getPointerPosition();
  if (!pos) return null;

  let off: HTMLCanvasElement;
  try {
    off = stage.toCanvas({ pixelRatio: 1 });
  } catch {
    return null;
  }

  const ctx = off.getContext("2d");
  if (!ctx) return null;

  const x = Math.max(0, Math.min(off.width - 1, Math.round(pos.x)));
  const y = Math.max(0, Math.min(off.height - 1, Math.round(pos.y)));

  let pixel: Uint8ClampedArray;
  try {
    pixel = ctx.getImageData(x, y, 1, 1).data;
  } catch {
    return null;
  }

  // If the user tapped on a fully-transparent area (e.g. transparent
  // background's checkerboard renders as opaque white/grey, but a
  // hypothetical empty-stage tap would land here), fall back to
  // null so the picker cancels rather than committing to black.
  if (pixel[3] === 0) return null;

  return rgbToHex(pixel[0], pixel[1], pixel[2]);
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return ("#" + h(r) + h(g) + h(b)).toUpperCase();
}
