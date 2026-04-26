// src/components/photo-editor/canvas/StickerNode.tsx
//
// Renders a StickerLayer onto the Konva canvas. A sticker is essentially
// an image node whose source is an SVG (Twemoji from CDN once the
// Stickers panel lands in Session 6, or any image URL the layer carries
// in `src`). use-image handles the asynchronous load.
//
// Twemoji caveat: Konva paints the SVG via an HTMLImageElement, which
// rasterises it at the natural SVG dimensions. That's fine for emoji at
// 72×72 typical render sizes, but very large stickers may look soft if
// the Twemoji asset is small. Session 6's sticker picker can deal with
// resolution selection (24 / 72 / svg) when wiring the picker.

"use client";

import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { useRef } from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { StickerLayer, Transform } from "@/lib/photo-editor/types";

interface StickerNodeProps {
  layer: StickerLayer;
  draggable: boolean;
  onSelect: (additive: boolean) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (next: Partial<Transform>) => void;
}

export function StickerNode({
  layer,
  draggable,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: StickerNodeProps) {
  const imageRef = useRef<Konva.Image>(null);
  const [img] = useImage(layer.src, "anonymous");

  if (!img) return null;

  return (
    <KonvaImage
      ref={imageRef}
      id={layer.id}
      name="pe-layer pe-layer-sticker"
      image={img}
      x={layer.transform.x}
      y={layer.transform.y}
      width={layer.width}
      height={layer.height}
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
