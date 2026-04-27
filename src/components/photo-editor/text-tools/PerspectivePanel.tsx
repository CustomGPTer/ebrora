// src/components/photo-editor/text-tools/PerspectivePanel.tsx
//
// Phase 2 — actual UI for editing an image's 4-point perspective warp.
// Replaces the Phase 1 placeholder. Features:
//
//   • Enable / disable toggle (sets layer.perspective to identity quad
//     on enable, null on disable)
//   • Reset button (back to identity quad — flat rectangle)
//   • Four preset tilts: forward / back / left / right
//   • Per-corner X/Y offset sliders for fine control
//
// All controls dispatch UPDATE_LAYER on the selected ImageLayer. The
// rendering is handled by ImageNode's perspective sceneFunc whenever
// layer.perspective !== null AND not the identity quad.

"use client";

import { useMemo } from "react";
import { Box, RotateCcw } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import {
  ActionButton,
  DimmedWhen,
  Row,
  Section,
  SectionDivider,
  Slider,
  Toggle,
} from "./controls";
import { identityPerspective } from "@/lib/photo-editor/canvas/perspective-render";
import type {
  AnyLayer,
  ImageLayer,
  Point,
} from "@/lib/photo-editor/types";

interface PerspectivePanelProps {
  open: boolean;
  onClose: () => void;
}

/** A single drag of any one corner is bounded so the quad doesn't
 *  invert or fly off-canvas. ±30% of the image dimension is enough
 *  for any realistic tilt. */
const CORNER_DRAG_FRACTION = 0.3;

