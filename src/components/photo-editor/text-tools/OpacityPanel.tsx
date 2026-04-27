// src/components/photo-editor/text-tools/OpacityPanel.tsx
//
// Generic opacity panel. Works for any single-selected layer kind.
// Phase 1 — Apr 2026.

"use client";

import { useMemo } from "react";
import { Droplet } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import { Row, Section, Slider } from "./controls";
import type { AnyLayer } from "@/lib/photo-editor/types";

interface OpacityPanelProps {
  open: boolean;
  onClose: () => void;
}

export function OpacityPanel({ open, onClose }: OpacityPanelProps) {
  const { state, dispatch } = useEditor();

  const layer = useMemo<AnyLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    return state.project.layers.find((l) => l.id === id) ?? null;
  }, [state.selection, state.project.layers]);

  function setOpacity(v: number) {
    if (!layer) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { opacity: v } as Partial<AnyLayer>,
    });
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      icon={<Droplet className="w-5 h-5" strokeWidth={1.75} />}
      title="Opacity"
      footer={<span>Applied to the whole layer.</span>}
    >
      <div className="flex-1 overflow-y-auto">
        {!layer ? (
          <div
            className="px-4 py-6 text-xs"
            style={{ color: "var(--pe-text-subtle)" }}
          >
            Select a layer to access opacity controls.
          </div>
        ) : (
          <Section title="Layer opacity">
            <Row label="Value">
              <Slider
                ariaLabel="Layer opacity"
                value={layer.opacity}
                min={0}
                max={1}
                step={0.01}
                onChange={setOpacity}
                format={(n) => `${Math.round(n * 100)}%`}
              />
            </Row>
          </Section>
        )}
      </div>
    </PanelDrawer>
  );
}
