// =============================================================================
// Canvas editor — undo/redo history stack.
//
// Generic over the shape of the entry. The canvas editor uses it with
// Pick<VisualInstance, 'presetId' | 'data' | 'settings' | 'canvas' | 'title'>
// so an entry captures everything a single visual's edit can change.
//
// Design notes:
// - 50-entry cap — push beyond drops the oldest.
// - Debounced push for drags (300 ms default). Call `pushDebounced` on every
//   drag-frame; only the last one lands in history after the debounce window.
// - `skipHistoryRef` pattern: when applying an undo/redo result back into
//   component state, DON'T let that state-apply push a new entry. Flip the
//   flag before the apply, the next `push` becomes a no-op, then flip back.
//   The caller manages the flag; this module just exposes the helper.
// - `structuredClone` on every push — entries are deep-copied so later
//   mutations to the live state don't retroactively change history.
// =============================================================================

const DEFAULT_LIMIT = 50;
const DEFAULT_DEBOUNCE_MS = 300;

export interface HistoryApi<T> {
  /** Push an entry immediately. Flushes any pending debounced push first. */
  push: (entry: T) => void;
  /** Push an entry after `debounceMs` of inactivity. Latest call wins. */
  pushDebounced: (entry: T) => void;
  /** Flush any pending debounced push. No-op if nothing pending. */
  flush: () => void;
  /** Go back one entry, returns the new current entry (or null if at start). */
  undo: () => T | null;
  /** Go forward one entry, returns the new current entry (or null if at end). */
  redo: () => T | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  /** Clear everything and seed a fresh base entry. */
  reset: (base: T) => void;
  /** Number of entries in the stack (including the base). */
  size: () => number;
  /** Current index within the stack. 0 is the base. */
  cursor: () => number;
}

export interface HistoryOptions {
  limit?: number;
  debounceMs?: number;
}

/**
 * Create a new history controller seeded with a base entry.
 * The base entry is index 0; a single push makes it index 1.
 * Undo from index N moves to index N-1 and returns that entry.
 */
export function createHistory<T>(base: T, opts: HistoryOptions = {}): HistoryApi<T> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const debounceMs = opts.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  let stack: T[] = [clone(base)];
  let index = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingEntry: T | null = null;

  const flush = () => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (pendingEntry !== null) {
      pushImmediate(pendingEntry);
      pendingEntry = null;
    }
  };

  const pushImmediate = (entry: T) => {
    // Discard any redo future when a new entry lands.
    if (index < stack.length - 1) {
      stack = stack.slice(0, index + 1);
    }
    stack.push(clone(entry));
    // Trim oldest entries if over the cap.
    if (stack.length > limit) {
      const overflow = stack.length - limit;
      stack = stack.slice(overflow);
    }
    index = stack.length - 1;
  };

  const push = (entry: T) => {
    // If there's a pending debounced push, flush it first so this one lands after.
    flush();
    pushImmediate(entry);
  };

  const pushDebounced = (entry: T) => {
    pendingEntry = entry;
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (pendingEntry !== null) {
        pushImmediate(pendingEntry);
        pendingEntry = null;
      }
    }, debounceMs);
  };

  const undo = (): T | null => {
    flush();
    if (index <= 0) return null;
    index--;
    return clone(stack[index]);
  };

  const redo = (): T | null => {
    flush();
    if (index >= stack.length - 1) return null;
    index++;
    return clone(stack[index]);
  };

  const canUndo = () => index > 0;
  const canRedo = () => index < stack.length - 1;

  const reset = (nextBase: T) => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    pendingEntry = null;
    stack = [clone(nextBase)];
    index = 0;
  };

  return {
    push,
    pushDebounced,
    flush,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    size: () => stack.length,
    cursor: () => index,
  };
}

/**
 * Deep-clone helper. `structuredClone` is available in Node 17+ and all
 * evergreen browsers; the Next 14 target runtimes (Node 18+, modern browsers)
 * all have it. Fallback to JSON round-trip if somehow missing (old test env).
 */
function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}
