// src/lib/photo-editor/canvas/selection.ts
//
// Selection helpers. Pure logic — no React, no DOM, no Konva. Used by:
//   • EditorContext callers that toggle / replace selection
//   • The Layers panel for "is this row currently selected?"
//   • The SelectionFrame component when computing where the transformer
//     handles should live
//
// Selection is stored as Id[] on EditorState (multi-select supported).

import type { AnyLayer, Id, Project, Rect, TextLayer } from "../types";
import { layoutTextLayer } from "../rich-text/layout";

/** Whether `id` is currently in the selection array. */
export function isSelected(selection: Id[], id: Id): boolean {
  return selection.includes(id);
}

/** Toggle a single id in the selection.
 *
 *  • Without `additive`: tapping selects only that id; tapping again clears.
 *  • With `additive`: tapping adds to / removes from the existing selection.
 *    (Wired to Cmd/Ctrl-click in a future session.)
 */
export function toggleSelection(
  selection: Id[],
  id: Id,
  additive = false
): Id[] {
  const has = selection.includes(id);
  if (additive) {
    return has ? selection.filter((x) => x !== id) : [...selection, id];
  }
  if (has && selection.length === 1) return [];
  return [id];
}

/** Replace the selection with exactly one id. */
export function setSingleSelection(id: Id): Id[] {
  return [id];
}

/** Clear the selection. */
export function clearSelection(): Id[] {
  return [];
}

// ─── Bounding boxes ─────────────────────────────────────────────
//
// These return the layer's bounding box in canvas-local pixels with the
// layer's transform applied. Used for centred placement of new layers,
// "fit to selection" framing, and the layout-aware nudge / snap logic
// that lands later. The Konva Transformer handles its own visual bbox at
// runtime — these helpers exist for non-Konva code paths.

/** Bounding box of a single layer in canvas-local pixels (with transform). */
export function layerBoundingBox(layer: AnyLayer): Rect {
  const { width, height } = naturalSize(layer);
  const t = layer.transform;
  // Apply scale; rotation / skew make the AABB approximate, which is fine
  // for placement / framing.
  const w = width * t.scaleX;
  const h = height * t.scaleY;
  return { x: t.x, y: t.y, width: w, height: h };
}

/** Natural (untransformed) size of a layer. For text, this requires a
 *  layout pass; we run the engine's pure-logic layout (no canvas paint).
 *  Safe to call client-side; throws on the server only if measureRun is
 *  invoked, which layoutTextLayer triggers — keep these calls inside
 *  client components. */
export function naturalSize(layer: AnyLayer): { width: number; height: number } {
  switch (layer.kind) {
    case "text": {
      const layout = safeLayoutText(layer);
      return {
        width: Math.max(1, layout.width),
        height: Math.max(1, layout.height),
      };
    }
    case "image":
      // Crop wins over the source's natural pixel dimensions when set —
      // matches what ImageNode actually paints.
      return layer.crop
        ? { width: layer.crop.width, height: layer.crop.height }
        : { width: layer.naturalWidth, height: layer.naturalHeight };
    case "shape":
    case "sticker":
      return { width: layer.width, height: layer.height };
  }
}

function safeLayoutText(layer: TextLayer): { width: number; height: number } {
  try {
    const layout = layoutTextLayer(layer);
    return { width: layout.width, height: layout.height };
  } catch {
    // Server-side or unavailable canvas — fall back to layer.width and
    // a rough guess at height based on the first run's font size.
    const firstRun = layer.runs[0];
    const fallbackH = firstRun ? firstRun.fontSize * 1.2 : 96;
    return { width: layer.width, height: fallbackH };
  }
}

/** Union bounding box of all selected layers, or null if nothing selected. */
export function selectionBoundingBox(
  project: Project,
  selection: Id[]
): Rect | null {
  if (selection.length === 0) return null;
  const layers = project.layers.filter((l) => selection.includes(l.id));
  if (layers.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const layer of layers) {
    const bb = layerBoundingBox(layer);
    if (bb.x < minX) minX = bb.x;
    if (bb.y < minY) minY = bb.y;
    if (bb.x + bb.width > maxX) maxX = bb.x + bb.width;
    if (bb.y + bb.height > maxY) maxY = bb.y + bb.height;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Centre a layer's transform.x / transform.y so its bounding box sits at
 *  the centre of a (canvasWidth × canvasHeight) canvas. Mutates a copy. */
export function centreLayerOnCanvas<T extends AnyLayer>(
  layer: T,
  canvasWidth: number,
  canvasHeight: number
): T {
  const { width, height } = naturalSize(layer);
  return {
    ...layer,
    transform: {
      ...layer.transform,
      x: (canvasWidth - width) / 2,
      y: (canvasHeight - height) / 2,
    },
  };
}
