// src/lib/site-photo-stamp/gallery-db.ts
//
// IndexedDB data layer for Site Photo Stamp.
//
// Two object stores share a single database:
//   • "records"        — stamped photo records (keyed by record id).
//   • "bulk-session"   — single-row "current" bulk-mode session so the
//                        user's pending photos, notes, and template
//                        selection can survive browser refresh for 2h.
//
// Values in both stores carry Blobs directly — IndexedDB handles Blobs
// natively with no base64 encoding, so storage cost is the raw image size.
//
// All functions are safe to call on the server (return zero / no-op) so
// imports from server components don't crash.

import type { StampedRecord, TemplateId, VariantId } from "./types";

const DB_NAME = "ebrora-site-photo-stamp";
const DB_VERSION = 2;
const STORE = "records";
const BULK_STORE = "bulk-session";

/** Hard cap — storage-friendly limit per device. */
export const MAX_RECORDS = 500;
/** Show a banner once the user is within this many of the cap. */
export const WARN_THRESHOLD = 400;

/** Bulk sessions older than this are discarded on read. */
export const BULK_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ─── DB handle cache ────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      // Version 1 → create the records store. Still run for fresh installs.
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
      // Version 2 → add bulk-session store. Safe for upgrades from v1
      // (existing records untouched) and fresh installs (both stores
      // created in one transaction).
      if (!db.objectStoreNames.contains(BULK_STORE)) {
        db.createObjectStore(BULK_STORE, { keyPath: "id" });
      }
      // Future versions: check event.oldVersion and branch as needed.
      void event;
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error("IndexedDB open failed"));
    };
    req.onblocked = () => {
      // Another tab has the DB open at an older version — unlikely since we
      // never bump version without a migration, but guard anyway.
      dbPromise = null;
      reject(new Error("IndexedDB blocked by another tab"));
    };
  });

  return dbPromise;
}

// ─── Helpers ────────────────────────────────────────────────────

function tx(
  mode: IDBTransactionMode,
  storeName: string = STORE
): Promise<{ db: IDBDatabase; store: IDBObjectStore; transaction: IDBTransaction }> {
  return openDb().then((db) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    return { db, store, transaction };
  });
}

function asPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IDB request failed"));
  });
}

// ─── Public API ─────────────────────────────────────────────────

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export class GalleryFullError extends Error {
  constructor() {
    super(`Gallery is full (${MAX_RECORDS} records). Delete some to make room.`);
    this.name = "GalleryFullError";
  }
}

/** Save a record. Rejects with GalleryFullError or QuotaExceededError. */
export async function saveRecord(record: StampedRecord): Promise<void> {
  const existing = await countRecords();
  // If record.id isn't already in the DB and we're at the cap, reject.
  if (existing >= MAX_RECORDS) {
    const already = await getRecord(record.id);
    if (!already) throw new GalleryFullError();
  }

  try {
    const { store, transaction } = await tx("readwrite");
    store.put(record);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Transaction failed"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Transaction aborted"));
    });
  } catch (err) {
    // Safari throws QuotaExceededError here when device storage is full.
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      throw new QuotaExceededError(
        "Your device storage is full. Free up some space or delete older records."
      );
    }
    throw err;
  }
}

/** Return all records, sorted newest-first. */
export async function listRecords(): Promise<StampedRecord[]> {
  const { store } = await tx("readonly");
  const all = await asPromise(store.getAll());
  // Defensive: filter out corrupted rows (missing required fields).
  const valid = (all as StampedRecord[]).filter(
    (r) => r && r.id && r.imageBlob && r.thumbnailBlob && r.createdAt
  );
  valid.sort((a, b) => b.createdAt - a.createdAt);
  return valid;
}

/** Count records without loading blobs. */
export async function countRecords(): Promise<number> {
  try {
    const { store } = await tx("readonly");
    return await asPromise(store.count());
  } catch {
    return 0;
  }
}

/** Fetch a single record. */
export async function getRecord(id: string): Promise<StampedRecord | null> {
  const { store } = await tx("readonly");
  const r = await asPromise(store.get(id));
  return (r as StampedRecord | undefined) ?? null;
}

/** Delete one record. No-op if it doesn't exist. */
export async function deleteRecord(id: string): Promise<void> {
  const { store, transaction } = await tx("readwrite");
  store.delete(id);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Delete failed"));
  });
}

/** Wipe the entire gallery. */
export async function clearAll(): Promise<void> {
  const { store, transaction } = await tx("readwrite");
  store.clear();
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Clear failed"));
  });
}

