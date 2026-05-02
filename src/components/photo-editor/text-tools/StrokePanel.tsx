// src/components/photo-editor/text-tools/StrokePanel.tsx
//
// Stroke panel — outline for the active layer.
//
// Two routing branches, decided per-render from the sole-selected
// layer's `kind`:
//
//   • Text layer  → patches `{ stroke: { ... } }` via patchRuns
//                   (selected range or whole layer). GlyphRun.stroke
//                   is the full Stroke object — applyStylePatch does
//                   a shallow merge, so when patching a single field
//                   we MUST construct the full Stroke object from the
//                   current value and override the field. runValue
//                   ("stroke") returns null when the range mixes
//                   strokes; in that case we fall back to a sensible
//                   default ("disabled" black stroke) so the panel
//                   still functions.
//   • Shape layer → patches `layer.stroke` directly via UPDATE_LAYER.
//                   ShapeNode reads layer.stroke and renders the
//                   outline whenever stroke.width > 0. Note: when the
//                   shape's variant is "outlined" and stroke.width is
//                   0, ShapeNode still draws an implicit outline using
//                   layer.fill. So setting a non-zero stroke width
//                   here effectively overrides that implicit outline
//                   with explicit colour / width / opacity.
//   • Anything else (image / sticker / nothing selected) → empty
//                   state with a kind-appropriate hint. Note the
//                   image layer has its own dedicated stroke panel
//                   (ImageStrokePanel) routed from the Image dock.

"use client";

import { useMemo } from "react";
import { Pencil } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import { useTextTool } from "./use-text-tool";
import {
  MixedHint,
  Row,
  Section,
  SectionDivider,
  Slider,
} from "./controls";
import { ColorPicker } from "./ColorPicker";
import type { AnyLayer, ShapeLayer, Stroke } from "@/lib/photo-editor/types";

interface StrokePanelProps {
  /** Drawer open state — ignored when `inline` is set. */
  open?: boolean;
  /** Drawer close handler — ignored when `inline` is set. */
  onClose?: () => void;
  /** When true, render body without PanelDrawer chrome (used by the
   *  bottom tab strip in BottomDock). Defaults to false. */
  inline?: boolean;
}

const DEFAULT_STROKE: Stroke = {
  color: "#000000",
  width: 0,
  opacity: 1,
};

export function StrokePanel({
  open = false,
  onClose,
  inline = false,
}: StrokePanelProps) {
  const { state, dispatch } = useEditor();
  const tool = useTextTool();

  // Resolve the sole-selected layer (any kind) for the shape branch.
  const selectedLayer = useMemo<AnyLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    return (
      state.project.layers.find((l) => l.id === state.selection[0]) ?? null
    );
  }, [state.selection, state.project.layers]);

  const isShape = selectedLayer?.kind === "shape";
  const isText = tool.layer !== null;

  // Read current stroke value:
  //   • Shape: layer.stroke (always present — never "mixed").
  //   • Text:  runValue("stroke") returns null when the range mixes
  //            strokes, otherwise the Stroke object.
  const textStroke = isText ? (tool.runValue("stroke") as Stroke | null) : null;
  const shapeStroke = isShape ? (selectedLayer as ShapeLayer).stroke : null;
  const mixed = isText && textStroke === null;
  const stroke: Stroke = shapeStroke ?? textStroke ?? DEFAULT_STROKE;

  function patchStroke(next: Partial<Stroke>) {
    if (isShape && selectedLayer) {
      dispatch({
        type: "UPDATE_LAYER",
        id: selectedLayer.id,
        patch: { stroke: { ...stroke, ...next } } as Partial<AnyLayer>,
      });
      return;
    }
    if (isText) {
      tool.patchRuns({ stroke: { ...stroke, ...next } });
    }
  }

  const hasEditableLayer = isShape || isText;

  const footerNode = isText && tool.hasRange ? (
    <span>Applied to selected text.</span>
  ) : (
    <span>Applied to the whole layer.</span>
  );

  const body = (
    <div className="flex-1 overflow-y-auto">
      {!hasEditableLayer ? (
        <EmptyState kind={selectedLayer?.kind} />
      ) : (
        <>
          <Section
            title="Stroke"
            right={mixed ? <MixedHint /> : null}
          >
            <Row label="Width">
              <Slider
                ariaLabel="Stroke width"
                value={stroke.width}
                min={0}
                max={20}
                step={0.5}
                onChange={(v) => patchStroke({ width: v })}
                format={(n) => `${n.toFixed(1)} px`}
              />
            </Row>
            <Row label="Opacity">
              <Slider
                ariaLabel="Stroke opacity"
                value={stroke.opacity}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => patchStroke({ opacity: v })}
                format={(n) => `${Math.round(n * 100)}%`}
              />
            </Row>
          </Section>

          <SectionDivider />

          <Section title="Colour">
            <ColorPicker
              // For shape strokes, stroke.color may be null
              // ("inherit from fill"). Show the effective colour
              // in the picker so the ring lands on a meaningful
              // swatch — when the user picks a swatch, that flips
              // null to a concrete hex via patchStroke and the
              // stroke gains its own life from then on.
              value={
                stroke.color ??
                (isShape
                  ? (selectedLayer as ShapeLayer).fill
                  : "#000000")
              }
              onChange={(c) => patchStroke({ color: c })}
              ariaLabel="Stroke colour"
            />
          </Section>
        </>
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
      icon={<Pencil className="w-5 h-5" strokeWidth={1.75} />}
      title="Stroke"
      footer={footerNode}
    >
      {body}
    </PanelDrawer>
  );
}

function EmptyState({ kind }: { kind?: AnyLayer["kind"] }) {
  let msg = "Select a text or shape layer to apply a stroke.";
  if (kind === "image") {
    msg = "Use the Image Stroke panel to outline an image layer.";
  } else if (kind === "sticker") {
    msg = "Stickers don't support strokes.";
  }
  return (
    <div
      className="px-4 py-6 text-xs"
      style={{ color: "var(--pe-text-subtle)" }}
    >
      {msg}
    </div>
  );
}
