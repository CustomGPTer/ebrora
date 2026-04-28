// src/components/photo-editor/text-tools/ImageAdjustPanel.tsx
//
// Per-layer Adjust panel: brightness, contrast, saturation, exposure.
// Matches the Background's adjust block but operates on
// ImageLayer.adjust. Apr 2026.

"use client";

import { useMemo } from "react";
import { Sliders, RotateCcw } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import {
  ActionButton,
  Row,
  Section,
  SectionDivider,
  Slider,
} from "./controls";
import type { AnyLayer, ImageLayer } from "@/lib/photo-editor/types";

interface ImageAdjustPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ImageAdjustPanel({ open, onClose }: ImageAdjustPanelProps) {
  const { state, dispatch } = useEditor();

  const layer = useMemo<ImageLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "image") return null;
    return found as ImageLayer;
  }, [state.selection, state.project.layers]);

  const adjust =
    layer?.adjust ??
    ({ brightness: 0, contrast: 0, saturation: 0, exposure: 0 } as const);

  function patchAdjust(patch: Partial<ImageLayer["adjust"]>) {
    if (!layer) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { adjust: { ...adjust, ...patch } } as Partial<AnyLayer>,
    });
  }

  function reset() {
    if (!layer) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: {
        adjust: { brightness: 0, contrast: 0, saturation: 0, exposure: 0 },
      } as Partial<AnyLayer>,
    });
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      icon={<Sliders className="w-5 h-5" strokeWidth={1.75} />}
      title="Adjust"
      footer={<span>Applied to this image only.</span>}
    >
      <div className="flex-1 overflow-y-auto">
        {!layer ? (
          <div
            className="px-4 py-6 text-xs"
            style={{ color: "var(--pe-text-subtle)" }}
          >
            Select an image to access adjust controls.
          </div>
        ) : (
          <>
            <Section title="Light">
              <Row label="Brightness">
                <Slider
                  ariaLabel="Brightness"
                  value={adjust.brightness}
                  min={-100}
                  max={100}
                  step={1}
                  onChange={(v) => patchAdjust({ brightness: v })}
                  format={(n) => `${n > 0 ? "+" : ""}${Math.round(n)}`}
                />
              </Row>
              <Row label="Contrast">
                <Slider
                  ariaLabel="Contrast"
                  value={adjust.contrast}
                  min={-100}
                  max={100}
                  step={1}
                  onChange={(v) => patchAdjust({ contrast: v })}
                  format={(n) => `${n > 0 ? "+" : ""}${Math.round(n)}`}
                />
              </Row>
              <Row label="Exposure">
                <Slider
                  ariaLabel="Exposure"
                  value={adjust.exposure}
                  min={-100}
                  max={100}
                  step={1}
                  onChange={(v) => patchAdjust({ exposure: v })}
                  format={(n) => `${n > 0 ? "+" : ""}${Math.round(n)}`}
                />
              </Row>
            </Section>

            <SectionDivider />

            <Section title="Colour">
              <Row label="Saturation">
                <Slider
                  ariaLabel="Saturation"
                  value={adjust.saturation}
                  min={-100}
                  max={100}
                  step={1}
                  onChange={(v) => patchAdjust({ saturation: v })}
                  format={(n) => `${n > 0 ? "+" : ""}${Math.round(n)}`}
                />
              </Row>
            </Section>

            <SectionDivider />

            <Section title="Reset">
              <ActionButton
                ariaLabel="Reset adjustments"
                onClick={reset}
                fullWidth
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to defaults</span>
              </ActionButton>
            </Section>
          </>
        )}
      </div>
    </PanelDrawer>
  );
}
