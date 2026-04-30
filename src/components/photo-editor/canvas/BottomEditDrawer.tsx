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
//     so the canvas reflects the new text immediately.
//   • Per-letter styling collapse: every keystroke replaces all runs
//     with a single run that carries the FIRST original run's style
//     fields. The desktop FormatPanel + selection-range path remains
//     intact for users who want per-letter control.
//   • Backdrop tap commits (matches iOS / Android keyboard convention).
//   • Cancel (X) rolls back via MobileEditContext.endEditing(false).
//
// Apr 2026 keyboard-pop fix (revision 3):
//
// The drawer is CONDITIONALLY RENDERED — mounted only when an edit
// session is active. The Add Text click handler (BottomDock,
// AddLayerSheet) wraps its state dispatches in `flushSync` so the
// drawer mounts SYNCHRONOUSLY inside the user-gesture handler. After
// flushSync returns, the textarea is in the DOM in its FINAL layout.
// The handler then calls focusForKeyboardPop, which focuses that
// textarea — still inside the same user gesture — and the OS pops
// the keyboard.
//
// Why this is better than the previous always-mounted-textarea +
// opacity:0 approach:
//   1. The textarea is in its final layout the moment focus() runs.
//      Both iOS Safari and Android Chrome bind the IME to the
//      element's layout snapshot at focus time; with no subsequent
//      layout transition, keystrokes reach the React-controlled
//      `value` reliably.
//   2. There's no offscreen 1×1 ghost element for taps to fall into
//      when not editing.
//   3. The drawer is unmounted between sessions, so no stale state
//      can leak across sessions.
//
// Android keyboard overlay handling (the "drawer disappears behind
// the keyboard" symptom):
//
// On modern Android Chrome (Android 13+), the on-screen keyboard
// defaults to OVERLAYS-CONTENT mode — it sits on top of the page
// without resizing the layout viewport. A naive `bottom: 0` puts
// the drawer behind the keyboard. We use `window.visualViewport`
// to compute the keyboard's height (layout viewport height minus
// visual viewport height) and offset the drawer's `bottom` by that
// amount, so it pins to the top edge of the keyboard regardless of
// which keyboard mode the OS / browser is in:
//
//   • Resizes mode (older Android, default iOS in some configs):
//     visualViewport.height ≈ window.innerHeight, offset = 0,
//     bottom = 0. Drawer sits at the resized viewport's bottom edge,
//     which is already above the keyboard. Correct.
//   • Overlays mode (modern Android Chrome): visualViewport.height
//     < window.innerHeight by the keyboard's height, offset > 0,
//     drawer pinned above the keyboard. Correct.
//
// We listen on visualViewport `resize` and `scroll` events to track
// the keyboard's animation in/out, so the drawer follows it smoothly.

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

  const layerId = mobileEdit.editingLayerId;
  const layer = useMemo<TextLayer | null>(() => {
    if (layerId === null) return null;
    const found = state.project.layers.find((l) => l.id === layerId);
    if (!found || found.kind !== "text") return null;
    return found as TextLayer;
  }, [layerId, state.project.layers]);

  // Local draft of the textarea — separate from layer.runs so we
  // don't fight controlled-input semantics with reducer dispatches.
  const [draft, setDraft] = useState<string>(() =>
    layer ? fullTextOf(layer) : "",
  );
  const lastLayerIdRef = useRef<string | null>(layer?.id ?? null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Keyboard offset (visualViewport tracking) ───────────────────
  // On Android Chrome 13+ the keyboard overlays the page rather than
  // resizing the layout viewport, so a naive `bottom: 0` puts the
  // drawer *behind* the keyboard. We track the visual viewport's
  // bottom edge and offset the drawer by however far it sits above
  // the layout viewport's bottom — that's the keyboard height.
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    function compute() {
      // window.innerHeight is the LAYOUT viewport height (full page).
      // visualViewport.height is the VISUAL viewport height (the
      // portion the user actually sees, minus the keyboard if it's
      // overlaying). The difference is the keyboard's height in
      // overlays mode; in resizes mode it's roughly 0 because
      // window.innerHeight already shrank with the keyboard.
      const layoutH = window.innerHeight;
      const visualH = vv!.height;
      // visualViewport.offsetTop catches some edge cases (e.g. when
      // the user pinch-zooms and scrolls the visual viewport); we
      // subtract it so the drawer doesn't drift away from the
      // keyboard's top edge.
      const offsetTop = vv!.offsetTop ?? 0;
      const next = Math.max(0, layoutH - visualH - offsetTop);
      setKeyboardOffset(next);
    }

    compute();
    vv.addEventListener("resize", compute);
    vv.addEventListener("scroll", compute);
    return () => {
      vv.removeEventListener("resize", compute);
      vv.removeEventListener("scroll", compute);
    };
  }, []);

  // Register the textarea with MobileEditContext so the Add Text
  // user-gesture handler (in BottomDock / AddLayerSheet) can call
  // focusForKeyboardPop on it after flushSync mounts the drawer.
  // The drawer is conditionally rendered, so this registration runs
  // each time an edit session begins.
  useEffect(() => {
    registerEditTextarea(textareaRef.current);
    return () => registerEditTextarea(null);
  }, [registerEditTextarea]);

  useEffect(() => {
    if (!layer) {
      lastLayerIdRef.current = null;
      setDraft("");
      return;
    }
    if (lastLayerIdRef.current !== layer.id) {
      // New editing session (or switched to a different layer) —
      // sync the draft from the layer's current text once.
      setDraft(fullTextOf(layer));
      lastLayerIdRef.current = layer.id;
      // The textarea is mounted (we're rendering) and (in the
      // Add Text path) already focused from the click handler's
      // synchronous focusForKeyboardPop call. We still re-focus and
      // place the caret at the end here to cover the "tap existing
      // text layer" path, which doesn't go through
      // focusForKeyboardPop. setTimeout(0) ensures the layout has
      // committed so the textarea is on-screen before we place the
      // caret.
      window.setTimeout(() => {
        const el = textareaRef.current;
        if (!el) return;
        if (document.activeElement !== el) {
          el.focus();
        }
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

  // Conditionally render — drawer is only mounted while a layer is
  // being edited. The Add Text click handler uses flushSync to
  // mount this synchronously inside the user gesture so the
  // textarea is available for focusForKeyboardPop in the same tick.
  if (!layer) return null;

  return (
    <>
      {/* Backdrop — tap to commit (mobile keyboard convention). */}
      <div
        className="fixed inset-0 z-[230]"
        style={{
          background: "transparent",
          pointerEvents: "auto",
        }}
        onClick={() => endEditing(true)}
        aria-hidden
      />

      {/* Drawer chrome — pinned to the top edge of the keyboard via
          visualViewport-derived `bottom` offset, NOT just bottom: 0.
          On Android Chrome's overlays-content mode this is the
          difference between visible drawer and drawer-behind-the-
          keyboard. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit text"
        className="fixed left-0 right-0 z-[231] flex flex-col"
        style={{
          bottom: keyboardOffset,
          background: "var(--pe-toolbar-bg)",
          borderTop: "1px solid var(--pe-toolbar-border)",
          boxShadow: "var(--pe-shadow-lg)",
          paddingBottom:
            keyboardOffset > 0
              ? "0px"
              : "env(safe-area-inset-bottom, 0px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="your text here"
            rows={1}
            className="w-full resize-none outline-none bg-transparent text-base leading-snug"
            style={{
              color: "var(--pe-text)",
              maxHeight: 200,
            }}
          />
        </div>

        {/* Controls row */}
        <div
          className="flex-none flex items-center justify-between px-2 py-1.5"
          style={{
            borderTop: "1px solid var(--pe-toolbar-border)",
          }}
        >
          {/* Cancel */}
          <DrawerIconButton
            ariaLabel="Cancel and discard changes"
            onClick={() => endEditing(false)}
            icon={<X className="w-5 h-5" strokeWidth={1.75} />}
          />

          {/* Align cluster */}
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

          {/* Commit */}
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
