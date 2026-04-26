// src/components/photo-editor/canvas/SelectionTools.tsx
//
// Per-selection contextual toolbar — DOM overlay above the canvas that
// floats over the currently-selected layer with quick-action icons.
//
// Why a horizontal toolbar rather than the literal "icons-around-the-
// box" pattern? Three reasons:
//   1. Touch targets — 44px minimum (WCAG 2.5.5). Putting one icon at
//      each side / corner of an arbitrarily-sized box leaves the
//      icons far apart on big bboxes and overlapping on small ones.
//   2. Predictability — every selection shows tools in the same place,
//      so users build muscle memory.
//   3. Simplicity — one absolute position to compute, one stack to
//      manage, one pointer-events surface.
//
// Konva.Transformer (SelectionFrame.tsx) paints scale + rotate handles
// on the bbox itself. This DOM toolbar is a layer above that, exposing
// actions that Konva doesn't (Edit, Duplicate, Delete, layer order,
// Flip).
//
// Icons surfaced (per layer kind):
//   • Text:        Edit • Duplicate • Up • Down • Delete   (5)
//   • Image:       Duplicate • Up • Down • Flip-H • Delete (5)
//   • Sticker:     Duplicate • Up • Down • Flip-H • Delete (5)
//   • Shape:       Duplicate • Up • Down • Delete          (4)
//
// ─── Batch 7 fix — bbox scale math ──────────────────────────────
//
// The Batch 4 implementation was placing this toolbar off-screen on
// every mobile session. The bug: `node.getClientRect({ relativeTo:
// stage })` returns a rect in stage's LOCAL coordinate space — i.e.
// the unscaled drawing space (a 1080×1080 canvas's native pixels) —
// NOT the rendered DOM-pixel space inside the stage div. On mobile
// the stage typically renders at scale ~0.4 (a 1080 canvas fits in a
// ~432-px-wide viewport), so the toolbar was being positioned
// 1 / 0.4 = 2.5× too far from stageLeft/stageTop. For a layer near
// the centre of a tall canvas the toolbar landed several hundred
// pixels below the bottom of the visible viewport — invisible but
// technically rendered.
//
// The fix: multiply the bbox by stage.scaleX() / scaleY() before
// adding the stage's container offset. We receive the scale from
// CanvasShell as a prop (it already computes effectiveScale for the
// stage size) so we don't have to call into the Konva node twice.
//
// The hide rules now also include "stage scale not yet known" (scale
// === 0, which happens on the first render before ResizeObserver
// fires) — without this the toolbar would briefly render at an
// undefined position before the canvas has measured itself.

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  FlipHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import type { AnyLayer, Id, Project } from "@/lib/photo-editor/types";

interface SelectionToolsProps {
  /** Stage div's left offset within the canvas-area container. */
  stageLeft: number;
  /** Stage div's top offset within the canvas-area container. */
  stageTop: number;
  /** Width of the un-rotated stage div in CSS pixels. */
  stageWidth: number;
  /** Height of the un-rotated stage div in CSS pixels. */
  stageHeight: number;
  /** Stage's effective scale (fitScale × viewportZoom). Used to
   *  convert un-scaled drawing-space bboxes into DOM pixels. */
  stageScale: number;
}

const TOOLBAR_HEIGHT = 40;
const TOOLBAR_GAP = 10;
const TOP_MIN_PAD = 8;

