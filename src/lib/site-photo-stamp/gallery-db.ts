// src/lib/site-photo-stamp/gallery-db.ts
//
// IndexedDB data layer for stamped photo records.
//
// Single object store, keyed by record ID. Values are the full StampedRecord
// including imageBlob + thumbnailBlob — IndexedDB handles Blobs natively, so
// there's no base64 encoding required.
//
// All functions are safe to call on the server (return zero / no-op) so
// imports from server components don't crash.

import type { StampedRecord } from "./types";

const DB_NAME = "ebrora-site-photo-stamp";
const DB_VERSION = 1;
const STORE = "records";

/** Hard cap — storage-friendly limit per device. */
export const MAX_RECORDS = 500;
/** Show a banner once the user is within this many of the cap. */
export const WARN_THRESHOLD = 400;

// ─── DB handle cache ────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
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
  mode: IDBTransactionMode
): Promise<{ db: IDBDatabase; store: IDBObjectStore; transaction: IDBTransaction }> {
  return openDb().then((db) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
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
