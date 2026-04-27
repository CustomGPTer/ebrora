// src/components/photo-editor/canvas/BottomEditDrawer.tsx
//
// Mobile text-input drawer. Mirrors the reference Add Text app's bottom
// editing strip (Image 7 from the design brief): a textarea pre-filled
// with the layer's current text, plus a controls row underneath:
//
//   ┌───────────────────────────────────────┐
//   │  Enter text here_                     │   ← textarea, autofocus
//   │                                       │
//   ├───────────────────────────────────────┤
//   │ [✕]  [⫷] [⫸] [⫶]              [→]    │   ← cancel / align L/C/R / commit
//   └───────────────────────────────────────┘
//
// Behavioural contract:
//   • Open/close lifecycle is owned by MobileEditContext. This file
//     reads `editingLayerId` and `originalRuns` from useMobileEdit()
//     and renders only when editingLayerId is set.
//   • Live updates: typing dispatches UPDATE_LAYER on every keystroke
//     so the canvas reflects the new text immediately. The reducer's
//     existing coalescing behaviour (history-coalesce.ts) collapses
//     consecutive run-edits within COALESCE_WINDOW_MS into one
//     undo step, so the user gets one history entry per editing
//     session rather than one per character.
//   • Per-letter styling collapse: every keystroke replaces all runs
//     with a single run that carries the FIRST original run's style
//     fields (font / colour / stroke / shadow / etc). This is a
//     conscious trade-off — typed mobile users overwhelmingly want
//     "tap, type, done" rather than per-letter styling preservation.
//     The desktop FormatPanel + ColorPanel + selection-range path
//     remains intact for users who want per-letter control.
//   • Backdrop tap commits (matches iOS keyboard convention).
//   • Tapping a different text layer on the canvas auto-commits
//     this layer and switches the drawer to the other (handled by
//     MobileEditContext's beginEditing transition logic).
//   • Cancel (X) rolls back via MobileEditContext.endEditing(false):
//     fresh layers are removed, existing layers are restored to
//     originalRuns.
//
// Keyboard handling note: on iOS Safari the on-screen keyboard
// overlays the viewport rather than resizing it. We use position:fixed
// + bottom: 0 + env(safe-area-inset-bottom) so the drawer pins to the
// physical bottom edge. iOS automatically scrolls the focused textarea
// into view above the keyboard, so the drawer ends up visually above
// the keyboard most of the time. If we need pixel-perfect placement
// we can switch to the visualViewport API in a polish pass.
//
// We deliberately do NOT trigger the existing TextEditOverlay
// (caret + selection rectangles in canvas-local coords). That UI was
// the previous double-tap inline-editing path and clashes visually
// with the keyboard-first drawer flow. TextEditOverlay still mounts
// when state.runSelection is set, but no UI dispatches that on mobile
// in this batch — the inline path remains as engine plumbing for any
// future desktop power-mode (e.g. selection-range text styling).

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowRight,
  X,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { fullTextOf, useMobileEdit } from "../context/MobileEditContext";
import { defaultGlyphRun } from "@/lib/photo-editor/rich-text/factory";
import type {
  GlyphRun,
  TextLayer,
  TextLayerStyling,
} from "@/lib/photo-editor/types";

type Align = TextLayerStyling["align"];

