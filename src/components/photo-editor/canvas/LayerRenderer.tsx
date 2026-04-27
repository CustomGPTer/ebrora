// src/components/photo-editor/canvas/LayerRenderer.tsx
//
// Renders every layer in the project, in z-order (layerOrder, bottom up),
// dispatching to the right per-kind node component. Wires each node into
// the editor's selection / drag / transform actions.
//
// One node per layer — even hidden / locked ones get rendered. Hidden
// layers pass `visible={false}` to Konva (which skips paint and hit-test)
// rather than being filtered out, so toggling visibility doesn't remount
// the underlying Konva node and lose its place in the selection.
//
// Batch 3 (Mobile text editing rebuild — April 2026):
//   • Tapping a text layer now ALSO calls useMobileEdit().beginEditing
//     so the BottomEditDrawer opens for that layer. The "double-tap to
//     edit, single-tap to select" behaviour from earlier sessions is
//     replaced by "single-tap = select + edit." This matches the
//     reference Add Text app and makes multi-text layers tap-switchable:
//     tapping any text layer opens the drawer pre-filled with that
//     layer's content, auto-committing whichever layer was previously
//     open (committed-by-being-already-live, since the drawer dispatches
//     UPDATE_LAYER on every keystroke).
//   • The `onDoubleClick` prop / wiring on RichTextNode is gone. The
//     legacy inline TextEditOverlay still mounts when state.runSelection
//     is set on a text layer, but no UI in the editor dispatches
//     SET_RUN_SELECTION any more — it stays as engine plumbing for any
//     future desktop power-mode (per-letter selection-range styling).

"use client";

import { Fragment } from "react";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import { useSmartGuides } from "./SmartGuidesContext";
import { RichTextNode } from "./RichTextNode";
import { ImageNode } from "./ImageNode";
import { ShapeNode } from "./ShapeNode";
import { StickerNode } from "./StickerNode";
import { TextEditOverlay } from "./TextEditOverlay";
import { computeSnap, type Box } from "@/lib/photo-editor/canvas/snap";
import type {
  AnyLayer,
  Id,
  Transform,
} from "@/lib/photo-editor/types";
import type Konva from "konva";

export function LayerRenderer() {
  const { state, dispatch, stageRef } = useEditor();
  const { beginEditing } = useMobileEdit();
  const { setGuides, clearGuides } = useSmartGuides();
  const { project } = state;

  const orderedLayers = orderLayers(project.layers, project.layerOrder);

  /** Resolve a layer's current bbox in canvas-pixel coords. */
  function getBboxOnStage(id: Id): Box | null {
    const stage = stageRef.current;
    if (!stage) return null;
    const node = stage.findOne(`#${id}`);
    if (!node) return null;
    const r = node.getClientRect({ relativeTo: stage });
    if (!Number.isFinite(r.x) || !Number.isFinite(r.y)) return null;
    if (r.width <= 0 || r.height <= 0) return null;
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }

  return (
    <>
      {orderedLayers.map((layer) => {
        const draggable = !layer.locked;
        const isEditingThisText =
          layer.kind === "text" &&
          state.runSelection !== null &&
          state.runSelection.layerId === layer.id;

        const onSelect = (additive: boolean) => {
          if (additive && state.selection.includes(layer.id)) {
            dispatch({
              type: "SET_SELECTION",
              ids: state.selection.filter((id) => id !== layer.id),
            });
          } else if (additive) {
            dispatch({
              type: "SET_SELECTION",
              ids: [...state.selection, layer.id],
            });
          } else {
            dispatch({ type: "SET_SELECTION", ids: [layer.id] });
          }

          // Text layers: tap also opens the BottomEditDrawer for this
          // layer. We only do this for non-additive taps because Cmd/
          // Ctrl-click on desktop is meant for multi-select, not edit.
          if (!additive && layer.kind === "text") {
            beginEditing(layer.id);
          }
        };

        const onDragMove = (x: number, y: number, node: Konva.Node) => {
          // Build the dragged box from the Konva node's bbox in canvas
          // coords (snap.ts works in canvas pixels).
          const stage = stageRef.current;
          if (!stage) return;
          const draggedRect = node.getClientRect({ relativeTo: stage });
          if (!Number.isFinite(draggedRect.x)) return;
          const draggedBox: Box = {
            x: draggedRect.x,
            y: draggedRect.y,
            width: draggedRect.width,
            height: draggedRect.height,
          };
          const otherBoxes: Box[] = [];
          for (const other of project.layers) {
            if (other.id === layer.id) continue;
            if (!other.visible) continue;
            const box = getBboxOnStage(other.id);
            if (box) otherBoxes.push(box);
          }
          const result = computeSnap({
            draggedBox,
            otherBoxes,
            canvasWidth: project.width,
            canvasHeight: project.height,
          });
          // Apply snap delta to the Konva node directly so subsequent
          // dragmove ticks build on the snapped position.
          const dx = result.x - draggedBox.x;
          const dy = result.y - draggedBox.y;
          if (dx !== 0 || dy !== 0) {
            node.x(x + dx);
            node.y(y + dy);
          }
          setGuides(result.verticalGuides, result.horizontalGuides);
        };

        const onDragEnd = (x: number, y: number) => {
          clearGuides();
          dispatch({
            type: "UPDATE_LAYER",
            id: layer.id,
            patch: {
              transform: { ...layer.transform, x, y },
            } as Partial<AnyLayer>,
          });
        };

        const onTransformEnd = (next: Partial<Transform>) => {
          dispatch({
            type: "UPDATE_LAYER",
            id: layer.id,
            patch: {
              transform: { ...layer.transform, ...next },
            } as Partial<AnyLayer>,
          });
        };

        switch (layer.kind) {
          case "text":
            return (
              <Fragment key={layer.id}>
                <RichTextNode
                  layer={layer}
                  draggable={draggable}
                  editing={isEditingThisText}
                  onSelect={onSelect}
                  onDragMove={onDragMove}
                  onDragEnd={onDragEnd}
                  onTransformEnd={onTransformEnd}
                />
                {isEditingThisText ? (
                  <TextEditOverlay layer={layer} />
                ) : null}
              </Fragment>
            );

          case "image":
            return (
              <ImageNode
                key={layer.id}
                layer={layer}
                draggable={draggable}
                onSelect={onSelect}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
                onTransformEnd={onTransformEnd}
              />
            );

          case "shape":
            return (
              <ShapeNode
                key={layer.id}
                layer={layer}
                draggable={draggable}
                onSelect={onSelect}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
                onTransformEnd={onTransformEnd}
              />
            );

          case "sticker":
            return (
              <StickerNode
                key={layer.id}
                layer={layer}
                draggable={draggable}
                onSelect={onSelect}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
                onTransformEnd={onTransformEnd}
              />
            );
        }
      })}
    </>
  );
}

/** Returns layers sorted bottom-to-top by `layerOrder`. Layers missing
 *  from the order list (shouldn't happen in practice; defensive) are
 *  appended at the top so they remain visible / debuggable. */
function orderLayers(layers: AnyLayer[], order: Id[]): AnyLayer[] {
  const byId = new Map<Id, AnyLayer>();
  for (const l of layers) byId.set(l.id, l);

  const out: AnyLayer[] = [];
  const seen = new Set<Id>();

  for (const id of order) {
    const layer = byId.get(id);
    if (layer) {
      out.push(layer);
      seen.add(id);
    }
  }

  // Defensive — any layer not in `order` lands on top.
  for (const layer of layers) {
    if (!seen.has(layer.id)) out.push(layer);
  }

  return out;
}
