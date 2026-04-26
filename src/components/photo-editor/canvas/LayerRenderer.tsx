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
// Session 5 / Batch B addition:
//   • For text layers in inline-edit mode (state.runSelection set on
//     them), render TextEditOverlay alongside the RichTextNode, AFTER it
//     in the JSX so it sits above in z-order. The overlay handles caret
//     + selection rendering and intercepts pointer events.
//   • Double-tap on a text layer dispatches SET_SELECTION + SET_RUN_
//     SELECTION at the tapped offset, putting the layer into edit mode.

"use client";

import { Fragment } from "react";
import { useEditor } from "../context/EditorContext";
import { RichTextNode } from "./RichTextNode";
import { ImageNode } from "./ImageNode";
import { ShapeNode } from "./ShapeNode";
import { StickerNode } from "./StickerNode";
import { TextEditOverlay } from "./TextEditOverlay";
import type {
  AnyLayer,
  Id,
  Transform,
} from "@/lib/photo-editor/types";

export function LayerRenderer() {
  const { state, dispatch } = useEditor();
  const { project } = state;

  const orderedLayers = orderLayers(project.layers, project.layerOrder);

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
        };

        const onDragEnd = (x: number, y: number) => {
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
          case "text": {
            // Double-tap → enter edit mode at the tapped caret offset.
            // SET_SELECTION first ensures the layer is the sole
            // selection (also clears any previous runSelection on a
            // different layer); SET_RUN_SELECTION puts the caret in.
            const onDoubleClick = (caretOffset: number) => {
              dispatch({ type: "SET_SELECTION", ids: [layer.id] });
              dispatch({
                type: "SET_RUN_SELECTION",
                layerId: layer.id,
                start: caretOffset,
                end: caretOffset,
              });
            };

            return (
              <Fragment key={layer.id}>
                <RichTextNode
                  layer={layer}
                  draggable={draggable}
                  editing={isEditingThisText}
                  onSelect={onSelect}
                  onDoubleClick={onDoubleClick}
                  onDragEnd={onDragEnd}
                  onTransformEnd={onTransformEnd}
                />
                {isEditingThisText ? (
                  <TextEditOverlay layer={layer} />
                ) : null}
              </Fragment>
            );
          }

          case "image":
            return (
              <ImageNode
                key={layer.id}
                layer={layer}
                draggable={draggable}
                onSelect={onSelect}
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
