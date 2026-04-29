// src/components/photo-editor/canvas/SelectionTools.tsx
//
// Per-selection contextual UI — DOM overlay above the canvas. Renders
// action icons positioned at the corners and edges of the selected
// layer's bbox:
//
//     [✕]            [↕]            [⟳]
//      ┌─────────────────────────────┐
//      │                             │
//     [⇄]            ‹bbox›
//      │                             │
//      └─────────────────────────────┘
//     [⌨ ]*          [⧉]            [⤡]
//
//   • ✕   top-left      Delete            (tap)
//   • ↕   top-centre    Flip vertical     (tap)
//   • ⟳   top-right     Rotate            (drag — pointer rotates the layer)
//   • ⇄   middle-left   Flip horizontal   (tap)
//   • ⌨   bottom-left   Edit text         (tap — text layers only)
//   • ⧉   bottom-centre Duplicate         (tap)
//   • ⤡   bottom-right  Resize            (drag — locked aspect ratio)
//
// The keyboard handle (bottom-left) is text-only and opens the
// BottomEditDrawer for the selected layer in non-fresh mode (existing
// runs preserved). Added in Batch A — Apr 2026 — to match the
// reference Add-Text-on-Photo app's selection chrome.
//
// Drag math runs in DOM-pixel space because we receive pointer client
// coords directly. The layer's geometric centre (in DOM coords) is the
// pivot for both rotate and resize. Konva.Transformer is reduced to a
// dashed border (see SelectionFrame); all transform interaction lives
// here. Phase 1 — Apr 2026.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  FlipHorizontal,
  FlipVertical,
  Keyboard,
  Maximize2 as ResizeIcon,
  RotateCw,
  X,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import type { AnyLayer } from "@/lib/photo-editor/types";

interface SelectionToolsProps {
  stageLeft: number;
  stageTop: number;
  stageWidth: number;
  stageHeight: number;
  stageScale: number;
}

// Phase 2 (Apr 2026) — bare-icon selection chrome (no white circle
// backing). The tap target is the icon itself; we keep a small inner
// padding so the lucide stroke doesn't sit on the absolute pixel edge.
const ICON_SIZE = 24;

// Adaptive contrast colours for the corner icons. We pick by the
// relative luminance of the selected layer's primary visible colour
// (shape fill / outlined-shape stroke / text glyph fill). For layers
// without a parseable colour (images, stickers) we fall back to white,
// which is the most common case over photo content.
const ICON_LIGHT = "#FFFFFF"; // for dark shapes
const ICON_DARK = "#1F2937"; // for light shapes (slate-800)
const DANGER_LIGHT = "#FCA5A5"; // delete-on-dark (red-300)
const DANGER_DARK = "#B91C1C"; // delete-on-light (red-700)

function parseHexLuminance(color: string): number | null {
  if (typeof color !== "string") return null;
  const m = color.trim().match(/^#([0-9a-fA-F]{3,8})$/);
  if (!m) return null;
  const hex = m[1];
  let r: number, g: number, b: number;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6 || hex.length === 8) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    return null;
  }
  // sRGB → relative luminance (WCAG 2.1)
  const toLin = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

/**
 * Return the layer's primary visible colour for contrast judgement, or
 * null when no colour is decidable from the layer model alone (image /
 * sticker layers — pixel sampling would be required, which is overkill
 * for the corner-icon overlay). Caller defaults to ICON_LIGHT for null.
 */
function pickLayerColor(layer: AnyLayer): string | null {
  if (layer.kind === "shape") {
    if (layer.variant === "outlined" && layer.stroke?.enabled) {
      return layer.stroke.color;
    }
    return layer.fill;
  }
  if (layer.kind === "text") {
    return layer.runs?.[0]?.fill ?? null;
  }
  return null;
}

