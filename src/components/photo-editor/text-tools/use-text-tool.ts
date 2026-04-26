// src/components/photo-editor/text-tools/use-text-tool.ts
//
// Shared hook for the six Batch C text-tool panels (Format, Color,
// Stroke, Highlight, Shadow, Position). Centralises the dispatch
// boilerplate that all six would otherwise duplicate.
//
// Contract:
//   • `layer`     — the sole-selected text layer, or null when nothing
//                   text-shaped is selected. The caller renders an
//                   empty state when this is null; we don't gate the
//                   hook itself.
//   • `range`     — the inline-selection range when the layer is in
//                   inline-edit mode (`state.runSelection.layerId ===
//                   layer.id`), otherwise the whole-layer range
//                   `{ start: 0, end: totalLength(layer.runs) }`.
//                   `range` is NEVER null — panels should not need a
//                   "no range" branch.
//   • `hasRange`  — true when the user is range-selecting (the inline
//                   range has non-zero length). Used by panels that
//                   want to show "applied to selection" vs "applied to
//                   layer" affordances.
//   • `patchRuns` — patches every run intersecting `range` via
//                   `applyStylePatch`. The ONLY mutation path for run
//                   styling. Auto-clamped to the layer's text length.
//   • `patchStyling` — patches `layer.styling`. Used by FormatPanel's
//                      alignment / spacing controls (styling is
//                      layer-level, not per-run).
//   • `patchLayer`   — patches the layer itself. Used by PositionPanel
//                      for transform updates.
//   • `runValue`  — returns the value of a GlyphRun key if every run
//                   intersecting `range` agrees on it, otherwise null
//                   (= "mixed"). For object-typed keys (stroke,
//                   highlight, shadow, gradient, texture) we deep-
//                   compare via JSON.stringify.
//
// Per the handover (§6.7): when `hasRange` is true, only the selected
// range is patched; otherwise the whole layer is patched. The hook
// abstracts that — panels just call patchRuns / patchStyling /
// patchLayer without thinking about it.

"use client";

import { useCallback, useMemo } from "react";
import { useEditor } from "../context/EditorContext";
import {
  applyStylePatch,
  totalLength,
} from "@/lib/photo-editor/rich-text/glyph-run";
import { chars } from "@/lib/photo-editor/rich-text/measure";
import type {
  AnyLayer,
  GlyphRun,
  TextLayer,
  TextLayerStyling,
} from "@/lib/photo-editor/types";

export interface TextToolRange {
  start: number;
  end: number;
}

export interface TextToolContext {
  /** The sole-selected text layer, or null when nothing text-shaped is selected. */
  layer: TextLayer | null;
  /** Inline-selection range, or the whole-layer range when no range is active.
   *  Never null. */
  range: TextToolRange;
  /** True when the user is range-selecting (start < end AND the layer is
   *  in inline-edit mode for that specific layer). */
  hasRange: boolean;
  /** Patch every run intersecting `range` via applyStylePatch. */
  patchRuns: (patch: Partial<Omit<GlyphRun, "text">>) => void;
  /** Patch the layer's styling (align / letterSpacing / lineHeight). */
  patchStyling: (patch: Partial<TextLayerStyling>) => void;
  /** Patch the layer itself (used for transform / opacity / etc.). */
  patchLayer: (patch: Partial<TextLayer>) => void;
  /** Read a per-run value across the active range; returns null if mixed. */
  runValue: <K extends keyof Omit<GlyphRun, "text">>(
    key: K,
  ) => GlyphRun[K] | null;
}

