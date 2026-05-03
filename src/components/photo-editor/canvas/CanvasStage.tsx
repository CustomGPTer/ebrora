// src/components/photo-editor/canvas/CanvasStage.tsx
//
// The Konva Stage. Covers the entire grey "canvas area" container at
// scale 1; viewport scale + rotation + translate live on a Konva.Group
// inside instead of on the Stage itself. This lets layers extend past
// the visible canvas frame and render in the surrounding grey area.
//
// Architecture (mobile-fixes batch 2 — issue 7):
//
//   <Stage width=containerWidth height=containerHeight>           ← scale 1
//     <Layer> background canvas (clipped to canvas rect) </Layer>
//     <Layer ref=layerGroupLayerRef>                              ← interactive
//       <Group ref=layerGroupRef>                                 ← viewport tx
//         <LayerRenderer />     ← unclipped, full opacity
//         <SelectionFrame />    ← konva selection ring
//       </Group>
//     </Layer>
//     <Layer listening={false}> overhang dimmer (clipped to OUTSIDE canvas) </Layer>
//     <Layer listening={false}> smart guides on top </Layer>
//   </Stage>
//
// Why the layer-group ref: snap math (LayerRenderer.tsx) and selection
// math (SelectionTools.tsx) both need project-pixel coordinates of the
// dragged layer. With the Stage now at scale 1 we use
// `relativeTo: layerGroup` and `getAbsoluteTransform(layerGroup)` to
// strip the viewport transform — same project-pixel coords as before.
//
// Overhang dimming trick:
//   Each layer renders ONCE, unclipped, at full opacity, fully
//   interactive. To make the overhang appear at "50% opacity", we
//   paint a 50%-opaque rectangle of canvas-bg colour on top of every
//   pixel OUTSIDE the canvas frame. Mathematically that's identical
//   to actually setting the layer to 50% opacity (when the underlying
//   "background" is a solid colour, which the grey canvas-bg is):
//     visible = 0.5 * layer + 0.5 * canvasBg     (true 50% opacity)
//     visible = 0.5 * canvasBg + 0.5 * layer     (overlay trick)
//   Same result. The overlay is `listening={false}` so it doesn't
//   block hit testing — users can grab the dimmed overhang and drag
//   it back onto the canvas. Smart guides + selection chrome render
//   on top of the overlay so they stay full-opacity in the overhang.
//
// Background rendering (preserved from before):
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
// Tapping the stage *outside* any layer clears the selection — same
// behaviour as before; the hit-test simply runs against the layer-group
// Layer now, with everything outside it counting as a stage tap.

"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  Stage,
  Layer,
  Rect,
  Group,
  Image as KonvaImage,
} from "react-konva";
import useImage from "use-image";
import Konva from "konva";
import type { Filter as KonvaFilter, KonvaEventObject } from "konva/lib/Node";
import { useEditor } from "../context/EditorContext";
import { useTheme } from "../context/ThemeContext";
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
  /** Pixel width of the grey canvas-area container. The Stage is sized
   *  to this so layer overhangs render past the visible canvas frame. */
  containerWidth: number;
  /** Pixel height of the grey canvas-area container. */
  containerHeight: number;
  /** DOM-pixel x of the visual canvas-frame's top-left corner inside
   *  the container. Pre-rotation — the rotation is applied around the
   *  frame's centre. */
  canvasLeft: number;
  /** DOM-pixel y of the visual canvas-frame's top-left corner. */
  canvasTop: number;
  /** Effective scale for the viewport — fitScale × viewportZoom. */
  canvasScale: number;
  /** Container ref forwarded to GestureLayer for two-finger gesture
   *  hit-testing. */
  canvasAreaRef: RefObject<HTMLDivElement>;
}

/** Light/dark canvas-bg colour values — kept in sync with ThemeStyles.tsx
 *  so the dimming overlay (issue 7) blends cleanly with the surrounding
 *  grey area. The CSS variable can't be passed straight to Konva fill;
 *  Konva needs a hex string at render time. */
const CANVAS_BG_COLOR: Record<"light" | "dark", string> = {
  light: "#E9ECEF",
  dark: "#0A0B0E",
};

/** Generous outer bound for the dimming overlay's clipping rect. The
 *  overlay covers everything outside the canvas; this number just has
 *  to be big enough that the overlay always fills the visible Stage at
 *  any zoom/pan. 100 000 project-pixels is plenty. */
const DIMMER_BOUNDS = 100_000;

/** Tiny outset on the dimmer's inner rect so the overlay never paints
 *  a 1-pixel hairline along the canvas frame's exact edge during
 *  fractional-scale rasterisation. Half a pixel in project units is
 *  invisible to the user. */
const DIMMER_INSET = 0.5;

