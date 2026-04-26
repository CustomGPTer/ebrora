// src/lib/photo-editor/saved-projects/idb.ts
//
// Shared IndexedDB connection for the photo editor (Session 7).
//
// Owns the database `ebrora-photo-editor` and the schema migration
// from v1 → v2. Two object stores:
//
//   v1  custom-fonts   keyPath: "id"
//   v2  custom-fonts   keyPath: "id"      (unchanged from v1)
//       projects       keyPath: "id"      (added in v2)
//
// Both `custom-fonts-db.ts` (Sessions 1–6) and `db.ts` (saved projects,
// Session 7) call into this shared opener so the upgrade transaction
// runs exactly once regardless of which module triggers the open. The
// upgrade handler must be tolerant of being entered at oldVersion 0
// (fresh install) or oldVersion 1 (existing user upgrading from
// pre-Session-7).
//
// The handler is intentionally idempotent: each store is created only
// if it doesn't already exist. That lets the same code run on both
// fresh installs and incremental upgrades without branching.
//
// Failure mode: if IndexedDB is unavailable (private browsing on some
// browsers, storage quota exhausted, etc.) we surface a rejected
// promise. Callers — listCustomFonts, listProjects, etc. — catch and
// either return an empty result or surface a UI-level "saved projects
// unavailable" state.

export const DB_NAME = "ebrora-photo-editor";
export const DB_VERSION = 2;

export const STORE_CUSTOM_FONTS = "custom-fonts";
export const STORE_PROJECTS = "projects";

let dbPromise: Promise<IDBDatabase> | null = null;

/** Open (or upgrade) the editor's IndexedDB. Memoised across the page
 *  lifetime — repeat calls return the same connection. */
export function openEditorDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      // Idempotent store creation — runs on fresh installs (oldVersion
      // 0) and on the v1 → v2 upgrade. Existing custom-fonts data is
      // preserved because the store is left in place when it already
      // exists.
      if (!db.objectStoreNames.contains(STORE_CUSTOM_FONTS)) {
        db.createObjectStore(STORE_CUSTOM_FONTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const projects = db.createObjectStore(STORE_PROJECTS, {
          keyPath: "id",
        });
        // Index by updatedAt so the Projects modal can list MRU-first
        // without sorting in memory for large libraries.
        projects.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };

    req.onsuccess = () => {
      const db = req.result;
      // Reset memoised promise if the DB ever closes (e.g. another tab
      // triggered an upgrade and forced ours closed).
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        // Another tab is upgrading. Close ours so the upgrade can
        // complete.
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error("IndexedDB open failed"));
    };

    req.onblocked = () => {
      dbPromise = null;
      reject(new Error("IndexedDB open blocked by another tab"));
    };
  });

  return dbPromise;
}

/** Test-only: drop the memoised connection so the next call re-opens.
 *  Not used in production; provided for the typecheck workspace and
 *  any future test harness. */
export function _resetEditorDbForTests(): void {
  dbPromise = null;
}
