'use client';

// =============================================================================
// AlignmentGuides — renders dashed gold lines for active alignment matches.
//
// Standalone SVG <g> so it can be composed into any SVG overlay. Uses
// `vector-effect="non-scaling-stroke"` so the 1 px stroke stays 1 px at any
// zoom when nested inside a transformed parent.
//
// Colour: #D4A44C (brand gold) per original handover §3.6.
// Dash pattern: 3 on, 3 off.
// =============================================================================

import type { AlignmentGuide } from '@/lib/visualise/canvas/snapping';

interface Props {
  guides: AlignmentGuide[];
}

const GUIDE_COLOUR = '#D4A44C';

export default function AlignmentGuides({ guides }: Props) {
  if (guides.length === 0) return null;
  return (
    <g aria-hidden="true" pointerEvents="none">
      {guides.map((g, i) =>
        g.axis === 'vertical' ? (
          <line
            key={`vg-${i}`}
            x1={g.position}
            y1={g.from}
            x2={g.position}
            y2={g.to}
            stroke={GUIDE_COLOUR}
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <line
            key={`hg-${i}`}
            x1={g.from}
            y1={g.position}
            x2={g.to}
            y2={g.position}
            stroke={GUIDE_COLOUR}
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        ),
      )}
    </g>
  );
}
