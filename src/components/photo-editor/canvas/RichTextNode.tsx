// src/components/photo-editor/canvas/RichTextNode.tsx
//
// The bridge between the custom rich-text engine and Konva.
//
// Architecture (per the Session 1+2 handover, hard rule #4):
//   • Each TextLayer paints into its own off-screen <canvas>.
//   • The engine's renderTextToCanvas() does the painting.
//   • That canvas is then handed to Konva as the source of a Konva.Image.
//   • Konva owns the transform / hit-testing / Transformer wiring.
//
// We never use Konva.Text. The engine is the only path that paints text.
//
// Re-paint policy: useEffect re-runs whenever the layer's runs / styling /
// width / erase array change (which together drive layout + rendering).
// After each re-paint we ask the layer to redraw via batchDraw() so Konva
// picks up the new pixel contents even when the canvas reference is stable.
//
// Erase strokes — Session 6 wires the destination-out pass. After the
// engine renders the text bitmap, applyEraseStrokes() replays each stroke
// in the layer's `erase` array as `globalCompositeOperation =
// "destination-out"`, masking out any text that the brush passed over.
// Erase points are stored in layer-local pixel coords (no padding); the
// outer ctx.translate(RENDER_PADDING, ...) puts them at the right
// position in the bitmap. (Gotcha #11.)
//
// Batch 3 (Mobile text editing rebuild — April 2026):
//   • Double-tap inline-edit handlers removed. Mobile users tap once
//     to open the BottomEditDrawer (wired by LayerRenderer via
//     useMobileEdit().beginEditing); the in-canvas caret + selection-
//     range UX provided by TextEditOverlay is no longer reachable from
//     this component's events.
//   • The `editing` prop is preserved because callers still pass it,
//     but the only behavioural effect now is "draggable && !editing"
//     which acts as belt-and-braces against drag-while-keyboard-up.
//   • The `onDoubleClick` prop is removed from the interface entirely.
//     Any caller that was passing it should drop the prop — only
//     LayerRenderer used it and that's been updated in this same batch.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Shape as KonvaShape } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { layoutText, paintTextBackground, renderTextToCanvas } from "@/lib/photo-editor/rich-text/engine";
import { applyEraseStrokes } from "@/lib/photo-editor/canvas/erase-render";
import {
  computeBentBounds,
  createBendContext,
} from "@/lib/photo-editor/rich-text/bend";
import { getTextureMap } from "@/lib/photo-editor/rich-text/textures";
import {
  isIdentityPerspective,
  renderPerspectiveImage,
} from "@/lib/photo-editor/canvas/perspective-render";
import type { Transform } from "@/lib/photo-editor/types";
import type { TextLayer } from "@/lib/photo-editor/types";

/** Padding (in canvas-local pixels) added around the laid-out text on the
 *  off-screen canvas. Without this, glyphs that bleed past their advance
 *  box (heavy strokes, large shadows, italic overhang) get clipped at the
 *  edges of the bitmap. TextEditOverlay uses the same value for its
 *  transform — keep them in sync. */
const RENDER_PADDING = 24;

interface RichTextNodeProps {
  layer: TextLayer;
  /** Whether the user can drag this layer. Mirrors !layer.locked AND
   *  !editing (we don't want to drag-move while inline-editing). */
  draggable: boolean;
  /** True while this layer is in inline-edit mode (legacy desktop
   *  power-mode reachable only via direct SET_RUN_SELECTION dispatch).
   *  Suppresses drag while true. Mobile tap-to-edit (Batch 3) does NOT
   *  set this — it routes through MobileEditContext + BottomEditDrawer
   *  instead. */
  editing: boolean;
  /** Selection click — fires on tap / click anywhere on the rendered text.
   *  LayerRenderer wires this to dispatch SET_SELECTION and (for text
   *  layers) to also call useMobileEdit().beginEditing so the bottom
   *  editing drawer opens. */
  onSelect: (additive: boolean) => void;
  /** Drag move — fires on every pointer move while dragging. Used by
   *  smart-guides snap (Phase 1). */
  onDragMove?: (x: number, y: number, node: import("konva").default.Node) => void;
  /** Drag end — receives the new canvas-local x, y of the layer's origin. */
  onDragEnd: (x: number, y: number) => void;
  /** Transform end — receives the new transform values (Konva-modified). */
  onTransformEnd: (next: Partial<Transform>) => void;
}

