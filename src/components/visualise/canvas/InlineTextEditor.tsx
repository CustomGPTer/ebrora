'use client';

// =============================================================================
// InlineTextEditor — contentEditable overlay for editing SVG text in-place.
//
// The canvas editor uses this to let users double-click SVG text and type.
// Rendering contentEditable over the SVG (rather than trying to make the SVG
// <text> itself editable) avoids cross-browser SVG text-editing quirks
// (especially iOS Safari, which can't focus <text> elements).
//
// Positioning: the caller measures the target SVG text node's bounding box
// in viewport coordinates (getBoundingClientRect) and passes it in via `rect`.
// We render an absolutely-positioned <div> at that spot.
//
// Lifecycle:
// - Mount → focuses + selects all text on first render
// - Blur → `onCommit(finalText)`
// - Escape → `onCancel()`
// - Enter (single-line) → `onCommit`
// - Shift+Enter → allows newline
//
// This file is SHIPPED in 6a as a standalone component. It gets wired into
// the canvas selection system in 6b (when a text node is selected and
// double-clicked). 6a mounts nothing dynamically.
// =============================================================================

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface InlineTextEditorRect {
  /** Viewport-space coords (from getBoundingClientRect). */
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Props {
  initialValue: string;
  rect: InlineTextEditorRect;
  /** Font CSS properties to keep the overlay visually matching the SVG text. */
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  multiline?: boolean;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

export default function InlineTextEditor({
  initialValue,
  rect,
  fontFamily = 'Inter, sans-serif',
  fontSize = 16,
  fontWeight = 400,
  color = '#111827',
  textAlign = 'center',
  multiline = false,
  onCommit,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value] = useState(initialValue);
  const committed = useRef(false);

  // Focus and select all on mount.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = initialValue;
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [initialValue]);

  // Commit-on-unmount safety net — if the component is forcibly unmounted
  // (e.g. user pressed Escape elsewhere), we don't commit. Commit only via
  // explicit user action below.
  useEffect(() => {
    return () => {
      // No-op intentionally. Commit is user-driven only.
    };
  }, []);

  const doCommit = () => {
    if (committed.current) return;
    committed.current = true;
    const el = ref.current;
    const finalValue = el?.textContent ?? value;
    onCommit(finalValue);
  };

  const doCancel = () => {
    if (committed.current) return;
    committed.current = true;
    onCancel();
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Edit text"
      aria-multiline={multiline}
      onBlur={doCommit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          doCancel();
          return;
        }
        if (e.key === 'Enter' && !e.shiftKey && !multiline) {
          e.preventDefault();
          e.stopPropagation();
          doCommit();
          return;
        }
        // Stop global keyboard shortcuts from firing while typing
        // (Delete, Ctrl+Z, Ctrl+D etc. are canvas shortcuts in 6c).
        e.stopPropagation();
      }}
      style={{
        position: 'fixed',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        minHeight: rect.height,
        fontFamily,
        fontSize,
        fontWeight,
        color,
        textAlign,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1.5px solid #1B5B50',
        borderRadius: 3,
        padding: '1px 4px',
        outline: 'none',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
        zIndex: 10000,
        whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
        overflow: 'hidden',
      }}
    />
  );
}
