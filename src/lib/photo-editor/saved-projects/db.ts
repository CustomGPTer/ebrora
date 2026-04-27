// src/lib/photo-editor/saved-projects/db.ts
//
// CRUD for SavedProject records (Session 7).
//
// Schema lives in idb.ts. This module only knows the SavedProject shape
// and exposes typed getters / setters. List operations sort by
// updatedAt descending (MRU-first) using the index built in idb.ts.
//
// Session 8 addition: saveProject detects QuotaExceededError on the IDB
// transaction and re-throws as a typed StorageQuotaError so the caller
// (EditorShell save flow, autosaver) can surface a "delete some saved
// projects" dialog rather than a generic failure.

import type { SavedProject } from "../types";
import { openEditorDb, STORE_PROJECTS } from "./idb";
import { DRAFT_PROJECT_ID } from "./draft";

/** Thrown by saveProject when the browser's storage quota is exceeded.
 *  Caller should surface a dialog prompting the user to delete saved
 *  projects rather than retry. */
export class StorageQuotaError extends Error {
  constructor(message = "Browser storage is full.") {
    super(message);
    this.name = "StorageQuotaError";
  }
}

/** Save (insert or replace) a SavedProject. Returns the saved record.
 *  Throws StorageQuotaError when IndexedDB rejects the put with a
 *  quota-related DOMException. */
export async function saveProject(record: SavedProject): Promise<SavedProject> {
  const db = await openEditorDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, "readwrite");
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => {
      const err = req.error;
      if (isQuotaError(err)) {
        reject(new StorageQuotaError());
      } else {
        reject(err ?? new Error("saveProject put failed"));
      }
    };
    // Some browsers raise quota at transaction-abort time rather than
    // request-error time. Catch that path too.
    tx.onabort = () => {
      const err = tx.error;
      if (isQuotaError(err)) {
        reject(new StorageQuotaError());
      }
    };
  });
}

function isQuotaError(err: DOMException | null): boolean {
  if (!err) return false;
  return (
    err.name === "QuotaExceededError" ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    // Older WebKit reports it via the deprecated numeric code.
    err.code === 22
  );
}

/** Load a SavedProject by id. Resolves to null if not found. */
export async function loadProject(
  id: string,
): Promise<SavedProject | null> {
  const db = await openEditorDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, "readonly");
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.get(id);
    req.onsuccess = () =>
      resolve((req.result as SavedProject | undefined) ?? null);
    req.onerror = () =>
      reject(req.error ?? new Error("loadProject get failed"));
  });
}

/** List every saved project, MRU-first (most recently updated first). */
export async function listProjects(): Promise<SavedProject[]> {
  const db = await openEditorDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, "readonly");
    const store = tx.objectStore(STORE_PROJECTS);
    const index = store.index("updatedAt");
    const out: SavedProject[] = [];
    // openCursor with "prev" walks the index in descending order.
    const req = index.openCursor(null, "prev");
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        // Skip the reserved draft record — it has its own restore flow
        // (RestoreDraftDialog on home mount) and must never appear in
        // user-facing project lists.
        const value = cursor.value as SavedProject;
        if (value.id !== DRAFT_PROJECT_ID) {
          out.push(value);
        }
        cursor.continue();
      } else {
        resolve(out);
      }
    };
    req.onerror = () =>
      reject(req.error ?? new Error("listProjects cursor failed"));
  });
}

/** Delete a SavedProject by id. Resolves true if a record was removed,
 *  false if nothing existed at that id. */
export async function deleteProject(id: string): Promise<boolean> {
  const existing = await loadProject(id);
  if (!existing) return false;
  const db = await openEditorDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, "readwrite");
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () =>
      reject(req.error ?? new Error("deleteProject failed"));
  });
}

/** Count saved projects. Used to drive the soft-cap warning in the
 *  Projects modal. The reserved draft record is excluded so it doesn't
 *  inflate the user-visible count. */
export async function countProjects(): Promise<number> {
  const db = await openEditorDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, "readonly");
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.count();
    req.onsuccess = () => {
      // Subtract the draft if present. We can't filter at the count
      // level, so check existence with a separate get() — cheap because
      // it's keyed by primary id.
      const draftReq = store.get(DRAFT_PROJECT_ID);
      draftReq.onsuccess = () => {
        resolve(req.result - (draftReq.result ? 1 : 0));
      };
      draftReq.onerror = () => resolve(req.result);
    };
    req.onerror = () =>
      reject(req.error ?? new Error("countProjects failed"));
  });
}

/** Approximate the bytes used by saved projects in IndexedDB (Session 8).
 *  Sums `JSON.stringify(snapshot).length + thumbnail.length` across
 *  every record. Not a precise byte count (UTF-16 in-memory ≠ stored
 *  encoding) but accurate enough to drive the storage-usage display in
 *  the Projects modal. Always resolves; errors yield 0 so the UI
 *  degrades to "—" rather than crashing. */
export async function approximateStorageUsage(): Promise<number> {
  try {
    const all = await listProjects();
    let total = 0;
    for (const rec of all) {
      try {
        total += JSON.stringify(rec.snapshot).length;
      } catch {
        /* ignore unstringifiable record */
      }
      total += rec.thumbnail?.length ?? 0;
    }
    return total;
  } catch {
    return 0;
  }
}
