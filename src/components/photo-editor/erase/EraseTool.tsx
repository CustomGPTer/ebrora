// src/components/photo-editor/erase/EraseTool.tsx
//
// Full-screen erase modal. Activated when the user taps the Erase tool
// button while a single text layer is selected. Per HANDOVER §7.5 Q3
// the surface is a full-screen modal — the Add Text app does it this
// way and it's the right model for a destructive operation. ESC and the
// Cancel button discard pending strokes; Done commits.
//
// Architecture:
//   • The modal sits at position: fixed; inset: 0; z-index above panel
//     drawers (which are at 200/210). Backdrop dims the editor.
//   • Inside the modal we render a fresh Konva Stage that mirrors the
//     project canvas (background + the target text layer + nothing else)
//     scaled to fit the modal's working area.
//   • The text layer is rendered via RichTextNode with a SYNTHETIC erase
//     array — `[...layer.erase, ...pending, ...active]` — so the user
//     sees the live preview as they paint without committing to history.
//     RichTextNode's destination-out pass (added in this same session)
//     handles the masking.
//   • Pointer events on the stage are captured and converted to the
//     text layer's local coordinate space via the standard
//     `getAbsoluteTransform().copy().invert()` recipe (gotcha #25).
//   • The brush size slider drives the radius of every new stroke.
//     Range: 1–100 px in layer-local pixels (the same units the type
//     stores). Visual brush diameter on screen scales with the layer's
//     own scaleX so the indicator matches what'll actually be erased.
//
// Mutation contract: on Done we dispatch a single UPDATE_LAYER with
// `erase: [...originalLayer.erase, ...pending]`. No new reducer action
// — the handover marked UPDATE_LAYER as the cleaner option (§7.2).
// History snapshots once per session because the reducer treats
// UPDATE_LAYER as undoable; for v1 we accept this granularity.

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import { Eraser, X, Check } from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { RichTextNode } from "../canvas/RichTextNode";
import { BrushSizeIndicator } from "./BrushSizeIndicator";
import type {
  Background,
  EraseStroke,
  Point,
  TextLayer,
} from "@/lib/photo-editor/types";

// Same constant as RichTextNode / TextEditOverlay — the off-screen
// bitmap is padded by this in every direction. (Gotcha #19.)
const RENDER_PADDING = 24;

// Slider bounds — locked per HANDOVER §7.4 ("variable size, slider 1–100 px").
const MIN_BRUSH = 1;
const MAX_BRUSH = 100;
const DEFAULT_BRUSH = 24;

// Modal padding around the working area — leaves room for the toolbar
// (top) and brush controls (bottom). Numbers in CSS pixels.
const TOP_BAR = 56;
const BOTTOM_BAR = 96;
const MODAL_PAD = 24;

interface EraseToolProps {
  open: boolean;
  onClose: () => void;
}

export function EraseTool({ open, onClose }: EraseToolProps) {
  const { state, dispatch } = useEditor();

  // Resolve the target text layer — exactly one text layer must be
  // selected. If anything else is in selection (or the selection has
  // changed since the modal opened), we close politely.
  const targetLayer = useMemo<TextLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const layer = state.project.layers.find((l) => l.id === state.selection[0]);
    if (!layer || layer.kind !== "text") return null;
    return layer;
  }, [state.selection, state.project.layers]);

  // Auto-close if the target disappears (selection cleared, layer
  // deleted, kind changed).
  useEffect(() => {
    if (open && !targetLayer) onClose();
  }, [open, targetLayer, onClose]);

  // ESC closes (revert).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !targetLayer) return null;

  return (
    <EraseToolImpl
      layer={targetLayer}
      project={state.project}
      onClose={onClose}
      onCommit={(strokes) => {
        dispatch({
          type: "UPDATE_LAYER",
          id: targetLayer.id,
          patch: { erase: [...targetLayer.erase, ...strokes] },
        });
        onClose();
      }}
    />
  );
}

// ─── Implementation (only mounted while the modal is open + valid). ──

