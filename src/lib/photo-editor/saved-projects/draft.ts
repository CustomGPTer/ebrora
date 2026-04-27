// src/lib/photo-editor/saved-projects/draft.ts
//
// Always-on draft persistence for the photo editor.
//
// Background: the original autosave (autosave.ts + EditorShell wiring)
// is gated behind savedProjectId !== null — meaning it only fires once
// the user has explicitly saved (and named) the project. That left a
// fundamental hole: a user could spend ten minutes editing, hit
// refresh, and lose everything because the project was never named.
//
// This module fills that hole. It piggy-backs on the existing
// SavedProject IndexedDB store but uses a reserved id, DRAFT_PROJECT_ID,
// so there is exactly one draft per browser at any time. listProjects()
// in db.ts filters this id out so it doesn't appear in the Projects
// modal or the home grid.
//
// Lifecycle:
//   • EditorShell schedules saveDraft() on every state.project change
//     (debounced inside the caller, no armed gate).
//   • EditorShell calls deleteDraft() the moment the project is
//     explicitly saved (it now lives in the real Projects store under
//     a real id) OR when the user exits the editor cleanly.
//   • EmptyState calls loadDraft() on mount; if a draft is present it
//     shows the RestoreDraftDialog. Yes → load it back into the editor.
//     No → deleteDraft() and continue.

import type { Project, SavedProject } from "../types";
import { openEditorDb, STORE_PROJECTS } from "./idb";
import { serializeSavedProject } from "./serialize";

/** Reserved id for the single draft record. Filtered out by
 *  listProjects() in db.ts so it never appears in user-facing project
 *  lists. */
export const DRAFT_PROJECT_ID = "__draft__";

/** Stable name for the draft's snapshot. We do NOT persist the draft
 *  under the user-visible project name because (a) drafts are usually
 *  unnamed and (b) we want the restore dialog to read "your last work"
 *  rather than a specific title that may never have been chosen. */
const DRAFT_SNAPSHOT_NAME = "Untitled draft";

/** Write the draft. Always succeeds at the call-site level — internal
 *  IDB errors are swallowed so a failed draft save never disrupts the
 *  user's editing flow. */
export async function saveDraft(project: Project): Promise<void> {
  try {
    const record: SavedProject = serializeSavedProject(project, {
      id: DRAFT_PROJECT_ID,
      name: project.name || DRAFT_SNAPSHOT_NAME,
      // Empty thumbnail — we never display the draft in a grid, and
      // generating one on every change would be expensive.
      thumbnail: "",
    });
    const db = await openEditorDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, "readwrite");
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("saveDraft put failed"));
    });
  } catch {
    // Intentional — draft save failure must never bubble up to the user.
  }
}

/** Load the draft if one exists, else null. Never throws. */
export async function loadDraft(): Promise<SavedProject | null> {
  try {
    const db = await openEditorDb();
    return await new Promise<SavedProject | null>((resolve) => {
      const tx = db.transaction(STORE_PROJECTS, "readonly");
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.get(DRAFT_PROJECT_ID);
      req.onsuccess = () =>
        resolve((req.result as SavedProject | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Delete the draft. Idempotent — succeeds whether or not a draft
 *  exists. Never throws. */
export async function deleteDraft(): Promise<void> {
  try {
    const db = await openEditorDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_PROJECTS, "readwrite");
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.delete(DRAFT_PROJECT_ID);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Same swallow pattern as saveDraft.
  }
}
