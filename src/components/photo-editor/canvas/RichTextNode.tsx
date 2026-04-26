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
// Session 5 / Batch B additions:
//   • `editing` prop — true while this layer is in inline-edit mode.
//     When editing, the layer is NOT draggable (TextEditOverlay sits on
//     top and intercepts pointer events anyway, but disabling drag here
//     is belt-and-braces against the bitmap accidentally responding).
//   • `onDoubleClick` prop — fires on dblclick / dbltap with the caret
//     offset computed from the pointer position. LayerRenderer wires
//     this to dispatch SET_RUN_SELECTION which puts the layer into edit
//     mode at the tapped offset.
//
// Single-tap behaviour is unchanged: onSelect fires, LayerRenderer
// dispatches SET_SELECTION. Edit mode is entered ONLY via double-tap —
// matches the Add Text app convention and avoids accidentally entering
// edit mode on every selection tap.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { layoutText, renderTextToCanvas } from "@/lib/photo-editor/rich-text/engine";
import { caretOffsetFromPoint } from "@/lib/photo-editor/rich-text/hit-test";
import { applyEraseStrokes } from "@/lib/photo-editor/canvas/erase-render";
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
  /** True while this layer is in inline-edit mode. When true, drag is
   *  suppressed and pointer events on the bitmap are still hooked but
   *  TextEditOverlay (mounted by LayerRenderer above us) sits on top
   *  and intercepts taps — so onSelect won't typically fire. */
  editing: boolean;
  /** Selection click — fires on tap / click anywhere on the rendered text
   *  (when not covered by TextEditOverlay). */
  onSelect: (additive: boolean) => void;
  /** Double-tap to enter edit mode. Receives the code-point offset where
   *  the caret should land based on where the user tapped. Wired by
   *  LayerRenderer to dispatch SET_SELECTION + SET_RUN_SELECTION. */
  onDoubleClick: (caretOffset: number) => void;
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
  onDoubleClick,
  onDragEnd,
  onTransformEnd,
}: RichTextNodeProps) {
  const imageRef = useRef<Konva.Image>(null);

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

  // Logical (CSS-pixel) dimensions of the off-screen canvas, including
  // padding so heavy strokes / shadows / italic overhang don't clip.
  const logicalW = Math.max(1, Math.ceil(layout.width + RENDER_PADDING * 2));
  const logicalH = Math.max(1, Math.ceil(layout.height + RENDER_PADDING * 2));

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

    // Translate into the padding region so layer-local (0,0) sits at
    // (PAD, PAD) on the bitmap. The Konva Image is then offset by -PAD
    // so the layer's transform.x/y still corresponds to the layer's
    // logical top-left, not the bitmap's top-left.
    ctx.save();
    ctx.translate(RENDER_PADDING, RENDER_PADDING);
    renderTextToCanvas(ctx, layer, layout);
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
    // `image` prop reference is unchanged.
    imageRef.current?.getLayer()?.batchDraw();
  }, [offscreen, layer, layout, logicalW, logicalH]);

  if (!offscreen) return null;

  return (
    <KonvaImage
      ref={imageRef}
      // The id matches the layer id so SelectionFrame.findOne(`#<id>`)
      // resolves to this Konva node.
      id={layer.id}
      name="pe-layer pe-layer-text"
      image={offscreen}
      // Transform.x/y is the layer's logical top-left on the canvas. The
      // bitmap is logicalW × logicalH (text + padding), so we offset by
      // -RENDER_PADDING in image coords to keep the visible text
      // anchored at the layer's transform.x / transform.y.
      x={layer.transform.x}
      y={layer.transform.y}
      offsetX={RENDER_PADDING}
      offsetY={RENDER_PADDING}
      width={logicalW}
      height={logicalH}
      scaleX={layer.transform.scaleX}
      scaleY={layer.transform.scaleY}
      rotation={layer.transform.rotation}
      skewX={layer.transform.skewX}
      skewY={layer.transform.skewY}
      visible={layer.visible}
      opacity={layer.opacity}
      // Suppress drag while inline-editing. The user is selecting text,
      // not moving the layer.
      draggable={draggable && !editing}
      onMouseDown={(e) => onSelect(isAdditive(e))}
      onTouchStart={(e) => onSelect(isAdditive(e))}
      onDblClick={(e) => {
        const offset = caretOffsetForEvent(e, layer);
        onDoubleClick(offset);
      }}
      onDblTap={(e) => {
        const offset = caretOffsetForEvent(e, layer);
        onDoubleClick(offset);
      }}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onTransformEnd={(e) => {
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
      }}
    />
  );
}

/** Resolve the layer-local caret offset for a Konva pointer event.
 *  Uses the event target's absolute transform (which includes stage
 *  scale + the layer's transform) to map the stage pointer position
 *  into bitmap pixel coords, then subtracts RENDER_PADDING to get
 *  layer-local coords for hit-test.
 *
 *  The event type is left wide — Konva's onDblClick / onDblTap deliver
 *  `KonvaEventObject<Event>` rather than narrowed mouse / touch types,
 *  and we don't read anything off the underlying event anyway. */
function caretOffsetForEvent(
  e: KonvaEventObject<Event>,
  layer: TextLayer,
): number {
  const node = e.target;
  const stage = node.getStage();
  if (!stage) return 0;
  const pos = stage.getPointerPosition();
  if (!pos) return 0;
  const matrix = node.getAbsoluteTransform().copy();
  matrix.invert();
  const bitmapLocal = matrix.point(pos);
  const layerLocal = {
    x: bitmapLocal.x - RENDER_PADDING,
    y: bitmapLocal.y - RENDER_PADDING,
  };
  // Layout is recomputed here rather than threaded through the prop —
  // double-clicks are infrequent and recomputing once on each is cheap.
  // Avoids needing to plumb the LayoutResult back out of the render
  // closure.
  return caretOffsetFromPoint(layoutText(layer), layerLocal);
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
