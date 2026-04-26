// src/components/photo-editor/canvas/ImageNode.tsx
//
// Renders an ImageLayer onto the Konva canvas via react-konva's <Image>
// node. Loads the source image asynchronously through the use-image hook
// (already a dependency) — while loading, the node renders nothing so it
// doesn't pop in at zero size.
//
// Crop is supported via the layer.crop rectangle, which describes a sub-
// region of the source image's natural pixels to display. The visible
// canvas dimensions become the crop dimensions; if no crop is set, the
// image renders at its natural size.
//
// Perspective (4-point warp) is *not* applied here — Konva has no native
// perspective support. The Free Transform tool in Session 6 will swap
// this node out for a Konva.Path with a custom sceneFunc that paints the
// image into a non-rectangular quad. For Session 3, a layer with
// `perspective !== null` still renders flat (the warp is recorded in
// state but ignored visually); a console.debug noisily flags the case so
// it's easy to spot during Session 6 bring-up.

"use client";

import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { useRef } from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { ImageLayer, Transform } from "@/lib/photo-editor/types";

interface ImageNodeProps {
  layer: ImageLayer;
  draggable: boolean;
  onSelect: (additive: boolean) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (next: Partial<Transform>) => void;
}

export function ImageNode({
  layer,
  draggable,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: ImageNodeProps) {
  const imageRef = useRef<Konva.Image>(null);
  const [img] = useImage(layer.src, "anonymous");

  if (!img) return null;

  // Visible dimensions — crop overrides natural size. If no crop, fall
  // back to natural pixels.
  const width = layer.crop ? layer.crop.width : layer.naturalWidth;
  const height = layer.crop ? layer.crop.height : layer.naturalHeight;

  // Crop offset into the source image (Konva's `crop` prop expects a
  // sub-rectangle of the *source* in source pixels).
  const cropProps = layer.crop
    ? {
        cropX: layer.crop.x,
        cropY: layer.crop.y,
        cropWidth: layer.crop.width,
        cropHeight: layer.crop.height,
      }
    : {};

  if (layer.perspective) {
    // eslint-disable-next-line no-console
    console.debug(
      "[ImageNode] perspective warp set on layer",
      layer.id,
      "— flat render until Session 6 adds the sceneFunc."
    );
  }

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
