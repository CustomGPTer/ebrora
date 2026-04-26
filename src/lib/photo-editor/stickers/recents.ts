// src/lib/photo-editor/stickers/recents.ts
//
// Recent-stickers persistence — stores the last 30 codepoints the user
// inserted, MRU-first, in localStorage under
// "ebrora.photo-editor.recent-stickers". Survives reloads. The
// StickerPanel surfaces this as a strip above the category tabs when at
// least one recent exists.
//
// API:
//   • loadRecents()        → string[]   (empty array on first run / SSR / bad JSON)
//   • pushRecent(codepoint) → string[]  (returns the new array; persists synchronously)
//   • clearRecents()       → void
//
// Pure-logic from the editor's perspective — every function is a no-op
// when window.localStorage is unavailable (SSR, private mode quotas, etc.)
// rather than throwing.

import { STORAGE_PREFIX } from "../types";

const STORAGE_KEY = `${STORAGE_PREFIX}recent-stickers`;
const MAX_RECENTS = 30;

/** Load the recent codepoints, MRU-first. Returns [] on any failure. */
export function loadRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive — every entry must be a non-empty string.
    return parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

/** Push a codepoint to the front of the recent list. De-dupes earlier
 *  occurrences; caps at MAX_RECENTS. Returns the new array. Persists
 *  synchronously; failures (quota, etc.) are swallowed. */
export function pushRecent(codepoint: string): string[] {
  const prior = loadRecents();
  const filtered = prior.filter((c) => c !== codepoint);
  const next = [codepoint, ...filtered].slice(0, MAX_RECENTS);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota / private mode — recents revert to in-memory for this session.
    }
  }
  return next;
}

/** Clear every recent. Useful for "Reset" controls in future settings panels. */
export function clearRecents(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // No-op.
  }
}
