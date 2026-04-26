// src/lib/photo-editor/canvas/history-coalesce.ts
//
// History coalescing logic (Session 7).
//
// Without coalescing, every keystroke into a text layer pushes a
// separate undo entry — typing "Hello world" produces 11 entries and
// undoing once removes a single character. Coalescing collapses runs
// of related edits within a short window into a single undo entry.
//
// Rules (locked in HANDOVER-5 §8.4):
//   • Two consecutive UPDATE_LAYER patches that both modify `runs` on
//     the SAME layer, fired within COALESCE_WINDOW_MS, collapse into
//     one history entry.
//   • All other UPDATE_LAYER patches always create a new entry.
//   • SET_RUN_SELECTION never creates a history entry (already non-
//     undoable per state.ts).
//   • SET_VIEWPORT never creates a history entry (added in Session 7).
//   • LOAD_PROJECT clears the history stack — handled in EditorContext,
//     not here.
//   • Erase strokes within one pointer-down → pointer-up gesture
//     collapse into one entry. EraseTool already commits all pending
//     strokes in a single UPDATE_LAYER dispatch on Done, so this rule
//     is satisfied automatically with no special-casing here.
//
// Coalescing semantics: when a new action coalesces with the previous
// one, we DO NOT push a new snapshot. The earlier snapshot (which
// captures the project state BEFORE any of the coalesced actions) is
// what undo will restore — exactly what the user expects. The window
// timestamp slides forward so a continuous stream of edits keeps
// coalescing.

import type { Project } from "../types";
import { pushHistory, type HistoryStack } from "./history";
import type { EditorAction } from "./state";

export const COALESCE_WINDOW_MS = 1000;

/** State carried across dispatches to drive coalescing decisions. */
export interface CoalesceState {
  /** Coalesce key of the previous undoable action, or null. */
  lastKey: string | null;
  /** Timestamp at which the coalesce window for `lastKey` started or
   *  was last extended. */
  lastTime: number;
}

export function emptyCoalesceState(): CoalesceState {
  return { lastKey: null, lastTime: 0 };
}

/** Returns a coalesce key for an action, or null if the action should
 *  never coalesce (always pushes its own entry). */
export function coalesceKey(action: EditorAction): string | null {
  if (action.type !== "UPDATE_LAYER") return null;
  // Only `runs` patches coalesce. Style/transform/erase patches each
  // get their own undo entry.
  const patch = action.patch as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(patch, "runs")) return null;
  return `UPDATE_LAYER:${action.id}:runs`;
}

/** Decide what to do for a new undoable action. Either pushes a fresh
 *  snapshot onto the stack, or merges into the previous entry by
 *  skipping the push and sliding the window forward.
 *
 *  Returns the new (stack, coalesce) pair so the caller can keep both
 *  refs in sync. */
export function pushWithCoalesce(
  stack: HistoryStack,
  prev: CoalesceState,
  project: Project,
  action: EditorAction,
  label: string,
  now: number = Date.now(),
): { stack: HistoryStack; coalesce: CoalesceState } {
  const key = coalesceKey(action);
  const inWindow = now - prev.lastTime <= COALESCE_WINDOW_MS;
  const sameKey = key !== null && key === prev.lastKey;
  const haveExistingEntry = stack.past.length > 0;

  if (sameKey && inWindow && haveExistingEntry) {
    // Merge: skip the push, slide the window forward.
    return {
      stack,
      coalesce: { lastKey: key, lastTime: now },
    };
  }

  return {
    stack: pushHistory(stack, project, label),
    coalesce: { lastKey: key, lastTime: now },
  };
}
