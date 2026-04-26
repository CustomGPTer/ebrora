// src/lib/photo-editor/fonts/custom-fonts-db.ts
//
// IndexedDB wrapper for paid-tier custom font uploads.
//
// Schema (per the handover):
//   database: "ebrora-photo-editor"
//   version:  2  (Session 7 — bumped from 1 to add the `projects` store
//                  for saved projects; custom-fonts data is preserved
//                  verbatim)
//   store:    "custom-fonts"
//   keyPath:  "id"   (id = `${family}::${variant}`)
//
// The database itself is opened by the shared module
// `saved-projects/idb.ts` so the upgrade transaction creates both
// stores in one shot regardless of which module triggers the open.
// Each record holds the full file bytes as a Blob plus enough metadata
// to re-register the font with document.fonts on the next page load.
// localStorage is unsuitable for this — .ttf files routinely exceed the
// 5 MB localStorage quota.

import {
  setCustomFonts,
  upsertCustomFont,
  removeCustomFontFromStore,
} from "./font-store";
//
// Public API:
//   • openDb() — opens (or upgrades) the database and resolves to an IDBDatabase
//   • listCustomFonts() — returns every record
//   • getCustomFont(id) — returns one record or null
//   • addCustomFont(record) — persists a single record (overwrites by id)
//   • removeCustomFont(id) — deletes a record
//   • ensureCustomFontLoaded(record) — registers a record's blob as a FontFace
//                                      under its real family name; idempotent
//   • loadAllCustomFonts() — bring-up: enumerates every record and registers
//                            them with document.fonts so the canvas engine
//                            can use them immediately
//
// Failure mode: every call resolves cleanly. If the user has IDB
// disabled (private mode in some browsers), opening fails — we surface
// that to the FontPanel which then falls back to "no custom fonts
// available". The editor itself stays usable.

import {
  openEditorDb,
  STORE_CUSTOM_FONTS as STORE_NAME,
} from "../saved-projects/idb";

export interface CustomFontRecord {
  /** `${family}::${variant}` — keyPath. */
  id: string;
  family: string;
  /** "regular" | "italic" | "700" | etc. v1 always uses "regular". */
  variant: string;
  filename: string;
  blob: Blob;
  addedAt: number;
}

// ─── Connection ─────────────────────────────────────────────────

/** Open the editor's IndexedDB. Delegates to the shared opener so the
 *  v1→v2 upgrade only runs once across the whole module graph. */
export function openDb(): Promise<IDBDatabase> {
  return openEditorDb();
}

// ─── Record operations ──────────────────────────────────────────

/** Build the canonical id for a family + variant. */
export function customFontId(family: string, variant: string): string {
  return `${family}::${variant}`;
}

export async function listCustomFonts(): Promise<CustomFontRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () =>
      resolve(((req.result as CustomFontRecord[]) ?? []).slice());
    req.onerror = () => reject(req.error);
  });
}

export async function getCustomFont(
  id: string,
): Promise<CustomFontRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () =>
      resolve(((req.result as CustomFontRecord | undefined) ?? null) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function addCustomFont(record: CustomFontRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  upsertCustomFont(record);
}

export async function removeCustomFont(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  removeCustomFontFromStore(id);
}

// ─── FontFace registration ──────────────────────────────────────

const registered = new Set<string>();

/** Register a record's blob as a FontFace under its real family name.
 *  Idempotent — repeated calls for the same record id are no-ops. */
export async function ensureCustomFontLoaded(
  record: CustomFontRecord,
): Promise<void> {
  if (typeof document === "undefined") return;
  if (registered.has(record.id)) return;

  let buffer: ArrayBuffer;
  try {
    buffer = await record.blob.arrayBuffer();
  } catch {
    return;
  }

  const isItalic = record.variant.endsWith("italic");
  const weightMatch = record.variant.match(/^(\d{3})/);
  const weight = weightMatch ? weightMatch[1] : "400";

  try {
    const face = new FontFace(record.family, buffer, {
      style: isItalic ? "italic" : "normal",
      weight,
      display: "swap",
    });
    const loaded = await face.load();
    (document as Document & { fonts: FontFaceSet }).fonts.add(loaded);
    registered.add(record.id);
  } catch (err) {
    console.warn(
      `[photo-editor] custom font registration failed: ${record.family}`,
      err,
    );
  }
}

/** Bring-up: enumerate every stored record and register each with
 *  document.fonts. Run once near the editor's mount so any custom
 *  fonts the user has previously uploaded are immediately paintable. */
export async function loadAllCustomFonts(): Promise<CustomFontRecord[]> {
  let records: CustomFontRecord[];
  try {
    records = await listCustomFonts();
  } catch (err) {
    console.warn("[photo-editor] custom font bring-up failed", err);
    setCustomFonts([]);
    return [];
  }
  await Promise.all(records.map((r) => ensureCustomFontLoaded(r)));
  setCustomFonts(records);
  return records;
}