export function CanvasStage({
  containerWidth,
  containerHeight,
  canvasLeft,
  canvasTop,
  canvasScale,
  canvasAreaRef,
}: CanvasStageProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const layerGroupRefBg = useRef<Konva.Group>(null);
  const layerGroupRef = useRef<Konva.Group>(null);
  const layerGroupRefDim = useRef<Konva.Group>(null);
  const layerGroupRefGuides = useRef<Konva.Group>(null);
  const {
    state,
    dispatch,
    stageRef: contextStageRef,
    layerGroupRef: contextLayerGroupRef,
  } = useEditor();
  const { theme } = useTheme();
  const { project, viewport } = state;

  useEffect(() => {
    contextStageRef.current = stageRef.current;
    return () => {
      if (contextStageRef.current === stageRef.current) {
        contextStageRef.current = null;
      }
    };
  }, [contextStageRef]);

  // Expose the interactive layer-group through context so snap and
  // selection math can resolve project-pixel coords via
  // `relativeTo: layerGroup`. Mobile-fixes batch 2 — issue 7.
  useEffect(() => {
    contextLayerGroupRef.current = layerGroupRef.current;
    return () => {
      if (contextLayerGroupRef.current === layerGroupRef.current) {
        contextLayerGroupRef.current = null;
      }
    };
  }, [contextLayerGroupRef]);

  function handleStageClick(e: KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = stageRef.current;
    if (!stage) return;
    if (e.target === stage) {
      if (state.selection.length > 0) {
        dispatch({ type: "SET_SELECTION", ids: [] });
      }
    }
  }

  // Viewport transform — applied identically to every Konva.Group in
  // the stage so the four layers stay perfectly aligned. Group
  // transform order (Konva): translate(x,y) ∘ rotate ∘ scale ∘ translate(-offset).
  // Setting (x,y) to canvas centre in container coords, rotation to
  // viewport.rotation, scale to canvasScale, and offset to canvas
  // centre in project-pixel coords means: project (0,0) lands at
  // (canvasLeft, canvasTop) in container coords pre-rotation.
  const projectCentreX = project.width / 2;
  const projectCentreY = project.height / 2;
  const stageW = Math.round(project.width * canvasScale);
  const stageH = Math.round(project.height * canvasScale);
  const groupX = canvasLeft + stageW / 2;
  const groupY = canvasTop + stageH / 2;
  const rotationDeg = (viewport.rotation * 180) / Math.PI;

  const groupTransform = {
    x: groupX,
    y: groupY,
    rotation: rotationDeg,
    scaleX: canvasScale,
    scaleY: canvasScale,
    offsetX: projectCentreX,
    offsetY: projectCentreY,
  };

  // Clip to the canvas rect (project-pixel coords). Used by the
  // background layer so the photo / gradient / checkerboard stops at
  // the canvas edge — overhanging layers still render past it.
  const clipToCanvas = (ctx: Konva.Context) => {
    ctx.beginPath();
    ctx.rect(0, 0, project.width, project.height);
  };

  // Clip to OUTSIDE the canvas rect — outer rect clockwise, inner
  // (canvas) rect counter-clockwise, non-zero fill rule. The outer
  // bound is large enough to cover any zoom/pan; the inner is the
  // canvas, slightly outset by DIMMER_INSET so the dimmer doesn't
  // paint a hairline at the frame edge during sub-pixel rasterisation.
  const clipOutsideCanvas = (ctx: Konva.Context) => {
    ctx.beginPath();
    // Outer rectangle clockwise (TL → TR → BR → BL → close).
    ctx.moveTo(-DIMMER_BOUNDS, -DIMMER_BOUNDS);
    ctx.lineTo(DIMMER_BOUNDS, -DIMMER_BOUNDS);
    ctx.lineTo(DIMMER_BOUNDS, DIMMER_BOUNDS);
    ctx.lineTo(-DIMMER_BOUNDS, DIMMER_BOUNDS);
    ctx.closePath();
    // Inner rectangle (the canvas) counter-clockwise.
    const innerL = -DIMMER_INSET;
    const innerT = -DIMMER_INSET;
    const innerR = project.width + DIMMER_INSET;
    const innerB = project.height + DIMMER_INSET;
    ctx.moveTo(innerL, innerT);
    ctx.lineTo(innerL, innerB);
    ctx.lineTo(innerR, innerB);
    ctx.lineTo(innerR, innerT);
    ctx.closePath();
  };

  return (
    <>
      <Stage
        ref={stageRef}
        width={containerWidth}
        height={containerHeight}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 1,
          touchAction: "none",
        }}
      >
        {/* ── Background — clipped to canvas rect, non-interactive ── */}
        <Layer listening={false}>
          <Group ref={layerGroupRefBg} {...groupTransform}>
            <Group clipFunc={clipToCanvas}>
              <BackgroundNode />
            </Group>
          </Group>
        </Layer>

        {/* ── Layers + selection ring — interactive, unclipped so
             overhangs render past the canvas frame at full opacity. */}
        <Layer>
          <Group ref={layerGroupRef} {...groupTransform}>
            <LayerRenderer />
            <SelectionFrame />
          </Group>
        </Layer>

        {/* ── Overhang dimmer — 50%-opacity canvas-bg painted over
             everything OUTSIDE the canvas, simulating 50% layer opacity
             on the overhang portion. listening={false} so it doesn't
             block hit testing on the overhang area below. */}
        <Layer listening={false}>
          <Group ref={layerGroupRefDim} {...groupTransform}>
            <Group clipFunc={clipOutsideCanvas}>
              <Rect
                x={-DIMMER_BOUNDS}
                y={-DIMMER_BOUNDS}
                width={DIMMER_BOUNDS * 2}
                height={DIMMER_BOUNDS * 2}
                fill={CANVAS_BG_COLOR[theme]}
                opacity={0.5}
                listening={false}
                perfectDrawEnabled={false}
              />
            </Group>
          </Group>
        </Layer>

        {/* ── Smart guides — on top of the dimmer so guides at the
             canvas edge stay full-opacity even where the dimmer paints. */}
        <Layer listening={false}>
          <Group ref={layerGroupRefGuides} {...groupTransform}>
            <SmartGuides
              canvasWidth={project.width}
              canvasHeight={project.height}
            />
          </Group>
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
