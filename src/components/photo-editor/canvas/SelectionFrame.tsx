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
// Hide rules — a layer in the selection list is skipped (no handles
// drawn) when:
//   1. The layer is locked or hidden.
//   2. The layer is the active inline-edit target (state.runSelection
//      is set on it). Legacy desktop power-mode — the Transformer would
//      visually clash with TextEditOverlay's caret + selection rects.
//   3. NEW — Batch 3: the layer is the active mobile-drawer target
//      (useMobileEdit().state.editingLayerId matches it). The user is
//      typing in the bottom drawer; showing scale / rotate handles at
//      the same time is visual noise. Handles re-appear the instant
//      the drawer commits (or cancels).
//
// One subtle point about rule 3: the Konva Transformer needs to be
// re-resolved when the editing-drawer state changes, otherwise the
// handles linger from before the drawer opened. We add
// useMobileEdit().state.editingLayerId to the effect dep list so the
// Transformer re-attaches when it flips.

"use client";

import { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";

const ACCENT = "#FFFFFF";

export function SelectionFrame() {
  const { state } = useEditor();
  const { state: mobileEdit } = useMobileEdit();
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

    // The id (if any) of the text layer currently in inline-edit mode
    // (legacy desktop power-mode).
    const editingTextLayerId =
      state.runSelection !== null ? state.runSelection.layerId : null;

    // The id (if any) of the text layer currently open in the mobile
    // BottomEditDrawer.
    const drawerLayerId = mobileEdit.editingLayerId;

    const nodes: Konva.Node[] = [];
    for (const id of state.selection) {
      if (lockedIds.has(id)) continue;
      if (!visibleIds.has(id)) continue;
      if (id === editingTextLayerId) continue;
      if (id === drawerLayerId) continue;
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
    mobileEdit.editingLayerId,
  ]);

  return (
    <Transformer
      ref={transformerRef}
      shouldOverdrawWholeArea
      // ── Phase 1: corner-icon overlay owns transform handles ──
      // The visible chrome is reduced to a dashed border. Resize and
      // rotate are driven by the DOM CornerIcons overlay
      // (SelectionTools.tsx), which dispatches transform updates
      // directly. We keep the Transformer mounted because its bbox
      // visibility logic is already managed cleanly through it; the
      // anchors are simply hidden.
      resizeEnabled={false}
      rotateEnabled={false}
      enabledAnchors={[]}
      anchorSize={0}
      anchorStroke="rgba(0,0,0,0)"
      anchorFill="rgba(0,0,0,0)"
      anchorStrokeWidth={0}
      borderStroke={ACCENT}
      borderStrokeWidth={1.5}
      borderDash={[4, 3]}
      boundBoxFunc={(oldBox, newBox) => {
        if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
          return oldBox;
        }
        return newBox;
      }}
    />
  );
}