/** Best-effort storage-usage estimate in bytes. */
export async function estimateUsage(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
    const e = await navigator.storage.estimate();
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
  } catch {
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// Bulk session persistence
// ════════════════════════════════════════════════════════════════
//
// The bulk-session store holds exactly one row, keyed by the literal
// string "current". Its purpose is to let a user's in-progress bulk
// batch survive a browser refresh / tab close / phone lock for up to
// 2 hours — because losing 20 pre-picked photos to an accidental
// navigation is a brutal UX failure on a mobile site tool.
//
// What's persisted:
//   • Each pending photo's raw Blob (+ original filename) so we can
//     rehydrate the File list exactly as it was.
//   • The global bulk note text.
//   • Per-photo note overrides (keyed by pending id).
//   • The template + variant selected at save time.
//   • lastEditAt — epoch ms of the most recent user action. Anything
//     older than BULK_SESSION_TTL_MS on read is deleted and treated
//     as absent.
//
// What's NOT persisted:
//   • Ephemeral URL.createObjectURL thumbnails — these are re-created
//     from the restored Blob on rehydrate.
//   • Progress state — a refresh mid-stamp is fine, we just restart
//     from whatever photos are still in the session.
//
// Partial-stamp handling: the caller is expected to remove successfully
// stamped photos from the session after each one succeeds (via
// updateBulkSession). That way a refresh mid-batch restores only the
// photos that haven't been stamped yet, with notes intact.

export interface BulkSessionPhoto {
  id: string;
  /** Raw image bytes. Blob, not base64 — IDB stores this natively. */
  blob: Blob;
  /** Original filename (for display + filename hint on stamp). */
  name: string;
  /** Per-photo note override. Empty / undefined means "use global note". */
  note?: string;
}

export interface BulkSession {
  /** Always the literal string "current" — there is only ever one session. */
  id: "current";
  photos: BulkSessionPhoto[];
  globalNote: string;
  templateId: TemplateId;
  variantId: VariantId;
  /** Epoch ms of the last user-initiated change. Drives the 2h TTL. */
  lastEditAt: number;
}

const BULK_KEY = "current";

/**
 * Save (or replace) the bulk session. Caller is responsible for setting
 * `lastEditAt = Date.now()` before calling — this function does not
 * touch it so callers can opt in/out of resetting the TTL if needed.
 *
 * On storage-full errors returns false instead of throwing so caller
 * can decide whether to drop photos and persist metadata-only.
 */
export async function saveBulkSession(session: BulkSession): Promise<boolean> {
  try {
    const { store, transaction } = await tx("readwrite", BULK_STORE);
    store.put({ ...session, id: BULK_KEY });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Bulk save failed"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Bulk save aborted"));
    });
    return true;
  } catch (err) {
    // Storage full — likely iOS hitting its ~6% quota ceiling. Let the
    // caller try again without the Blobs (metadata-only salvage) if they
    // want. We do NOT retry automatically — that's a UX decision.
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      return false;
    }
    // Other errors: treat as non-fatal. The UI still works without the
    // session restore feature; the user loses at most 2 hours of recovery.
    return false;
  }
}

/**
 * Load the bulk session, if one exists and is within TTL.
 *
 * If the stored session is past BULK_SESSION_TTL_MS, it's silently
 * deleted and null is returned. Caller sees an empty bulk screen.
 */
export async function loadBulkSession(): Promise<BulkSession | null> {
  try {
    const { store } = await tx("readonly", BULK_STORE);
    const raw = (await asPromise(store.get(BULK_KEY))) as BulkSession | undefined;
    if (!raw) return null;

    // Defensive shape check — if anything looks wrong (e.g. schema drift
    // from a future version, or corrupted entry), drop it.
    if (
      raw.id !== BULK_KEY ||
      !Array.isArray(raw.photos) ||
      typeof raw.lastEditAt !== "number"
    ) {
      await clearBulkSession();
      return null;
    }

    if (Date.now() - raw.lastEditAt > BULK_SESSION_TTL_MS) {
      await clearBulkSession();
      return null;
    }

    return raw;
  } catch {
    return null;
  }
}

/** Delete the bulk session. No-op if none exists. */
export async function clearBulkSession(): Promise<void> {
  try {
    const { store, transaction } = await tx("readwrite", BULK_STORE);
    store.delete(BULK_KEY);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Bulk clear failed"));
    });
  } catch {
    // Swallow — worst case is the session times out in 2h anyway.
  }
}