export function PerspectivePanel({ open, onClose }: PerspectivePanelProps) {
  const { state, dispatch } = useEditor();

  const layer = useMemo<ImageLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "image") return null;
    return found as ImageLayer;
  }, [state.selection, state.project.layers]);

  // Visible dimensions of the image (post-crop, pre-transform). Mirrors
  // ImageNode's logic for the source rectangle.
  const w = layer ? (layer.crop ? layer.crop.width : layer.naturalWidth) : 0;
  const h = layer ? (layer.crop ? layer.crop.height : layer.naturalHeight) : 0;

  const enabled = layer?.perspective !== null && layer?.perspective !== undefined;
  const corners: [Point, Point, Point, Point] = enabled
    ? (layer!.perspective as [Point, Point, Point, Point])
    : identityPerspective(w, h);

  function patchPerspective(
    next: [Point, Point, Point, Point] | null,
  ) {
    if (!layer) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { perspective: next } as Partial<AnyLayer>,
    });
  }

  function setCorner(idx: 0 | 1 | 2 | 3, axis: "x" | "y", value: number) {
    const next: [Point, Point, Point, Point] = [
      { ...corners[0] },
      { ...corners[1] },
      { ...corners[2] },
      { ...corners[3] },
    ];
    next[idx] = { ...next[idx], [axis]: value };
    patchPerspective(next);
  }

  function applyPreset(preset: "forward" | "back" | "left" | "right") {
    // Each preset narrows one edge by 18% of its dimension — enough to
    // read clearly as a tilt, not so much that the image is unusable.
    const dx = w * 0.18;
    const dy = h * 0.18;
    let next: [Point, Point, Point, Point];
    switch (preset) {
      case "forward":
        // Top edge narrows (image leans away from viewer)
        next = [
          { x: dx, y: 0 },
          { x: w - dx, y: 0 },
          { x: w, y: h },
          { x: 0, y: h },
        ];
        break;
      case "back":
        // Bottom edge narrows (image leans toward viewer)
        next = [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w - dx, y: h },
          { x: dx, y: h },
        ];
        break;
      case "left":
        // Left edge narrows (image rotates around vertical axis, leftward)
        next = [
          { x: 0, y: dy },
          { x: w, y: 0 },
          { x: w, y: h },
          { x: 0, y: h - dy },
        ];
        break;
      case "right":
        // Right edge narrows
        next = [
          { x: 0, y: 0 },
          { x: w, y: dy },
          { x: w, y: h - dy },
          { x: 0, y: h },
        ];
        break;
    }
    patchPerspective(next);
  }

  function resetIdentity() {
    patchPerspective(identityPerspective(w, h));
  }

  function setEnabled(on: boolean) {
    patchPerspective(on ? identityPerspective(w, h) : null);
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      icon={<Box className="w-5 h-5" strokeWidth={1.75} />}
      title="Perspective"
      footer={<span>4-point warp.</span>}
    >
      <div className="flex-1 overflow-y-auto">
        {!layer ? (
          <div
            className="px-4 py-6 text-xs"
            style={{ color: "var(--pe-text-subtle)" }}
          >
            Select an image to access perspective controls.
          </div>
        ) : (
          <>
            <Section title="Warp">
              <Toggle
                checked={enabled}
                onChange={setEnabled}
                label="Enable perspective warp"
              />
            </Section>

            <SectionDivider />

            <DimmedWhen disabled={!enabled}>
              <Section title="Presets">
                <div className="grid grid-cols-2 gap-2">
                  <ActionButton
                    ariaLabel="Tilt forward"
                    onClick={() => applyPreset("forward")}
                    fullWidth
                  >
                    Tilt forward
                  </ActionButton>
                  <ActionButton
                    ariaLabel="Tilt back"
                    onClick={() => applyPreset("back")}
                    fullWidth
                  >
                    Tilt back
                  </ActionButton>
                  <ActionButton
                    ariaLabel="Tilt left"
                    onClick={() => applyPreset("left")}
                    fullWidth
                  >
                    Tilt left
                  </ActionButton>
                  <ActionButton
                    ariaLabel="Tilt right"
                    onClick={() => applyPreset("right")}
                    fullWidth
                  >
                    Tilt right
                  </ActionButton>
                </div>
              </Section>

              <SectionDivider />

              <CornerEditor
                label="Top-left"
                point={corners[0]}
                width={w}
                height={h}
                onChange={(axis, v) => setCorner(0, axis, v)}
              />

              <SectionDivider />

              <CornerEditor
                label="Top-right"
                point={corners[1]}
                width={w}
                height={h}
                onChange={(axis, v) => setCorner(1, axis, v)}
              />

              <SectionDivider />

              <CornerEditor
                label="Bottom-right"
                point={corners[2]}
                width={w}
                height={h}
                onChange={(axis, v) => setCorner(2, axis, v)}
              />

              <SectionDivider />

              <CornerEditor
                label="Bottom-left"
                point={corners[3]}
                width={w}
                height={h}
                onChange={(axis, v) => setCorner(3, axis, v)}
              />

              <SectionDivider />

              <Section title="Reset">
                <ActionButton
                  ariaLabel="Reset to flat rectangle"
                  onClick={resetIdentity}
                  fullWidth
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Back to flat</span>
                </ActionButton>
              </Section>
            </DimmedWhen>
          </>
        )}
      </div>
    </PanelDrawer>
  );
}

interface CornerEditorProps {
  label: string;
  point: Point;
  width: number;
  height: number;
  onChange: (axis: "x" | "y", value: number) => void;
}

function CornerEditor({
  label,
  point,
  width,
  height,
  onChange,
}: CornerEditorProps) {
  // Slider bounds: each corner can move within ±CORNER_DRAG_FRACTION
  // of the image dimension from its identity position. The identity
  // position depends on which corner this is — we infer from the
  // current value's proximity to each rect corner. Simpler: just use
  // the whole [-frac*dim, dim + frac*dim] range so every corner is
  // editable to sensible bounds.
  const xMin = -width * CORNER_DRAG_FRACTION;
  const xMax = width * (1 + CORNER_DRAG_FRACTION);
  const yMin = -height * CORNER_DRAG_FRACTION;
  const yMax = height * (1 + CORNER_DRAG_FRACTION);

  return (
    <Section title={label}>
      <Row label="X">
        <Slider
          ariaLabel={`${label} X offset`}
          value={point.x}
          min={xMin}
          max={xMax}
          step={1}
          onChange={(v) => onChange("x", v)}
          format={(n) => `${Math.round(n)} px`}
        />
      </Row>
      <Row label="Y">
        <Slider
          ariaLabel={`${label} Y offset`}
          value={point.y}
          min={yMin}
          max={yMax}
          step={1}
          onChange={(v) => onChange("y", v)}
          format={(n) => `${Math.round(n)} px`}
        />
      </Row>
    </Section>
  );
}
