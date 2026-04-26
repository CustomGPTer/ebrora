// src/components/photo-editor/canvas/SelectionFrame.tsx
//
// Konva.Transformer wired to EditorContext.selection. Reads the array of
// selected layer ids, finds their corresponding Konva nodes via the
// stage's node-id index (each per-kind node sets its `id` to the layer
// id), and tells the Transformer which nodes to attach handles to.
//
// Visual style: rounded square anchors, accent stroke, drag handles on
// all four corners + four sides + a top-of-bbox rotation handle. Locked
// layers in the selection are skipped (no handles for them).
//
// Session 5 / Batch B addition:
//   • A text layer in inline-edit mode (state.runSelection set on it)
//     is skipped here — the Transformer would visually clash with
//     TextEditOverlay's caret + selection rectangles, and the user is
//     manipulating text content, not layer geometry. Tapping outside
//     the layer (or pressing Escape) exits edit mode and re-enables the
//     Transformer on the next render.

"use client";

import { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import { useEditor } from "../context/EditorContext";

const ANCHOR_FILL = "#FFFFFF";
const ACCENT = "#1B5B50";

export function SelectionFrame() {
  const { state } = useEditor();
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const stage = transformer.getStage();
    if (!stage) {
      transformer.nodes([]);
      return;
    }

    const project = state.project;
    const lockedIds = new Set(
      project.layers.filter((l) => l.locked).map((l) => l.id),
    );
    const visibleIds = new Set(
      project.layers.filter((l) => l.visible).map((l) => l.id),
    );

    // The id (if any) of the text layer currently in inline-edit mode.
    // SelectionFrame skips this id so the Transformer doesn't visually
    // overlap TextEditOverlay's caret + selection rectangles.
    const editingTextLayerId =
      state.runSelection !== null ? state.runSelection.layerId : null;

    const nodes: Konva.Node[] = [];
    for (const id of state.selection) {
      if (lockedIds.has(id)) continue;
      if (!visibleIds.has(id)) continue;
      if (id === editingTextLayerId) continue;
      const node = stage.findOne(`#${id}`);
      if (node) nodes.push(node);
    }

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
    // We depend on layer references too because `findOne` resolves
    // against the live Konva tree — when layers are added / removed /
    // reordered, the stage's node index changes and we need to re-query.
  }, [
    state.selection,
    state.project.layers,
    state.project.layerOrder,
    state.runSelection,
  ]);

  return (
    <Transformer
      ref={transformerRef}
      // Hide the transformer entirely when nothing usable is selected. The
      // useEffect already calls .nodes([]) in that case; this prop just
      // keeps the visual chrome out of the way.
      shouldOverdrawWholeArea
      anchorSize={10}
      anchorCornerRadius={5}
      anchorStroke={ACCENT}
      anchorFill={ANCHOR_FILL}
      anchorStrokeWidth={1.5}
      borderStroke={ACCENT}
      borderStrokeWidth={1.5}
      borderDash={[4, 3]}
      rotateEnabled
      rotationSnaps={[0, 90, 180, 270]}
      rotationSnapTolerance={5}
      enabledAnchors={[
        "top-left",
        "top-center",
        "top-right",
        "middle-left",
        "middle-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ]}
      // Don't shrink to nothing on drag — clamp the visual minimum.
      boundBoxFunc={(oldBox, newBox) => {
        if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
          return oldBox;
        }
        return newBox;
      }}
    />
  );
}
