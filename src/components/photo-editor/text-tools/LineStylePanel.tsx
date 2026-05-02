// src/components/photo-editor/text-tools/LineStylePanel.tsx
//
// Line-style panel — May 2026.
//
// Surfaces line-specific controls for the sole-selected line-type
// ShapeLayer (any catalogue entry whose id starts with `line-`):
//
//   • Arrowhead preset — 4 visual buttons:
//        ───      none
//        ───▶     end only
//        ◀───     start only
//        ◀──▶     both ends
//
//   • Arrowhead style picker — 2 buttons:
//        ▶  filled triangle   (Konva.Arrow with `fill = stroke colour`)
//        >  open chevron      (Konva.Arrow with `fill = transparent`)
//
// Reads + writes `layer.lineProps`. When unset, falls back to the
// no-arrows / triangle-style default so existing line layers (created
// before this build) render unchanged.
//
// Mounted as a stand-alone panel surfaced from the AddLayerSheet for
// line-type shapes; not wired into the shape tab strip (the tab strip
// is shape-fundamentals only).

"use client";

import { useMemo } from "react";
import { Pencil, Undo2 } from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { Row, Section, SectionDivider } from "./controls";
import type {
  AnyLayer,
  LineProps,
  ShapeLayer,
} from "@/lib/photo-editor/types";

const DEFAULT_LINE_PROPS: LineProps = {
  arrowStart: false,
  arrowEnd: false,
  arrowStyle: "triangle",
};

interface LineStylePanelProps {
  inline?: boolean;
}

type Preset = "none" | "end" | "start" | "both";

function presetOf(props: LineProps): Preset {
  if (props.arrowStart && props.arrowEnd) return "both";
  if (props.arrowStart) return "start";
  if (props.arrowEnd) return "end";
  return "none";
}

function patchForPreset(preset: Preset): Pick<LineProps, "arrowStart" | "arrowEnd"> {
  switch (preset) {
    case "none":
      return { arrowStart: false, arrowEnd: false };
    case "end":
      return { arrowStart: false, arrowEnd: true };
    case "start":
      return { arrowStart: true, arrowEnd: false };
    case "both":
      return { arrowStart: true, arrowEnd: true };
  }
}

export function LineStylePanel({ inline = false }: LineStylePanelProps) {
  const { state, dispatch } = useEditor();

  const layer = useMemo<ShapeLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "shape") return null;
    if (!(found as ShapeLayer).shapeId.startsWith("line-")) return null;
    return found as ShapeLayer;
  }, [state.selection, state.project.layers]);

  if (!layer) {
    return (
      <div
        className="px-4 py-6 text-xs"
        style={{ color: "var(--pe-text-subtle)" }}
      >
        Select a line to edit arrowheads.
      </div>
    );
  }

  const props = layer.lineProps ?? DEFAULT_LINE_PROPS;
  const preset = presetOf(props);
  const isFreehand = layer.shapeId === "line-freehand";
  const isCurved = layer.shapeId === "line-curved";

  function patchLine(next: Partial<LineProps>) {
    if (!layer) return;
    const merged: LineProps = { ...props, ...next };
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { lineProps: merged } as Partial<AnyLayer>,
    });
  }

  function startFreehandRedraw() {
    if (!layer) return;
    dispatch({ type: "SET_FREEHAND_DRAWING", layerId: layer.id });
  }

  function resetBezier() {
    if (!layer) return;
    const next: LineProps = { ...props };
    delete next.bezier;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { lineProps: next } as Partial<AnyLayer>,
    });
  }

  function resetFreehand() {
    if (!layer) return;
    const next: LineProps = { ...props };
    delete next.freehandPoints;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: { lineProps: next } as Partial<AnyLayer>,
    });
  }

  const body = (
    <div className="flex-1 overflow-y-auto">
      <Section title="Arrowheads">
        <Row label="Ends">
          <div className="flex flex-wrap gap-2">
            <PresetButton
              active={preset === "none"}
              ariaLabel="No arrowheads"
              onClick={() => patchLine(patchForPreset("none"))}
              glyph={<LineGlyph variant="none" />}
            />
            <PresetButton
              active={preset === "end"}
              ariaLabel="Arrowhead at end"
              onClick={() => patchLine(patchForPreset("end"))}
              glyph={<LineGlyph variant="end" />}
            />
            <PresetButton
              active={preset === "start"}
              ariaLabel="Arrowhead at start"
              onClick={() => patchLine(patchForPreset("start"))}
              glyph={<LineGlyph variant="start" />}
            />
            <PresetButton
              active={preset === "both"}
              ariaLabel="Arrowheads at both ends"
              onClick={() => patchLine(patchForPreset("both"))}
              glyph={<LineGlyph variant="both" />}
            />
          </div>
        </Row>
      </Section>

      <SectionDivider />

      <Section title="Arrowhead style">
        <Row label="Style">
          <div className="flex gap-2">
            <StyleButton
              active={props.arrowStyle === "triangle"}
              ariaLabel="Filled triangle"
              onClick={() => patchLine({ arrowStyle: "triangle" })}
              glyph={<ArrowStyleGlyph kind="triangle" />}
            />
            <StyleButton
              active={props.arrowStyle === "chevron"}
              ariaLabel="Open chevron"
              onClick={() => patchLine({ arrowStyle: "chevron" })}
              glyph={<ArrowStyleGlyph kind="chevron" />}
            />
          </div>
        </Row>
      </Section>

      {isFreehand ? (
        <>
          <SectionDivider />
          <Section title="Freehand path">
            <Row label="Path">
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  primary
                  ariaLabel="Redraw the freehand line"
                  onClick={startFreehandRedraw}
                  icon={<Pencil className="w-4 h-4" strokeWidth={2} />}
                  text="Redraw"
                />
                {props.freehandPoints && props.freehandPoints.length > 0 ? (
                  <ActionButton
                    ariaLabel="Reset to default wave"
                    onClick={resetFreehand}
                    icon={<Undo2 className="w-4 h-4" strokeWidth={2} />}
                    text="Reset"
                  />
                ) : null}
              </div>
            </Row>
            <Row>
              <span
                className="text-[11px]"
                style={{ color: "var(--pe-text-muted)" }}
              >
                Tap Redraw, then drag across the canvas to lay down a
                new path. The bounding box snaps to fit your drawing.
              </span>
            </Row>
          </Section>
        </>
      ) : null}

      {isCurved ? (
        <>
          <SectionDivider />
          <Section title="Curve shape">
            <Row label="Curve">
              <div className="flex flex-wrap gap-2">
                {props.bezier ? (
                  <ActionButton
                    ariaLabel="Reset curve to default S"
                    onClick={resetBezier}
                    icon={<Undo2 className="w-4 h-4" strokeWidth={2} />}
                    text="Reset curve"
                  />
                ) : null}
              </div>
            </Row>
            <Row>
              <span
                className="text-[11px]"
                style={{ color: "var(--pe-text-muted)" }}
              >
                Drag the two square handles on the canvas to reshape
                the curve. The endpoints stay at the bbox corners; the
                control points pull the curve toward them.
              </span>
            </Row>
          </Section>
        </>
      ) : null}
    </div>
  );

  if (inline) return body;
  return body;
}

