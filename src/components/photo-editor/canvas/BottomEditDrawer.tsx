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
// Apr 2026 keyboard-pop fix (revision 2):
// The textarea is PERMANENTLY MOUNTED in a CONSISTENT LAYOUT. It has
// the same className, the same inline style, the same dimensions, the
// same DOM position whether or not an edit session is active. The
// drawer chrome around it (background colour, border, controls row)
// is what changes — we hide the drawer visually with opacity:0 and
// disable interaction with pointer-events:none when not editing,
// instead of repositioning or resizing the textarea itself.
//
// Why: the previous revision swapped the textarea between two very
// different layouts — full-size in editing mode, 1×1 invisible inside
// a position:absolute 1×1 overflow:hidden box in non-editing mode.
// Even though the DOM node was preserved, iOS Safari's IME would
// stay bound to the layout snapshot it took at focus() time. The
// keyboard popped correctly (the focus() call landed), but the
// keystrokes that followed never reached the React-controlled
// `value` because by then the textarea's layout had changed
// drastically. The OS thought it was still typing into a 1×1 ghost.
//
// With identical layout in both states, focus() runs against the
// same element the user will actually see and type into. There is
// no layout transition between focus and first keystroke, and no
// IME confusion. The drawer just fades in around the already-focused
// textarea.
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
  // Local ref to the textarea. The textarea is permanently mounted in
  // the same layout regardless of editing state, and registers itself
  // with MobileEditContext via registerEditTextarea so
  // focusForKeyboardPop targets the SAME element the user will
  // actually type into. No focus handover, no layout transition
  // between focus() and the first keystroke.
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
  // Active alignment to show in the controls row. When not editing
  // (drawer hidden), default to "left" so we don't crash dereferencing
  // a null layer — the buttons are non-interactive anyway because the
  // drawer is opacity:0 + pointerEvents:none.
  const activeAlign: Align = layer ? layer.styling.align : "left";

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

      {/* Drawer container — ALWAYS mounted in a CONSISTENT layout
          (same DOM tree, same className, same style structure) so the
          textarea inside never undergoes a layout transition between
          focus() and first keystroke. When no layer is being edited
          we hide the drawer with opacity:0 and disable interaction
          with pointerEvents:none — the textarea inside is still a
          real, focusable, in-viewport element so focusForKeyboardPop
          (called synchronously from the Add Text user gesture) can
          pop the OS keyboard reliably. */}
      <div
        role={editing ? "dialog" : undefined}
        aria-modal={editing ? "true" : undefined}
        aria-label={editing ? "Edit text" : undefined}
        aria-hidden={!editing}
        className="fixed left-0 right-0 z-[231] flex flex-col"
        style={{
          bottom: 0,
          background: "var(--pe-toolbar-bg)",
          borderTop: "1px solid var(--pe-toolbar-border)",
          boxShadow: "var(--pe-shadow-lg)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          // Hide the drawer when not editing without removing the
          // textarea from the layout. opacity:0 keeps the element
          // fully focusable and IME-bindable; pointerEvents:none
          // lets taps fall through to the dock / canvas underneath.
          opacity: editing ? 1 : 0,
          pointerEvents: editing ? "auto" : "none",
          transition: "opacity 120ms ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Textarea — ALWAYS in the same layout (full width, normal
            padding, normal font size). Same className, same style.
            iOS Safari and Android Chrome bind the IME to the focused
            element's layout at the moment of focus(); keeping that
            layout stable across the editing-state flip is what makes
            the keystrokes actually reach the React-controlled
            `value` after the keyboard pops. */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="your text here"
            rows={1}
            // Always tab-reachable / accessible. We do not toggle
            // aria-hidden or tabIndex based on editing state because
            // changing those on a focused input can confuse iOS
            // Safari into dropping IME bindings.
            className="w-full resize-none outline-none bg-transparent text-base leading-snug"
            style={{
              color: "var(--pe-text)",
              maxHeight: 200,
              // Block taps when the drawer is hidden so the dock /
              // canvas underneath stays interactive. Doesn't affect
              // focus() or keyboard input.
              pointerEvents: editing ? "auto" : "none",
            }}
          />
        </div>

        {/* Controls row — always rendered to keep the drawer's height
            and layout stable across edit-state flips. Buttons are
            non-interactive when not editing because the drawer is
            opacity:0 + pointerEvents:none. */}
        <div
          className="flex-none flex items-center justify-between px-2 py-1.5"
          style={{
            borderTop: "1px solid var(--pe-toolbar-border)",
          }}
        >
          {/* Cancel ─────────────────────────────────────────── */}
          <DrawerIconButton
            ariaLabel="Cancel and discard changes"
            onClick={() => editing && endEditing(false)}
            icon={<X className="w-5 h-5" strokeWidth={1.75} />}
          />

          {/* Align cluster ──────────────────────────────────── */}
          <div className="flex items-center gap-0.5">
            <DrawerIconButton
              ariaLabel="Align left"
              active={activeAlign === "left"}
              onClick={() => editing && handleSetAlign("left")}
              icon={<AlignLeft className="w-5 h-5" strokeWidth={1.75} />}
            />
            <DrawerIconButton
              ariaLabel="Align centre"
              active={activeAlign === "center"}
              onClick={() => editing && handleSetAlign("center")}
              icon={<AlignCenter className="w-5 h-5" strokeWidth={1.75} />}
            />
            <DrawerIconButton
              ariaLabel="Align right"
              active={activeAlign === "right"}
              onClick={() => editing && handleSetAlign("right")}
              icon={<AlignRight className="w-5 h-5" strokeWidth={1.75} />}
            />
            <DrawerIconButton
              ariaLabel="Justify"
              active={activeAlign === "justify"}
              onClick={() => editing && handleSetAlign("justify")}
              icon={<AlignJustify className="w-5 h-5" strokeWidth={1.75} />}
            />
          </div>

          {/* Commit ─────────────────────────────────────────── */}
          <CommitButton onClick={() => editing && endEditing(true)} />
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
