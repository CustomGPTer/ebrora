// src/lib/photo-editor/fonts/font-store.ts
//
// React-aware cache that mirrors the loaders in load-google-font.ts and
// custom-fonts-db.ts. Components consume it via useSyncExternalStore and
// re-render when an async load completes — no prop drilling, no
// per-component state machines.
//
// Three pieces of state:
//   • menuLoaded — set of families whose menu-subset font has loaded
//   • variantLoaded — set of `${family}::${variant}` keys whose full
//     variant has loaded (used by the canvas engine, plus the panel for
//     "applying…" UI)
//   • customFonts — array of CustomFontRecord, the user's IDB-uploaded
//     fonts. Initialised by loadAllCustomFonts() on editor mount;
//     mutated on upload / remove from the FontPanel.
//
// Snapshot stability: we replace the underlying reference (new Set, new
// array) on every change, so getSnapshot returns a stable reference
// between changes. React's useSyncExternalStore is happy with that.

"use client";

import { useSyncExternalStore } from "react";
import type { CustomFontRecord } from "./custom-fonts-db";

// ─── State ──────────────────────────────────────────────────────

let menuLoadedSnapshot: ReadonlySet<string> = new Set();
let variantLoadedSnapshot: ReadonlySet<string> = new Set();
let customFontsSnapshot: ReadonlyArray<CustomFontRecord> = [];

const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ─── Mutations (called by loaders, not components) ──────────────

export function markMenuLoaded(family: string): void {
  if (menuLoadedSnapshot.has(family)) return;
  const next = new Set(menuLoadedSnapshot);
  next.add(family);
  menuLoadedSnapshot = next;
  emit();
}

export function markVariantLoaded(family: string, variant: string): void {
  const key = `${family}::${variant}`;
  if (variantLoadedSnapshot.has(key)) return;
  const next = new Set(variantLoadedSnapshot);
  next.add(key);
  variantLoadedSnapshot = next;
  emit();
}

/** Replace the entire custom-fonts list. Used after a bring-up, an
 *  upload, or a deletion. */
export function setCustomFonts(records: CustomFontRecord[]): void {
  customFontsSnapshot = records.slice();
  emit();
}

/** Append or replace a single custom font record by id. */
export function upsertCustomFont(record: CustomFontRecord): void {
  const existing = customFontsSnapshot.findIndex((r) => r.id === record.id);
  const next = customFontsSnapshot.slice();
  if (existing >= 0) next[existing] = record;
  else next.push(record);
  customFontsSnapshot = next;
  emit();
}

/** Remove a single custom font record by id. No-op if missing. */
export function removeCustomFontFromStore(id: string): void {
  const idx = customFontsSnapshot.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const next = customFontsSnapshot.slice();
  next.splice(idx, 1);
  customFontsSnapshot = next;
  emit();
}

// ─── Snapshot accessors ─────────────────────────────────────────

function getMenuLoaded(): ReadonlySet<string> {
  return menuLoadedSnapshot;
}
function getVariantLoaded(): ReadonlySet<string> {
  return variantLoadedSnapshot;
}
function getCustomFonts(): ReadonlyArray<CustomFontRecord> {
  return customFontsSnapshot;
}

// Stable empty references for the SSR snapshot — useSyncExternalStore
// requires the server snapshot to be referentially stable across calls
// during hydration.
const SSR_EMPTY_SET: ReadonlySet<string> = new Set();
const SSR_EMPTY_ARRAY: ReadonlyArray<CustomFontRecord> = [];

// ─── Hooks ──────────────────────────────────────────────────────

/** True if the menu-subset font for `family` has been loaded. */
export function useIsMenuLoaded(family: string): boolean {
  const set = useSyncExternalStore(
    subscribe,
    getMenuLoaded,
    () => SSR_EMPTY_SET,
  );
  return set.has(family);
}

/** True if the full variant for `family + variant` has been loaded. */
export function useIsVariantLoaded(
  family: string,
  variant: string,
): boolean {
  const set = useSyncExternalStore(
    subscribe,
    getVariantLoaded,
    () => SSR_EMPTY_SET,
  );
  return set.has(`${family}::${variant}`);
}

/** Subscribe to the menu-loaded set. Re-renders on any change. */
export function useMenuLoadedSet(): ReadonlySet<string> {
  return useSyncExternalStore(
    subscribe,
    getMenuLoaded,
    () => SSR_EMPTY_SET,
  );
}

/** Subscribe to the custom-fonts list. */
export function useCustomFonts(): ReadonlyArray<CustomFontRecord> {
  return useSyncExternalStore(
    subscribe,
    getCustomFonts,
    () => SSR_EMPTY_ARRAY,
  );
}
