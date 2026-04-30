// src/components/photo-editor/context/MobileEditContext.tsx
//
// Mobile text-editing state. Tracks which TextLayer is currently open
// in the BottomEditDrawer plus the snapshot needed to roll back the
// edit on cancel.
//
// Why a separate context (and not the editor reducer)?
// The reducer's job is project state (project, selection, viewport). The
// drawer's open/closed state is transient UI — putting it in the
// reducer would mean snapshotting it in the history stack and
// serialising it with saved projects, neither of which makes sense for
// a "currently open keyboard sheet" flag.
//
// Why not React state in EditorShell with prop-drilling?
// The drawer's beginEditing handler is called from three spots — the
// LayerRenderer (tap on text), the BottomDock (Add Text button), and
// the AddLayerSheet (+ menu Add Text). Two of those are siblings of
// the canvas tree and one lives inside it. Drilling a callback through
// CanvasShell → CanvasStage → LayerRenderer is the kind of plumbing a
// Context exists to remove.
//
// State machine (states):
//   idle            editingLayerId = null
//   editing-fresh   layer was just created via Add Text, runs[0].text
//                   is empty. Cancel → REMOVE_LAYER (the layer never
//                   gained content, so we tidy up).
//   editing-existing layer existed before this edit session. Cancel →
//                   restore originalRuns via UPDATE_LAYER. Commit →
//                   keep current state (the drawer dispatches
//                   UPDATE_LAYER live on each keystroke, so the canvas
//                   already reflects the new text).
//
// Transitions:
//   beginEditing(id, { isFresh: true })  Add Text path
//   beginEditing(id)                     Tap on existing text path
//   endEditing(commit=true)              → idle, keep changes
//   endEditing(commit=false)             → idle, rollback or delete
//
// Switching layers (user taps text B while B is open) auto-commits A
// (its live updates are already on the canvas) and opens B fresh. If
// A was fresh-empty, A is also tidied up at the same time.

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useEditor } from "./EditorContext";
import type { GlyphRun, Id, TextLayer } from "@/lib/photo-editor/types";

interface MobileEditState {
  /** id of the text layer currently being edited via BottomEditDrawer.
   *  null means the drawer is closed. */
  editingLayerId: Id | null;
  /** True when this edit session was opened by Add Text (the layer
   *  started life empty). Drives cancel-deletes-layer behaviour. */
  isFresh: boolean;
  /** Snapshot of the layer's runs at the start of the edit session.
   *  Used by cancel to restore. null when isFresh (nothing to roll
   *  back to). */
  originalRuns: GlyphRun[] | null;
}

interface MobileEditApi {
  state: MobileEditState;
  /** Open the drawer for `layerId`. If a different layer is already
   *  open, that layer's edits are kept (already live on the canvas)
   *  and the drawer transitions to the new layer. If the previous
   *  layer was fresh-empty, it is removed at the same time. */
  beginEditing: (layerId: Id, opts?: { isFresh?: boolean }) => void;
  /** Close the drawer. commit=true keeps the live-edited state.
   *  commit=false rolls back: either restore originalRuns (existing
   *  layer) or REMOVE_LAYER (fresh layer). */
  endEditing: (commit: boolean) => void;
  /** Apr 2026 keyboard-pop fix:
   *  Focuses the BottomEditDrawer's permanently-mounted textarea so
   *  iOS / Android pop the on-screen keyboard. Must be called
   *  synchronously inside a user-gesture handler (e.g. the Add Text
   *  button's onClick) BEFORE any state dispatch. The same element is
   *  later used to receive the user's typed input — there is no
   *  focus handover, no shadow shim, no setTimeout race. */
  focusForKeyboardPop: () => void;
  /** Called by BottomEditDrawer on mount to register its textarea
   *  element with the provider. focusForKeyboardPop targets whatever
   *  is registered here. There is exactly one drawer instance in the
   *  editor tree, so this is effectively a singleton ref. */
  registerEditTextarea: (el: HTMLTextAreaElement | null) => void;
}

const MobileEditContext = createContext<MobileEditApi | null>(null);

