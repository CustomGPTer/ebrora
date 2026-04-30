// src/components/photo-editor/text-tools/ImageBlurPanel.tsx
//
// Per-layer Blur panel. Apr 2026. Note: heavy on Konva render perf if
// applied to many large image layers simultaneously — see CHANGES.md.

"use client";

import { useMemo } from "react";
import { Droplets } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import { Row, Section, Slider } from "./controls";
import type { AnyLayer, ImageLayer } from "@/lib/photo-editor/types";

interface ImageBlurPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ImageBlurPanel({ open, onClose }: ImageBlurPanelProps) {
  const { state, dispatch } = useEditor();

  const layer = useMemo<ImageLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "image") return null;
    return found as ImageLayer;
  }, [state.selection, state.project.layers]);

  const blur = layer?.blur ?? ({ radius: 0, kind: "gaussian" } as const);

  function patchBlur(patch: Partial<ImageLayer["blur"]>) {
    if (!layer) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { blur: { ...blur, ...patch } } as Partial<AnyLayer>,
    });
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      icon={<Droplets className="w-5 h-5" strokeWidth={1.75} />}
      title="Blur"
      footer={<span>Gaussian blur on this image.</span>}
    >
      <div className="flex-1 overflow-y-auto">
        {!layer ? (
          <div
            className="px-4 py-6 text-xs"
            style={{ color: "var(--pe-text-subtle)" }}
          >
            Select an image to access blur controls.
          </div>
        ) : (
          <Section title="Blur">
            <Row label="Radius">
              <Slider
                ariaLabel="Blur radius"
                value={blur.radius}
                min={0}
                max={50}
                step={1}
                onChange={(v) => patchBlur({ radius: v })}
                format={(n) => `${Math.round(n)} px`}
              />
            </Row>
          </Section>
        )}
      </div>
    </PanelDrawer>
  );
}
