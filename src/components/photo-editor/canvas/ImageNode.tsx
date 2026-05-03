// src/components/photo-editor/canvas/ImageNode.tsx
//
// Renders an ImageLayer onto the Konva canvas. Two render paths:
//
//   • No perspective set → react-konva's <Image> node. This is the
//     fast / hardware-accelerated path with native crop, stroke, and
//     transform attribute support.
//
//   • Perspective set    → react-konva's <Shape> node with a custom
//     sceneFunc that warps the image into the four destination corners
//     via the triangle-mesh algorithm in /lib/photo-editor/canvas/
//     perspective-render.ts. The Shape's logical width/height equal
//     the bounding box of the warped quad so SelectionFrame and
//     hit-testing line up with the visible artwork.
//
// Crop is handled identically across both paths: the source image is
// cropped to layer.crop (if set) before warping. We slice the image
// into an offscreen canvas once per render so the crop happens at
// source resolution and the warp works on the cropped region.

"use client";

import { Image as KonvaImage, Shape as KonvaShape } from "react-konva";
import useImage from "use-image";
import { useEffect, useMemo, useRef } from "react";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  isIdentityPerspective,
  perspectiveBoundingBox,
  renderPerspectiveImage,
} from "@/lib/photo-editor/canvas/perspective-render";
import {
  applyImageFilterAttrs,
  buildCssFilterString,
  resolveImageFilterChain,
} from "@/lib/photo-editor/canvas/image-filters";
import type { ImageLayer, Transform } from "@/lib/photo-editor/types";

interface ImageNodeProps {
  layer: ImageLayer;
  draggable: boolean;
  onSelect: (additive: boolean) => void;
  onDragMove?: (x: number, y: number, node: Konva.Node) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (next: Partial<Transform>) => void;
}

