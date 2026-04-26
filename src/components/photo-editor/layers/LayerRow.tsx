// src/components/photo-editor/layers/LayerRow.tsx
//
// One row in the Layers panel. Renders a kind icon, the layer name, a
// lock toggle, a visibility (eye) toggle, and a drag handle for
// reordering. Selection state mirrors the editor's selection array —
// tapping the row body selects the layer; the toggles do not propagate.
//
// Drag-to-reorder is wired via native HTML5 drag-and-drop on the parent
// LayersPanel; this row exposes draggable + the necessary data attribute
// (data-layer-id) so the panel's onDrop handler can find the source /
// target ids.

"use client";

import { Eye, EyeOff, GripVertical, Image, Lock, Smile, Square, Type, Unlock } from "lucide-react";
import type { AnyLayer, Id } from "@/lib/photo-editor/types";

interface LayerRowProps {
  layer: AnyLayer;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onToggleLocked: () => void;
  /** HTML5 drag-and-drop handlers passed down from the panel. */
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: Id) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, id: Id) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, id: Id) => void;
  isDropTarget?: boolean;
}

export function LayerRow({
  layer,
  selected,
  onSelect,
  onToggleVisible,
  onToggleLocked,
  onDragStart,
  onDragOver,
  onDrop,
  isDropTarget = false,
}: LayerRowProps) {
  return (
    <div
      role="listitem"
      data-layer-id={layer.id}
      draggable
      onDragStart={(e) => onDragStart(e, layer.id)}
      onDragOver={(e) => onDragOver(e, layer.id)}
      onDrop={(e) => onDrop(e, layer.id)}
      className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors"
      style={{
        background: selected
          ? "var(--pe-tool-icon-active-bg)"
          : isDropTarget
          ? "var(--pe-surface-2)"
          : "transparent",
        border: "1px solid",
        borderColor: selected
          ? "var(--pe-tool-icon-active)"
          : "transparent",
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (selected) return;
        (e.currentTarget as HTMLDivElement).style.background =
          "var(--pe-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (selected || isDropTarget) return;
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      <span
        className="flex-none cursor-grab"
        style={{ color: "var(--pe-text-subtle)" }}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" strokeWidth={1.75} />
      </span>

      <KindIcon kind={layer.kind} />

      <span
        className="flex-1 text-sm truncate"
        style={{
          color: layer.visible
            ? "var(--pe-text)"
            : "var(--pe-text-subtle)",
          fontStyle: layer.visible ? "normal" : "italic",
        }}
      >
        {layer.name}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleLocked();
        }}
        aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
        className="flex-none w-7 h-7 inline-flex items-center justify-center rounded-md transition-colors"
        style={{
          color: layer.locked
            ? "var(--pe-text)"
            : "var(--pe-text-subtle)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--pe-surface)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }}
      >
        {layer.locked ? (
          <Lock className="w-4 h-4" strokeWidth={1.75} />
        ) : (
          <Unlock className="w-4 h-4" strokeWidth={1.75} />
        )}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisible();
        }}
        aria-label={layer.visible ? "Hide layer" : "Show layer"}
        className="flex-none w-7 h-7 inline-flex items-center justify-center rounded-md transition-colors"
        style={{
          color: layer.visible
            ? "var(--pe-text)"
            : "var(--pe-text-subtle)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--pe-surface)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }}
      >
        {layer.visible ? (
          <Eye className="w-4 h-4" strokeWidth={1.75} />
        ) : (
          <EyeOff className="w-4 h-4" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}

function KindIcon({ kind }: { kind: AnyLayer["kind"] }) {
  const props = {
    className: "w-4 h-4 flex-none",
    strokeWidth: 1.75,
    style: { color: "var(--pe-text-muted)" },
  };
  switch (kind) {
    case "text":
      return <Type {...props} />;
    case "image":
      // eslint-disable-next-line jsx-a11y/alt-text
      return <Image {...props} />;
    case "shape":
      return <Square {...props} />;
    case "sticker":
      return <Smile {...props} />;
  }
}