export function SelectionTools({
  stageLeft,
  stageTop,
  stageWidth,
  stageHeight,
  stageScale,
}: SelectionToolsProps) {
  const { state, dispatch, stageRef } = useEditor();
  const { state: mobileEdit, beginEditing, focusForKeyboardPop } =
    useMobileEdit();

  const [tick, setTick] = useState(0);

  const selectedLayer = useMemo<AnyLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    return (
      state.project.layers.find((l) => l.id === state.selection[0]) ?? null
    );
  }, [state.selection, state.project.layers]);

  const hidden =
    selectedLayer === null ||
    selectedLayer.locked ||
    !selectedLayer.visible ||
    mobileEdit.editingLayerId === selectedLayer.id ||
    stageScale <= 0;

  useEffect(() => {
    if (hidden) return;
    const stage = stageRef.current;
    if (!stage) return;
    const handler = () => setTick((t) => t + 1);
    stage.on("dragmove", handler);
    stage.on("transform", handler);
    return () => {
      stage.off("dragmove", handler);
      stage.off("transform", handler);
    };
  }, [hidden, stageRef]);

  // Force the geom useMemo to re-evaluate AFTER the React commit phase
  // when selection or the layer list changes. The geom computation runs
  // during render (it's a useMemo) and calls stage.findOne() to locate
  // the selected layer's Konva node — but on the same render that adds
  // a brand-new layer, react-konva hasn't yet committed the new node
  // to the Konva tree, so findOne returns null and geom resolves to
  // null (no icons). SelectionFrame works around this by doing its
  // findOne in a useEffect (post-commit); we get the same behaviour by
  // bumping `tick` here, which causes one extra render after commit
  // with the node now present. Negligible cost and cures the "icons
  // missing on freshly-added shape" symptom.
  useEffect(() => {
    setTick((t) => t + 1);
  }, [state.selection, state.project.layers]);

  // Box geometry — four corner points in DOM-pixel space (within the
  // canvas-area container). Handles non-zero viewport rotation.
  //
  // Approach: get the layer's four local-rect corners in stage-local
  // (canvas-pixel) space via the layer node's absolute transform.
  // Then convert each stage-local point to DOM space by applying the
  // stage's (stageScale, viewport.rotation) transform around its
  // pivot. The stage-pivot in DOM space is (stageLeft + stageWidth/2,
  // stageTop + stageHeight/2) because CanvasStage centres the stage
  // div within the canvas area.
  const geom = useMemo(() => {
    if (hidden) return null;
    const stage = stageRef.current;
    if (!stage) return null;
    const node = stage.findOne(`#${selectedLayer!.id}`);
    if (!node) return null;
    // Layer's local rect (pre-transform). For text/image/sticker the
    // outermost node is a Konva.Image (Shape) — getClientRect with
    // skipTransform returns the same {x: 0, y: 0, width, height} as
    // getSelfRect would. For shape layers the outermost node is a
    // Konva.Group (see ShapeNode.tsx) which does NOT define
    // getSelfRect() in Konva 9.x; getClientRect works on any node and
    // returns the union of children's bounds in group-local space —
    // i.e. the visible Path's bbox, which is what we want here.
    // skipStroke=true keeps the rect tight to the geometry (matching
    // the old getSelfRect behaviour for Shapes).
    let selfRect = node.getClientRect({
      skipTransform: true,
      skipShadow: true,
      skipStroke: true,
    });
    if (
      !selfRect ||
      !Number.isFinite(selfRect.width) ||
      !Number.isFinite(selfRect.height) ||
      selfRect.width <= 0 ||
      selfRect.height <= 0
    ) {
      // Fallback: if the node has no rendered children yet (e.g. an
      // image still loading or a shape catalogue path that hasn't
      // mounted), derive from the layer's own width/height so the
      // selection UI doesn't disappear.
      const w = (selectedLayer as { width?: number }).width;
      const h = (selectedLayer as { height?: number }).height;
      if (
        typeof w === "number" &&
        typeof h === "number" &&
        Number.isFinite(w) &&
        Number.isFinite(h) &&
        w > 0 &&
        h > 0
      ) {
        selfRect = { x: 0, y: 0, width: w, height: h };
      } else {
        return null;
      }
    }
    // Layer's transform up to (but excluding) the stage. This gives
    // points in PROJECT-pixel space — we then multiply by stageScale
    // and rotate by viewport.rotation to land in DOM coords.
    // Calling getAbsoluteTransform() WITHOUT a top arg would include
    // the stage's scale, double-applying stageScale below.
    const layerTr = node.getAbsoluteTransform(stage);
    const stageLocal = {
      tl: layerTr.point({ x: selfRect.x, y: selfRect.y }),
      tr: layerTr.point({
        x: selfRect.x + selfRect.width,
        y: selfRect.y,
      }),
      br: layerTr.point({
        x: selfRect.x + selfRect.width,
        y: selfRect.y + selfRect.height,
      }),
      bl: layerTr.point({
        x: selfRect.x,
        y: selfRect.y + selfRect.height,
      }),
    };
    // Stage-local coords from Konva are in PROJECT-pixel space (the
    // Konva Stage has no rotation; only stage scale = stageScale is
    // applied at render time when Konva paints). To get DOM coords:
    //   1. The pivot in stage-local (project-pixel) space is
    //      (projectWidth/2, projectHeight/2) — equivalently
    //      (stageWidth / stageScale / 2, stageHeight / stageScale / 2).
    //   2. Translate so pivot is at origin.
    //   3. Scale by stageScale → rotate by viewport.rotation. (Order
    //      matters: the CSS rotate is on the OUTER stage div, AFTER
    //      Konva's scale, so in math-space: rotate(scale(point))).
    //   4. Re-translate to the centre of the DOM stage box.
    const cosR = Math.cos(state.viewport.rotation);
    const sinR = Math.sin(state.viewport.rotation);
    const pivotX = stageWidth / stageScale / 2;
    const pivotY = stageHeight / stageScale / 2;
    const toDom = (p: { x: number; y: number }) => {
      const lx = (p.x - pivotX) * stageScale;
      const ly = (p.y - pivotY) * stageScale;
      const rotX = lx * cosR - ly * sinR;
      const rotY = lx * sinR + ly * cosR;
      return {
        x: stageLeft + stageWidth / 2 + rotX,
        y: stageTop + stageHeight / 2 + rotY,
      };
    };
    return {
      tl: toDom(stageLocal.tl),
      tr: toDom(stageLocal.tr),
      br: toDom(stageLocal.br),
      bl: toDom(stageLocal.bl),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hidden,
    selectedLayer,
    stageRef,
    tick,
    stageScale,
    state.project.layers,
    state.viewport.translateX,
    state.viewport.translateY,
    state.viewport.zoom,
    state.viewport.rotation,
    stageLeft,
    stageTop,
    stageWidth,
    stageHeight,
  ]);

  const rotateRef = useRef<{
    startAngle: number;
    layerStartRotation: number;
    centreX: number;
    centreY: number;
    pointerId: number;
  } | null>(null);
  const resizeRef = useRef<{
    startDist: number;
    layerStartScaleX: number;
    layerStartScaleY: number;
    centreX: number;
    centreY: number;
    pointerId: number;
  } | null>(null);

  if (!geom || !selectedLayer) return null;

  // Geometric centre = average of the four corners. Works for any
  // rotation / aspect ratio.
  const centreXDom = (geom.tl.x + geom.tr.x + geom.br.x + geom.bl.x) / 4;
  const centreYDom = (geom.tl.y + geom.tr.y + geom.br.y + geom.bl.y) / 4;

  const onDelete = () =>
    dispatch({ type: "REMOVE_LAYER", id: selectedLayer.id });
  const onDuplicate = () =>
    dispatch({ type: "DUPLICATE_LAYER", id: selectedLayer.id });
  const onFlipH = () => {
    const next = { ...selectedLayer.transform };
    next.scaleX = -next.scaleX;
    dispatch({
      type: "UPDATE_LAYER",
      id: selectedLayer.id,
      patch: { transform: next },
    });
  };
  const onFlipV = () => {
    const next = { ...selectedLayer.transform };
    next.scaleY = -next.scaleY;
    dispatch({
      type: "UPDATE_LAYER",
      id: selectedLayer.id,
      patch: { transform: next },
    });
  };

  // ── Rotate drag ──────────────────────────────────────────────
  const onRotatePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedLayer) return;
    const startAngle = Math.atan2(
      e.clientY - centreYDom,
      e.clientX - centreXDom,
    );
    rotateRef.current = {
      startAngle,
      layerStartRotation: selectedLayer.transform.rotation,
      centreX: centreXDom,
      centreY: centreYDom,
      pointerId: e.pointerId,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onRotatePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = rotateRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    const angle = Math.atan2(e.clientY - r.centreY, e.clientX - r.centreX);
    const deltaDeg = ((angle - r.startAngle) * 180) / Math.PI;
    const newRotation = r.layerStartRotation + deltaDeg;
    dispatch({
      type: "UPDATE_LAYER",
      id: selectedLayer.id,
      patch: {
        transform: { ...selectedLayer.transform, rotation: newRotation },
      },
    });
  };

  const onRotatePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = rotateRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    rotateRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* element may have already lost capture */
    }
  };

  // ── Resize drag (locked aspect ratio) ────────────────────────
  const onResizePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedLayer) return;
    const dx = e.clientX - centreXDom;
    const dy = e.clientY - centreYDom;
    const startDist = Math.max(1, Math.hypot(dx, dy));
    resizeRef.current = {
      startDist,
      layerStartScaleX: selectedLayer.transform.scaleX,
      layerStartScaleY: selectedLayer.transform.scaleY,
      centreX: centreXDom,
      centreY: centreYDom,
      pointerId: e.pointerId,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onResizePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = resizeRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    const dx = e.clientX - r.centreX;
    const dy = e.clientY - r.centreY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const factor = dist / r.startDist;
    const newScaleX =
      Math.sign(r.layerStartScaleX || 1) *
      Math.abs(r.layerStartScaleX) *
      factor;
    const newScaleY =
      Math.sign(r.layerStartScaleY || 1) *
      Math.abs(r.layerStartScaleY) *
      factor;
    const MIN_SCALE = 0.05;
    const clampedX =
      Math.abs(newScaleX) < MIN_SCALE
        ? Math.sign(newScaleX || 1) * MIN_SCALE
        : newScaleX;
    const clampedY =
      Math.abs(newScaleY) < MIN_SCALE
        ? Math.sign(newScaleY || 1) * MIN_SCALE
        : newScaleY;
    dispatch({
      type: "UPDATE_LAYER",
      id: selectedLayer.id,
      patch: {
        transform: {
          ...selectedLayer.transform,
          scaleX: clampedX,
          scaleY: clampedY,
        },
      },
    });
  };

  const onResizePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = resizeRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    resizeRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  // Position icons at the actual rotated corner positions and edge
  // midpoints — not at AABB corners. This makes the icons sit
  // visually on the layer's edges at any rotation.
  const topMidX = (geom.tl.x + geom.tr.x) / 2;
  const topMidY = (geom.tl.y + geom.tr.y) / 2;
  const leftMidX = (geom.tl.x + geom.bl.x) / 2;
  const leftMidY = (geom.tl.y + geom.bl.y) / 2;
  const bottomMidX = (geom.bl.x + geom.br.x) / 2;
  const bottomMidY = (geom.bl.y + geom.br.y) / 2;

  // Adaptive icon colour — sample the selected layer's primary visible
  // colour and decide on dark vs light icons based on its relative
  // luminance. Threshold 0.5 is the pragmatic mid-point; if the colour
  // can't be parsed (or the layer is an image / sticker) we default to
  // white, which works on photo content and the dark editor canvas.
  const layerColor = pickLayerColor(selectedLayer);
  const lum = layerColor !== null ? parseHexLuminance(layerColor) : null;
  const isLightLayer = lum !== null && lum > 0.5;
  const iconColor = isLightLayer ? ICON_DARK : ICON_LIGHT;
  const dangerColor = isLightLayer ? DANGER_DARK : DANGER_LIGHT;

  // Batch A — text layers get a keyboard handle at bottom-left that
  // opens the BottomEditDrawer for inline typing. Matches the
  // reference Add-Text-on-Photo app's selection chrome.
  const isText = selectedLayer.kind === "text";
  const onOpenKeyboard = () => {
    if (!selectedLayer) return;
    focusForKeyboardPop();
    beginEditing(selectedLayer.id, { isFresh: false });
  };

  return (
    <>
      <CornerBtn
        x={geom.tl.x}
        y={geom.tl.y}
        ariaLabel="Delete"
        onClick={onDelete}
        color={dangerColor}
      >
        <X className="w-5 h-5" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={topMidX}
        y={topMidY}
        ariaLabel="Flip vertically"
        onClick={onFlipV}
        color={iconColor}
      >
        <FlipVertical className="w-5 h-5" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={geom.tr.x}
        y={geom.tr.y}
        ariaLabel="Rotate"
        drag
        color={iconColor}
        onPointerDown={onRotatePointerDown}
        onPointerMove={onRotatePointerMove}
        onPointerUp={onRotatePointerUp}
        onPointerCancel={onRotatePointerUp}
      >
        <RotateCw className="w-5 h-5" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={leftMidX}
        y={leftMidY}
        ariaLabel="Flip horizontally"
        onClick={onFlipH}
        color={iconColor}
      >
        <FlipHorizontal className="w-5 h-5" strokeWidth={2.25} />
      </CornerBtn>

      {isText && (
        <CornerBtn
          x={geom.bl.x}
          y={geom.bl.y}
          ariaLabel="Edit text"
          onClick={onOpenKeyboard}
          color={iconColor}
        >
          <Keyboard className="w-5 h-5" strokeWidth={2.25} />
        </CornerBtn>
      )}

      <CornerBtn
        x={bottomMidX}
        y={bottomMidY}
        ariaLabel="Duplicate"
        onClick={onDuplicate}
        color={iconColor}
      >
        <Copy className="w-5 h-5" strokeWidth={2.25} />
      </CornerBtn>

      <CornerBtn
        x={geom.br.x}
        y={geom.br.y}
        ariaLabel="Resize"
        drag
        color={iconColor}
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
      >
        <ResizeIcon className="w-5 h-5" strokeWidth={2.25} />
      </CornerBtn>
    </>
  );
}

