// src/components/photo-editor/text-tools/ImageStrokePanel.tsx
//
// Stroke panel for image layers. Mirrors the text StrokePanel UX (toggle
// + colour swatches + width slider + opacity slider) but operates on the
// ImageLayer.stroke field directly. Phase 1 — Apr 2026.
//
// "image-stroke" panel id is distinct from text "stroke" so the BottomDock
// can route to whichever panel matches the selected layer kind without
// either panel having to gate its own UI on layer kind.
//
// Batch E2 (Apr 2026): added `inline?` prop following the same pattern
// as the text-side panels (StrokePanel / ColorPanel / etc.). When the
// prop is set the panel returns its body directly for mounting inside
// the BottomDock's PropertyPanelHost; the legacy PanelDrawer wrapper
// is only used when called via the EditorShell drawer mount (which
// will be removed in a future cleanup batch).

"use client";

import { useMemo } from "react";
import { Pencil } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import {
  Row,
  Section,
  SectionDivider,
  Slider,
} from "./controls";
import { ColorPicker } from "./ColorPicker";
import type { AnyLayer, ImageLayer, Stroke } from "@/lib/photo-editor/types";

interface ImageStrokePanelProps {
  /** Drawer open state — ignored when `inline` is set. */
  open?: boolean;
  /** Drawer close handler — ignored when `inline` is set. */
  onClose?: () => void;
  /** When true, the panel renders its body without the PanelDrawer
   *  chrome — for mounting inside BottomDock's PropertyPanelHost. */
  inline?: boolean;
}

const DEFAULT_STROKE: Stroke = {
  color: "#000000",
  width: 0,
  opacity: 1,
};

export function ImageStrokePanel({
  open = false,
  onClose,
  inline = false,
}: ImageStrokePanelProps) {
  const { state, dispatch } = useEditor();
  // showHsv state removed (May 2026) — ColorPicker handles its own modal.

  const layer = useMemo<ImageLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "image") return null;
    return found as ImageLayer;
  }, [state.selection, state.project.layers]);

  const stroke = layer?.stroke ?? DEFAULT_STROKE;

  function patchStroke(patch: Partial<Stroke>) {
    if (!layer) return;
    const next: Stroke = { ...stroke, ...patch };
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { stroke: next } as Partial<AnyLayer>,
    });
  }

  const body = (
    <div className="flex-1 overflow-y-auto">
      {!layer ? (
        <EmptyState />
      ) : (
        <>
          <Section title="Stroke">
            <Row label="Width">
              <Slider
                ariaLabel="Stroke width"
                value={stroke.width}
                min={0}
                max={40}
                step={1}
                onChange={(v) => patchStroke({ width: v })}
                format={(n) => `${n.toFixed(0)} px`}
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
              // Image strokes always carry a concrete colour from
              // their factory, but the Stroke type now permits null
              // (shape-stroke semantics). Defensive fallback for
              // type safety and to avoid a hidden ring on the
              // picker if a null ever leaks in.
              value={stroke.color ?? "#000000"}
              onChange={(c) => patchStroke({ color: c })}
              ariaLabel="Image stroke colour"
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
      footer={<span>Outline drawn around the image.</span>}
    >
      {body}
    </PanelDrawer>
  );
}

function EmptyState() {
  return (
    <div
      className="px-4 py-6 text-xs"
      style={{ color: "var(--pe-text-subtle)" }}
    >
      Select an image to access stroke controls.
    </div>
  );
}
