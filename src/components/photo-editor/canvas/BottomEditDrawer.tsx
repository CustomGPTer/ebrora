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
// Apr 2026 keyboard-pop fix:
// The textarea is now PERMANENTLY MOUNTED (positioned offscreen as a
// 1×1 transparent box when no edit session is active) and registers
// itself with MobileEditContext via registerEditTextarea. The Add Text
// click handler calls focusForKeyboardPop SYNCHRONOUSLY inside the
// gesture, which focuses this same textarea — same DOM element pops
// the keyboard and receives the user's typed input. There is no
// shadow-shim element and no setTimeout-based focus handover, so the
// OS keyboard's IME stays bound to the right input and keystrokes
// can't get lost into a void. The drawer chrome (controls row,
// backdrop, visible padding) is still rendered conditionally.
//
// CRITICAL: the outer drawer container MUST NOT use `visibility:
// hidden` when not editing. iOS Safari and Android Chrome silently
// refuse to pop the on-screen keyboard for inputs whose computed
// `visibility` is `hidden` — even when focus() is called inside a
// user gesture. Because focusForKeyboardPop runs BEFORE the
// `editing` state flips (React batches the dispatch asynchronously),
// the textarea would still be in the offscreen state at the moment
// of focus, and any visibility:hidden ancestor would suppress the
// keyboard. We hide the chrome with conditional `background` /
// `borderTop` / `boxShadow` (so nothing is visually drawn) and
// disable interaction with `pointerEvents: none`. The 1×1 inner
// wrapper around the textarea handles invisibility — the textarea
// itself stays a real, focusable, in-viewport element at all times.
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
  const { state: mobileEdit, endEditing, registerEditTextarea } =
    useMobileEdit();

  // Only render chrome when a layer is actively being edited.
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
  // Local ref to the textarea. Apr 2026 — the textarea is now
  // permanently mounted (positioned offscreen when no layer is
  // being edited) and registers itself with MobileEditContext via
  // registerEditTextarea so focusForKeyboardPop targets the SAME
  // element the user will actually type into. No focus handover.
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Register / deregister with the provider on mount / unmount.
  // Drawer is mounted exactly once in EditorShell so this fires
  // once at startup and keeps the registration for the lifetime of
  // the editor session.
  useEffect(() => {
    registerEditTextarea(textareaRef.current);
    return () => registerEditTextarea(null);
  }, [registerEditTextarea]);

  useEffect(() => {
    if (!layer) {
      lastLayerIdRef.current = null;
      // Reset draft when leaving an edit session so the next
      // edit-session sync isn't pre-populated with stale text.
      setDraft("");
      return;
    }
    if (lastLayerIdRef.current !== layer.id) {
      // New editing session (or switched to a different layer) —
      // sync the draft from the layer's current text once.
      setDraft(fullTextOf(layer));
      lastLayerIdRef.current = layer.id;
      // The textarea is already mounted and (in the Add Text path)
      // already focused from the click handler's synchronous
      // focusForKeyboardPop call. We still re-focus and place the
      // caret at the end here to cover the "tap existing text
      // layer" path, which doesn't go through focusForKeyboardPop.
      // setTimeout(0) ensures the chrome around the textarea has
      // committed so the textarea is visibly on-screen before we
      // place the caret.
      window.setTimeout(() => {
        const el = textareaRef.current;
        if (!el) return;
        // Skip the focus call if we already have it — avoids a
        // redundant focus event that some Android keyboards treat
        // as a reason to dismiss.
        if (document.activeElement !== el) {
          el.focus();
        }
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

  const editing = layer !== null;

  return (
    <>
      {/* Backdrop — tap to commit (iOS keyboard convention). Only
          renders during an edit session. */}
      {editing && (
        <div
          className="fixed inset-0 z-[230]"
          style={{
            background: "transparent",
            pointerEvents: "auto",
          }}
          onClick={() => endEditing(true)}
          aria-hidden
        />
      )}

      {/* Drawer container — ALWAYS mounted so the textarea inside
          retains its DOM identity across edit sessions. When no
          layer is being edited the container is positioned offscreen
          and made non-interactive; the textarea inside still
          accepts focus() calls from focusForKeyboardPop. */}
      <div
        role={editing ? "dialog" : undefined}
        aria-modal={editing ? "true" : undefined}
        aria-label={editing ? "Edit text" : undefined}
        aria-hidden={!editing}
        className="fixed left-0 right-0 z-[231] flex flex-col"
        style={{
          // Offscreen until editing starts. We still position the
          // drawer at bottom: 0 (rather than off-page) so the
          // browser counts the textarea as "in viewport" — some
          // Android browsers refuse to show the keyboard for inputs
          // that are wholly outside the visual viewport.
          bottom: 0,
          background: editing ? "var(--pe-toolbar-bg)" : "transparent",
          borderTop: editing
            ? "1px solid var(--pe-toolbar-border)"
            : "none",
          boxShadow: editing ? "var(--pe-shadow-lg)" : "none",
          paddingBottom: editing
            ? "env(safe-area-inset-bottom, 0px)"
            : "0px",
          // When not editing we hide the chrome via transparent
          // background / no border / no shadow above, but we DO NOT
          // set `visibility: hidden` here. iOS Safari and Android
          // Chrome refuse to pop the on-screen keyboard for inputs
          // whose computed visibility is `hidden`, and the outer
          // container's visibility is inherited by the textarea.
          // The 1×1 inner wrapper below collapses the textarea to
          // an invisible focusable target. pointerEvents: none means
          // the (now visually empty) drawer doesn't block taps on
          // the canvas / dock when no edit session is active.
          pointerEvents: editing ? "auto" : "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Textarea — ALWAYS mounted. Size and visible chrome are
            toggled via the inner wrapper below and the textarea's
            own style. The textarea remains a real, focusable, in-
            viewport element at all times so focusForKeyboardPop
            (called synchronously inside the Add Text user gesture)
            can pop the OS keyboard before the drawer chrome
            renders. */}
        <div
          className={editing ? "px-4 pt-3 pb-2" : ""}
          style={
            editing
              ? undefined
              : {
                  // Collapse to a 1×1 transparent box when no edit
                  // session is active. The textarea inside stays
                  // focusable (and keyboard-poppable on mobile)
                  // because no ancestor sets visibility: hidden or
                  // display: none.
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                }
          }
        >
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="your text here"
            rows={1}
            aria-hidden={!editing}
            tabIndex={editing ? 0 : -1}
            className={
              editing
                ? "w-full resize-none outline-none bg-transparent text-base leading-snug"
                : "resize-none outline-none bg-transparent"
            }
            style={
              editing
                ? {
                    color: "var(--pe-text)",
                    maxHeight: 200,
                  }
                : {
                    width: 1,
                    height: 1,
                    opacity: 0,
                    color: "transparent",
                    caretColor: "transparent",
                    border: "none",
                    padding: 0,
                  }
            }
          />
        </div>

        {/* Controls row — only renders during an edit session. */}
        {editing && (
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
                active={layer!.styling.align === "left"}
                onClick={() => handleSetAlign("left")}
                icon={<AlignLeft className="w-5 h-5" strokeWidth={1.75} />}
              />
              <DrawerIconButton
                ariaLabel="Align centre"
                active={layer!.styling.align === "center"}
                onClick={() => handleSetAlign("center")}
                icon={<AlignCenter className="w-5 h-5" strokeWidth={1.75} />}
              />
              <DrawerIconButton
                ariaLabel="Align right"
                active={layer!.styling.align === "right"}
                onClick={() => handleSetAlign("right")}
                icon={<AlignRight className="w-5 h-5" strokeWidth={1.75} />}
              />
              <DrawerIconButton
                ariaLabel="Justify"
                active={layer!.styling.align === "justify"}
                onClick={() => handleSetAlign("justify")}
                icon={<AlignJustify className="w-5 h-5" strokeWidth={1.75} />}
              />
            </div>

            {/* Commit ─────────────────────────────────────────── */}
            <CommitButton onClick={() => endEditing(true)} />
          </div>
        )}
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