export function ImageNode({
  layer,
  draggable,
  onSelect,
  onDragMove,
  onDragEnd,
  onTransformEnd,
}: ImageNodeProps) {
  const imageRef = useRef<Konva.Image>(null);
  const shapeRef = useRef<Konva.Shape>(null);
  const [img] = useImage(layer.src, "anonymous");

  // Visible dimensions — crop overrides natural size. If no crop, fall
  // back to natural pixels.
  const width = layer.crop ? layer.crop.width : layer.naturalWidth;
  const height = layer.crop ? layer.crop.height : layer.naturalHeight;

  // Apply per-layer filter chain (adjust + effect + blur) to the flat
  // KonvaImage path. Mirrors PhotoRect's behaviour for the project
  // background: cache the un-filtered pixels once, then update filter
  // attrs on each spec change so Konva's afterSetFilter re-runs the
  // chain against the cached canvas.
  useEffect(() => {
    const node = imageRef.current;
    if (!node || !img) return;
    const spec = {
      adjust: layer.adjust,
      effect: layer.filterEffect,
      blur: layer.blur,
    };
    const chain = resolveImageFilterChain(spec);
    applyImageFilterAttrs(node, spec);
    node.filters(chain);
    if (chain.length > 0) {
      if (!node.isCached()) {
        node.cache();
      }
    } else if (node.isCached()) {
      node.clearCache();
    }
    node.getLayer()?.batchDraw();
  }, [
    img,
    layer.adjust,
    layer.filterEffect,
    layer.blur,
    width,
    height,
  ]);

  // Override getSelfRect on the perspective KonvaShape so the selection
  // chrome wraps the warped quad's actual bounding box, not the un-
  // warped natural rectangle (W × H). Default getSelfRect for a Shape
  // returns (0, 0, width, height) which under-clips on extreme corner
  // warps that push corners outside the natural rect (the per-corner
  // sliders' ±30% range). Fixed May 2026.
  //
  // The flat path doesn't need this — KonvaImage's bbox is
  // already correct because no warping happens. We only patch the
  // shapeRef instance, and only when perspective is meaningfully
  // active (non-null, non-identity).
  useEffect(() => {
    const shape = shapeRef.current;
    if (!shape) return;
    if (
      !layer.perspective ||
      isIdentityPerspective(layer.perspective, width, height)
    ) {
      return;
    }
    const bbox = perspectiveBoundingBox(layer.perspective);
    shape.getSelfRect = () => ({
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
    });
    // Force a redraw so any attached transformer / SelectionFrame
    // re-reads the new self-rect.
    shape.getLayer()?.batchDraw();
  }, [layer.perspective, width, height]);

  // Pre-build a source canvas for the perspective path. When perspective
  // is active, the warp engine samples from this canvas. Two extra
  // responsibilities vs the plain path:
  //   • Crop: extract the visible sub-rectangle so the warp engine
  //     samples from "the cropped image" not "the cropped image padded
  //     with the full source".
  //   • Filters: apply adjust + filterEffect + blur to the source
  //     pixels via Canvas2D's ctx.filter before warping. This is a
  //     CLOSE-ENOUGH approximation of Konva's filter chain — the maths
  //     differ slightly (CSS uses multiplicative brightness, Konva uses
  //     additive, etc.) so the warped result and a flat-rendered same
  //     image with same filters won't be pixel-identical, but they
  //     match well enough for typical use. Documented for future
  //     polish.
  // Only built when perspective is active; the flat path uses Konva's
  // native filter chain via the useEffect above.
  const perspectiveSourceCanvas = useMemo<HTMLCanvasElement | null>(() => {
    if (!img) return null;
    if (!layer.perspective) return null;
    const sw = layer.crop ? layer.crop.width : img.width;
    const sh = layer.crop ? layer.crop.height : img.height;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.floor(sw));
    c.height = Math.max(1, Math.floor(sh));
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    // Build a CSS filter string from the layer's adjust + effect + blur.
    // Shared with the export pipeline via image-filters.ts so both paths
    // produce identical filter output for the same spec.
    const filterStr = buildCssFilterString({
      adjust: layer.adjust,
      effect: layer.filterEffect,
      blur: layer.blur,
    });
    if (filterStr) {
      // ctx.filter is supported in all modern browsers + Node Canvas.
      ctx.filter = filterStr;
    }
    if (layer.crop) {
      ctx.drawImage(
        img,
        layer.crop.x,
        layer.crop.y,
        layer.crop.width,
        layer.crop.height,
        0,
        0,
        layer.crop.width,
        layer.crop.height,
      );
    } else {
      ctx.drawImage(img, 0, 0);
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    img,
    layer.crop?.x,
    layer.crop?.y,
    layer.crop?.width,
    layer.crop?.height,
    !!layer.perspective,
    layer.adjust,
    layer.filterEffect,
    layer.blur,
  ]);

  // Trigger a Konva redraw of the perspective Shape whenever the
  // pre-baked source canvas changes (e.g. on filter changes). The
  // Shape's sceneFunc closes over `sourceImage`; we still need an
  // explicit batchDraw to flush.
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;
    node.getLayer()?.batchDraw();
  }, [perspectiveSourceCanvas]);

  if (!img) return null;

  // Decide which path to render via.
  const usePerspective =
    layer.perspective !== null &&
    !isIdentityPerspective(layer.perspective, width, height);

  // ── Plain (un-warped) path ──────────────────────────────────────
  if (!usePerspective) {
    const cropProps = layer.crop
      ? {
          cropX: layer.crop.x,
          cropY: layer.crop.y,
          cropWidth: layer.crop.width,
          cropHeight: layer.crop.height,
        }
      : {};

    const strokeProps =
      layer.stroke && layer.stroke.width > 0 && layer.stroke.opacity > 0
        ? {
            // Image strokes never carry null colour from their factory,
            // but the Stroke type now permits null (shape-stroke
            // semantics). Defensive fallback for type safety.
            stroke: layer.stroke.color ?? "#000000",
            strokeWidth: layer.stroke.width,
            strokeEnabled: true as const,
          }
        : { strokeEnabled: false as const };

    return (
      <KonvaImage
        ref={imageRef}
        id={layer.id}
        name="pe-layer pe-layer-image"
        image={img}
        x={layer.transform.x}
        y={layer.transform.y}
        width={width}
        height={height}
        {...cropProps}
        {...strokeProps}
        scaleX={layer.transform.scaleX}
        scaleY={layer.transform.scaleY}
        rotation={layer.transform.rotation}
        skewX={layer.transform.skewX}
        skewY={layer.transform.skewY}
        visible={layer.visible}
        opacity={layer.opacity}
        draggable={draggable}
        onMouseDown={(e) => onSelect(isAdditive(e))}
        onTouchStart={(e) => onSelect(isAdditive(e))}
        onDragMove={(e) => {
          if (!onDragMove) return;
          const node = e.target;
          onDragMove(node.x(), node.y(), node);
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

  // ── Perspective path ────────────────────────────────────────────
  // Destination corners are in layer-local coords where (0, 0) maps to
  // layer.transform.x/y — i.e. corners[0] = (0, 0) is the un-warped
  // top-left. So the sceneFunc draws at the literal corner coords with
  // NO offset shift; this keeps the perspective corner positions
  // visually consistent with where the user dropped the image.
  //
  // The KonvaShape's `width` / `height` are still set to the natural
  // source dimensions for hit-testing purposes (taps inside the
  // un-warped rect select the layer). Selection-chrome bbox is handled
  // separately via the `getSelfRect` override in the useEffect above —
  // that returns the bbox of the four destination corners so the
  // dashed selection border wraps the warp tightly even on extreme
  // corner-slider values that push corners outside the natural rect.
  const corners = layer.perspective!;
  const sourceImage: CanvasImageSource = perspectiveSourceCanvas ?? img;
  const sourceWidth = layer.crop ? layer.crop.width : img.width;
  const sourceHeight = layer.crop ? layer.crop.height : img.height;

  return (
    <KonvaShape
      ref={shapeRef}
      id={layer.id}
      name="pe-layer pe-layer-image"
      x={layer.transform.x}
      y={layer.transform.y}
      width={width}
      height={height}
      scaleX={layer.transform.scaleX}
      scaleY={layer.transform.scaleY}
      rotation={layer.transform.rotation}
      skewX={layer.transform.skewX}
      skewY={layer.transform.skewY}
      visible={layer.visible}
      opacity={layer.opacity}
      draggable={draggable}
      sceneFunc={(konvaCtx, shape) => {
        const ctx = konvaCtx._context as CanvasRenderingContext2D;
        renderPerspectiveImage(
          ctx,
          sourceImage,
          sourceWidth,
          sourceHeight,
          corners,
        );
        // Stroke: paint along the warped quad's edges (TL → TR → BR → BL).
        if (
          layer.stroke &&
          layer.stroke.width > 0 &&
          layer.stroke.opacity > 0
        ) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(corners[0].x, corners[0].y);
          ctx.lineTo(corners[1].x, corners[1].y);
          ctx.lineTo(corners[2].x, corners[2].y);
          ctx.lineTo(corners[3].x, corners[3].y);
          ctx.closePath();
          ctx.strokeStyle = layer.stroke.color ?? "#000000";
          ctx.lineWidth = layer.stroke.width;
          ctx.globalAlpha = layer.stroke.opacity;
          ctx.stroke();
          ctx.restore();
        }
        // Konva needs fillStrokeShape to wire up hit-testing.
        konvaCtx.fillStrokeShape(shape);
      }}
      hitFunc={(konvaCtx, shape) => {
        // Hit region: the natural rectangle. Same as the visual bbox;
        // taps inside the un-warped rect select the layer.
        konvaCtx.beginPath();
        konvaCtx.rect(0, 0, width, height);
        konvaCtx.closePath();
        konvaCtx.fillStrokeShape(shape);
      }}
      onMouseDown={(e) => onSelect(isAdditive(e))}
      onTouchStart={(e) => onSelect(isAdditive(e))}
      onDragMove={(e) => {
        if (!onDragMove) return;
        const node = e.target;
        onDragMove(node.x(), node.y(), node);
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

function isAdditive(e: KonvaEventObject<MouseEvent | TouchEvent>): boolean {
  const evt = e.evt as MouseEvent | TouchEvent;
  if ("touches" in evt) return false;
  return evt.metaKey || evt.ctrlKey || evt.shiftKey;
}
