// src/components/photo-editor/layers/LayersPanel.tsx
//
// Slide-in side panel listing every layer in the project. Top of the
// list is the *top* of the z-order (Photoshop convention). Tapping a row
// selects that layer; the visibility eye and lock toggle dispatch the
// matching UPDATE_LAYER actions; rows can be dragged to reorder.
//
// Mobile: full-bleed sheet sliding from the right with a backdrop.
// Desktop (lg+): 320px sidebar overlaying the right side of the editor.
// In both cases the panel is a controlled overlay — open / closed state
// lives in EditorShell so the toggle button and the panel can talk.

"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers as LayersIcon, X } from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { LayerRow } from "./LayerRow";
import type { AnyLayer, Id } from "@/lib/photo-editor/types";

interface LayersPanelProps {
  open: boolean;
  onClose: () => void;
}

export function LayersPanel({ open, onClose }: LayersPanelProps) {
  const { state, dispatch } = useEditor();
  const { project, selection } = state;

  // Drag-and-drop reorder state. We track only the in-flight drop target
  // for visual feedback; the actual drop emits a REORDER_LAYERS dispatch.
  const [dragSourceId, setDragSourceId] = useState<Id | null>(null);
  const [dragTargetId, setDragTargetId] = useState<Id | null>(null);

  // Top of the panel = top of the z-order = end of `layerOrder` array.
  // We render the reverse so the topmost layer appears first.
  const topDownLayers = useMemo<AnyLayer[]>(() => {
    const byId = new Map<Id, AnyLayer>();
    for (const l of project.layers) byId.set(l.id, l);
    const ordered: AnyLayer[] = [];
    for (const id of project.layerOrder) {
      const l = byId.get(id);
      if (l) ordered.push(l);
    }
    return ordered.reverse();
  }, [project.layers, project.layerOrder]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handleDragStart(
    e: React.DragEvent<HTMLDivElement>,
    id: Id
  ) {
    setDragSourceId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(
    e: React.DragEvent<HTMLDivElement>,
    id: Id
  ) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragTargetId) setDragTargetId(id);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, id: Id) {
    e.preventDefault();
    const sourceId = dragSourceId ?? e.dataTransfer.getData("text/plain");
    setDragSourceId(null);
    setDragTargetId(null);
    if (!sourceId || sourceId === id) return;

    // The panel renders top-down, but layerOrder is bottom-up. We work in
    // bottom-up coords so dispatches are unambiguous.
    const bottomUp = project.layerOrder.slice();
    const sourceIdx = bottomUp.indexOf(sourceId);
    const targetIdx = bottomUp.indexOf(id);
    if (sourceIdx < 0 || targetIdx < 0) return;

    const [moved] = bottomUp.splice(sourceIdx, 1);
    bottomUp.splice(targetIdx, 0, moved);

    dispatch({ type: "REORDER_LAYERS", order: bottomUp });
  }

  function handleSelect(id: Id) {
    dispatch({ type: "SET_SELECTION", ids: [id] });
  }

  function handleToggleVisible(layer: AnyLayer) {
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { visible: !layer.visible } as Partial<AnyLayer>,
    });
  }

  function handleToggleLocked(layer: AnyLayer) {
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { locked: !layer.locked } as Partial<AnyLayer>,
    });
  }

  return (
    <>
      {/* Backdrop — covers the editor when the panel is open. Click to
          dismiss. Sits above the canvas (z-50ish) and below the panel. */}
      <div
        className={`fixed inset-0 z-[200] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "var(--pe-overlay)" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel itself — slides in from the right. */}
      <aside
        className={`fixed right-0 top-0 z-[210] h-full w-[88vw] max-w-[360px] flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "var(--pe-surface)",
          borderLeft: "1px solid var(--pe-border)",
          boxShadow: open ? "var(--pe-shadow-lg)" : "none",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Layers"
      >
        {/* Header */}
        <div
          className="flex-none flex items-center justify-between px-4"
          style={{
            height: 52,
            borderBottom: "1px solid var(--pe-border)",
          }}
        >
          <div
            className="flex items-center gap-2"
            style={{ color: "var(--pe-text)" }}
          >
            <LayersIcon className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-sm font-semibold">Layers</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close layers panel"
            className="w-9 h-9 inline-flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--pe-tool-icon)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--pe-surface-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* List */}
        <div
          className="flex-1 overflow-y-auto px-2 py-2"
          role="list"
          aria-label="Layer list"
        >
          {topDownLayers.length === 0 ? (
            <div
              className="px-3 py-6 text-center text-sm"
              style={{ color: "var(--pe-text-subtle)" }}
            >
              No layers yet. Tap <span className="font-medium">Add Text</span>{" "}
              in the toolbar to add one.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {topDownLayers.map((layer) => (
                <LayerRow
                  key={layer.id}
                  layer={layer}
                  selected={selection.includes(layer.id)}
                  isDropTarget={dragTargetId === layer.id}
                  onSelect={() => handleSelect(layer.id)}
                  onToggleVisible={() => handleToggleVisible(layer)}
                  onToggleLocked={() => handleToggleLocked(layer)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer hint — small layer count summary */}
        <div
          className="flex-none px-4 py-3 text-xs"
          style={{
            borderTop: "1px solid var(--pe-border)",
            color: "var(--pe-text-subtle)",
          }}
        >
          {topDownLayers.length === 0
            ? "Empty canvas"
            : `${topDownLayers.length} layer${
                topDownLayers.length === 1 ? "" : "s"
              }`}
        </div>
      </aside>
    </>
  );
}
