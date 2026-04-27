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
  /** Phase 1 keyboard-pop fix:
   *  Focuses a permanently-mounted off-screen shadow textarea so iOS /
   *  Android pop the keyboard. Must be called synchronously inside a
   *  user-gesture handler (e.g. the Add Text button's onClick) BEFORE
   *  any state dispatch that would mount the real drawer. The drawer's
   *  own useEffect then transfers focus to its real textarea on the
   *  next render — focus moves between two inputs in the same task,
   *  so the OS keyboard stays open through the handover. */
  focusForKeyboardPop: () => void;
}

const MobileEditContext = createContext<MobileEditApi | null>(null);

export function MobileEditProvider({ children }: { children: ReactNode }) {
  const { state: editorState, dispatch } = useEditor();
  const [state, setState] = useState<MobileEditState>({
    editingLayerId: null,
    isFresh: false,
    originalRuns: null,
  });
  // Permanent shadow textarea ref — only the shim binds to this. The
  // real BottomEditDrawer textarea uses its own local ref so unmounting
  // the drawer doesn't null this one out.
  const shadowRef = useRef<HTMLTextAreaElement | null>(null);

  const focusForKeyboardPop = useCallback(() => {
    const el = shadowRef.current;
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
    }),
    [state, beginEditing, endEditing, focusForKeyboardPop],
  );

  return (
    <MobileEditContext.Provider value={value}>
      {/*
        Phase 1 keyboard-pop shim:
        A permanently-mounted, off-screen <textarea>. focusForKeyboardPop
        focuses this when the user taps "Add Text", popping the OS
        keyboard. The real BottomEditDrawer textarea isn't in the DOM at
        that moment (drawer is conditionally rendered). When the drawer
        mounts a tick later, its existing useEffect focuses its real
        textarea — focus transfers between two inputs in the same task,
        so the keyboard stays open through the handover.
      */}
      <textarea
        ref={shadowRef}
        aria-hidden="true"
        tabIndex={-1}
        // No readOnly — iOS may suppress the on-screen keyboard for
        // read-only inputs, which would defeat the whole shim. The
        // pointer-events: none + off-screen positioning prevent the
        // user from typing into it accidentally.
        style={{
          position: "fixed",
          left: -10000,
          top: -10000,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
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