export function MobileEditProvider({ children }: { children: ReactNode }) {
  const { state: editorState, dispatch } = useEditor();
  const [state, setState] = useState<MobileEditState>({
    editingLayerId: null,
    isFresh: false,
    originalRuns: null,
  });
  // The BottomEditDrawer's permanently-mounted textarea registers
  // itself here on mount. focusForKeyboardPop targets this element
  // directly — same element used for keyboard-pop AND user typing,
  // so there is no focus handover that the OS keyboard could fail
  // to follow.
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const registerEditTextarea = useCallback(
    (el: HTMLTextAreaElement | null) => {
      editTextareaRef.current = el;
    },
    [],
  );

  const focusForKeyboardPop = useCallback(() => {
    const el = editTextareaRef.current;
    if (!el) return;
    // Synchronous focus inside a user gesture — pops the OS keyboard
    // on iOS Safari and Android Chrome. Async focus (setTimeout, ref
    // callback in a useEffect) is silently ignored by both browsers.
    el.focus();
  }, []);

  const beginEditing = useCallback(
    (layerId: Id, opts?: { isFresh?: boolean }) => {
      const project = editorState.project;
      const targetLayer = project.layers.find((l) => l.id === layerId);
      if (!targetLayer || targetLayer.kind !== "text") {
        // Defensive — shouldn't happen, but better to ignore than blow
        // up the editor if a stale id is passed in (e.g. a tap fires
        // after the layer was removed by another path).
        return;
      }

      // Auto-tidy if we're transitioning away from a fresh-empty layer.
      setState((prev) => {
        if (
          prev.editingLayerId !== null &&
          prev.editingLayerId !== layerId &&
          prev.isFresh
        ) {
          const previousLayer = project.layers.find(
            (l) => l.id === prev.editingLayerId,
          );
          if (
            previousLayer &&
            previousLayer.kind === "text" &&
            fullTextOf(previousLayer) === ""
          ) {
            dispatch({ type: "REMOVE_LAYER", id: prev.editingLayerId });
          }
        }
        return {
          editingLayerId: layerId,
          isFresh: opts?.isFresh ?? false,
          // Clone the runs so future UPDATE_LAYER patches don't
          // mutate our snapshot.
          originalRuns:
            opts?.isFresh
              ? null
              : (targetLayer as TextLayer).runs.map((r) => ({ ...r })),
        };
      });

      // Make the editing layer the sole selection — keeps the user's
      // mental model "what I'm editing is what's selected" and feeds
      // the (Batch 4) selection-handle overlay correctly.
      dispatch({ type: "SET_SELECTION", ids: [layerId] });
    },
    [editorState.project, dispatch],
  );

  const endEditing = useCallback(
    (commit: boolean) => {
      setState((prev) => {
        if (prev.editingLayerId === null) return prev;
        if (!commit) {
          if (prev.isFresh) {
            // Fresh layer never gained content (or user wants to discard
            // even what they typed) — remove it entirely.
            dispatch({ type: "REMOVE_LAYER", id: prev.editingLayerId });
          } else if (prev.originalRuns !== null) {
            // Roll back to the snapshot.
            dispatch({
              type: "UPDATE_LAYER",
              id: prev.editingLayerId,
              patch: { runs: prev.originalRuns },
            });
          }
        }
        return {
          editingLayerId: null,
          isFresh: false,
          originalRuns: null,
        };
      });
    },
    [dispatch],
  );

  const value = useMemo<MobileEditApi>(
    () => ({
      state,
      beginEditing,
      endEditing,
      focusForKeyboardPop,
      registerEditTextarea,
    }),
    [
      state,
      beginEditing,
      endEditing,
      focusForKeyboardPop,
      registerEditTextarea,
    ],
  );

  return (
    <MobileEditContext.Provider value={value}>
      {/* Apr 2026 — the focus-pop "shim" textarea has been removed.
          The BottomEditDrawer's own textarea is now permanently
          mounted (offscreen until the user starts editing) and
          registers itself with this provider via registerEditTextarea.
          focusForKeyboardPop targets that real textarea directly, so
          there is no fragile focus handover after the keyboard is
          already open — same element pops the keyboard and receives
          the typed input. */}
      {children}
    </MobileEditContext.Provider>
  );
}

export function useMobileEdit(): MobileEditApi {
  const ctx = useContext(MobileEditContext);
  if (!ctx) {
    throw new Error(
      "useMobileEdit must be used inside <MobileEditProvider>",
    );
  }
  return ctx;
}

/** Returns the full text of a TextLayer by concatenating every run's
 *  `text` field. Used for the drawer's pre-fill and for empty checks. */
export function fullTextOf(layer: TextLayer): string {
  return layer.runs.map((r) => r.text).join("");
}