// ─── Buttons ────────────────────────────────────────────────────

interface ButtonProps {
  active: boolean;
  ariaLabel: string;
  onClick: () => void;
  glyph: React.ReactNode;
}

function PresetButton({ active, ariaLabel, onClick, glyph }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className="inline-flex items-center justify-center rounded-md transition-colors"
      style={{
        width: 64,
        height: 40,
        background: active ? "var(--pe-accent-soft, #DCFCE7)" : "transparent",
        border: active
          ? "1.5px solid var(--pe-accent)"
          : "1px solid var(--pe-border)",
        color: active ? "var(--pe-accent)" : "var(--pe-text)",
      }}
    >
      {glyph}
    </button>
  );
}

function StyleButton({ active, ariaLabel, onClick, glyph }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className="inline-flex items-center justify-center rounded-md transition-colors"
      style={{
        width: 56,
        height: 40,
        background: active ? "var(--pe-accent-soft, #DCFCE7)" : "transparent",
        border: active
          ? "1.5px solid var(--pe-accent)"
          : "1px solid var(--pe-border)",
        color: active ? "var(--pe-accent)" : "var(--pe-text)",
      }}
    >
      {glyph}
    </button>
  );
}

// ─── Glyphs ─────────────────────────────────────────────────────

function LineGlyph({
  variant,
}: {
  variant: "none" | "end" | "start" | "both";
}) {
  // 48 × 16 viewBox. Line at y=8.
  const startArrow = variant === "start" || variant === "both";
  const endArrow = variant === "end" || variant === "both";
  const x1 = startArrow ? 8 : 2;
  const x2 = endArrow ? 40 : 46;
  return (
    <svg width={48} height={16} viewBox="0 0 48 16" aria-hidden>
      <line
        x1={x1}
        y1={8}
        x2={x2}
        y2={8}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {startArrow ? (
        <polygon
          points="2,8 9,4 9,12"
          fill="currentColor"
        />
      ) : null}
      {endArrow ? (
        <polygon
          points="46,8 39,4 39,12"
          fill="currentColor"
        />
      ) : null}
    </svg>
  );
}

// ─── Action button (Redraw / Reset) ─────────────────────────────

function ActionButton({
  ariaLabel,
  onClick,
  icon,
  text,
  primary = false,
}: {
  ariaLabel: string;
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1.5 transition-colors"
      style={{
        height: 36,
        padding: "0 14px",
        borderRadius: 999,
        background: primary ? "var(--pe-accent)" : "transparent",
        color: primary ? "#FFFFFF" : "var(--pe-text)",
        border: primary
          ? "1.5px solid var(--pe-accent)"
          : "1px solid var(--pe-border)",
        fontSize: 13,
        fontWeight: primary ? 600 : 500,
      }}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

function ArrowStyleGlyph({ kind }: { kind: "triangle" | "chevron" }) {
  if (kind === "triangle") {
    return (
      <svg width={32} height={16} viewBox="0 0 32 16" aria-hidden>
        <line
          x1={2}
          y1={8}
          x2={20}
          y2={8}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <polygon points="30,8 20,3 20,13" fill="currentColor" />
      </svg>
    );
  }
  // Chevron — open angle, drawn with 2 strokes meeting at the tip.
  return (
    <svg width={32} height={16} viewBox="0 0 32 16" aria-hidden>
      <line
        x1={2}
        y1={8}
        x2={26}
        y2={8}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <polyline
        points="20,3 30,8 20,13"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
