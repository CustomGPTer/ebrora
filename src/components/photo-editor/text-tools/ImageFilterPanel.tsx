// src/components/photo-editor/text-tools/ImageFilterPanel.tsx
//
// Per-layer Filter (effect preset) panel. Mono / Sepia / Invert /
// Original. Apr 2026.

"use client";

import { useMemo } from "react";
import { Wand2 } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import { Section } from "./controls";
import { FILTER_EFFECT_PRESETS } from "@/lib/photo-editor/canvas/image-filters";
import type { AnyLayer, ImageLayer } from "@/lib/photo-editor/types";

interface ImageFilterPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ImageFilterPanel({ open, onClose }: ImageFilterPanelProps) {
  const { state, dispatch } = useEditor();

  const layer = useMemo<ImageLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "image") return null;
    return found as ImageLayer;
  }, [state.selection, state.project.layers]);

  function setEffect(id: string | null) {
    if (!layer) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { filterEffect: id } as Partial<AnyLayer>,
    });
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      icon={<Wand2 className="w-5 h-5" strokeWidth={1.75} />}
      title="Filters"
      footer={<span>Preset effects on this image.</span>}
    >
      <div className="flex-1 overflow-y-auto">
        {!layer ? (
          <div
            className="px-4 py-6 text-xs"
            style={{ color: "var(--pe-text-subtle)" }}
          >
            Select an image to access filter presets.
          </div>
        ) : (
          <Section title="Presets">
            <div className="grid grid-cols-2 gap-2">
              {FILTER_EFFECT_PRESETS.map((p) => {
                const active = (layer.filterEffect ?? null) === p.id;
                return (
                  <button
                    key={p.id ?? "original"}
                    type="button"
                    onClick={() => setEffect(p.id)}
                    className="rounded-lg px-3 py-2 text-sm transition"
                    style={{
                      background: active
                        ? "var(--pe-accent)"
                        : "var(--pe-surface-soft)",
                      color: active ? "#FFFFFF" : "var(--pe-text)",
                      border: active
                        ? "1px solid var(--pe-accent)"
                        : "1px solid var(--pe-border)",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </PanelDrawer>
  );
}
