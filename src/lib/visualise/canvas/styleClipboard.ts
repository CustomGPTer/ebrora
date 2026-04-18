// =============================================================================
// Canvas style clipboard — a tiny module-level singleton that holds a copy of
// a visual's `{ paletteId, customColors }` for "Copy style" / "Paste style"
// actions.
//
// Not persisted across sessions. Deliberately outside React state so it
// survives CanvasEditor unmounts (e.g. user closes the editor, opens another
// visual, pastes the style they copied a minute ago). Cleared only when the
// tab is closed or refreshed.
//
// Design note: the clipboard holds STYLE only — paletteId + customColors.
// It does NOT hold per-node geometry (x/y/w/h), font, showTitle, or canvas
// overrides. A paste applies the style over whatever node ids exist in the
// target visual; colour entries for ids that don't exist in the target are
// still copied across (harmless — they'll be ignored by the renderer).
// =============================================================================

import type { PaletteId, VisualSettings } from '@/lib/visualise/types';

interface StyleClip {
  paletteId: PaletteId;
  customColors: Record<string, string>;
}

let clip: StyleClip | null = null;

/** Snapshot the paletteId and customColors from a visual's settings. */
export function copyStyleFrom(settings: VisualSettings): void {
  clip = {
    paletteId: settings.paletteId,
    customColors: { ...settings.customColors },
  };
}

/** Returns true if a style is currently in the clipboard. */
export function hasStyleInClipboard(): boolean {
  return clip !== null;
}

/**
 * Apply the clipboard contents over the given settings, returning a new
 * settings object. If the clipboard is empty, returns `settings` unchanged
 * (caller can early-out using hasStyleInClipboard() to avoid a no-op patch).
 */
export function pasteStyleInto(settings: VisualSettings): VisualSettings {
  if (!clip) return settings;
  return {
    ...settings,
    paletteId: clip.paletteId,
    customColors: { ...clip.customColors },
  };
}

/** Test-only hook — resets the clipboard. Not used in production code. */
export function __clearStyleClipboard(): void {
  clip = null;
}