export function BottomEditDrawer() {
  const { state, dispatch } = useEditor();
  const { state: mobileEdit, endEditing } = useMobileEdit();

  // Only render when a layer is actively being edited.
  const layerId = mobileEdit.editingLayerId;
  const layer = useMemo<TextLayer | null>(() => {
    if (layerId === null) return null;
    const found = state.project.layers.find((l) => l.id === layerId);
    if (!found || found.kind !== "text") return null;
    return found as TextLayer;
  }, [layerId, state.project.layers]);

  // Local draft of the textarea — separate from layer.runs so we
  // don't fight controlled-input semantics with reducer dispatches.
  // We sync from layer.runs whenever the editing layer changes.
  const [draft, setDraft] = useState<string>("");
  const lastLayerIdRef = useRef<string | null>(null);
  // Local ref. The "keyboard pop on Add Text" path uses a separate
  // permanent shim in MobileEditProvider — once this drawer mounts and
  // its useEffect fires, focus transfers from the shim to here in the
  // same task and the OS keyboard stays open through the handover.
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!layer) {
      lastLayerIdRef.current = null;
      return;
    }
    if (lastLayerIdRef.current !== layer.id) {
      // New editing session (or switched to a different layer) —
      // sync the draft from the layer's current text once.
      setDraft(fullTextOf(layer));
      lastLayerIdRef.current = layer.id;
      // Focus the textarea so the OS keyboard pops up on mobile.
      // setTimeout ensures the element is in the DOM before .focus().
      window.setTimeout(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        // Move cursor to the end of any existing text — feels right
        // for "tap to edit" because users typically want to append.
        const end = el.value.length;
        el.setSelectionRange(end, end);
      }, 0);
    }
  }, [layer]);

  // Auto-grow the textarea up to a cap. We do it imperatively rather
  // than via CSS because textareas don't auto-grow with content.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 200; // ~6 lines at 20px line-height
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  }, [draft]);

  if (layer === null) return null;

  function handleChange(next: string) {
    setDraft(next);
    // Live-update the canvas. Single-run collapse keeps this O(1)
    // per keystroke regardless of original run count.
    if (!layer) return;
    const baseRun: GlyphRun = layer.runs[0]
      ? { ...layer.runs[0], text: next }
      : defaultGlyphRun({ text: next });
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { runs: [baseRun] },
    });
  }

  function handleSetAlign(align: Align) {
    if (!layer) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { styling: { ...layer.styling, align } },
    });
  }

  return (
    <>
      {/* Backdrop — tap to commit (iOS keyboard convention). Only
          covers the area above the drawer so the drawer itself stays
          tappable. */}
      <div
        className="fixed inset-0 z-[230]"
        style={{
          background: "transparent",
          pointerEvents: "auto",
        }}
        onClick={() => endEditing(true)}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit text"
        className="fixed left-0 right-0 bottom-0 z-[231] flex flex-col"
        style={{
          background: "var(--pe-toolbar-bg)",
          borderTop: "1px solid var(--pe-toolbar-border)",
          boxShadow: "var(--pe-shadow-lg)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Textarea ─────────────────────────────────────────────── */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="your text here"
            rows={3}
            className="w-full resize-none outline-none bg-transparent text-base leading-snug"
            style={{
              color: "var(--pe-text)",
              minHeight: 80,
              maxHeight: 200,
            }}
          />
        </div>

        {/* Controls row ─────────────────────────────────────────── */}
        <div
          className="flex-none flex items-center justify-between px-2 py-1.5"
          style={{
            borderTop: "1px solid var(--pe-toolbar-border)",
          }}
        >
          {/* Cancel ─────────────────────────────────────────── */}
          <DrawerIconButton
            ariaLabel="Cancel and discard changes"
            onClick={() => endEditing(false)}
            icon={<X className="w-5 h-5" strokeWidth={1.75} />}
          />

          {/* Align cluster ──────────────────────────────────── */}
          <div className="flex items-center gap-0.5">
            <DrawerIconButton
              ariaLabel="Align left"
              active={layer.styling.align === "left"}
              onClick={() => handleSetAlign("left")}
              icon={<AlignLeft className="w-5 h-5" strokeWidth={1.75} />}
            />
            <DrawerIconButton
              ariaLabel="Align centre"
              active={layer.styling.align === "center"}
              onClick={() => handleSetAlign("center")}
              icon={<AlignCenter className="w-5 h-5" strokeWidth={1.75} />}
            />
            <DrawerIconButton
              ariaLabel="Align right"
              active={layer.styling.align === "right"}
              onClick={() => handleSetAlign("right")}
              icon={<AlignRight className="w-5 h-5" strokeWidth={1.75} />}
            />
            <DrawerIconButton
              ariaLabel="Justify"
              active={layer.styling.align === "justify"}
              onClick={() => handleSetAlign("justify")}
              icon={<AlignJustify className="w-5 h-5" strokeWidth={1.75} />}
            />
          </div>

          {/* Commit ─────────────────────────────────────────── */}
          <CommitButton onClick={() => endEditing(true)} />
        </div>
      </div>
    </>
  );
}

// ─── Buttons ────────────────────────────────────────────────────

function DrawerIconButton({
  icon,
  ariaLabel,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className="w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors"
      style={{
        color: active ? "var(--pe-tool-icon-active)" : "var(--pe-tool-icon)",
        background: active ? "var(--pe-tool-icon-active-bg)" : "transparent",
      }}
    >
      {icon}
    </button>
  );
}

function CommitButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Done editing"
      className="w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors"
      style={{
        background: "#1B5B50",
        color: "#FFFFFF",
      }}
    >
      <ArrowRight className="w-5 h-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
