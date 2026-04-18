// =============================================================================
// Canvas keyboard dispatcher — a pure factory returning a keydown handler
// wired to the set of capabilities CanvasEditor exposes.
//
// The CanvasEditor.tsx useEffect just needs to do:
//
//   const handler = buildCanvasKeyHandler({ ...deps });
//   window.addEventListener('keydown', handler);
//   return () => window.removeEventListener('keydown', handler);
//
// Keeping the handler logic here (rather than inline in CanvasEditor) means
// the growing set of shortcuts has one home, and the effect's dependency
// list stays readable.
//
// Shortcuts (6c):
//   Escape            → deselect; if nothing selected, onEscape (typically close)
//   Ctrl/Cmd + Z      → onUndo
//   Ctrl/Cmd + Shift + Z (or Ctrl/Cmd + Y) → onRedo
//   Ctrl/Cmd + 0      → onFit
//   Ctrl/Cmd + 1      → onZoomReset
//   Ctrl/Cmd + A      → onSelectAll
//   Ctrl/Cmd + G      → onGroup
//   Ctrl/Cmd + Shift + G → onUngroup
//   Ctrl/Cmd + C      → onCopyStyle (only if selection non-empty)
//   Ctrl/Cmd + V      → onPasteStyle
//   Delete / Backspace → onDelete (only if selection non-empty)
//   Arrow keys        → onNudge with (±1, 0) or (0, ±1)
//   Shift + Arrow     → onNudge scaled by 10
//
// Ctrl/Cmd + D (Duplicate) is intentionally not wired — see Q2 in the 6c
// handover. Will be added when presets gain a `supportsDuplicate` flag.
// =============================================================================

export interface CanvasKeyDeps {
  /** True when a visual is mounted in the editor. Most shortcuts no-op otherwise. */
  hasVisual: () => boolean;
  /** Current selection size (used to gate Delete / Copy / Arrow-nudge). */
  selectionSize: () => number;

  onEscape: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFit: () => void;
  onZoomReset: () => void;

  onSelectAll: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onCopyStyle: () => void;
  onPasteStyle: () => void;
  onNudge: (dx: number, dy: number) => void;
}

/**
 * Detect whether the current event target is something the user is typing
 * into (native input/textarea/select or any contentEditable element).
 * If so, we bail out early so the user's typing isn't hijacked by canvas
 * shortcuts — important because InlineTextEditor uses a contentEditable div.
 */
function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function buildCanvasKeyHandler(deps: CanvasKeyDeps): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;

    // ── Escape: deselect or close. Always runs regardless of modifiers. ──
    if (e.key === 'Escape') {
      e.preventDefault();
      deps.onEscape();
      return;
    }

    // ── Delete / Backspace: soft-delete selected nodes. ──────────────────
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!deps.hasVisual() || deps.selectionSize() === 0) return;
      e.preventDefault();
      deps.onDelete();
      return;
    }

    // ── Arrow nudge (no modifier, or Shift for ×10). ─────────────────────
    // Ctrl/Cmd + Arrow is reserved by OS/browser (workspace switching,
    // word-jump in text inputs) so we only act on bare / Shift arrows.
    const isArrow =
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight';
    if (isArrow && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (!deps.hasVisual() || deps.selectionSize() === 0) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'ArrowUp':
          deps.onNudge(0, -step);
          break;
        case 'ArrowDown':
          deps.onNudge(0, step);
          break;
        case 'ArrowLeft':
          deps.onNudge(-step, 0);
          break;
        case 'ArrowRight':
          deps.onNudge(step, 0);
          break;
      }
      return;
    }

    // ── Ctrl/Cmd-combos ──────────────────────────────────────────────────
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    const key = e.key.toLowerCase();

    // Undo / Redo — Z with Shift = redo; Y = redo (Windows convention).
    if (key === 'z') {
      e.preventDefault();
      if (e.shiftKey) deps.onRedo();
      else deps.onUndo();
      return;
    }
    if (key === 'y' && !e.shiftKey) {
      e.preventDefault();
      deps.onRedo();
      return;
    }

    // Zoom.
    if (key === '0') {
      e.preventDefault();
      deps.onFit();
      return;
    }
    if (key === '1') {
      e.preventDefault();
      deps.onZoomReset();
      return;
    }

    // Select all.
    if (key === 'a' && !e.shiftKey) {
      if (!deps.hasVisual()) return;
      e.preventDefault();
      deps.onSelectAll();
      return;
    }

    // Group / Ungroup.
    if (key === 'g') {
      if (!deps.hasVisual()) return;
      e.preventDefault();
      if (e.shiftKey) deps.onUngroup();
      else deps.onGroup();
      return;
    }

    // Copy / Paste style. Only intercept Ctrl+C when a node is selected —
    // otherwise let the browser handle text copy in the rest of the UI.
    if (key === 'c' && !e.shiftKey) {
      if (!deps.hasVisual() || deps.selectionSize() === 0) return;
      e.preventDefault();
      deps.onCopyStyle();
      return;
    }
    if (key === 'v' && !e.shiftKey) {
      if (!deps.hasVisual()) return;
      e.preventDefault();
      deps.onPasteStyle();
      return;
    }
  };
}