interface CornerBtnProps {
  x: number;
  y: number;
  ariaLabel: string;
  onClick?: () => void;
  drag?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  /** Resolved icon stroke colour (caller picks via adaptive contrast). */
  color: string;
}

function CornerBtn({
  x,
  y,
  ariaLabel,
  onClick,
  drag = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  children,
  color,
}: CornerBtnProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="absolute z-30 inline-flex items-center justify-center"
      style={{
        left: x,
        top: y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        transform: "translate(-50%, -50%)",
        background: "transparent",
        border: "none",
        padding: 0,
        color,
        cursor: drag ? "grab" : "pointer",
        touchAction: drag ? "none" : "auto",
        // No backdrop, no shadow — icon-only chrome (Apr 2026 redesign).
        // The inner lucide stroke carries all the visual weight; tap
        // target is the bounding box of the icon itself. A thin grey
        // outline halo (4-direction sharp drop-shadows) ensures the
        // icon stays legible against any layer fill or photo region —
        // grey reads as a neutral edge whether the icon is white-on-
        // dark or dark-on-light.
        filter:
          "drop-shadow(0.6px 0 0 #9CA3AF) drop-shadow(-0.6px 0 0 #9CA3AF) drop-shadow(0 0.6px 0 #9CA3AF) drop-shadow(0 -0.6px 0 #9CA3AF)",
      }}
    >
      {children}
    </button>
  );
}
