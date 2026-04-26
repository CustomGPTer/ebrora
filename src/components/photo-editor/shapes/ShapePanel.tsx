// src/components/photo-editor/shapes/ShapePanel.tsx
//
// Custom shape catalogue picker. Replaces ShapePanelStub from Session 5.
//
// Layout (top → bottom inside the PanelDrawer body):
//   • Variant toggle — "Filled" / "Outlined". Sets the variant of the
//     next shape created from this panel.
//   • Colour row — 24 curated swatches (reusing ColorSwatches from text-
//     tools) plus a "Custom" disclosure that expands an HSV picker
//     (HsvPicker, also reused). The selected colour is the fill of new
//     shapes; for outlined variants it acts as the outline colour.
//   • Category tabs — Geometric / Arrows / Badges / Frames / Decorative.
//   • Preview grid — each tile renders the shape's SVG path inline so
//     the user can see what they're getting. Tap to insert.
//
// Insertion contract: tapping any shape creates a new ShapeLayer via
// `createShapeLayer({ shapeId, variant, fill, width, height })`, centres
// it on the canvas, dispatches ADD_LAYER + SET_SELECTION, and closes
// the panel. Catalogue entries can carry a `defaultSize` override
// (banners, dividers, etc.); square shapes default to 240×240 via the
// factory.
//
// Per Q4 in HANDOVER §7.5 we don't extract a parallel "ColorPicker"
// component — the existing ColorSwatches and HsvPicker are already pure
// presentational primitives that just emit a hex on change, so we
// import them directly.

"use client";

import { useState } from "react";
import { Square, ChevronDown } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import { ColorSwatches } from "../text-tools/ColorSwatches";
import { HsvPicker } from "../text-tools/HsvPicker";
import { createShapeLayer } from "@/lib/photo-editor/canvas/factories";
import { centreLayerOnCanvas } from "@/lib/photo-editor/canvas/selection";
import {
  SHAPE_CATEGORIES,
  SHAPES_BY_CATEGORY,
  type ShapeCategoryId,
  type ShapeEntry,
} from "@/lib/photo-editor/shapes/catalogue";

interface ShapePanelProps {
  open: boolean;
  onClose: () => void;
}

type Variant = "filled" | "outlined";

const DEFAULT_VARIANT: Variant = "filled";
const DEFAULT_FILL = "#1B5B50"; // Brand accent (gotcha #10).

