// src/components/photo-editor/canvas/TextEditOverlay.tsx
//
// Inline text editing overlay for a TextLayer. Mounted by LayerRenderer
// on top of the RichTextNode bitmap whenever state.runSelection is set
// on this layer (i.e. the layer is in inline-edit mode).
//
// Architecture:
//   • Caret + selection rectangles render as plain Konva nodes inside a
//     Group whose transform mirrors RichTextNode's. They are NEVER
//     painted into the off-screen bitmap — that would bake them into the
//     image and ruin the per-tap selection model.
//   • A transparent hit Rect covers the entire bitmap region (plus a
//     little extra for empty layers where the laid-out text has zero
//     width). It catches pointer events; child decoration nodes
//     (selection rects, caret) have listening={false}.
//   • Window-level keydown handler runs while this overlay is mounted.
//     It listens for arrow keys, Home/End, Backspace/Delete, Enter, and
//     printable characters. It does NOT listen while focus is in a real
//     <input> / <textarea> / contenteditable (e.g. the FontPanel search
//     box).
//
// Because state.runSelection IS edit mode, exiting is automatic when:
//   • The user taps outside any layer (CanvasStage clears selection)
//   • The user taps another layer (LayerRenderer.onSelect dispatches
//     SET_SELECTION which clears runSelection)
//   • Escape is pressed (handled here)
//
// IME composition is intentionally NOT supported in v1 — the handover's
// inline-editing notes flag this as deferrable. Composition events are
// passed through to the printable-character handler, which will produce
// noisy results for IME users; revisit if Jon wants Japanese / Chinese
// / Korean input pre-launch.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Rect } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEditor } from "../context/EditorContext";
import { layoutText, type LayoutResult } from "@/lib/photo-editor/rich-text/engine";
import {
  caretOffsetFromPoint,
  caretPositionForOffset,
  selectionRangeFromPoints,
  wordRangeAtOffset,
  type LayerLocalPoint,
} from "@/lib/photo-editor/rich-text/hit-test";
import {
  clampOffset,
  codePointLength,
  offsetBackward,
  offsetForward,
  replaceTextRange,
} from "@/lib/photo-editor/rich-text/edit-ops";
import { totalLength } from "@/lib/photo-editor/rich-text/glyph-run";
import type { AnyLayer, TextLayer } from "@/lib/photo-editor/types";

/** Same value as RichTextNode — keeps the overlay's transform aligned
 *  with the bitmap so layer-local coordinates match. If RichTextNode's
 *  RENDER_PADDING ever changes, change this too. */
const RENDER_PADDING = 24;

/** Caret blink interval (ms). 530 matches macOS / Chrome conventions. */
const CARET_BLINK_MS = 530;

/** Selection rect visual — accent at low opacity so per-letter colour
 *  underneath stays visible. */
const SELECTION_FILL = "rgba(27, 91, 80, 0.28)";
const CARET_FILL = "#1B5B50";
const CARET_WIDTH = 2;

interface TextEditOverlayProps {
  layer: TextLayer;
}

