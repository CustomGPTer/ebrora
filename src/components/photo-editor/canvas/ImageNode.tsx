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
import { useMemo, useRef } from "react";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  isIdentityPerspective,
  renderPerspectiveImage,
} from "@/lib/photo-editor/canvas/perspective-render";
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

  // Pre-build a cropped offscreen canvas for the perspective path so
  // the sceneFunc draws from "source = the cropped sub-rectangle"
  // every tick without re-cropping. Only built when perspective +
  // crop are BOTH set; in all other cases the original image is used
  // directly.
  const croppedCanvas = useMemo<HTMLCanvasElement | null>(() => {
    if (!img) return null;
    if (!layer.crop) return null;
    if (!layer.perspective) return null;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.floor(layer.crop.width));
    c.height = Math.max(1, Math.floor(layer.crop.height));
    const ctx = c.getContext("2d");
    if (!ctx) return null;
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
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, layer.crop?.x, layer.crop?.y, layer.crop?.width, layer.crop?.height, !!layer.perspective]);

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
      layer.stroke && layer.stroke.enabled
        ? {
            stroke: layer.stroke.color,
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
  // Konva's getClientRect for a Shape uses `width`/`height` (= bbox in
  // shape-local), so we set them to the natural source dimensions
  // (W × H) — which corresponds to the un-warped rectangle from (0, 0)
  // to (W, H). When perspective corners stay inside the natural rect
  // (the common case — every preset in PerspectivePanel does), the
  // selection chrome wraps the warp tightly. For extreme warps that
  // push corners outside (only reachable via the per-corner sliders'
  // ±30% range), the dashed border under-counts the overflow but the
  // warp itself still renders correctly. A future polish pass can
  // override Shape.getSelfRect to track the perspective bbox exactly.
  const corners = layer.perspective!;
  const sourceImage: CanvasImageSource = croppedCanvas ?? img;
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
        if (layer.stroke && layer.stroke.enabled && layer.stroke.width > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(corners[0].x, corners[0].y);
          ctx.lineTo(corners[1].x, corners[1].y);
          ctx.lineTo(corners[2].x, corners[2].y);
          ctx.lineTo(corners[3].x, corners[3].y);
          ctx.closePath();
          ctx.strokeStyle = layer.stroke.color;
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
