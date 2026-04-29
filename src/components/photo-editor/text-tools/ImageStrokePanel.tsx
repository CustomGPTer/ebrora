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

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import {
  DimmedWhen,
  Row,
  Section,
  SectionDivider,
  Slider,
  Toggle,
} from "./controls";
import { ColorSwatches } from "./ColorSwatches";
import { HsvPicker } from "./HsvPicker";
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
  enabled: false,
  color: "#000000",
  width: 4,
  opacity: 1,
};

export function ImageStrokePanel({
  open = false,
  onClose,
  inline = false,
}: ImageStrokePanelProps) {
  const { state, dispatch } = useEditor();
  const [showHsv, setShowHsv] = useState(false);

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
            <Toggle
              checked={stroke.enabled}
              onChange={(next) => patchStroke({ enabled: next })}
              label="Enable stroke"
            />
          </Section>

          <SectionDivider />

          <DimmedWhen disabled={!stroke.enabled}>
            <Section title="Colour">
              <ColorSwatches
                value={stroke.color}
                onPick={(c) => patchStroke({ color: c })}
              />
              <Row>
                <button
                  type="button"
                  onClick={() => setShowHsv((s) => !s)}
                  className="text-xs underline self-start"
                  style={{ color: "var(--pe-text-muted)" }}
                >
                  {showHsv ? "Hide custom picker" : "Custom colour…"}
                </button>
              </Row>
              {showHsv ? (
                <HsvPicker
                  value={stroke.color}
                  onChange={(c) => patchStroke({ color: c })}
                />
              ) : null}
            </Section>

            <SectionDivider />

            <Section title="Geometry">
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
          </DimmedWhen>
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