export function TextEditOverlay({ layer }: TextEditOverlayProps) {
  const { state, dispatch } = useEditor();
  const groupRef = useRef<Konva.Group>(null);
  const dragOriginRef = useRef<LayerLocalPoint | null>(null);
  const [caretVisible, setCaretVisible] = useState(true);

  // Layout — pure-logic, cheap. Recomputes on every layer mutation.
  const layout = useMemo<LayoutResult>(() => layoutText(layer), [layer]);

  // Edit mode is "runSelection is set on this layer". LayerRenderer
  // only mounts us in that case, but defensive checks keep the logic
  // simple here.
  const runSel = state.runSelection;
  const isEditingThis = runSel !== null && runSel.layerId === layer.id;
  const selStart = isEditingThis ? runSel.start : 0;
  const selEnd = isEditingThis ? runSel.end : 0;
  const rangeStart = Math.min(selStart, selEnd);
  const rangeEnd = Math.max(selStart, selEnd);
  const hasRange = rangeStart !== rangeEnd;

  // ─── Caret blink ───────────────────────────────────────────
  useEffect(() => {
    if (!isEditingThis || hasRange) {
      setCaretVisible(true);
      return;
    }
    setCaretVisible(true);
    const id = window.setInterval(
      () => setCaretVisible((v) => !v),
      CARET_BLINK_MS,
    );
    return () => window.clearInterval(id);
  }, [isEditingThis, hasRange]);

  // Reset blink visibility on caret movement so the caret is always
  // briefly visible after the user moves it.
  useEffect(() => {
    setCaretVisible(true);
  }, [selStart, selEnd]);

  // ─── Pointer position helper ───────────────────────────────
  //
  // getAbsoluteTransform().invert().point() handles stage scale + the
  // layer's transform (translate, scale, rotate, skew) in one shot.
  // The result is in the group's local coord space — bitmap pixel
  // coords. Subtracting RENDER_PADDING gives us layer-local coords
  // (where (0, 0) is the laid-out text's top-left), which is what
  // hit-test.ts expects.
  function getLayerLocalPoint(): LayerLocalPoint | null {
    const group = groupRef.current;
    if (!group) return null;
    const stage = group.getStage();
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    const matrix = group.getAbsoluteTransform().copy();
    matrix.invert();
    const bitmapLocal = matrix.point(pos);
    return {
      x: bitmapLocal.x - RENDER_PADDING,
      y: bitmapLocal.y - RENDER_PADDING,
    };
  }

  // ─── Pointer handlers ──────────────────────────────────────
  function handlePointerDown(
    e: KonvaEventObject<MouseEvent | TouchEvent>,
  ) {
    e.cancelBubble = true;
    const point = getLayerLocalPoint();
    if (!point) return;
    const offset = caretOffsetFromPoint(layout, point);
    dragOriginRef.current = point;
    dispatch({
      type: "SET_RUN_SELECTION",
      layerId: layer.id,
      start: offset,
      end: offset,
    });
  }

  function handlePointerMove(
    e: KonvaEventObject<MouseEvent | TouchEvent>,
  ) {
    if (dragOriginRef.current === null) return;
    e.cancelBubble = true;
    const point = getLayerLocalPoint();
    if (!point) return;
    const range = selectionRangeFromPoints(
      layout,
      dragOriginRef.current,
      point,
    );
    dispatch({
      type: "SET_RUN_SELECTION",
      layerId: layer.id,
      start: range.start,
      end: range.end,
    });
  }

  function handlePointerUp() {
    dragOriginRef.current = null;
  }

  function handleDoubleClick(
    e: KonvaEventObject<MouseEvent | TouchEvent>,
  ) {
    e.cancelBubble = true;
    const point = getLayerLocalPoint();
    if (!point) return;
    const offset = caretOffsetFromPoint(layout, point);
    const word = wordRangeAtOffset(layout, offset);
    if (!word) return;
    dispatch({
      type: "SET_RUN_SELECTION",
      layerId: layer.id,
      start: word.start,
      end: word.end,
    });
  }

  // ─── Window-level keyboard handler ─────────────────────────
  //
  // We attach to `window` so the overlay receives keystrokes regardless
  // of where focus actually sits — the canvas doesn't take focus by
  // default. We bail out if focus is in a real input element (e.g. the
  // FontPanel search box) to avoid hijacking the user's typing there.
  useEffect(() => {
    if (!isEditingThis) return;

    function isFocusedOnEditableField(): boolean {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      if (el.tagName === "INPUT") return true;
      if (el.tagName === "TEXTAREA") return true;
      if (el.tagName === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    }

    function applyEdit(
      start: number,
      end: number,
      insertText: string,
    ): void {
      const nextRuns = replaceTextRange(layer.runs, start, end, insertText);
      dispatch({
        type: "UPDATE_LAYER",
        id: layer.id,
        patch: { runs: nextRuns } as Partial<AnyLayer>,
      });
      const newCaret = clampOffset(nextRuns, start + codePointLength(insertText));
      dispatch({
        type: "SET_RUN_SELECTION",
        layerId: layer.id,
        start: newCaret,
        end: newCaret,
      });
    }

    function moveCaret(target: number, extend: boolean): void {
      dispatch({
        type: "SET_RUN_SELECTION",
        layerId: layer.id,
        start: extend ? selStart : target,
        end: target,
      });
    }

    function exitEditMode(): void {
      dispatch({
        type: "SET_RUN_SELECTION",
        layerId: null,
        start: 0,
        end: 0,
      });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isFocusedOnEditableField()) return;

      const total = totalLength(layer.runs);

      // Cmd/Ctrl-A — select all on this layer.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        dispatch({
          type: "SET_RUN_SELECTION",
          layerId: layer.id,
          start: 0,
          end: total,
        });
        return;
      }

      // Cmd/Ctrl combos we don't handle (copy / paste / cut / undo /
      // redo) — let the browser handle them. v1 doesn't wire programmatic
      // copy / paste; the browser's native clipboard works only when
      // there's a visible selection in the DOM, which there isn't here.
      // Document this in the README so Jon knows it's a known limitation.
      if (e.metaKey || e.ctrlKey) return;

      switch (e.key) {
        case "ArrowLeft": {
          e.preventDefault();
          // Without shift: collapse a range to its left edge; otherwise
          // step the caret left by one code point.
          const target = !e.shiftKey && hasRange
            ? rangeStart
            : offsetBackward(layer.runs, selEnd);
          moveCaret(target, e.shiftKey);
          return;
        }
        case "ArrowRight": {
          e.preventDefault();
          const target = !e.shiftKey && hasRange
            ? rangeEnd
            : offsetForward(layer.runs, selEnd);
          moveCaret(target, e.shiftKey);
          return;
        }
        case "ArrowUp":
        case "ArrowDown": {
          e.preventDefault();
          const cp = caretPositionForOffset(layout, selEnd);
          // Aim for the vertical centre of the previous / next line.
          // Heuristic — not exact across mixed font sizes; refines later.
          const targetY =
            e.key === "ArrowUp"
              ? cp.y - cp.height * 0.5
              : cp.y + cp.height * 1.5;
          const target = caretOffsetFromPoint(layout, {
            x: cp.x,
            y: targetY,
          });
          moveCaret(target, e.shiftKey);
          return;
        }
        case "Home": {
          e.preventDefault();
          // Jump to the start of the current line.
          const cp = caretPositionForOffset(layout, selEnd);
          let lineStart = 0;
          for (let i = 0; i < cp.lineIndex && i < layout.lines.length; i++) {
            lineStart += layout.lines[i].glyphs.length;
          }
          moveCaret(lineStart, e.shiftKey);
          return;
        }
        case "End": {
          e.preventDefault();
          // Jump to the end of the current line.
          const cp = caretPositionForOffset(layout, selEnd);
          let lineEnd = 0;
          for (let i = 0; i <= cp.lineIndex && i < layout.lines.length; i++) {
            lineEnd += layout.lines[i].glyphs.length;
          }
          moveCaret(lineEnd, e.shiftKey);
          return;
        }
        case "Escape": {
          e.preventDefault();
          exitEditMode();
          return;
        }
        case "Enter": {
          e.preventDefault();
          applyEdit(rangeStart, rangeEnd, "\n");
          return;
        }
        case "Backspace": {
          e.preventDefault();
          if (hasRange) {
            applyEdit(rangeStart, rangeEnd, "");
          } else if (rangeStart > 0) {
            applyEdit(offsetBackward(layer.runs, rangeStart), rangeStart, "");
          }
          return;
        }
        case "Delete": {
          e.preventDefault();
          if (hasRange) {
            applyEdit(rangeStart, rangeEnd, "");
          } else if (rangeStart < total) {
            applyEdit(rangeStart, offsetForward(layer.runs, rangeStart), "");
          }
          return;
        }
        case "Tab": {
          // Don't insert a tab — let focus traversal happen normally so
          // the user can tab out of the editor to the surrounding UI.
          // (If we wanted a literal tab in text we'd need a different
          // affordance.)
          exitEditMode();
          return;
        }
      }

      // Printable character — single-character key with no modifier.
      // (e.key is the produced character for printable keys.)
      if (e.key.length === 1) {
        e.preventDefault();
        applyEdit(rangeStart, rangeEnd, e.key);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isEditingThis,
    layer.id,
    layer.runs,
    layout,
    selStart,
    selEnd,
    rangeStart,
    rangeEnd,
    hasRange,
    dispatch,
  ]);

  // ─── Render ────────────────────────────────────────────────

  if (!isEditingThis) return null;

  // Selection rectangles — one per line in the range.
  const selectionRects = computeSelectionRects(layout, rangeStart, rangeEnd);

  // Caret position. For empty layers (no laid-out lines), synthesise a
  // caret at the layer's logical origin sized by the first run's font
  // size so the user can see where typing will land.
  let caret: { x: number; y: number; height: number } | null = null;
  if (!hasRange) {
    if (layout.lines.length === 0) {
      const fs = layer.runs[0]?.fontSize ?? 16;
      caret = { x: 0, y: 0, height: fs };
    } else {
      const cp = caretPositionForOffset(layout, rangeStart);
      caret = { x: cp.x, y: cp.y, height: cp.height };
    }
  }

  // Hit-rect dimensions — at least as large as the bitmap, but never
  // smaller than something tappable when the layer's text is empty
  // (otherwise the user can never re-enter text on a fully-deleted
  // layer).
  const fs = layer.runs[0]?.fontSize ?? 16;
  const minHitW = Math.max(fs * 2, 80);
  const minHitH = Math.max(fs * 1.4, 40);
  const bgWidth = Math.max(
    minHitW + RENDER_PADDING * 2,
    layout.width + RENDER_PADDING * 2,
  );
  const bgHeight = Math.max(
    minHitH + RENDER_PADDING * 2,
    layout.height + RENDER_PADDING * 2,
  );

  return (
    <Group
      ref={groupRef}
      // Mirror RichTextNode's transform exactly so layer-local coords
      // line up with the bitmap underneath.
      x={layer.transform.x}
      y={layer.transform.y}
      offsetX={RENDER_PADDING}
      offsetY={RENDER_PADDING}
      scaleX={layer.transform.scaleX}
      scaleY={layer.transform.scaleY}
      rotation={layer.transform.rotation}
      skewX={layer.transform.skewX}
      skewY={layer.transform.skewY}
      listening={layer.visible}
    >
      {/* Hit rect — invisible, catches all pointer events. Children
          below set listening={false} so events fall through to here. */}
      <Rect
        x={0}
        y={0}
        width={bgWidth}
        height={bgHeight}
        fill="transparent"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
      />

      {/* Selection rectangles — laid out in layer-local coords; the
          group's offset shifts them into the bitmap region. */}
      {selectionRects.map((rect, i) => (
        <Rect
          key={i}
          x={rect.x + RENDER_PADDING}
          y={rect.y + RENDER_PADDING}
          width={rect.width}
          height={rect.height}
          fill={SELECTION_FILL}
          listening={false}
        />
      ))}

      {/* Caret */}
      {caret && caretVisible ? (
        <Rect
          x={caret.x + RENDER_PADDING - CARET_WIDTH / 2}
          y={caret.y + RENDER_PADDING}
          width={CARET_WIDTH}
          height={caret.height}
          fill={CARET_FILL}
          listening={false}
        />
      ) : null}
    </Group>
  );
}