function EraseToolImpl({
  layer,
  project,
  onClose,
  onCommit,
}: {
  layer: TextLayer;
  project: import("@/lib/photo-editor/types").Project;
  onClose: () => void;
  onCommit: (strokes: EraseStroke[]) => void;
}) {
  // ─── Modal-local stroke accumulation ─────────────────────────
  const [pending, setPending] = useState<EraseStroke[]>([]);
  const [active, setActive] = useState<EraseStroke | null>(null);
  const [brushSize, setBrushSize] = useState<number>(DEFAULT_BRUSH);

  // Synthetic preview layer — what RichTextNode actually paints. We
  // splice the in-progress strokes onto the layer's existing erase
  // array; the live preview matches the would-be commit exactly.
  const previewLayer = useMemo<TextLayer>(() => {
    const all: EraseStroke[] = [...layer.erase, ...pending];
    if (active) all.push(active);
    return { ...layer, erase: all };
  }, [layer, pending, active]);

  // ─── Working-area sizing ─────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ w: width, h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const availW = Math.max(0, containerSize.w - MODAL_PAD * 2);
  const availH = Math.max(0, containerSize.h - MODAL_PAD * 2);
  const stageScale =
    availW > 0 && availH > 0
      ? Math.min(availW / project.width, availH / project.height, 1)
      : 1;
  const stageW = Math.round(project.width * stageScale);
  const stageH = Math.round(project.height * stageScale);

  // ─── Pointer handlers ────────────────────────────────────────
  const stageRef = useRef<Konva.Stage>(null);
  const textNodeRef = useRef<Konva.Image | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);

  // Grab the Konva node for the rendered text layer once it's mounted.
  // RichTextNode sets id={layer.id} (hard rule #6 / gotcha re ids), so
  // we look it up by id from the stage.
  const findTextNode = useCallback((): Konva.Node | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    return stage.findOne(`#${layer.id}`) ?? null;
  }, [layer.id]);

  const stagePosToLayerLocal = useCallback(
    (stagePos: { x: number; y: number }): Point | null => {
      const node = textNodeRef.current ?? findTextNode();
      if (!node) return null;
      // Cache the lookup on subsequent calls.
      textNodeRef.current = node as Konva.Image;
      const matrix = node.getAbsoluteTransform().copy().invert();
      const bitmap = matrix.point(stagePos);
      return { x: bitmap.x - RENDER_PADDING, y: bitmap.y - RENDER_PADDING };
    },
    [findTextNode],
  );

  const handlePointerDown = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sp = stage.getPointerPosition();
    if (!sp) return;
    const local = stagePosToLayerLocal(sp);
    if (!local) return;
    isDrawingRef.current = true;
    setActive({ radius: brushSize / 2, points: [local] });
  }, [brushSize, stagePosToLayerLocal]);

  const handlePointerMove = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sp = stage.getPointerPosition();
    if (!sp) {
      setPointer(null);
      return;
    }
    setPointer(sp);
    if (!isDrawingRef.current) return;
    const local = stagePosToLayerLocal(sp);
    if (!local) return;
    setActive((prev) => {
      if (!prev) return prev;
      // Cheap distance gate — if the pointer barely moved (< 1 px in
      // layer-local) we don't push a redundant point.
      const last = prev.points[prev.points.length - 1];
      if (Math.hypot(local.x - last.x, local.y - last.y) < 1) return prev;
      return { ...prev, points: [...prev.points, local] };
    });
  }, [stagePosToLayerLocal]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setActive((prev) => {
      if (!prev) return null;
      setPending((p) => [...p, prev]);
      return null;
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setPointer(null);
    // If we were mid-stroke when the pointer left, commit it as-is —
    // matches the Add Text behaviour (no "abandon" state).
    handlePointerUp();
  }, [handlePointerUp]);

  // ─── Brush indicator visual size ──────────────────────────────
  // brushSize is layer-local diameter. Visual diameter on screen =
  // brushSize × |layer.scaleX| × stageScale. Use abs in case the layer
  // was flipped via a negative scale.
  const visualBrushDiameter =
    brushSize * Math.abs(layer.transform.scaleX) * stageScale;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Erase from text"
      className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      {/* ── Top bar ───────────────────────────────────────────── */}
      <div
        className="flex-none flex items-center justify-between px-4"
        style={{ height: TOP_BAR }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel erase"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors"
          style={{
            color: "#FFFFFF",
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <X className="w-4 h-4" strokeWidth={2} />
          <span>Cancel</span>
        </button>

        <div className="flex items-center gap-2 text-sm" style={{ color: "#FFFFFF" }}>
          <Eraser className="w-4 h-4" strokeWidth={1.75} />
          <span>Erase</span>
        </div>

        <button
          type="button"
          onClick={() => onCommit(pending)}
          aria-label="Apply erase"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors"
          style={{
            color: "#FFFFFF",
            background: "var(--pe-tool-icon-active-bg, #1B5B50)",
          }}
        >
          <Check className="w-4 h-4" strokeWidth={2} />
          <span>Done</span>
        </button>
      </div>

      {/* ── Working area (Stage + brush indicator) ─────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ touchAction: "none" }}
      >
        {containerSize.w > 0 && stageW > 0 && stageH > 0 && (
          <div
            style={{
              position: "absolute",
              left: Math.round((containerSize.w - stageW) / 2),
              top: Math.round((containerSize.h - stageH) / 2),
              width: stageW,
              height: stageH,
              cursor: "crosshair",
            }}
          >
            <Stage
              ref={stageRef}
              width={stageW}
              height={stageH}
              scaleX={stageScale}
              scaleY={stageScale}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerLeave}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            >
              <Layer listening={false}>
                <BackgroundOnly bg={project.background} project={project} />
              </Layer>
              <Layer listening={false}>
                <RichTextNode
                  layer={previewLayer}
                  draggable={false}
                  editing={false}
                  onSelect={() => undefined}
                  onDragEnd={() => undefined}
                  onTransformEnd={() => undefined}
                />
              </Layer>
            </Stage>
            <BrushSizeIndicator
              diameter={visualBrushDiameter}
              x={pointer?.x ?? 0}
              y={pointer?.y ?? 0}
              visible={pointer !== null}
            />
          </div>
        )}
      </div>

      {/* ── Bottom controls ────────────────────────────────────── */}
      <div
        className="flex-none flex items-center gap-3 px-4"
        style={{ height: BOTTOM_BAR, color: "#FFFFFF" }}
      >
        <span className="text-xs flex-none uppercase tracking-wide opacity-70">
          Brush
        </span>
        <input
          type="range"
          min={MIN_BRUSH}
          max={MAX_BRUSH}
          step={1}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          aria-label="Brush size"
          className="flex-1"
          style={{ accentColor: "#FFFFFF" }}
        />
        <span
          className="text-xs flex-none tabular-nums"
          style={{ width: 36, textAlign: "right" }}
        >
          {brushSize}
        </span>
      </div>
    </div>
  );
}

// ─── Background renderer ────────────────────────────────────────
//
// Mirrors what CanvasStage paints for the project background, but
// dimmed so the user's focus stays on the text being erased. We don't
// reuse CanvasStage's BackgroundNode directly to avoid a circular
// dependency (CanvasStage imports the LayerRenderer which renders
// every layer kind, and we only want one layer here).

function BackgroundOnly({
  bg,
  project,
}: {
  bg: Background;
  project: import("@/lib/photo-editor/types").Project;
}) {
  switch (bg.kind) {
    case "transparent":
      return (
        <Rect
          x={0}
          y={0}
          width={project.width}
          height={project.height}
          fill="#FFFFFF"
        />
      );
    case "solid":
      return (
        <Rect
          x={0}
          y={0}
          width={project.width}
          height={project.height}
          fill={bg.color}
        />
      );
    case "gradient":
      // Use a flat midpoint colour for the modal — the gradient detail
      // isn't important for the erase task and avoids re-implementing
      // the gradient maths from CanvasStage.
      return (
        <Rect
          x={0}
          y={0}
          width={project.width}
          height={project.height}
          fill={bg.gradient.stops[0]?.color ?? "#FFFFFF"}
        />
      );
    case "photo":
      return (
        <PhotoBg
          src={bg.src}
          width={project.width}
          height={project.height}
        />
      );
  }
}

function PhotoBg({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const [img] = useImage(src, "anonymous");
  if (!img) return null;
  return <KonvaImage image={img} x={0} y={0} width={width} height={height} />;
}
