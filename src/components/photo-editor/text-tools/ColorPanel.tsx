// src/components/photo-editor/text-tools/ColorPanel.tsx
//
// Color panel — solid-fill colour for the active layer.
//
// May 2026 — rewritten on top of the new shared ColorPicker. The
// old segmented control (Swatches / Picker / Pick) is gone; the
// new picker is one horizontal strip with everything on it.
//
// Two routing branches, decided per-render from the sole-selected
// layer's `kind`:
//
//   • Text layer  → patches `{ fill: "#RRGGBB" }` via patchRuns.
//   • Shape layer → patches `{ fill: "#RRGGBB" }` on the layer.
//
// Run-shape gotcha (text branch): the fill field on GlyphRun is
// `fill` — not `color`.

"use client";

import { useMemo } from "react";
import { Palette } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import { useTextTool } from "./use-text-tool";
import { Section } from "./controls";
import { ColorPicker } from "./ColorPicker";
import type { AnyLayer, ShapeLayer } from "@/lib/photo-editor/types";

interface ColorPanelProps {
  open?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

export function ColorPanel({
  open = false,
  onClose,
  inline = false,
}: ColorPanelProps) {
  const { state, dispatch } = useEditor();
  const tool = useTextTool();

  const selectedLayer = useMemo<AnyLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    return (
      state.project.layers.find((l) => l.id === state.selection[0]) ?? null
    );
  }, [state.selection, state.project.layers]);

  const isShape = selectedLayer?.kind === "shape";
  const isText = tool.layer !== null;

  const fillNorm: string | null = isShape
    ? (selectedLayer as ShapeLayer).fill
    : isText
    ? (tool.runValue("fill") as string | null)
    : null;

  function applyColor(hex: string) {
    if (isShape && selectedLayer) {
      dispatch({
        type: "UPDATE_LAYER",
        id: selectedLayer.id,
        patch: { fill: hex } as Partial<AnyLayer>,
      });
      return;
    }
    if (isText) {
      tool.patchRuns({ fill: hex });
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
        <Section title="Colour">
          <ColorPicker
            value={fillNorm}
            onChange={applyColor}
            ariaLabel="Fill colour"
          />
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
      icon={<Palette className="w-5 h-5" strokeWidth={1.75} />}
      title="Color"
      footer={footerNode}
    >
      {body}
    </PanelDrawer>
  );
}

function EmptyState({ kind }: { kind?: AnyLayer["kind"] }) {
  let msg = "Select a text or shape layer to apply colour.";
  if (kind === "image") {
    msg = "Use Adjust or Filters to recolour an image layer.";
  } else if (kind === "sticker") {
    msg = "Stickers don't support colour changes.";
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
