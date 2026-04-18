'use client';

// =============================================================================
// NodeHandles — 8 resize handles around a selection bbox. Rendered in
// SCREEN coordinates (outside SvgCanvas's transform) so the handles stay a
// constant 10 px no matter the zoom level.
//
// The parent (CanvasEditor) computes the bbox in screen coords and passes it
// as `rect`. We render 8 small squares positioned around that rect.
//
// Corner handles (nw, ne, se, sw) resize both axes. Shift-drag locks aspect
// ratio. Edge handles (n, e, s, w) resize one axis only.
//
// Event handling: each handle fires `onResizeStart(direction, mouseEvent)`
// on mousedown. The parent hooks up window-level mousemove/mouseup to
// compute the new bbox and apply it to canvas.nodes.
// =============================================================================

import type { MouseEvent as ReactMouseEvent } from 'react';

export type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface Props {
  /** Screen-space rect covering the selection. Null = no handles. */
  rect: { left: number; top: number; width: number; height: number } | null;
  onResizeStart: (direction: ResizeDirection, e: ReactMouseEvent) => void;
  /** Size of each handle in px. Default 10. */
  handleSize?: number;
}

const HANDLE_COLOUR = '#1B5B50';
const HANDLE_BG = '#FFFFFF';

const DIRECTIONS: Array<{
  dir: ResizeDirection;
  cursor: string;
  // Position expressed as fractions of the rect.
  xFrac: 0 | 0.5 | 1;
  yFrac: 0 | 0.5 | 1;
}> = [
  { dir: 'nw', cursor: 'nwse-resize', xFrac: 0, yFrac: 0 },
  { dir: 'n', cursor: 'ns-resize', xFrac: 0.5, yFrac: 0 },
  { dir: 'ne', cursor: 'nesw-resize', xFrac: 1, yFrac: 0 },
  { dir: 'e', cursor: 'ew-resize', xFrac: 1, yFrac: 0.5 },
  { dir: 'se', cursor: 'nwse-resize', xFrac: 1, yFrac: 1 },
  { dir: 's', cursor: 'ns-resize', xFrac: 0.5, yFrac: 1 },
  { dir: 'sw', cursor: 'nesw-resize', xFrac: 0, yFrac: 1 },
  { dir: 'w', cursor: 'ew-resize', xFrac: 0, yFrac: 0.5 },
];

export default function NodeHandles({ rect, onResizeStart, handleSize = 10 }: Props) {
  if (!rect) return null;

  const half = handleSize / 2;

  return (
    <>
      {DIRECTIONS.map(({ dir, cursor, xFrac, yFrac }) => {
        const left = rect.left + rect.width * xFrac - half;
        const top = rect.top + rect.height * yFrac - half;
        return (
          <div
            key={dir}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart(dir, e);
            }}
            style={{
              position: 'fixed',
              left,
              top,
              width: handleSize,
              height: handleSize,
              background: HANDLE_BG,
              border: `1.5px solid ${HANDLE_COLOUR}`,
              borderRadius: 2,
              cursor,
              zIndex: 50,
              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }}
            data-handle={dir}
            aria-label={`Resize ${dir}`}
            role="button"
          />
        );
      })}
    </>
  );
}