export function useTextTool(): TextToolContext {
  const { state, dispatch } = useEditor();

  // Resolve the sole-selected text layer, mirroring the gate in
  // BottomToolbar / FontPanel. Anything else (multi-select, image
  // selection, no selection) → null.
  const layer = useMemo<TextLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "text") return null;
    return found as TextLayer;
  }, [state.selection, state.project.layers]);

  // Range derivation:
  //   • Layer in inline-edit mode (state.runSelection.layerId === layer.id)
  //     → use the inline range, clamped to the current text length.
  //   • Otherwise → whole layer.
  // Total length is recomputed each render so it tracks live edits.
  const total = layer ? totalLength(layer.runs) : 0;
  const range = useMemo<TextToolRange>(() => {
    if (!layer) return { start: 0, end: 0 };
    const sel = state.runSelection;
    if (sel && sel.layerId === layer.id) {
      const lo = Math.max(0, Math.min(sel.start, sel.end));
      const hi = Math.min(total, Math.max(sel.start, sel.end));
      return { start: lo, end: hi };
    }
    return { start: 0, end: total };
  }, [layer, state.runSelection, total]);

  const hasRange = useMemo<boolean>(() => {
    if (!layer) return false;
    const sel = state.runSelection;
    if (!sel || sel.layerId !== layer.id) return false;
    return sel.start !== sel.end;
  }, [layer, state.runSelection]);

  const patchRuns = useCallback(
    (patch: Partial<Omit<GlyphRun, "text">>) => {
      if (!layer) return;
      // applyStylePatch is a no-op when end <= start. Patching with an
      // empty range (e.g. caret with no selection in inline mode AND
      // total === 0) silently does nothing, which is correct.
      const start = range.start;
      const end = range.end > range.start ? range.end : totalLength(layer.runs);
      const nextRuns = applyStylePatch(layer.runs, start, end, patch);
      dispatch({
        type: "UPDATE_LAYER",
        id: layer.id,
        patch: { runs: nextRuns } as Partial<AnyLayer>,
      });
    },
    [layer, range.start, range.end, dispatch],
  );

  const patchStyling = useCallback(
    (patch: Partial<TextLayerStyling>) => {
      if (!layer) return;
      dispatch({
        type: "UPDATE_LAYER",
        id: layer.id,
        patch: {
          styling: { ...layer.styling, ...patch },
        } as Partial<AnyLayer>,
      });
    },
    [layer, dispatch],
  );

  const patchLayer = useCallback(
    (patch: Partial<TextLayer>) => {
      if (!layer) return;
      dispatch({
        type: "UPDATE_LAYER",
        id: layer.id,
        patch: patch as Partial<AnyLayer>,
      });
    },
    [layer, dispatch],
  );

  const runValue = useCallback(
    <K extends keyof Omit<GlyphRun, "text">>(key: K): GlyphRun[K] | null => {
      if (!layer) return null;
      let cursor = 0;
      let found = false;
      let firstSerialised: string | null = null;
      let firstValue: GlyphRun[K] | null = null;
      for (const run of layer.runs) {
        const len = chars(run.text).length;
        const runStart = cursor;
        const runEnd = cursor + len;
        cursor = runEnd;
        // Skip runs that fall entirely outside the active range.
        if (runEnd <= range.start || runStart >= range.end) continue;
        const value = run[key];
        if (!found) {
          firstValue = value as GlyphRun[K];
          firstSerialised = serialiseValue(value);
          found = true;
        } else {
          const next = serialiseValue(value);
          if (next !== firstSerialised) return null;
        }
      }
      // No runs intersected the range → null. Avoids false-positive
      // "value matches" reports for empty layers.
      return found ? firstValue : null;
    },
    [layer, range.start, range.end],
  );

  return useMemo<TextToolContext>(
    () => ({ layer, range, hasRange, patchRuns, patchStyling, patchLayer, runValue }),
    [layer, range, hasRange, patchRuns, patchStyling, patchLayer, runValue],
  );
}

// ─── Helpers ────────────────────────────────────────────────────

/** Stable string form of a GlyphRun field — used to compare values
 *  across runs in the range, including nested objects (stroke, shadow,
 *  highlight, gradient, texture). */
function serialiseValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
