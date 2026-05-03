// src/components/photo-editor/context/EditorContext.tsx
//
// Editor state context. Wraps the editor reducer plus the history stack
// so any component in the tree can read state, dispatch actions, and
// trigger undo/redo without prop-drilling.
//
// History is bolted on top of the reducer here rather than inside it so
// the reducer stays pure and snapshot-friendly. Whenever an undoable
// action fires, we snapshot the *previous* project before applying the
// action, then dispatch.
//
// Session 7 changes:
//   • Coalescing: consecutive UPDATE_LAYER patches that modify `runs`
//     on the same layer within COALESCE_WINDOW_MS collapse into one
//     history entry. See history-coalesce.ts.
//   • LOAD_PROJECT clears the entire history stack — opening a saved
//     project starts a fresh undo timeline for that project.
//   • undo() / redo() use a synthesised LOAD_PROJECT that bypasses the
//     coalescer and the clearing branch (it goes through the base
//     reducer dispatch, not the wrapped one).

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createInitialEditorState,
  describeAction,
  editorReducer,
  isUndoable,
  type EditorAction,
} from "@/lib/photo-editor/canvas/state";
import {
  canRedo as historyCanRedo,
  canUndo as historyCanUndo,
  createEmptyHistory,
  redo as historyRedo,
  undo as historyUndo,
  type HistoryStack,
} from "@/lib/photo-editor/canvas/history";
import {
  emptyCoalesceState,
  pushWithCoalesce,
  type CoalesceState,
} from "@/lib/photo-editor/canvas/history-coalesce";
import type { EditorState, Project } from "@/lib/photo-editor/types";
import type Konva from "konva";

interface EditorContextValue {
  state: EditorState;
  dispatch: (action: EditorAction) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  /** Mutable ref to the on-page Konva stage. Assigned by CanvasStage on
   *  mount; consumed by EditorShell (thumbnail generation) and
   *  ExportPanel. Replaces the `Konva.stages[0]` global hack carried
   *  over from Session 7. */
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  /** Mutable ref to the inner viewport-transform Group that holds every
   *  rendered layer. Used by snap math (issue 7 — overhang rendering)
   *  to convert layer-local coordinates into project-pixel canvas
   *  coordinates regardless of the outer Stage size / position.
   *
   *  Mobile-fixes batch 2 (May 2026). Before this, the Konva Stage's
   *  scale was effectiveScale and consumers used `relativeTo: stage`
   *  to read project-pixel coords. Now the Stage covers the entire
   *  grey container at scale 1, and the viewport transform (scale +
   *  rotation + translate) lives on this Group instead — so callers
   *  must use `relativeTo: layerGroup` to get project-pixel coords. */
  layerGroupRef: React.MutableRefObject<Konva.Group | null>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  children,
  initialProject,
}: {
  children: ReactNode;
  initialProject?: Project;
}) {
  const [state, baseDispatch] = useReducer(
    editorReducer,
    initialProject,
    (proj) => createInitialEditorState(proj)
  );

  // History stack lives in a ref so we don't recreate it on every render.
  const historyRef = useRef<HistoryStack>(createEmptyHistory());
  // Coalesce state — same lifetime as the history ref.
  const coalesceRef = useRef<CoalesceState>(emptyCoalesceState());

  // canUndo / canRedo are mirrored into state so toolbar button enablement
  // is reactive. They're updated explicitly whenever historyRef mutates.
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const refreshHistoryFlags = useCallback(() => {
    setCanUndo(historyCanUndo(historyRef.current));
    setCanRedo(historyCanRedo(historyRef.current));
  }, []);

  // Latest project ref so dispatch never closes over a stale state.
  const projectRef = useRef(state.project);
  projectRef.current = state.project;

  // Stage ref — assigned by CanvasStage when it mounts, read by
  // EditorShell / ExportPanel. Lives here so consumers don't have to
  // thread refs through the component tree.
  const stageRef = useRef<Konva.Stage | null>(null);

  // Layer-group ref — assigned by CanvasStage when the inner viewport-
  // transform Group mounts. Issue 7: snap / selection math uses this
  // instead of stageRef as the project-pixel reference frame, since
  // the Stage now covers the entire grey area while project-pixel
  // coordinates live one level deeper inside the transform Group.
  const layerGroupRef = useRef<Konva.Group | null>(null);

  const dispatch = useCallback(
    (action: EditorAction) => {
      // LOAD_PROJECT clears the history — locked decision §8.4. The
      // user is intentionally moving away from the current timeline.
      // Note: undo/redo synthesise LOAD_PROJECT but they call
      // baseDispatch directly, so they bypass this branch.
      if (action.type === "LOAD_PROJECT") {
        historyRef.current = createEmptyHistory();
        coalesceRef.current = emptyCoalesceState();
        refreshHistoryFlags();
        baseDispatch(action);
        return;
      }
      if (isUndoable(action)) {
        const result = pushWithCoalesce(
          historyRef.current,
          coalesceRef.current,
          projectRef.current,
          action,
          describeAction(action)
        );
        historyRef.current = result.stack;
        coalesceRef.current = result.coalesce;
        refreshHistoryFlags();
      }
      // Non-undoable actions (SET_VIEWPORT, SET_SELECTION,
      // SET_RUN_SELECTION, etc.) intentionally do NOT reset the
      // coalesce window. SET_RUN_SELECTION fires after every keystroke
      // alongside the UPDATE_LAYER for the same edit; resetting on
      // every selection change would defeat coalescing for typing.
      baseDispatch(action);
    },
    [refreshHistoryFlags]
  );

  const undo = useCallback(() => {
    const result = historyUndo(historyRef.current, projectRef.current);
    if (!result) return;
    historyRef.current = result.stack;
    coalesceRef.current = emptyCoalesceState();
    refreshHistoryFlags();
    // Bypass the wrapped dispatch — we don't want to clear the history
    // we just modified or to push another snapshot.
    baseDispatch({ type: "LOAD_PROJECT", project: result.project });
  }, [refreshHistoryFlags]);

  const redo = useCallback(() => {
    const result = historyRedo(historyRef.current, projectRef.current);
    if (!result) return;
    historyRef.current = result.stack;
    coalesceRef.current = emptyCoalesceState();
    refreshHistoryFlags();
    baseDispatch({ type: "LOAD_PROJECT", project: result.project });
  }, [refreshHistoryFlags]);

  // Wire keyboard shortcuts: Cmd/Ctrl-Z = undo; Cmd/Ctrl-Shift-Z and
  // Cmd/Ctrl-Y = redo. Don't fire when the active element is an input
  // (the user is in the middle of editing a project name, etc.) — let
  // the OS-native edit-undo win there.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && isEditableTarget(target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const value = useMemo<EditorContextValue>(
    () => ({
      state,
      dispatch,
      undo,
      redo,
      canUndo,
      canRedo,
      stageRef,
      layerGroupRef,
    }),
    [state, dispatch, undo, redo, canUndo, canRedo],
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor must be used inside <EditorProvider>");
  }
  return ctx;
}

/** Convenience hook for components that only need the project. */
export function useProject(): Project {
  return useEditor().state.project;
}

function isEditableTarget(el: HTMLElement): boolean {
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}