// ─── Selection-rect computation ─────────────────────────────────
//
// One rect per line in [start, end). For each affected line we find
// the x of the first selected glyph and the x just past the last
// selected glyph, and produce a rect spanning that horizontal range
// with the line's full height.

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function computeSelectionRects(
  layout: LayoutResult,
  start: number,
  end: number,
): SelectionRect[] {
  if (start >= end) return [];
  const rects: SelectionRect[] = [];
  let cursor = 0;

  for (const line of layout.lines) {
    const lineLen = line.glyphs.length;
    const lineStart = cursor;
    const lineEnd = cursor + lineLen;
    cursor = lineEnd;

    if (lineEnd <= start) continue;
    if (lineStart >= end) break;

    const localStart = Math.max(0, start - lineStart);
    const localEnd = Math.min(lineLen, end - lineStart);
    if (localStart >= localEnd) continue;

    const x1 = caretXForLineOffset(line.glyphs, localStart);
    const x2 = caretXForLineOffset(line.glyphs, localEnd);

    rects.push({
      x: x1,
      y: line.baselineY - line.ascent,
      width: Math.max(0, x2 - x1),
      height: line.height,
    });
  }

  return rects;
}

/** Local x for an intra-line offset on a specific line's glyphs.
 *  Mirrors hit-test.ts's caretXForLineOffset (kept private there); the
 *  duplication is two lines and avoids exporting an internal helper. */
function caretXForLineOffset(
  glyphs: LayoutResult["lines"][number]["glyphs"],
  intraOffset: number,
): number {
  if (glyphs.length === 0) return 0;
  if (intraOffset <= 0) return glyphs[0].x;
  if (intraOffset >= glyphs.length) {
    const last = glyphs[glyphs.length - 1];
    return last.x + last.width;
  }
  return glyphs[intraOffset].x;
}