export function ShapePanel({ open, onClose }: ShapePanelProps) {
  const { state, dispatch } = useEditor();

  // ─── Local state — settings for the NEXT shape inserted. ──────
  const [variant, setVariant] = useState<Variant>(DEFAULT_VARIANT);
  const [fill, setFill] = useState<string>(DEFAULT_FILL);
  const [activeCategory, setActiveCategory] =
    useState<ShapeCategoryId>("geometric");
  const [showHsv, setShowHsv] = useState(false);

  // ─── Tap handler ─────────────────────────────────────────────
  function handlePick(entry: ShapeEntry) {
    const project = state.project;
    const baseLayer = createShapeLayer({
      shapeId: entry.id,
      variant,
      fill,
      width: entry.defaultSize?.width,
      height: entry.defaultSize?.height,
      name: entry.label,
    });
    const positioned = centreLayerOnCanvas(
      baseLayer,
      project.width,
      project.height,
    );
    dispatch({ type: "ADD_LAYER", layer: positioned });
    dispatch({ type: "SET_SELECTION", ids: [positioned.id] });
    onClose();
  }

  const categoryEntries = SHAPES_BY_CATEGORY[activeCategory];

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      icon={<Square className="w-5 h-5" strokeWidth={1.75} />}
      title="Shapes"
      footer={<span>Tap a shape to add it to the canvas.</span>}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Variant + colour row */}
        <div
          className="flex-none px-4 pt-4 pb-3"
          style={{ borderBottom: "1px solid var(--pe-border)" }}
        >
          <VariantToggle value={variant} onChange={setVariant} />

          <div className="mt-3">
            <div
              className="text-[11px] uppercase tracking-wide mb-2"
              style={{ color: "var(--pe-text-subtle)" }}
            >
              Colour
            </div>
            <ColorSwatches value={fill} onPick={setFill} />
            <button
              type="button"
              onClick={() => setShowHsv((v) => !v)}
              aria-expanded={showHsv}
              className="mt-2 inline-flex items-center gap-1 text-xs transition-colors"
              style={{ color: "var(--pe-text-muted)" }}
            >
              <ChevronDown
                className="w-3.5 h-3.5"
                strokeWidth={2}
                style={{
                  transform: showHsv ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 150ms",
                }}
              />
              <span>{showHsv ? "Hide" : "Custom colour"}</span>
            </button>
            {showHsv ? (
              <div className="mt-2">
                <HsvPicker value={fill} onChange={setFill} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Category tabs */}
        <div
          className="flex-none flex gap-1 overflow-x-auto px-2 py-2"
          style={{
            borderBottom: "1px solid var(--pe-border)",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {SHAPE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                aria-label={cat.label}
                aria-pressed={isActive}
                className="flex-none inline-flex items-center px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors"
                style={{
                  background: isActive
                    ? "var(--pe-tool-icon-active-bg)"
                    : "transparent",
                  color: isActive
                    ? "var(--pe-tool-icon-active)"
                    : "var(--pe-text-muted)",
                  border: "1px solid var(--pe-border)",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Preview grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {categoryEntries.map((entry) => (
              <ShapeTile
                key={entry.id}
                entry={entry}
                variant={variant}
                fill={fill}
                onClick={() => handlePick(entry)}
              />
            ))}
          </div>
        </div>
      </div>
    </PanelDrawer>
  );
}

// ─── Variant toggle ─────────────────────────────────────────────

function VariantToggle({
  value,
  onChange,
}: {
  value: Variant;
  onChange: (v: Variant) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Shape variant"
      className="inline-flex p-0.5 rounded-lg"
      style={{
        background: "var(--pe-surface-2)",
        border: "1px solid var(--pe-border)",
      }}
    >
      {(["filled", "outlined"] as const).map((opt) => {
        const isActive = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={isActive}
            className="px-3 py-1 text-xs rounded-md transition-colors capitalize"
            style={{
              background: isActive ? "var(--pe-surface)" : "transparent",
              color: isActive ? "var(--pe-text)" : "var(--pe-text-muted)",
              fontWeight: isActive ? 600 : 400,
              boxShadow: isActive ? "var(--pe-shadow-sm)" : "none",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Shape preview tile ─────────────────────────────────────────
//
// Renders the catalogue's SVG path inline at the panel's current variant
// and fill so users see exactly what they're inserting. Tile aspect is
// derived from the entry's `defaultSize` when present (banners look like
// banners) or square otherwise.

function ShapeTile({
  entry,
  variant,
  fill,
  onClick,
}: {
  entry: ShapeEntry;
  variant: Variant;
  fill: string;
  onClick: () => void;
}) {
  // Visual aspect — wide banners get a wider tile cell.
  const ds = entry.defaultSize;
  const aspect = ds ? `${ds.width} / ${ds.height}` : "1 / 1";

  // Fill / stroke for the preview match the panel's variant settings.
  // For "outlined" we paint stroke + transparent fill; for "filled" the
  // fill carries the colour and we also nudge a thin border-coloured
  // stroke so very-pale fills (white) still read as a shape.
  const previewFill = variant === "filled" ? fill : "transparent";
  const previewStroke = variant === "outlined" ? fill : "var(--pe-border)";
  const previewStrokeWidth = variant === "outlined" ? 4 : 1;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Add ${entry.label}`}
      title={entry.label}
      className="rounded-xl flex flex-col items-center justify-center gap-1 transition-colors p-2"
      style={{
        background: "var(--pe-surface-2)",
        border: "1px solid var(--pe-border)",
        color: "var(--pe-text)",
        aspectRatio: ds ? "1 / 1" : "1 / 1",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--pe-tool-icon-active-bg)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--pe-surface-2)";
      }}
    >
      <div
        style={{
          width: "100%",
          height: "70%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          viewBox={entry.viewBox}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
          style={{
            width: "100%",
            height: "100%",
            maxHeight: "100%",
            aspectRatio: aspect,
          }}
        >
          <path
            d={entry.path}
            fill={previewFill}
            stroke={previewStroke}
            strokeWidth={previewStrokeWidth}
            fillRule="evenodd"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <span
        className="text-[10px] leading-tight text-center"
        style={{ color: "var(--pe-text-muted)" }}
      >
        {entry.label}
      </span>
    </button>
  );
}