export function SelectionTools({
  stageLeft,
  stageTop,
  stageWidth,
  stageHeight,
  stageScale,
}: SelectionToolsProps) {
  const { state, dispatch, stageRef } = useEditor();
  const { state: mobileEdit, beginEditing } = useMobileEdit();

  const [tick, setTick] = useState(0);

  const selectedLayer = useMemo<AnyLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    return (
      state.project.layers.find((l) => l.id === state.selection[0]) ?? null
    );
  }, [state.selection, state.project.layers]);

  const hidden =
    selectedLayer === null ||
    selectedLayer.locked ||
    !selectedLayer.visible ||
    mobileEdit.editingLayerId === selectedLayer.id ||
    state.viewport.rotation !== 0 ||
    stageScale <= 0;

  useEffect(() => {
    if (hidden) return;
    const stage = stageRef.current;
    if (!stage) return;
    const handler = () => setTick((t) => t + 1);
    stage.on("dragmove", handler);
    stage.on("transform", handler);
    return () => {
      stage.off("dragmove", handler);
      stage.off("transform", handler);
    };
  }, [hidden, stageRef]);

  // Resolve the bbox in DOM-pixel coordinates within the canvas
  // container. Konva returns the rect in stage-local (unscaled)
  // coords; we scale + offset to land in DOM space.
  const bboxDom = useMemo(() => {
    if (hidden) return null;
    const stage = stageRef.current;
    if (!stage) return null;
    const node = stage.findOne(`#${selectedLayer!.id}`);
    if (!node) return null;
    const rect = node.getClientRect({ relativeTo: stage });
    if (
      !Number.isFinite(rect.x) ||
      !Number.isFinite(rect.y) ||
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return null;
    }
    return {
      x: rect.x * stageScale,
      y: rect.y * stageScale,
      width: rect.width * stageScale,
      height: rect.height * stageScale,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hidden,
    selectedLayer,
    stageRef,
    tick,
    stageScale,
    state.project.layers,
    state.viewport.translateX,
    state.viewport.translateY,
    state.viewport.zoom,
    stageWidth,
    stageHeight,
  ]);

  if (!bboxDom || !selectedLayer) return null;

  // Position the toolbar — above the bbox if there's room, else
  // below. Centred horizontally over the bbox, then clamped to the
  // stage's horizontal extent so it can't drift off-canvas at the
  // edges.
  const screenX = stageLeft + bboxDom.x;
  const screenY = stageTop + bboxDom.y;
  const aboveTop = screenY - TOOLBAR_HEIGHT - TOOLBAR_GAP;
  const placeAbove = aboveTop > TOP_MIN_PAD;
  const toolbarTop = placeAbove
    ? aboveTop
    : screenY + bboxDom.height + TOOLBAR_GAP;
  const desiredCentre = screenX + bboxDom.width / 2;
  const minCentre = stageLeft + 60;
  const maxCentre = stageLeft + stageWidth - 60;
  const toolbarLeft = Math.max(minCentre, Math.min(maxCentre, desiredCentre));

  const onEdit = () => beginEditing(selectedLayer.id);
  const onDuplicate = () =>
    dispatch({ type: "DUPLICATE_LAYER", id: selectedLayer.id });
  const onUp = () =>
    moveLayerInOrder(state.project, dispatch, selectedLayer.id, +1);
  const onDown = () =>
    moveLayerInOrder(state.project, dispatch, selectedLayer.id, -1);
  const onFlipH = () => flipLayer(selectedLayer, dispatch, "h");
  const onDelete = () =>
    dispatch({ type: "REMOVE_LAYER", id: selectedLayer.id });

  const orderIndex = state.project.layerOrder.indexOf(selectedLayer.id);
  const canMoveUp =
    orderIndex !== -1 && orderIndex < state.project.layerOrder.length - 1;
  const canMoveDown = orderIndex > 0;

  return (
    <div
      className="absolute -translate-x-1/2 z-30"
      style={{
        left: toolbarLeft,
        top: toolbarTop,
        height: TOOLBAR_HEIGHT,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        className="flex items-center gap-0.5 rounded-full px-1.5 py-1"
        style={{
          background: "rgba(15, 17, 21, 0.94)",
          color: "#FFFFFF",
          boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
          backdropFilter: "blur(6px)",
        }}
      >
        {selectedLayer.kind === "text" && (
          <ToolBtn
            icon={<Pencil className="w-4 h-4" strokeWidth={1.75} />}
            label="Edit text"
            onClick={onEdit}
          />
        )}
        <ToolBtn
          icon={<Copy className="w-4 h-4" strokeWidth={1.75} />}
          label="Duplicate"
          onClick={onDuplicate}
        />
        <ToolBtn
          icon={<ChevronUp className="w-4 h-4" strokeWidth={2} />}
          label="Bring forward"
          onClick={onUp}
          disabled={!canMoveUp}
        />
        <ToolBtn
          icon={<ChevronDown className="w-4 h-4" strokeWidth={2} />}
          label="Send backward"
          onClick={onDown}
          disabled={!canMoveDown}
        />
        {(selectedLayer.kind === "image" ||
          selectedLayer.kind === "sticker") && (
          <ToolBtn
            icon={<FlipHorizontal className="w-4 h-4" strokeWidth={1.75} />}
            label="Flip horizontally"
            onClick={onFlipH}
          />
        )}
        <ToolBtn
          icon={<Trash2 className="w-4 h-4" strokeWidth={1.75} />}
          label="Delete"
          onClick={onDelete}
          danger
        />
      </div>
    </div>
  );
}

function ToolBtn({
  icon,
  label,
  onClick,
  disabled = false,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-9 h-9 rounded-full inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        color: danger ? "#FCA5A5" : "#FFFFFF",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(255,255,255,0.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {icon}
    </button>
  );
}

function moveLayerInOrder(
  project: Project,
  dispatch: ReturnType<typeof useEditor>["dispatch"],
  layerId: Id,
  delta: number,
) {
  const order = [...project.layerOrder];
  const idx = order.indexOf(layerId);
  if (idx === -1) return;
  const newIdx = Math.max(0, Math.min(order.length - 1, idx + delta));
  if (newIdx === idx) return;
  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  dispatch({ type: "REORDER_LAYERS", order });
}

function flipLayer(
  layer: AnyLayer,
  dispatch: ReturnType<typeof useEditor>["dispatch"],
  axis: "h" | "v",
) {
  const next = { ...layer.transform };
  if (axis === "h") next.scaleX = -next.scaleX;
  else next.scaleY = -next.scaleY;
  dispatch({
    type: "UPDATE_LAYER",
    id: layer.id,
    patch: { transform: next },
  });
}
