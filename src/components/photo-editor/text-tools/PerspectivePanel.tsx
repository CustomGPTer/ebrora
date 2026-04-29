// src/components/photo-editor/text-tools/PerspectivePanel.tsx
//
// 4-point perspective warp panel — generalised in Batch D2c to support
// BOTH ImageLayer and TextLayer. The UI is identical between layer
// kinds; only the source dimensions and the dispatch path differ.
//
//   • Image: dimensions = post-crop visible image size; dispatches via
//     UPDATE_LAYER directly because the legacy panel did so.
//   • Text:  dimensions = layer.width × layout.height (the flat layout
//     bbox in layer-local coords); dispatches via the same UPDATE_LAYER
//     for parity. The corners are in layer-local coords; RichTextNode
//     warps the layer-local sub-region of its anchor-padded off-screen
//     bitmap onto those corners.
//
// Drawer-vs-inline:
//   • Drawer mode (legacy) is still used by image selection in the
//     EditorShell drawer mount (`<PerspectivePanel open onClose />`).
//   • Inline mode is used by BottomDock's TextEditPanel via the new
//     Perspective tab (passes `inline`).
//
// Features unchanged from D1:
//   • Enable / disable toggle (sets layer.perspective to identity quad
//     on enable, null on disable)
//   • Reset button (back to identity quad — flat rectangle)
//   • Four preset tilts: forward / back / left / right
//   • Per-corner X/Y offset sliders for fine control

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
import { layoutText } from "@/lib/photo-editor/rich-text/engine";
import type {
  AnyLayer,
  ImageLayer,
  Point,
  TextLayer,
} from "@/lib/photo-editor/types";

interface PerspectivePanelProps {
  /** Drawer open state — ignored when `inline` is set. */
  open?: boolean;
  /** Drawer close handler — ignored when `inline` is set. */
  onClose?: () => void;
  /** When true, render body without PanelDrawer chrome (used by the
   *  bottom tab strip in BottomDock). Defaults to false. */
  inline?: boolean;
}

/** A single drag of any one corner is bounded so the quad doesn't
 *  invert or fly off-canvas. ±30% of the layer dimension is enough
 *  for any realistic tilt. */
const CORNER_DRAG_FRACTION = 0.3;

/** Layer-kind-agnostic shape used internally — `width` / `height` are
 *  the dimensions in whose coordinate system the perspective corners
 *  live. */
interface PerspectiveTarget {
  layer: ImageLayer | TextLayer;
  width: number;
  height: number;
}

export function PerspectivePanel({
  open = false,
  onClose,
  inline = false,
}: PerspectivePanelProps) {
  const { state, dispatch } = useEditor();

  const target = useMemo<PerspectiveTarget | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found) return null;

    if (found.kind === "image") {
      const img = found as ImageLayer;
      const w = img.crop ? img.crop.width : img.naturalWidth;
      const h = img.crop ? img.crop.height : img.naturalHeight;
      return { layer: img, width: w, height: h };
    }
    if (found.kind === "text") {
      const txt = found as TextLayer;
      // Layout is cheap and pure; recompute here so we don't have to
      // thread it through a context.
      const layout = layoutText(txt);
      return { layer: txt, width: txt.width, height: layout.height };
    }
    return null;
  }, [state.selection, state.project.layers]);

  const w = target?.width ?? 0;
  const h = target?.height ?? 0;

  const enabled =
    target?.layer.perspective !== null &&
    target?.layer.perspective !== undefined;
  const corners: [Point, Point, Point, Point] = enabled
    ? (target!.layer.perspective as [Point, Point, Point, Point])
    : identityPerspective(w, h);

  function patchPerspective(next: [Point, Point, Point, Point] | null) {
    if (!target) return;
    dispatch({
      type: "UPDATE_LAYER",
      id: target.layer.id,
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
    // read clearly as a tilt, not so much that the layer is unusable.
    const dx = w * 0.18;
    const dy = h * 0.18;
    let next: [Point, Point, Point, Point];
    switch (preset) {
      case "forward":
        // Top edge narrows (layer leans away from viewer)
        next = [
          { x: dx, y: 0 },
          { x: w - dx, y: 0 },
          { x: w, y: h },
          { x: 0, y: h },
        ];
        break;
      case "back":
        // Bottom edge narrows (layer leans toward viewer)
        next = [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w - dx, y: h },
          { x: dx, y: h },
        ];
        break;
      case "left":
        // Left edge narrows (rotates around vertical axis, leftward)
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

  const body = (
    <div className="flex-1 overflow-y-auto">
      {!target ? (
        <div
          className="px-4 py-6 text-xs"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          Select an image or text layer to access perspective controls.
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
  );

  if (inline) {
    return body;
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose ?? (() => {})}
      icon={<Box className="w-5 h-5" strokeWidth={1.75} />}
      title="Perspective"
      footer={<span>4-point warp.</span>}
    >
      {body}
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
  // of the layer dimension from its identity position. Just use the
  // whole [-frac*dim, dim + frac*dim] range so every corner is editable
  // to sensible bounds.
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
