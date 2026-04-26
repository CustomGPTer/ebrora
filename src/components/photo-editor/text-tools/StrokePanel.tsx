// src/components/photo-editor/text-tools/StrokePanel.tsx
//
// Stroke (text outline) panel. Top-level toggle controls whether the
// stroke is rendered; the colour, width, and opacity rows are dimmed
// when off.
//
// Run-level field shape (gotcha #20): GlyphRun.stroke is the full Stroke
// object. applyStylePatch does a shallow merge, so when patching a
// single field we MUST construct the full Stroke object from the
// current value and override the field. runValue("stroke") returns null
// when the range mixes strokes; in that case we fall back to a sensible
// default ("disabled" black stroke) so the panel still functions.

"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useTextTool } from "./use-text-tool";
import {
  DimmedWhen,
  MixedHint,
  Row,
  Section,
  SectionDivider,
  Slider,
  Toggle,
} from "./controls";
import { ColorSwatches } from "./ColorSwatches";
import { HsvPicker } from "./HsvPicker";
import type { Stroke } from "@/lib/photo-editor/types";

interface StrokePanelProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_STROKE: Stroke = {
  enabled: false,
  color: "#000000",
  width: 2,
  opacity: 1,
};

export function StrokePanel({ open, onClose }: StrokePanelProps) {
  const tool = useTextTool();
  const [showHsv, setShowHsv] = useState(false);

  const current = tool.runValue("stroke");
  const mixed = current === null;
  const stroke: Stroke = current ?? DEFAULT_STROKE;

  function patchStroke(next: Partial<Stroke>) {
    tool.patchRuns({ stroke: { ...stroke, ...next } });
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      icon={<Pencil className="w-5 h-5" strokeWidth={1.75} />}
      title="Stroke"
      footer={
        tool.hasRange ? (
          <span>Applied to selected text.</span>
        ) : (
          <span>Applied to the whole layer.</span>
        )
      }
    >
      <div className="flex-1 overflow-y-auto">
        {!tool.layer ? (
          <EmptyState />
        ) : (
          <>
            <Section
              title="Stroke"
              right={mixed ? <MixedHint /> : null}
            >
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
            </DimmedWhen>
          </>
        )}
      </div>
    </PanelDrawer>
  );
}

function EmptyState() {
  return (
    <div
      className="px-4 py-6 text-xs"
      style={{ color: "var(--pe-text-subtle)" }}
    >
      Select a text layer to apply a stroke.
    </div>
  );
}
