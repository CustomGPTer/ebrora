// src/components/photo-editor/text-tools/WidthPanel.tsx
//
// Width tab body — May 2026.
//
// New 5th tab in the shape edit dock (Color · Stroke · Position ·
// Opacity · WIDTH). Single 0–50 px slider that drives `layer.stroke
// .width` for the sole-selected ShapeLayer.
//
// Semantics by shape category:
//
//   • Filled shapes (pentagon, heart, hexagon, …) — Width is the
//     thickness of the outline drawn around the fill. Default 0
//     (no outline) so existing layers look identical until the
//     user moves the slider. The outline's *colour* comes from
//     the existing Stroke tab (which still owns colour / opacity).
//
//   • Line-type shapes (line-straight, line-dashed, line-dotted,
//     line-double, line-curved, line-freehand) — Width is the
//     thickness of the line ITSELF. ShapeNode's line branch reads
//     the same stroke.width field; non-zero stroke.width takes
//     precedence over the legacy 4-px fallback.
//
// Shared field (stroke.width) keeps the data model honest. The
// existing StrokePanel still works; both surfaces edit the same
// underlying value, so they stay in sync.
//
// Inline / drawer modes follow the same pattern as OpacityPanel.

"use client";

import { useMemo } from "react";
import { Minus } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import { Row, Section, Slider } from "./controls";
import type { AnyLayer, ShapeLayer } from "@/lib/photo-editor/types";

interface WidthPanelProps {
  /** Drawer open state — ignored when `inline` is set. */
  open?: boolean;
  /** Drawer close handler — ignored when `inline` is set. */
  onClose?: () => void;
  /** When true, render body without PanelDrawer chrome (used by the
   *  bottom tab strip in BottomDock). Defaults to false. */
  inline?: boolean;
}

const WIDTH_MIN = 0;
const WIDTH_MAX = 50;
const WIDTH_STEP = 0.5;

/** Lines render with a 4-px fallback when stroke.width is 0, so for
 *  display we report 4 (the visible thickness) rather than 0. The
 *  user's first slider drag still lands on a real value. */
function effectiveWidth(layer: ShapeLayer): number {
  if (layer.stroke.width > 0) return layer.stroke.width;
  if (layer.shapeId.startsWith("line-")) return 4;
  return 0;
}

export function WidthPanel({
  open = false,
  onClose,
  inline = false,
}: WidthPanelProps) {
  const { state, dispatch } = useEditor();

  const layer = useMemo<ShapeLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "shape") return null;
    return found as ShapeLayer;
  }, [state.selection, state.project.layers]);

  function setWidth(v: number) {
    if (!layer) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: {
        stroke: { ...layer.stroke, width: v },
      } as Partial<AnyLayer>,
    });
  }

  const isLine = layer?.shapeId.startsWith("line-") ?? false;
  const sectionTitle = isLine ? "Line thickness" : "Outline thickness";
  const helperText = isLine
    ? "Sets how thick the line itself is drawn."
    : "Adds an outline around the shape. 0 = no outline.";

  const body = (
    <div className="flex-1 overflow-y-auto">
      {!layer ? (
        <div
          className="px-4 py-6 text-xs"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          Select a shape to access width controls.
        </div>
      ) : (
        <Section title={sectionTitle}>
          <Row label="Value">
            <Slider
              ariaLabel="Width"
              value={effectiveWidth(layer)}
              min={WIDTH_MIN}
              max={WIDTH_MAX}
              step={WIDTH_STEP}
              onChange={setWidth}
              format={(n) => `${n.toFixed(1)} px`}
            />
          </Row>
          <Row>
            <span
              className="text-[11px]"
              style={{ color: "var(--pe-text-muted)" }}
            >
              {helperText}
            </span>
          </Row>
        </Section>
      )}
    </div>
  );

  if (inline) {
    return body;
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose ?? (() => {})}
      icon={<Minus className="w-5 h-5" strokeWidth={2.5} />}
      title="Width"
      footer={<span>Applied to the whole layer.</span>}
    >
      {body}
    </PanelDrawer>
  );
}