export function RichTextNode({
  layer,
  draggable,
  editing,
  onSelect,
  onDragMove,
  onDragEnd,
  onTransformEnd,
}: RichTextNodeProps) {
  const imageRef = useRef<Konva.Image>(null);
  const shapeRef = useRef<Konva.Shape>(null);

  // Lazy off-screen canvas — created once on mount, reused for every
  // repaint of this layer. We keep it in state so the Konva Image's
  // `image` prop has a stable reference React can compare.
  const [offscreen] = useState<HTMLCanvasElement | null>(() => {
    if (typeof document === "undefined") return null;
    return document.createElement("canvas");
  });

  // Layout is pure logic and cheap; recompute whenever the inputs to
  // line-break / measurement change.
  const layout = useMemo(() => {
    return layoutText(layer);
    // We deliberately depend on the whole `layer` rather than picking
    // fields. React's identity check on the layer reference is enough:
    // editorReducer creates a new layer object on every UPDATE_LAYER.
  }, [layer]);

  // Extent of the painted area in layer-local coords. Starts from the
  // wrap-box width (layer.width) so the selection frame represents the
  // wrap region — under center / right alignment the user expects the
  // text to sit in the middle / right of the dotted box, which only
  // works if the box covers the full wrap width. We then union in the
  // layout's aligned glyph rect (handles the justify-multi-line stretch
  // case where lines extend out to maxWidth, plus catches the no-wrap
  // case where layer.width is 0), bend's bent-bounds, and the
  // background's padding.
  //
  // We clamp minX to ≤ 0 so layer-local (0, 0) — the layer's logical
  // anchor for transform.x / .y — always falls within (or to the right
  // of) the bitmap left edge. Otherwise anchorX below would go negative
  // and downstream coords (perspective sampling, erase-stroke positions
  // stored in layer-local coords) would silently misalign.
  const extent = useMemo(() => {
    const alignedMinX = layout.bounds.x;
    const alignedMaxX = layout.bounds.x + layout.bounds.width;

    let minX = Math.min(0, alignedMinX);
    let minY = 0;
    let maxX = Math.max(layout.width, alignedMaxX, layer.width);
    let maxY = layout.height;

    const bend = createBendContext(
      layer.styling.bend?.amount ?? 0,
      layer.width
    );
    if (bend) {
      const b = computeBentBounds(bend, layout);
      minX = Math.min(minX, b.minX);
      minY = Math.min(minY, b.minY);
      maxX = Math.max(maxX, b.maxX);
      maxY = Math.max(maxY, b.maxY);
    }

    const bg = layer.background;
    if (bg && bg.opacity > 0) {
      // Track alignment: bounds.x is the leftmost glyph offset under
      // center / right / justify, bounds.width is the rendered glyph
      // width. The rect must include both edges with padding so the
      // off-screen bitmap is sized to fit the full background extent.
      minX = Math.min(minX, layout.bounds.x - bg.widthDelta);
      minY = Math.min(minY, -bg.heightDelta);
      maxX = Math.max(
        maxX,
        layout.bounds.x + layout.bounds.width + bg.widthDelta,
      );
      maxY = Math.max(maxY, layout.height + bg.heightDelta);
    }

    return { minX, minY, maxX, maxY };
  }, [layer, layout]);

  // Logical (CSS-pixel) dimensions of the off-screen canvas, including
  // padding so heavy strokes / shadows / italic overhang don't clip.
  const logicalW = Math.max(
    1,
    Math.ceil(extent.maxX - extent.minX + RENDER_PADDING * 2)
  );
  const logicalH = Math.max(
    1,
    Math.ceil(extent.maxY - extent.minY + RENDER_PADDING * 2)
  );

  // Where layer-local (0, 0) sits inside the bitmap. For the flat case
  // this is (PAD, PAD) — same as before. For bent text where the apex
  // pokes above y=0 or the chord starts left of x=0, this shifts so the
  // entire bent extent fits with PAD on every side.
  const anchorX = RENDER_PADDING - extent.minX;
  const anchorY = RENDER_PADDING - extent.minY;

  // Paint the off-screen canvas. Runs whenever the layer changes (which
  // means the layout changed too, since layout is derived from layer).
  useEffect(() => {
    if (!offscreen) return;
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    offscreen.width = Math.round(logicalW * dpr);
    offscreen.height = Math.round(logicalH * dpr);
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, logicalW, logicalH);

    // Translate so layer-local (0, 0) lands at the anchor pixel. Bent
    // text painted at negative layer-local y still lands inside the
    // bitmap because anchorY accounts for that.
    ctx.save();
    ctx.translate(anchorX, anchorY);

    // Background rect underlay — paints first so glyphs sit on top.
    // Sized to the aligned glyph rect (layout.bounds) expanded by the
    // padding deltas, so the rect tracks center / right / justify
    // alignment instead of staying glued to the left of the wrap box.
    // When bend is active, this rect is around the FLAT layout — bent
    // glyphs may extend outside the rect at the apex (Q3 decision).
    paintTextBackground(ctx, layer, layout);

    renderTextToCanvas(ctx, layer, layout, { textures: getTextureMap() });
    // Erase pass — destination-out paint of every stroke in the layer's
    // `erase` array. Stored points are in layer-local space (no padding),
    // and we're already inside the padding-translated context, so the
    // strokes line up with the painted text exactly.
    if (layer.erase.length > 0) {
      applyEraseStrokes(ctx, layer.erase);
    }
    ctx.restore();

    // Force Konva to re-read the canvas pixels. Without this, mutating
    // the existing canvas in place doesn't trigger a redraw because the
    // `image` prop reference is unchanged. Either node may be the
    // active one depending on whether perspective is set.
    (imageRef.current ?? shapeRef.current)?.getLayer()?.batchDraw();
  }, [offscreen, layer, layout, logicalW, logicalH, anchorX, anchorY]);

  if (!offscreen) return null;

  // Shared event handler props — identical between the plain and
  // perspective branches. Lifted into a single object so the two JSX
  // returns don't drift.
  const sharedHandlers = {
    onMouseDown: (e: KonvaEventObject<MouseEvent>) => onSelect(isAdditive(e)),
    onTouchStart: (e: KonvaEventObject<TouchEvent>) => onSelect(isAdditive(e)),
    onDragMove: (e: KonvaEventObject<DragEvent>) => {
      if (!onDragMove) return;
      const node = e.target;
      onDragMove(node.x(), node.y(), node);
    },
    onDragEnd: (e: KonvaEventObject<DragEvent>) =>
      onDragEnd(e.target.x(), e.target.y()),
    onTransformEnd: (e: KonvaEventObject<Event>) => {
      const node = e.target;
      onTransformEnd({
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
        skewX: node.skewX(),
        skewY: node.skewY(),
      });
    },
  };

  // Decide which path to render via. Identity perspective short-circuits
  // to the plain KonvaImage (cheaper, no triangle subdivision). null also
  // takes that path.
  const W = layout.width;
  const H = layout.height;
  const usePerspective =
    layer.perspective !== null &&
    !isIdentityPerspective(layer.perspective, W, H);

  // ── Plain (un-warped) path ──────────────────────────────────────
  if (!usePerspective) {
    return (
      <KonvaImage
        ref={imageRef}
        // The id matches the layer id so SelectionFrame.findOne(`#<id>`)
        // resolves to this Konva node.
        id={layer.id}
        name="pe-layer pe-layer-text"
        image={offscreen}
        // Transform.x/y is the layer's logical top-left on the canvas.
        // The bitmap is logicalW × logicalH (text extent + padding), and
        // (anchorX, anchorY) inside the bitmap is layer-local (0, 0), so
        // we offset by (anchorX, anchorY) to keep the visible text
        // anchored at the layer's transform.x / transform.y.
        x={layer.transform.x}
        y={layer.transform.y}
        offsetX={anchorX}
        offsetY={anchorY}
        width={logicalW}
        height={logicalH}
        scaleX={layer.transform.scaleX}
        scaleY={layer.transform.scaleY}
        rotation={layer.transform.rotation}
        skewX={layer.transform.skewX}
        skewY={layer.transform.skewY}
        visible={layer.visible}
        opacity={layer.opacity}
        // Suppress drag while inline-editing (legacy desktop runSelection
        // path). Mobile tap-to-edit doesn't set `editing`, so drag stays
        // available while the BottomEditDrawer is open — the user can
        // reposition the layer with one finger while the keyboard is up.
        draggable={draggable && !editing}
        {...sharedHandlers}
      />
    );
  }

  // ── Perspective path ────────────────────────────────────────────
  // Destination corners are in layer-local coords ((0, 0) → (W, H) is
  // the flat layout bbox). The sceneFunc warps the layer-local sub-
  // region of the off-screen bitmap (offset by anchorX/anchorY in
  // bitmap coords) onto those four corners. Layer-local (0, 0) lands
  // at the shape's local origin, so layer.transform.x / .y still
  // anchors where the layer top-left sits on the stage — no offsetX /
  // offsetY needed on the shape.
  //
  // KNOWN LIMITATION: bend's apex outside the layer-local bbox + the
  // background rect's padding outside that bbox both clip during the
  // perspective phase. We pull from (anchorX, anchorY, W, H) — anything
  // beyond is not warped. Documented in BATCH-D2C-NOTES.md gotchas.
  const corners = layer.perspective!;
  return (
    <KonvaShape
      ref={shapeRef}
      id={layer.id}
      name="pe-layer pe-layer-text"
      x={layer.transform.x}
      y={layer.transform.y}
      width={W}
      height={H}
      scaleX={layer.transform.scaleX}
      scaleY={layer.transform.scaleY}
      rotation={layer.transform.rotation}
      skewX={layer.transform.skewX}
      skewY={layer.transform.skewY}
      visible={layer.visible}
      opacity={layer.opacity}
      draggable={draggable && !editing}
      sceneFunc={(konvaCtx) => {
        const ctx = (konvaCtx as unknown as { _context: CanvasRenderingContext2D })
          ._context;
        renderPerspectiveImage(
          ctx,
          offscreen,
          W,
          H,
          corners,
          undefined,
          anchorX,
          anchorY,
        );
      }}
      {...sharedHandlers}
    />
  );
}

/** Cmd/Ctrl held = additive selection (multi-select). */
function isAdditive(e: KonvaEventObject<MouseEvent | TouchEvent>): boolean {
  const evt = e.evt as MouseEvent | TouchEvent;
  // Touch events don't carry modifier keys reliably across browsers; treat
  // them as non-additive for now. Multi-select on mobile lands later via
  // long-press for context menu.
  if ("touches" in evt) return false;
  return evt.metaKey || evt.ctrlKey || evt.shiftKey;
}
