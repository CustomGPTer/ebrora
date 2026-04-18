// =============================================================================
// Preset: fishbone-ishikawa-6bone
// Classic cause-and-effect (Ishikawa) diagram — horizontal spine pointing
// at an effect box on the right, with 6 diagonal bones (3 above, 3 below)
// each carrying a category label and up to 3 sub-causes.
//
// Differentiates from:
//   - concept-map (non-hierarchical web of labelled links)
//   - hierarchy-mindmap-centre (radial, not spine-based)
//   - hierarchy-tree-generic (vertical tree, not angled ribs)
// Use this when the text is explicitly a root-cause analysis of one effect.
// =============================================================================

import { z } from 'zod';
import type { ReactElement } from 'react';
import type { Preset, PresetRenderProps } from '../types';
import { paletteColor } from '../../palettes';

const boneSchema = z.object({
  category: z.string().min(1).max(18),
  causes: z.array(z.string().min(1).max(24)).min(1).max(3),
});

const dataSchema = z.object({
  effect: z.string().min(1).max(32),
  bones: z.array(boneSchema).length(6),
});

type Data = z.infer<typeof dataSchema>;

const defaultData: Data = {
  effect: 'Primary outcome',
  bones: [
    { category: 'Category one', causes: ['Cause A', 'Cause B'] },
    { category: 'Category two', causes: ['Cause A', 'Cause B'] },
    { category: 'Category three', causes: ['Cause A', 'Cause B'] },
    { category: 'Category four', causes: ['Cause A', 'Cause B'] },
    { category: 'Category five', causes: ['Cause A', 'Cause B'] },
    { category: 'Category six', causes: ['Cause A', 'Cause B'] },
  ],
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function Render({ data, settings, width, height }: PresetRenderProps<Data>): ReactElement {
  const { paletteId, customColors } = settings;
  const font = settings.font ?? 'Inter, sans-serif';
  const spineColour = paletteColor(paletteId, 0);
  const boneColour = paletteColor(paletteId, 1);
  const causeColour = paletteColor(paletteId, 2);
  const textColour = paletteColor(paletteId, 0);
  const effectFill = paletteColor(paletteId, 0);
  const effectText = paletteColor(paletteId, 5);

  // Layout zones
  const marginX = 30;
  const centreY = height / 2;
  const effectBoxW = Math.min(180, width * 0.22);
  const effectBoxH = 60;
  const effectBoxX = width - marginX - effectBoxW;
  const effectBoxY = centreY - effectBoxH / 2;

  // Spine endpoints
  const spineStartX = marginX;
  const spineEndX = effectBoxX;

  // Bone anchor points along the spine — 3 slots, each with one top + one bottom bone.
  // Slots at 25 %, 50 %, 75 % of the spine.
  const slots = [0.22, 0.5, 0.78];
  const boneLen = Math.min(150, (spineEndX - spineStartX) * 0.32);
  const boneAngleRad = (60 * Math.PI) / 180; // bones rise at 60° from the spine
  const boneDx = Math.cos(boneAngleRad) * boneLen; // backwards along the spine
  const boneDy = Math.sin(boneAngleRad) * boneLen;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <marker
          id="fish-spine-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={spineColour} />
        </marker>
      </defs>

      {/* Spine */}
      <line
        x1={spineStartX}
        y1={centreY}
        x2={spineEndX}
        y2={centreY}
        stroke={spineColour}
        strokeWidth={3}
        markerEnd="url(#fish-spine-arrow)"
      />

      {/* Bones + causes */}
      {data.bones.map((bone, i) => {
        const slotIdx = Math.floor(i / 2);
        const isTop = i % 2 === 0;
        const anchorX = spineStartX + slots[slotIdx] * (spineEndX - spineStartX);
        const anchorY = centreY;
        // Tip of the bone sits up-and-back or down-and-back from the anchor.
        const tipX = anchorX - boneDx;
        const tipY = isTop ? anchorY - boneDy : anchorY + boneDy;
        const nodeId = `bone-${i}`;
        const fill = customColors[nodeId] ?? boneColour;

        // Cause slots along the bone: evenly distributed between 35 % and 85 % of the bone length.
        const causeCount = bone.causes.length;
        const causeFractions =
          causeCount === 1
            ? [0.6]
            : causeCount === 2
              ? [0.45, 0.8]
              : [0.35, 0.6, 0.85];

        return (
          <g key={nodeId} data-id={nodeId}>
            {/* Main bone line */}
            <line
              x1={anchorX}
              y1={anchorY}
              x2={tipX}
              y2={tipY}
              stroke={fill}
              strokeWidth={2.5}
            />

            {/* Category label at the tip */}
            <rect
              x={tipX - 70}
              y={isTop ? tipY - 22 : tipY + 4}
              width={140}
              height={18}
              rx={4}
              ry={4}
              fill={fill}
              opacity={0.15}
            />
            <text
              x={tipX}
              y={isTop ? tipY - 9 : tipY + 16}
              textAnchor="middle"
              fontFamily={font}
              fontSize={11}
              fontWeight={700}
              fill={textColour}
            >
              {truncate(bone.category, 18)}
            </text>

            {/* Cause twigs — short horizontal lines off the main bone with a label */}
            {bone.causes.map((cause, ci) => {
              const f = causeFractions[ci] ?? 0.5;
              // Position along the bone line
              const px = anchorX + (tipX - anchorX) * f;
              const py = anchorY + (tipY - anchorY) * f;
              // Short horizontal twig (32px) pointing away from the spine
              const twigLen = 34;
              const twigEndX = px - twigLen;
              return (
                <g key={`cause-${ci}`}>
                  <line
                    x1={px}
                    y1={py}
                    x2={twigEndX}
                    y2={py}
                    stroke={causeColour}
                    strokeWidth={1.5}
                    opacity={0.75}
                  />
                  <text
                    x={twigEndX - 4}
                    y={py + 3}
                    textAnchor="end"
                    fontFamily={font}
                    fontSize={9}
                    fill={textColour}
                    opacity={0.95}
                  >
                    {truncate(cause, 22)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Effect box */}
      <g data-id="effect">
        <rect
          x={effectBoxX}
          y={effectBoxY}
          width={effectBoxW}
          height={effectBoxH}
          rx={6}
          ry={6}
          fill={customColors['effect'] ?? effectFill}
          stroke={paletteColor(paletteId, 5)}
          strokeWidth={1.5}
        />
        <text
          x={effectBoxX + effectBoxW / 2}
          y={effectBoxY + effectBoxH / 2 + 4}
          textAnchor="middle"
          fontFamily={font}
          fontSize={13}
          fontWeight={700}
          fill={effectText}
        >
          {truncate(data.effect, 22)}
        </text>
      </g>
    </svg>
  );
}

export const fishboneIshikawa6BonePreset: Preset<Data> = {
  id: 'fishbone-ishikawa-6bone',
  name: 'Fishbone — 6 Categories',
  category: 'relationships',
  tags: ['fishbone', 'ishikawa', 'cause-effect', 'root-cause', 'analysis'],
  description: 'Cause-and-effect diagram with one effect and 6 category bones.',
  aiDescription:
    'Use when the text is a root-cause analysis of a single outcome — one central effect with contributing causes grouped into exactly 6 categories. Each category carries 1–3 specific causes as twigs. Prefer "concept-map" when the shape is a web of peer concepts linked by labelled relationships rather than a centred cause-effect breakdown; prefer "hierarchy-mindmap-centre" when the content is a topic breakdown with no single "effect" to anchor on.',
  dataSchema,
  defaultData,
  thumbnailSvg: `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="8" y1="20" x2="92" y2="20" stroke="#1B5B50" stroke-width="1.5"/>
  <rect x="92" y="14" width="24" height="12" rx="2" fill="#1B5B50"/>
  <line x1="30" y1="20" x2="22" y2="8" stroke="#2A7A6C" stroke-width="1.2"/>
  <line x1="30" y1="20" x2="22" y2="32" stroke="#2A7A6C" stroke-width="1.2"/>
  <line x1="55" y1="20" x2="47" y2="8" stroke="#2A7A6C" stroke-width="1.2"/>
  <line x1="55" y1="20" x2="47" y2="32" stroke="#2A7A6C" stroke-width="1.2"/>
  <line x1="80" y1="20" x2="72" y2="8" stroke="#2A7A6C" stroke-width="1.2"/>
  <line x1="80" y1="20" x2="72" y2="32" stroke="#2A7A6C" stroke-width="1.2"/>
</svg>`,
  render: Render,
  editableFields: ['effect', 'bones[].category', 'bones[].causes[]'],
  compatibleFamilies: ['relationships'],
};
