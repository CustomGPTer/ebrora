// src/components/photo-editor/canvas/SelectionTools.tsx
//
// Per-selection contextual toolbar — DOM overlay above the canvas that
// floats over the currently-selected layer with quick-action icons.
// Mirrors the "icons around the selected box" pattern from the design
// brief (Image 1, the "h dad ghh" Samsung text-box reference) but
// adapted to the conventions of canvas editors (Canva / PicsArt /
// Figma): a single horizontal toolbar pinned above the bbox, holding
// 4–6 icons depending on the selected layer's type.
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
// The Konva.Transformer (SelectionFrame.tsx) already paints scale +
// rotate handles on the bbox itself. This DOM toolbar is a layer
// above that, exposing actions that Konva doesn't (Edit, Duplicate,
// Delete, layer order, Flip).
//
// Icons surfaced (per layer kind):
//   • Text:        Edit • Duplicate • Up • Down • Delete   (5)
//   • Image:       Duplicate • Up • Down • Flip-H • Delete (5)
//   • Sticker:     Duplicate • Up • Down • Flip-H • Delete (5)
//   • Shape:       Duplicate • Up • Down • Delete          (4)
//
// Hide rules:
//   • No selection                       → nothing to show
//   • Multi-selection                    → toolbar suppressed (multi-
//                                          select editing is a Layers
//                                          panel job, not a contextual
//                                          quick-action job)
//   • Selection is locked / hidden       → don't surface destructive
//                                          actions on a layer the user
//                                          can't directly interact
//                                          with anyway
//   • BottomEditDrawer is open for that  → don't double up on tools
//     layer                                while the keyboard is up
//   • viewport.rotation !== 0            → bbox math gets involved
//                                          with rotation; we ship a
//                                          simpler v1 and revisit if
//                                          users find the gap
//
// Live tracking — Konva fires `dragmove` on every drag tick and
// `transform` on every Transformer interaction. We listen on the
// stage and force a re-render so the toolbar follows the bbox at
// 60 fps while the user is interacting.

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
  /** Stage div's left offset within the canvas-area container.
   *  Computed by CanvasShell from centreX − stageW/2 + viewport.translateX. */
  stageLeft: number;
  /** Stage div's top offset within the canvas-area container. */
  stageTop: number;
  /** Width of the un-rotated stage div in CSS pixels (== project.width × effectiveScale). */
  stageWidth: number;
  /** Height of the un-rotated stage div in CSS pixels. */
  stageHeight: number;
}

const TOOLBAR_HEIGHT = 40;
const TOOLBAR_GAP = 10;
const TOP_MIN_PAD = 8;

export function SelectionTools({
  stageLeft,
  stageTop,
  stageWidth,
  stageHeight,
}: SelectionToolsProps) {
  const { state, dispatch, stageRef } = useEditor();
  const { state: mobileEdit, beginEditing } = useMobileEdit();

  // Force re-render counter — bumped by drag / transform listeners.
  const [tick, setTick] = useState(0);

  // Resolve the single selected layer (multi-select hides the toolbar).
  const selectedLayer = useMemo<AnyLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    return (
      state.project.layers.find((l) => l.id === state.selection[0]) ?? null
    );
  }, [state.selection, state.project.layers]);

  // Resolve the hide rules — see file header for rationale.
  const hidden =
    selectedLayer === null ||
    selectedLayer.locked ||
    !selectedLayer.visible ||
    mobileEdit.editingLayerId === selectedLayer.id ||
    state.viewport.rotation !== 0;

  // Subscribe to Konva's live drag / transform events so the toolbar
  // tracks the bbox during interaction, not just after dragEnd /
  // transformEnd dispatches an UPDATE_LAYER. Without this the toolbar
  // would lag behind the layer all through a drag.
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

  // Resolve the bbox in stage-local CSS-pixel coordinates. We pull it
  // from Konva because:
  //   1. Konva already has the layer's full transform (translate / scale
  //      / rotate / skew) applied, computing the pixel-perfect bbox.
  //   2. Doing the math ourselves would mean re-implementing the same
  //      logic the Transformer relies on — duplication risk.
  // We deliberately depend on `tick` here so the memo invalidates when
  // a drag / transform event fires.
  const bbox = useMemo(() => {
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
    return rect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hidden,
    selectedLayer,
    stageRef,
    tick,
    state.project.layers,
    state.viewport.translateX,
    state.viewport.translateY,
    state.viewport.zoom,
    stageWidth,
    stageHeight,
  ]);

  if (!bbox || !selectedLayer) return null;

  // ── Position the toolbar ─────────────────────────────────────
  //
  // Above the bbox if there's room; otherwise below. Centred
  // horizontally over the bbox, then clamped to the stage's
  // horizontal extent so the toolbar doesn't drift off the
  // visible canvas area at the edges.
  const screenX = stageLeft + bbox.x;
  const screenY = stageTop + bbox.y;
  const aboveTop = screenY - TOOLBAR_HEIGHT - TOOLBAR_GAP;
  const placeAbove = aboveTop > TOP_MIN_PAD;
  const toolbarTop = placeAbove
    ? aboveTop
    : screenY + bbox.height + TOOLBAR_GAP;
  // Clamp toolbar centre so it doesn't escape the stage box horizontally.
  const desiredCentre = screenX + bbox.width / 2;
  const minCentre = stageLeft + 60; // half of widest toolbar approx
  const maxCentre = stageLeft + stageWidth - 60;
  const toolbarLeft = Math.max(minCentre, Math.min(maxCentre, desiredCentre));

  // ── Action handlers ─────────────────────────────────────────
  const onEdit = () => beginEditing(selectedLayer.id);
  const onDuplicate = () =>
    dispatch({ type: "DUPLICATE_LAYER", id: selectedLayer.id });
  const onUp = () => moveLayerInOrder(state.project, dispatch, selectedLayer.id, +1);
  const onDown = () =>
    moveLayerInOrder(state.project, dispatch, selectedLayer.id, -1);
  const onFlipH = () => flipLayer(selectedLayer, dispatch, "h");
  const onDelete = () => dispatch({ type: "REMOVE_LAYER", id: selectedLayer.id });

  const orderIndex = state.project.layerOrder.indexOf(selectedLayer.id);
  const canMoveUp = orderIndex !== -1 && orderIndex < state.project.layerOrder.length - 1;
  const canMoveDown = orderIndex > 0;

  return (
    <div
      className="absolute -translate-x-1/2 z-30"
      style={{
        left: toolbarLeft,
        top: toolbarTop,
        height: TOOLBAR_HEIGHT,
      }}
      // Stop pointer events bleeding through to Konva when the user
      // interacts with the toolbar.
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

        {(selectedLayer.kind === "image" || selectedLayer.kind === "sticker") && (
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

// ─── Single tool button ─────────────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────────

/** Swap the layer's position in `layerOrder` by `delta` slots. delta=+1
 *  brings the layer one slot up (toward the top of the z-stack);
 *  delta=-1 sends it one slot down. */
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
  // Swap rather than splice-and-insert so a click only moves the layer
  // by exactly one position — predictable for repeated taps.
  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  dispatch({ type: "REORDER_LAYERS", order });
}

/** Flip an image / sticker layer by negating one axis of its scale.
 *  A layer with scaleX = -1 renders as a mirror image of scaleX = 1.
 *  We don't change x/y because Konva applies the transform around
 *  offsetX / offsetY — flipping in place is the natural visual. */
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
