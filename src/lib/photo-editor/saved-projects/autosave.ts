// src/lib/photo-editor/saved-projects/autosave.ts
//
// Debounced autosave runner (Session 7).
//
// The EditorShell instantiates one Autosaver and calls schedule()
// whenever state.project changes. After 5 seconds of no further
// schedules, the autosaver runs the save callback. Calling cancel()
// stops a pending save (used when the user explicitly hits Save and
// the debounce becomes redundant). Calling flush() runs the pending
// save immediately and resolves once it completes — used on
// beforeunload for the "last chance to persist" path.
//
// Locked decisions (HANDOVER §8.4):
//   • Debounce: 5 seconds after the last edit.
//   • Autosave only fires for named projects. The schedule() call is
//     a no-op if armed=false. EditorShell sets armed=true once the
//     user names the project (first save).
//   • Thumbnail timing (§8.5 Q3): generated on every explicit save
//     AND on the last autosave before unload (via flush). The
//     scheduled run does NOT regenerate the thumbnail — too expensive
//     to do every 5s. The save callback decides whether to recompute.

export const AUTOSAVE_DEBOUNCE_MS = 5000;

export interface Autosaver {
  /** Reset the timer. After AUTOSAVE_DEBOUNCE_MS of no further
   *  schedule() calls, the save callback runs. */
  schedule: () => void;
  /** Cancel any pending save without running it. */
  cancel: () => void;
  /** Run the save immediately if one is pending; resolve when done. */
  flush: () => Promise<void>;
  /** Arm/disarm the autosaver. When disarmed (default), schedule() is
   *  a no-op. When armed, schedule() starts the debounce timer. */
  setArmed: (armed: boolean) => void;
  /** Tear down — clear any pending timer. Called from useEffect
   *  cleanup. */
  destroy: () => void;
}

/** Build an Autosaver bound to the given save callback. The callback
 *  receives no arguments; it should read whatever it needs from a
 *  caller-side ref. */
export function createAutosaver(
  saveCallback: () => Promise<void>,
  debounceMs: number = AUTOSAVE_DEBOUNCE_MS,
): Autosaver {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let armed = false;
  // While saveCallback is running, we shouldn't fire it again. The
  // schedule()/timer fire path checks running first.
  let running = false;

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  async function fire() {
    clearTimer();
    if (running) return;
    running = true;
    try {
      await saveCallback();
    } catch {
      // Swallow — we don't want a failed autosave to take down the
      // editor. The user can still hit Save explicitly to surface any
      // error from the save dialog.
    } finally {
      running = false;
    }
  }

  return {
    schedule: () => {
      if (!armed) return;
      clearTimer();
      timer = setTimeout(() => {
        void fire();
      }, debounceMs);
    },
    cancel: () => {
      clearTimer();
    },
    flush: async () => {
      if (timer === null && !running) return;
      await fire();
    },
    setArmed: (next: boolean) => {
      armed = next;
      if (!next) clearTimer();
    },
    destroy: () => {
      clearTimer();
      armed = false;
    },
  };
}
