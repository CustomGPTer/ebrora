'use client';

// =============================================================================
// Ruler — top/left tick strips for the canvas viewport.
//
// Ticks at intervals that adapt to the current zoom:
//   - If scale <= 0.25 → every 200 user units
//   - If scale <= 0.75 → every 100 user units
//   - If scale <= 1.5  → every 50  user units
//   - Otherwise        → every 20  user units
//
// Labels every 2nd tick. The ruler shows SVG coordinate space, not viewport
// pixels — so panning left increases the visible range's starting value.
//
// Renders as an SVG strip. Container positioning is the CanvasEditor's job.
// =============================================================================

interface Props {
  orientation: 'horizontal' | 'vertical';
  /** Length of the ruler in viewport pixels (width for horizontal, height for vertical). */
  length: number;
  /** Current zoom scale. */
  scale: number;
  /** Pan offset in viewport pixels. */
  pan: number;
}

const TICK_COLOUR = '#E5E7EB';
const LABEL_COLOUR = '#9CA3AF';
const BG_COLOUR = '#FAFAFA';
const EDGE_COLOUR = '#E5E7EB';
const THICKNESS = 20;

export default function Ruler({ orientation, length, scale, pan }: Props) {
  if (length <= 0 || scale <= 0) return null;

  const interval = pickInterval(scale);
  const firstUnit = Math.floor(-pan / scale / interval) * interval;
  const lastUnit = Math.ceil((length - pan) / scale / interval) * interval;

  const ticks: { u: number; px: number; major: boolean }[] = [];
  for (let u = firstUnit; u <= lastUnit; u += interval) {
    const px = u * scale + pan;
    if (px < -20 || px > length + 20) continue;
    ticks.push({ u, px, major: (u / interval) % 2 === 0 });
  }

  const isH = orientation === 'horizontal';
  const w = isH ? length : THICKNESS;
  const h = isH ? THICKNESS : length;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: 'block', userSelect: 'none' }}
      aria-hidden="true"
    >
      <rect x={0} y={0} width={w} height={h} fill={BG_COLOUR} />
      {/* Edge line on the side facing the canvas */}
      <line
        x1={isH ? 0 : THICKNESS - 0.5}
        y1={isH ? THICKNESS - 0.5 : 0}
        x2={isH ? w : THICKNESS - 0.5}
        y2={isH ? THICKNESS - 0.5 : h}
        stroke={EDGE_COLOUR}
        strokeWidth={1}
      />
      {ticks.map(({ u, px, major }) => {
        const tickLength = major ? 10 : 5;
        if (isH) {
          return (
            <g key={u}>
              <line
                x1={px}
                y1={THICKNESS - tickLength}
                x2={px}
                y2={THICKNESS}
                stroke={TICK_COLOUR}
                strokeWidth={1}
              />
              {major ? (
                <text
                  x={px + 2}
                  y={10}
                  fontSize={9}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fill={LABEL_COLOUR}
                >
                  {u}
                </text>
              ) : null}
            </g>
          );
        }
        return (
          <g key={u}>
            <line
              x1={THICKNESS - tickLength}
              y1={px}
              x2={THICKNESS}
              y2={px}
              stroke={TICK_COLOUR}
              strokeWidth={1}
            />
            {major ? (
              <text
                x={2}
                y={px - 2}
                fontSize={9}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fill={LABEL_COLOUR}
              >
                {u}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function pickInterval(scale: number): number {
  if (scale <= 0.25) return 200;
  if (scale <= 0.75) return 100;
  if (scale <= 1.5) return 50;
  return 20;
}
