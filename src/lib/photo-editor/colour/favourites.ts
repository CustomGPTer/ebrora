// src/lib/photo-editor/colour/favourites.ts
//
// Favourites store for the colour picker. Up to 5 colours, kept in
// add-order (newest at the END of the array). When a 6th is added,
// the oldest (front of the array) is evicted FIFO.
//
// Persisted to localStorage rather than IndexedDB because it's tiny
// (5 × 7 chars = ~35 bytes) and we want fast synchronous reads for
// the initial render of every panel.
//
// Key: `pe-colour-favourites-v1`. Value: JSON array of hex strings
// in add-order. Schema is intentionally minimal — bumping the
// suffix to v2 is the migration path if we add metadata later.
//
// Module exports:
//
//   • `loadFavourites()` — sync read, returns a defensive copy.
//   • `saveFavourites(list)` — sync write, also pushes a window
//     "pe-favourites-changed" event so other open panels in the
//     same tab refresh.
//   • `addFavourite(hex)` — appends to the END (newest at end);
//     dedupes (existing entry is moved to end); evicts from the
//     FRONT (oldest first) when the list would exceed the cap.
//   • `removeFavourite(hex)` — removes by exact hex match.
//   • `useFavourites()` — React hook; subscribes to the change event
//     and re-renders when favourites change.
//
// May 2026 — cap-drop + FIFO rewrite. Two changes from the previous
// build:
//
//   1. MAX_FAVOURITES dropped 12 → 5.
//   2. Storage order changed from hue-sorted to add-order. This is
//      so the on-screen position of a favourite is stable: tapping
//      "Add to favourites" puts it at the right edge of the favs
//      strip, and it stays there until evicted. The previous hue
//      sort moved every favourite around on every add.
//
// Stale localStorage from earlier builds (cap=12, hue-sorted) is
// intentionally NOT migrated on load — `loadFavourites()` returns
// whatever's stored. The while-loop in `addFavourite` (rather than a
// single shift) handles oversized arrays gracefully: the first add
// after upgrading trims the store down to `cap − 1` before appending
// the new entry, converging the store to ≤ cap in a single op.

"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pe-colour-favourites-v1";
const MAX_FAVOURITES = 5;
const CHANGE_EVENT = "pe-favourites-changed";

function safeParse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return [];
  }
}

function normaliseHex(hex: string): string | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  return "#" + m[1].toUpperCase();
}

export function loadFavourites(): string[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveFavourites(list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // localStorage might be disabled (private browsing on iOS Safari);
    // the favourites silently won't persist. Rest of the app keeps
    // working from the in-memory copy until reload.
  }
}

export function addFavourite(hex: string): void {
  const norm = normaliseHex(hex);
  if (!norm) return;
  const current = loadFavourites();
  // Dedupe (case-insensitive). If the hex was already present we
  // remove it here and re-append below — i.e. re-favouriting an
  // existing colour bumps it to "newest".
  const without = current.filter((c) => c.toUpperCase() !== norm);
  // Trim from the FRONT (oldest first) until there's room for the
  // new entry. The while-loop (rather than a single shift) handles
  // oversized arrays from pre-cap-drop builds gracefully — one add
  // converges the store to the new cap.
  while (without.length >= MAX_FAVOURITES) {
    without.shift();
  }
  saveFavourites([...without, norm]);
}

export function removeFavourite(hex: string): void {
  const norm = normaliseHex(hex);
  if (!norm) return;
  const current = loadFavourites();
  saveFavourites(current.filter((c) => c.toUpperCase() !== norm));
}

export function isFavourite(hex: string): boolean {
  const norm = normaliseHex(hex);
  if (!norm) return false;
  return loadFavourites().some((c) => c.toUpperCase() === norm);
}

/** React hook — re-renders when favourites change in this tab. */
export function useFavourites(): string[] {
  const [favs, setFavs] = useState<string[]>(() => loadFavourites());

  useEffect(() => {
    function refresh() {
      setFavs(loadFavourites());
    }
    // Same-tab event (we dispatch it from saveFavourites).
    window.addEventListener(CHANGE_EVENT, refresh);
    // Cross-tab via the native storage event.
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) refresh();
    }
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return favs;
}

export const FAVOURITES_MAX = MAX_FAVOURITES;
