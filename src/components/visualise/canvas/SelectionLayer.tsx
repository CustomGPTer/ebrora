'use client';

// =============================================================================
// SelectionLayer — SVG overlay rendered INSIDE SvgCanvas's transformed layer.
// Three visual elements, all in SVG user coordinates (scaled with content):
//   1. Gold dashed outlines around every selected node (non-scaling-stroke)
//   2. A marquee rect while the user is dragging over empty canvas
//   3. Alignment guides (dashed gold lines) during an active drag
//
// Pure render — no event handling. Event handling lives in CanvasEditor,
// which passes the results in via props.
// =============================================================================

import type { NodeBBox, MarqueeRect } from '@/lib/visualise/canvas/selection';
import type { AlignmentGuide } from '@/lib/visualise/canvas/snapping';
import AlignmentGuides from './AlignmentGuides';

interface Props {
  contentWidth: number;
  contentHeight: number;
  /** Current natural bboxes keyed by data-id. Used to draw selection outlines. */
  nodeBBoxes: Record<string, NodeBBox>;
  /** Live bbox offsets during a drag — overrides nodeBBoxes for outline positions. */
  liveOffsets: Record<string, { dx: number; dy: number }>;
  selectedIds: Set<string>;
  marquee: MarqueeRect | null;
  guides: AlignmentGuide[];
}

const SELECTION_COLOUR = '#1B5B50';
const MARQUEE_FILL = 'rgba(27, 91, 80, 0.08)';
const MARQUEE_STROKE = '#1B5B50';

export default function SelectionLayer({
  contentWidth,
  contentHeight,
  nodeBBoxes,
  liveOffsets,
  selectedIds,
  marquee,
  guides,
}: Props) {
  return (
    <svg
      width={contentWidth}
      height={contentHeight}
      viewBox={`0 0 ${contentWidth} ${contentHeight}`}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      {/* Selection outlines */}
      {Array.from(selectedIds).map((id) => {
        const bbox = nodeBBoxes[id];
        if (!bbox) return null;
        const offset = liveOffsets[id];
        const dx = offset?.dx ?? 0;
        const dy = offset?.dy ?? 0;
        return (
          <rect
            key={id}
            x={bbox.x + dx - 2}
            y={bbox.y + dy - 2}
            width={bbox.w + 4}
            height={bbox.h + 4}
            fill="none"
            stroke={SELECTION_COLOUR}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            // `vector-effect` keeps the stroke 1.5 px at any zoom level.
            vectorEffect="non-scaling-stroke"
            rx={2}
            ry={2}
          />
        );
      })}

      {/* Alignment guides during an active drag */}
      <AlignmentGuides guides={guides} />

      {/* Marquee */}
      {marquee && marquee.w > 0 && marquee.h > 0 ? (
        <rect
          x={marquee.x}
          y={marquee.y}
          width={marquee.w}
          height={marquee.h}
          fill={MARQUEE_FILL}
          stroke={MARQUEE_STROKE}
          strokeWidth={1}
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}
