// src/lib/photo-editor/colour/favourites.ts
//
// Favourites store for the colour picker. Up to 12 colours, kept in
// hue order so the favourites strip reads as a curated mini-palette
// (Q13 = B). Persisted to localStorage rather than IndexedDB because
// it's tiny (12 × 7 chars = ~100 bytes) and we want fast synchronous
// reads for the initial render of every panel.
//
// Key: `pe-colour-favourites-v1`. Value: JSON array of hex strings.
// Schema is intentionally minimal — bumping the suffix to v2 is the
// migration path if we add metadata later.
//
// Module exports:
//
//   • `loadFavourites()` — sync read, returns a defensive copy.
//   • `saveFavourites(list)` — sync write, also pushes a window
//     "pe-favourites-changed" event so other open panels in the
//     same tab refresh.
//   • `addFavourite(hex)` — inserts in hue order, dedupes, drops the
//     least-recently-touched colour past 12.
//   • `removeFavourite(hex)` — removes by exact hex match.
//   • `useFavourites()` — React hook; subscribes to the change event
//     and re-renders when favourites change.
//
// May 2026 — new colour system build.

"use client";

import { useEffect, useState } from "react";
import { hueOfHex } from "./swatch-palette";

const STORAGE_KEY = "pe-colour-favourites-v1";
const MAX_FAVOURITES = 12;
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

/** Sort comparator: neutrals (very low saturation) first, then by
 *  hue ascending. Matches the standard palette's natural order. */
function compareHex(a: string, b: string): number {
  const ha = hueOfHex(a);
  const hb = hueOfHex(b);
  const aNeutral = ha.saturation < 0.05;
  const bNeutral = hb.saturation < 0.05;
  if (aNeutral && !bNeutral) return -1;
  if (!aNeutral && bNeutral) return 1;
  if (aNeutral && bNeutral) {
    // Both neutrals — sort by lightness (descending = white first).
    const la = parseInt(a.slice(1, 3), 16);
    const lb = parseInt(b.slice(1, 3), 16);
    return lb - la;
  }
  return ha.hue - hb.hue;
}

export function addFavourite(hex: string): void {
  const norm = normaliseHex(hex);
  if (!norm) return;
  const current = loadFavourites();
  // Dedupe (case-insensitive — already handled by normaliseHex).
  const without = current.filter((c) => c.toUpperCase() !== norm);
  // If at cap, drop the *last* (highest-hue) entry. Most users will
  // notice the capped entry less than if we drop the first.
  if (without.length >= MAX_FAVOURITES) {
    without.pop();
  }
  const next = [...without, norm].sort(compareHex);
  saveFavourites(next);
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
