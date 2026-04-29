// src/components/photo-editor/toolbar/EditableLayerName.tsx
//
// Inline-editable section header for the bottom-dock's selected-layer
// section. Replaces the hardcoded `<DockSectionHeader title="Edit X" />`
// titles inside ShapeEditPanel / TextEditPanel / ImageEditPanel /
// StickerEditPanel with the layer's actual `name` field — editable in
// place via tap.
//
// Batch G — Apr 2026 (V3 handover decision #5).
//
// UX:
//   • Default state: shows `layer.name` styled identically to the
//     pre-G DockSectionHeader (13px / semibold / `--pe-text`), with
//     a small pencil icon to indicate editability.
//   • Tap the row → swaps in a text input, focused, contents
//     auto-selected so the user can start typing immediately.
//   • Enter → commits via UPDATE_LAYER dispatch.
//   • Escape → reverts to the saved name.
//   • Blur (tap outside) → commits if non-empty, reverts otherwise
//     (a layer must always have a name).
//   • Empty input on Enter → reverts (no empty names allowed).
//
// Layer-kind defaults are preserved at factory time; this component
// just edits the existing `BaseLayer.name` field via the existing
// UPDATE_LAYER reducer action.

"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { useEditor } from "../context/EditorContext";
import type { AnyLayer } from "@/lib/photo-editor/types";

interface EditableLayerNameProps {
  layer: AnyLayer;
  /** Optional trailing slot — preserved from the original
   *  DockSectionHeader contract. Currently unused by all four
   *  EditPanels but kept for API compatibility. */
  trailing?: React.ReactNode;
}

export function EditableLayerName({
  layer,
  trailing,
}: EditableLayerNameProps) {
  const { dispatch } = useEditor();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(layer.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-sync the draft whenever the underlying layer name changes (e.g.
  // selection switched to a different layer with a different name).
  useEffect(() => {
    if (!editing) setDraft(layer.name);
  }, [layer.name, editing]);

  // Auto-focus + select-all on enter-edit.
  useEffect(() => {
    if (!editing) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [editing]);

  function commit(next: string) {
    const trimmed = next.trim();
    setEditing(false);
    if (trimmed.length === 0) {
      // Revert — never let a layer have an empty name.
      setDraft(layer.name);
      return;
    }
    if (trimmed === layer.name) {
      // No-op; keep history clean.
      return;
    }
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { name: trimmed } as Partial<AnyLayer>,
    });
  }

  function cancel() {
    setDraft(layer.name);
    setEditing(false);
  }

  if (editing) {
    return (
      <div
        className="flex-none flex items-center px-4 pt-2.5 pb-1"
        style={{ minHeight: 32 }}
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          onBlur={() => commit(draft)}
          maxLength={120}
          aria-label="Layer name"
          className="flex-1 bg-transparent outline-none text-[13px] font-semibold tracking-tight"
          style={{ color: "var(--pe-text)" }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex-none flex items-center justify-between px-4 pt-2.5 pb-1"
      style={{ minHeight: 32 }}
    >
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Rename layer (currently ${layer.name})`}
        className="inline-flex items-center gap-1.5 text-left transition-colors"
      >
        <span
          className="text-[13px] font-semibold tracking-tight truncate max-w-[60vw]"
          style={{ color: "var(--pe-text)" }}
        >
          {layer.name}
        </span>
        <Pencil
          className="w-3 h-3 flex-none"
          strokeWidth={2}
          style={{ color: "var(--pe-text-subtle)" }}
        />
      </button>
      {trailing ? <div>{trailing}</div> : null}
    </div>
  );
}
