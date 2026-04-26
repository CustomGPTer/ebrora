// src/components/photo-editor/canvas/ShapeNode.tsx
//
// Renders a ShapeLayer onto the Konva canvas.
//
// Two rendering paths:
//
//   1) Built-in primitives (rect / ellipse / circle / line / triangle /
//      star). These are the legacy ids the Session 5 stub created and
//      that ShapeNode has always supported. They render via dedicated
//      Konva nodes (Konva.Rect, Konva.Ellipse, etc.) for crispness.
//
//   2) Catalogue entries — Session 6's full shape set (~60 shapes
//      across Geometric / Arrows / Badges / Frames / Decorative). Any
//      shapeId that isn't a built-in is looked up in the catalogue; if
//      found, it renders via Konva.Path with the catalogue's `d`
//      string. The path is scaled to fit the layer's width × height by
//      computing per-axis scale from the catalogue's viewBox.
//
// Anything not in either set falls back to a dashed placeholder rect
// with the shape id printed inside so it's obvious during testing that
// a catalogue entry is missing.
//
// Variant handling (filled / outlined) and the existing layer.stroke
// rules are preserved across both rendering paths — fill is the layer's
// fill colour for filled variants, transparent for outlined; the
// outlined variant always draws an outline using the same fill colour
// when no explicit stroke is enabled.

"use client";

import { Ellipse, Line, Path, Rect, Star, Group, Text } from "react-konva";
import type Konva from "konva";
import { useRef } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type { ShapeLayer, Transform } from "@/lib/photo-editor/types";
import {
  findShape,
  isBuiltInShape,
} from "@/lib/photo-editor/shapes/catalogue";

interface ShapeNodeProps {
  layer: ShapeLayer;
  draggable: boolean;
  onSelect: (additive: boolean) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (next: Partial<Transform>) => void;
}

export function ShapeNode({
  layer,
  draggable,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: ShapeNodeProps) {
  const groupRef = useRef<Konva.Group>(null);
  const fill = layer.variant === "filled" ? layer.fill : "transparent";
  const strokeProps = layer.stroke.enabled
    ? {
        stroke: layer.stroke.color,
        strokeWidth: layer.stroke.width,
        strokeOpacity: layer.stroke.opacity,
      }
    : layer.variant === "outlined"
    ? {
        // Outlined variant always draws an outline even if explicit stroke is off.
        stroke: layer.fill,
        strokeWidth: 4,
      }
    : {};

  return (
    <Group
      ref={groupRef}
      id={layer.id}
      name="pe-layer pe-layer-shape"
      x={layer.transform.x}
      y={layer.transform.y}
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
    >
      {renderPrimitive(layer, fill, strokeProps)}
    </Group>
  );
}

function renderPrimitive(
  layer: ShapeLayer,
  fill: string,
  strokeProps: Record<string, unknown>
): JSX.Element {
  const { width, height, shapeId } = layer;

  // ── Built-in primitives ────────────────────────────────────
  if (isBuiltInShape(shapeId)) {
    switch (shapeId) {
      case "rect":
      case "rectangle":
      case "square":
        return <Rect width={width} height={height} fill={fill} {...strokeProps} />;

      case "ellipse":
      case "circle":
        return (
          <Ellipse
            x={width / 2}
            y={height / 2}
            radiusX={width / 2}
            radiusY={height / 2}
            fill={fill}
            {...strokeProps}
          />
        );

      case "line":
        return (
          <Line
            points={[0, height / 2, width, height / 2]}
            stroke={fill}
            strokeWidth={Math.max(2, height)}
            lineCap="round"
          />
        );

      case "triangle":
        return (
          <Line
            points={[width / 2, 0, width, height, 0, height]}
            fill={fill}
            closed
            {...strokeProps}
          />
        );

      case "star":
        return (
          <Star
            x={width / 2}
            y={height / 2}
            numPoints={5}
            innerRadius={Math.min(width, height) / 4}
            outerRadius={Math.min(width, height) / 2}
            fill={fill}
            {...strokeProps}
          />
        );
    }
  }

  // ── Catalogue entry (custom-svg branch) ─────────────────────
  const entry = findShape(shapeId);
  if (entry) {
    const [vbX, vbY, vbW, vbH] = parseViewBox(entry.viewBox);
    const sx = width / vbW;
    const sy = height / vbH;
    return (
      <Path
        data={entry.path}
        fill={fill}
        fillRule="evenodd"
        scaleX={sx}
        scaleY={sy}
        // Offset the path so its viewBox origin aligns with the layer's
        // (0, 0). Most catalogue entries use a "0 0 W H" viewBox so
        // these offsets are zero, but be defensive — a non-zero origin
        // would otherwise translate the rendered path.
        x={-vbX * sx}
        y={-vbY * sy}
        {...strokeProps}
      />
    );
  }

  // ── Unknown shape id — placeholder ──────────────────────────
  return (
    <>
      <Rect
        width={width}
        height={height}
        fill="transparent"
        stroke="#9CA3AF"
        strokeWidth={1.5}
        dash={[6, 4]}
      />
      <Text
        x={0}
        y={height / 2 - 8}
        width={width}
        align="center"
        text={`shape:${shapeId}`}
        fontSize={12}
        fill="#9CA3AF"
      />
    </>
  );
}

/** Parse "minX minY width height" into a 4-tuple. Whitespace is the
 *  delimiter; commas (rare in viewBox) are treated as whitespace. */
function parseViewBox(viewBox: string): [number, number, number, number] {
  const parts = viewBox.split(/[\s,]+/).map(Number);
  return [
    parts[0] || 0,
    parts[1] || 0,
    parts[2] || 100,
    parts[3] || 100,
  ];
}

function isAdditive(e: KonvaEventObject<MouseEvent | TouchEvent>): boolean {
  const evt = e.evt as MouseEvent | TouchEvent;
  if ("touches" in evt) return false;
  return evt.metaKey || evt.ctrlKey || evt.shiftKey;
}
