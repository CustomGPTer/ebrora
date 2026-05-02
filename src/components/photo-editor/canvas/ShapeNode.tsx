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

import { Ellipse, Line, Path, Rect, Star, Group, Text, Arrow } from "react-konva";
import type Konva from "konva";
import { useRef } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type { LineProps, ShapeLayer, Transform } from "@/lib/photo-editor/types";
import {
  findShape,
  isBuiltInShape,
} from "@/lib/photo-editor/shapes/catalogue";

interface ShapeNodeProps {
  layer: ShapeLayer;
  draggable: boolean;
  onSelect: (additive: boolean) => void;
  onDragMove?: (x: number, y: number, node: Konva.Node) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (next: Partial<Transform>) => void;
}

// ─── Line-shape detection (May 2026 — Width + Lines build) ─────
//
// A shape id starting with "line-" (catalogue category "lines") is
// rendered through the custom line branch — Konva.Line / Konva.Arrow
// with stroke.width as thickness and the layer's lineProps for arrow-
// heads / dash pattern. The legacy "line" primitive id keeps its old
// behaviour (thickness = bbox height) so existing projects don't break.

const LINE_PREFIX = "line-";

/** True when this shape should be rendered through the line branch.
 *  We branch on id prefix so existing catalogue lookup still works. */
function isLineShape(shapeId: string): boolean {
  return shapeId.startsWith(LINE_PREFIX);
}

/** Konva dash pattern in canvas pixels. Scaled to thickness so the
 *  pattern reads consistently as the line gets thicker. */
function dashFor(shapeId: string, thickness: number): number[] | undefined {
  const t = Math.max(1, thickness);
  if (shapeId === "line-dashed") return [t * 4, t * 2];
  if (shapeId === "line-dotted") return [t * 0.5, t * 1.5];
  return undefined;
}

const DEFAULT_LINE_PROPS: LineProps = {
  arrowStart: false,
  arrowEnd: false,
  arrowStyle: "triangle",
};

export function ShapeNode({
  layer,
  draggable,
  onSelect,
  onDragMove,
  onDragEnd,
  onTransformEnd,
}: ShapeNodeProps) {
  const groupRef = useRef<Konva.Group>(null);
  const fill = layer.variant === "filled" ? layer.fill : "transparent";
  const strokeProps =
    layer.stroke.width > 0 && layer.stroke.opacity > 0
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

  // ── Catalogue line-type shapes (May 2026) ──────────────────
  // Branch BEFORE built-in / catalogue lookup so the dash + arrow
  // logic always wins for these ids.
  if (isLineShape(shapeId)) {
    return renderLineShape(layer);
  }

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

// ─── Line rendering (May 2026 — Width + Lines build) ───────────
//
// Lines are drawn diagonally from the bbox top-left to bottom-right by
// default — this gives the user "free angle" via stretching the bbox
// horizontally + vertically. Thickness is governed by stroke.width
// (the new Width tab) with a 4-px fallback when width is 0 so the line
// is always visible.
//
// Curved line: rendered as a smooth bezier using Konva.Line tension.
// Freehand: a fixed wave path scaled to bbox (placeholder until full
// freehand authoring lands).
// Double line: two parallel strokes.
// Dashed / dotted: dash pattern derived from thickness.
//
// Arrowheads: rendered via a separate Konva.Arrow when the line's
// lineProps say so. The arrowhead size scales with the line's
// thickness so it always reads.

function renderLineShape(layer: ShapeLayer): JSX.Element {
  const { width, height, shapeId } = layer;
  const props: LineProps = layer.lineProps ?? DEFAULT_LINE_PROPS;
  const thickness =
    layer.stroke.width > 0 ? layer.stroke.width : 4;
  const colour =
    layer.stroke.opacity > 0 && layer.stroke.color
      ? layer.stroke.color
      : layer.fill;

  // Line goes from (0, height/2) → (width, height/2) for a horizontal
  // default. The user rotates / stretches the bbox to angle and length
  // it. Endpoints in layer-local coords:
  const x1 = 0;
  const y1 = height / 2;
  const x2 = width;
  const y2 = height / 2;

  // ── Curved line ─────────────────────────────────────────────
  if (shapeId === "line-curved") {
    return (
      <Line
        points={[
          0, height / 2,
          width * 0.25, height * 0.05,
          width * 0.5, height / 2,
          width * 0.75, height * 0.95,
          width, height / 2,
        ]}
        stroke={colour}
        strokeWidth={thickness}
        lineCap="round"
        lineJoin="round"
        bezier
      />
    );
  }

  // ── Freehand placeholder ────────────────────────────────────
  if (shapeId === "line-freehand") {
    // Sampled wave; matches the catalogue's static fallback path.
    const points: number[] = [];
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = t * width;
      const y = height / 2 + Math.sin(t * Math.PI * 4) * (height / 2 - 4);
      points.push(x, y);
    }
    return (
      <Line
        points={points}
        stroke={colour}
        strokeWidth={thickness}
        lineCap="round"
        lineJoin="round"
        tension={0.3}
      />
    );
  }

  // ── Double line ─────────────────────────────────────────────
  if (shapeId === "line-double") {
    const offset = Math.max(thickness * 1.5, 4);
    return (
      <>
        <Line
          points={[x1, y1 - offset, x2, y2 - offset]}
          stroke={colour}
          strokeWidth={thickness}
          lineCap="round"
        />
        <Line
          points={[x1, y1 + offset, x2, y2 + offset]}
          stroke={colour}
          strokeWidth={thickness}
          lineCap="round"
        />
      </>
    );
  }

  // ── Straight, dashed, dotted ────────────────────────────────
  const dash = dashFor(shapeId, thickness);

  // Arrowhead size scales with thickness so it always reads.
  const arrowLen = Math.max(thickness * 3, 12);
  const arrowWidth = Math.max(thickness * 2.5, 10);
  const arrowFilled = props.arrowStyle === "triangle";

  // When arrows are configured, render via Konva.Arrow — it draws the
  // line AND the arrowhead(s) consistently. Otherwise plain Line.
  const hasArrow = props.arrowEnd || props.arrowStart;
  if (hasArrow) {
    return (
      <Arrow
        points={[x1, y1, x2, y2]}
        stroke={colour}
        strokeWidth={thickness}
        fill={arrowFilled ? colour : "transparent"}
        pointerLength={arrowLen}
        pointerWidth={arrowWidth}
        pointerAtBeginning={props.arrowStart}
        pointerAtEnding={props.arrowEnd}
        lineCap="round"
        lineJoin="round"
        dash={dash}
      />
    );
  }

  return (
    <Line
      points={[x1, y1, x2, y2]}
      stroke={colour}
      strokeWidth={thickness}
      lineCap="round"
      dash={dash}
    />
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
