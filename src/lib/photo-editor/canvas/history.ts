// src/lib/photo-editor/canvas/history.ts
//
// In-memory undo/redo stack of project snapshots.
//
// Implementation: separate past[] and future[] arrays. On every
// undoable action the *previous* project is pushed to past[] and
// future[] is cleared. On undo, pop from past[] and push current
// to future[]. On redo, the inverse.
//
// Capped at 100 entries to bound memory. Even with hundreds of
// layers, a serialised project is normally under a megabyte, so
// 100 entries fits comfortably in browser memory for an active
// session.

import type { HistorySnapshot, Project } from "../types";

const HISTORY_LIMIT = 100;

export interface HistoryStack {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
}

export function createEmptyHistory(): HistoryStack {
  return { past: [], future: [] };
}

/** Push a snapshot onto past[] and clear future[]. */
export function pushHistory(
  stack: HistoryStack,
  project: Project,
  label: string
): HistoryStack {
  const snapshot: HistorySnapshot = {
    project,
    label,
    timestamp: Date.now(),
  };
  const past = [...stack.past, snapshot].slice(-HISTORY_LIMIT);
  return { past, future: [] };
}

/** Undo: pop from past[], push current onto future[]. Returns null if nothing to undo. */
export function undo(
  stack: HistoryStack,
  current: Project
): { stack: HistoryStack; project: Project; label: string } | null {
  if (stack.past.length === 0) return null;
  const last = stack.past[stack.past.length - 1];
  const newPast = stack.past.slice(0, -1);
  const newFuture = [
    ...stack.future,
    { project: current, label: last.label, timestamp: Date.now() },
  ].slice(-HISTORY_LIMIT);
  return {
    stack: { past: newPast, future: newFuture },
    project: last.project,
    label: last.label,
  };
}

/** Redo: pop from future[], push current onto past[]. Returns null if nothing to redo. */
export function redo(
  stack: HistoryStack,
  current: Project
): { stack: HistoryStack; project: Project; label: string } | null {
  if (stack.future.length === 0) return null;
  const next = stack.future[stack.future.length - 1];
  const newFuture = stack.future.slice(0, -1);
  const newPast = [
    ...stack.past,
    { project: current, label: next.label, timestamp: Date.now() },
  ].slice(-HISTORY_LIMIT);
  return {
    stack: { past: newPast, future: newFuture },
    project: next.project,
    label: next.label,
  };
}

export function canUndo(stack: HistoryStack): boolean {
  return stack.past.length > 0;
}

export function canRedo(stack: HistoryStack): boolean {
  return stack.future.length > 0;
}
