// src/components/photo-editor/canvas/SelectionTools.tsx
//
// Per-selection contextual UI — DOM overlay above the canvas. Renders
// action icons positioned at the corners and edges of the selected
// layer's bbox:
//
//     [✕]            [↕]            [⟳]
//      ┌─────────────────────────────┐
//      │                             │
//     [⇄]                           [↻]*
//      │                             │
//      └─────────────────────────────┘
//     [⌨ ]*          [⧉]            [⤡]
//
//   • ✕   top-left      Delete            (tap)
//   • ↕   top-centre    Flip vertical     (tap)
//   • ⟳   top-right     Rotate            (drag — pointer rotates the layer)
//   • ⇄   middle-left   Stretch X         (drag — scaleX, drag past flips)
//   • ↻   middle-right  Wrap width        (drag — text layers only;
//                                         changes layer.width without
//                                         scaling so font size stays
//                                         put. Double-tap re-engages
//                                         auto-fit on next edit-end.)
//   • ⌨   bottom-left   Edit text         (tap — text layers only)
//   • ⧉   bottom-centre Duplicate         (tap)
//   • ⤡   bottom-right  Resize            (drag — locked aspect ratio)
//
// The keyboard handle (bottom-left) is text-only and opens the
// BottomEditDrawer for the selected layer in non-fresh mode (existing
// runs preserved). Added in Batch A — Apr 2026 — to match the
// reference Add-Text-on-Photo app's selection chrome.
//
// The wrap-width handle (middle-right) is text-only and changes the
// layer's wrap width directly. It's distinct from the corner-resize
// (which scales the whole layer including font) and from the
// stretch-x handle (which also scales). New for May 2026 paragraph-
// width dragger build.
//
// Rotate behaviour (May 2026): while the rotate handle is being
// dragged, a live angle label appears above the box's top edge,
// rotates with the box, and shows the current rotation in degrees
// (range -180° to 180°). Rotation snaps to {0°, 90°, 180°, -90°}
// within ±5° (sticky cardinal snap). Label disappears on pointer
// up. Matches the reference Add Text app's rotate UX.
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
  Keyboard,
  Maximize2 as ResizeIcon,
  MoveHorizontal,
  MoveVertical,
  RotateCw,
  WrapText,
  X,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import { tightLayerWidth, widestGlyphWidth } from "@/lib/photo-editor/rich-text/layout";
import type { AnyLayer, TextLayer } from "@/lib/photo-editor/types";

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
    if (layer.variant === "outlined" && layer.stroke && layer.stroke.width > 0) {
      // null stroke colour = inherit from fill (May 2026 stroke
      // semantics). Falls through to layer.fill below either way,
      // but the explicit ?? makes the intent obvious.
      return layer.stroke.color ?? layer.fill;
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
  // Whether the rotate handle is currently being dragged. Drives the
  // visibility of the live angle label that appears next to the box's
  // top edge while rotating. (May 2026 — rotate behaviour from the
  // reference Add Text app screen recording.)
  const [isRotating, setIsRotating] = useState(false);

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

  // ── Stretch drag (May 2026 — replaces flip H / V) ─────────────
  //
  // Edge-midpoint handles drive a free, per-axis stretch. Pivot is
  // the OPPOSITE edge midpoint, captured at drag-start. Pointer
  // moves along the layer's local axis; signed projection drives
  // newScale (allowed to cross zero, which flips the layer and
  // continues mirroring). The OPPOSITE edge stays pinned in stage-
  // coord space.
  //
  // Math: see comments inline. Works at any rotation because we
  // capture both the pivot's stage-coord position AND the layer's
  // start transform once at drag-start, then solve for the new
  // transform.x/y that keeps the pivot in place under the new
  // scaleX / scaleY.
  const stretchRef = useRef<{
    axis: "x" | "y";
    /** Local-coords pivot = opposite edge's midpoint (selfRect-aware). */
    localPivot: { x: number; y: number };
    /** Stage-coord position where the pivot lives, captured once. */
    pivotStage: { x: number; y: number };
    /** Layer's transform at drag start. */
    layerStart: AnyLayer["transform"];
    /** DOM-space pivot and dragged-edge midpoints captured at start
     *  — used to define the projection axis for the pointer. */
    pivotDom: { x: number; y: number };
    axisDirDom: { x: number; y: number };
    axisLengthDom: number;
    pointerId: number;
  } | null>(null);

  // ── Wrap-width drag (May 2026) ──────────────────────────────
  // Text-only middle-right handle. Drags layer.width directly without
  // scaling the layer's transform, so the font size stays put as the
  // box widens / narrows and the text re-flows live. Anchor follows
  // the layer's text alignment so the visible content stays put under
  // the user's eye while the box edge they're not touching moves.
  const wrapWidthRef = useRef<{
    /** Layer width at drag start (layer-local pixels). */
    startWidth: number;
    /** Layer transform at drag start — we re-compute transform.x/y
     *  on each move to keep the alignment-based anchor in place. */
    startTransform: AnyLayer["transform"];
    /** Layer's text alignment at drag start. Captured once so a mid-
     *  drag alignment change (unlikely but possible if the user pokes
     *  the toolbar with another finger) doesn't mess up the anchor. */
    startAlign: TextLayer["styling"]["align"];
    /** Pointer's start position in DOM coords. */
    startPointer: { x: number; y: number };
    /** Unit vector in DOM coords pointing along the layer's local +x
     *  axis (left-mid → right-mid). Used to project pointer movement
     *  onto the axis so rotated layers behave correctly. */
    axisDirDom: { x: number; y: number };
    /** DOM-space length of the layer's full local-x axis at start.
     *  axisLengthDom / startWidth = DOM-units-per-layer-local-unit
     *  = the effective scaleX × stageScale. */
    axisLengthDom: number;
    /** Floor (longest single word width, layer-local px) below which
     *  we don't let the user drag — words would overflow the box. */
    minWidth: number;
    pointerId: number;
    /** Whether the pointer has moved past the click threshold. If
     *  not, treat pointerup as a tap (candidate for double-tap). */
    movedPastThreshold: boolean;
  } | null>(null);

  // Double-tap detection on the wrap-width handle. Stores the time
  // of the most-recent qualifying tap (pointerup without a drag). A
  // second tap within DOUBLE_TAP_MS fires the reset action.
  const wrapWidthLastTapRef = useRef<number>(0);

  if (!geom || !selectedLayer) return null;

  // Geometric centre = average of the four corners. Works for any
  // rotation / aspect ratio.
  const centreXDom = (geom.tl.x + geom.tr.x + geom.br.x + geom.bl.x) / 4;
  const centreYDom = (geom.tl.y + geom.tr.y + geom.br.y + geom.bl.y) / 4;

  const onDelete = () =>
    dispatch({ type: "REMOVE_LAYER", id: selectedLayer.id });
  const onDuplicate = () =>
    dispatch({ type: "DUPLICATE_LAYER", id: selectedLayer.id });

  // ── Stretch start: capture pivot + axis ─────────────────────
  //
  // axis = 'x' → user dragged the LEFT-mid handle, X stretch, pivot
  //              is the RIGHT-mid edge (stays pinned).
  // axis = 'y' → user dragged the TOP-mid handle, Y stretch, pivot
  //              is the BOTTOM-mid edge.
  function onStretchPointerDown(
    axis: "x" | "y",
    e: React.PointerEvent<HTMLButtonElement>,
  ) {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedLayer) return;
    const stage = stageRef.current;
    if (!stage) return;
    const node = stage.findOne(`#${selectedLayer.id}`);
    if (!node) return;

    // selfRect — layer's local-coord bounding box.
    const selfRect = node.getClientRect({
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
      return;
    }

    // Local pivot (opposite edge midpoint) in selfRect-aware coords.
    const localPivot =
      axis === "y"
        ? {
            x: selfRect.x + selfRect.width / 2,
            y: selfRect.y + selfRect.height,
          }
        : {
            x: selfRect.x + selfRect.width,
            y: selfRect.y + selfRect.height / 2,
          };

    // Pivot's stage-coord position = transform applied to localPivot.
    // T(p) = (transform.x, transform.y) + R(rotation) ∘ S(scaleX, scaleY) (p)
    const layerStart = { ...selectedLayer.transform };
    const radStart = (layerStart.rotation * Math.PI) / 180;
    const cosS = Math.cos(radStart);
    const sinS = Math.sin(radStart);
    const sx = localPivot.x * layerStart.scaleX;
    const sy = localPivot.y * layerStart.scaleY;
    const pivotStage = {
      x: layerStart.x + (sx * cosS - sy * sinS),
      y: layerStart.y + (sx * sinS + sy * cosS),
    };

    // DOM-space pivot + dragged-edge midpoints, derived from geom
    // (already in DOM coords). axisDir = unit vector from pivot to
    // dragged edge in DOM space.
    const pivotDom =
      axis === "y"
        ? {
            x: (geom!.bl.x + geom!.br.x) / 2,
            y: (geom!.bl.y + geom!.br.y) / 2,
          }
        : {
            x: (geom!.tr.x + geom!.br.x) / 2,
            y: (geom!.tr.y + geom!.br.y) / 2,
          };
    const draggedEdgeDom =
      axis === "y"
        ? {
            x: (geom!.tl.x + geom!.tr.x) / 2,
            y: (geom!.tl.y + geom!.tr.y) / 2,
          }
        : {
            x: (geom!.tl.x + geom!.bl.x) / 2,
            y: (geom!.tl.y + geom!.bl.y) / 2,
          };
    const dx = draggedEdgeDom.x - pivotDom.x;
    const dy = draggedEdgeDom.y - pivotDom.y;
    const axisLengthDom = Math.max(1, Math.hypot(dx, dy));
    const axisDirDom = {
      x: dx / axisLengthDom,
      y: dy / axisLengthDom,
    };

    stretchRef.current = {
      axis,
      localPivot,
      pivotStage,
      layerStart,
      pivotDom,
      axisDirDom,
      axisLengthDom,
      pointerId: e.pointerId,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onStretchPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const s = stretchRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    if (!selectedLayer) return;

    // Signed projection of (pointer − pivot) onto the start-axis.
    const vx = e.clientX - s.pivotDom.x;
    const vy = e.clientY - s.pivotDom.y;
    const t = vx * s.axisDirDom.x + vy * s.axisDirDom.y;
    const ratio = t / s.axisLengthDom;

    // newScale = startScale × ratio (allowed to be 0 / negative).
    const initialScale =
      s.axis === "y" ? s.layerStart.scaleY : s.layerStart.scaleX;
    let newScale = initialScale * ratio;
    const MIN = 0.05;
    if (Math.abs(newScale) < MIN) {
      newScale = Math.sign(newScale || 1) * MIN;
    }

    const newScaleX =
      s.axis === "x" ? newScale : s.layerStart.scaleX;
    const newScaleY =
      s.axis === "y" ? newScale : s.layerStart.scaleY;

    // Solve for transform.x/y such that pivotStage is unchanged:
    //   pivotStage = (transform.x, transform.y) + R ∘ S_new (localPivot)
    //   transform.xy = pivotStage − R ∘ S_new (localPivot)
    const rad = (s.layerStart.rotation * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);
    const sx2 = s.localPivot.x * newScaleX;
    const sy2 = s.localPivot.y * newScaleY;
    const rotatedX = sx2 * cosR - sy2 * sinR;
    const rotatedY = sx2 * sinR + sy2 * cosR;
    const newX = s.pivotStage.x - rotatedX;
    const newY = s.pivotStage.y - rotatedY;

    dispatch({
      type: "UPDATE_LAYER",
      id: selectedLayer.id,
      patch: {
        transform: {
          ...s.layerStart,
          scaleX: newScaleX,
          scaleY: newScaleY,
          x: newX,
          y: newY,
        },
      },
    });
  }

  function onStretchPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const s = stretchRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    stretchRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  // ── Wrap-width drag (text-only middle-right handle, May 2026) ──
  //
  // Drag right widens layer.width, drag left narrows it. Text re-flows
  // live (every pointermove dispatches UPDATE_LAYER). The font size
  // stays put — only the wrap width changes. Anchor follows alignment:
  //
  //   left   → left edge fixed (transform.x unchanged)
  //   center → centre fixed (transform.x shifts by half the delta)
  //   right  → right edge fixed (transform.x shifts by full delta)
  //   justify → treated as left for anchoring
  //
  // For rotated layers the anchor shift happens along the layer's
  // LOCAL +x axis (rotated to stage / DOM). cos / sin of the rotation
  // are applied to project the layer-local x-shift back into stage-
  // coord transform.x/y deltas.
  //
  // Floor: widestGlyphWidth(layer) — words can break per-character
  // once the box is narrower than the word, but a glyph itself can't
  // be split, so the box can't be narrower than the widest single
  // glyph without forcing overflow. 20px hard floor for empty layers
  // so the box doesn't disappear.
  //
  // Tap (no movement past threshold) is captured for double-tap
  // detection: two taps within DOUBLE_TAP_MS sets autoFitWidth=true
  // and immediately tightens to current content.
  const DOUBLE_TAP_MS = 300;
  const TAP_MOVE_THRESHOLD_PX = 5;

  function onWrapWidthPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedLayer || selectedLayer.kind !== "text") return;
    const layer = selectedLayer as TextLayer;
    if (!geom) return;

    // Build the layer-local +x axis direction in DOM coords from the
    // existing geom corners (TL → TR is the local +x direction at the
    // layer's top edge; bisecting to the layer-local x-axis is the
    // same direction). Unit vector + total DOM length captured.
    const axisDx = geom.tr.x - geom.tl.x;
    const axisDy = geom.tr.y - geom.tl.y;
    const axisLengthDom = Math.max(1, Math.hypot(axisDx, axisDy));
    const axisDirDom = {
      x: axisDx / axisLengthDom,
      y: axisDy / axisLengthDom,
    };

    wrapWidthRef.current = {
      startWidth: layer.width,
      startTransform: { ...layer.transform },
      startAlign: layer.styling.align,
      startPointer: { x: e.clientX, y: e.clientY },
      axisDirDom,
      axisLengthDom,
      // Floor at the widest single glyph — narrower than that would
      // force a glyph to overflow the box, which is uglier than per-
      // character wrapping. Above this floor, the user can drag to
      // any width; words will break per-character once the box is
      // narrower than they are. 20px hard floor for empty layers
      // (widestGlyphWidth returns 0 with no content) so the box
      // doesn't disappear.
      minWidth: Math.max(20, widestGlyphWidth(layer)),
      pointerId: e.pointerId,
      movedPastThreshold: false,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onWrapWidthPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const w = wrapWidthRef.current;
    if (!w || w.pointerId !== e.pointerId) return;
    if (!selectedLayer || selectedLayer.kind !== "text") return;

    // Pointer delta from drag start, in DOM space.
    const dxDom = e.clientX - w.startPointer.x;
    const dyDom = e.clientY - w.startPointer.y;

    // Tap-vs-drag: once we've moved past the threshold, this gesture
    // is a drag, no longer a tap.
    if (
      !w.movedPastThreshold &&
      Math.hypot(dxDom, dyDom) > TAP_MOVE_THRESHOLD_PX
    ) {
      w.movedPastThreshold = true;
    }
    if (!w.movedPastThreshold) return;

    // Project the pointer delta onto the layer's local +x axis (in
    // DOM space). Result is a signed DOM-pixel delta along that axis.
    const tDom = dxDom * w.axisDirDom.x + dyDom * w.axisDirDom.y;
    // Convert DOM-pixel delta back to layer-local units.
    const dWidthLocal = (tDom * w.startWidth) / w.axisLengthDom;
    let newWidth = w.startWidth + dWidthLocal;
    if (newWidth < w.minWidth) newWidth = w.minWidth;

    // Alignment-anchor: the local-x point that should stay put while
    // the box width changes. 0 for left, oldWidth/2 for centre,
    // oldWidth for right.
    const anchorRatio =
      w.startAlign === "left" || w.startAlign === "justify"
        ? 0
        : w.startAlign === "center"
          ? 0.5
          : 1;
    const anchorXOldLocal = w.startWidth * anchorRatio;
    const anchorXNewLocal = newWidth * anchorRatio;
    const anchorDeltaLocal = anchorXNewLocal - anchorXOldLocal;

    // Project the layer-local anchor delta onto stage-coord deltas.
    // The layer's local +x axis in stage coords (after applying its
    // own scaleX and rotation): R(rotation) ∘ S(scaleX, 1) (1, 0).
    const rad = (w.startTransform.rotation * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);
    // Stage-space delta of the anchor point if transform.xy stayed:
    //   dx_stage = anchorDeltaLocal × scaleX × cos(rad)
    //   dy_stage = anchorDeltaLocal × scaleX × sin(rad)
    // To keep the anchor point fixed in stage coords we shift
    // transform by the negative of that.
    const sx = w.startTransform.scaleX;
    const newTransformX =
      w.startTransform.x - anchorDeltaLocal * sx * cosR;
    const newTransformY =
      w.startTransform.y - anchorDeltaLocal * sx * sinR;

    dispatch({
      type: "UPDATE_LAYER",
      id: selectedLayer.id,
      patch: {
        width: newWidth,
        // Manual width set by the user — turn off auto-fit so the
        // next endEditing doesn't override their choice. (No-op if
        // already false.)
        autoFitWidth: false,
        transform: {
          ...w.startTransform,
          x: newTransformX,
          y: newTransformY,
        },
      },
    });
  }

  function onWrapWidthPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const w = wrapWidthRef.current;
    if (!w || w.pointerId !== e.pointerId) return;
    const wasTap = !w.movedPastThreshold;
    wrapWidthRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!wasTap) return;

    // Tap path — candidate for double-tap. If the previous tap was
    // recent enough, fire the reset action.
    const now = performance.now();
    const last = wrapWidthLastTapRef.current;
    if (last !== 0 && now - last <= DOUBLE_TAP_MS) {
      wrapWidthLastTapRef.current = 0;
      onWrapWidthDoubleTap();
      return;
    }
    wrapWidthLastTapRef.current = now;
  }

  function onWrapWidthDoubleTap() {
    if (!selectedLayer || selectedLayer.kind !== "text") return;
    const layer = selectedLayer as TextLayer;

    // Immediately tighten to current content + flag autoFitWidth=true
    // so subsequent edit-end also re-tightens. Mirrors the snap logic
    // in MobileEditContext.endEditing — kept inline rather than
    // factored because the editor reducer doesn't take auto-fit
    // commands and circular-importing the helper would be awkward.
    // 40px hard floor for empty / whitespace-only content (tight = 0
    // there) so the layer doesn't disappear.
    const tight = tightLayerWidth(layer);
    const newWidth = Math.max(tight, 40);
    if (newWidth === layer.width) {
      // Already tight — just re-arm the flag, no transform change.
      dispatch({
        type: "UPDATE_LAYER",
        id: layer.id,
        patch: { autoFitWidth: true },
      });
      return;
    }
    const oldWidth = layer.width;
    const align = layer.styling.align;
    const anchorRatio =
      align === "left" || align === "justify"
        ? 0
        : align === "center"
          ? 0.5
          : 1;
    const anchorDeltaLocal = (newWidth - oldWidth) * anchorRatio;
    const rad = (layer.transform.rotation * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);
    const sx = layer.transform.scaleX;
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: {
        width: newWidth,
        autoFitWidth: true,
        transform: {
          ...layer.transform,
          x: layer.transform.x - anchorDeltaLocal * sx * cosR,
          y: layer.transform.y - anchorDeltaLocal * sx * sinR,
        },
      },
    });
  }

  // ── Rotate drag ──────────────────────────────────────────────
  //
  // Sticky snap (May 2026): when the rotated angle (normalised to
  // (-180, 180]) falls within ±5° of a cardinal {0, 90, 180, -90},
  // it snaps to that exact value. Inside the snap zone the angle
  // sticks; the user has to drag past 5° to release. Implementation
  // is "simple snap" — the same ±5° threshold governs entry and
  // exit, which behaves identically to true sticky-with-hysteresis
  // for a 5° zone.
  //
  // Angle label is shown via isRotating state — set true on
  // pointerdown so the label flashes up the moment the user touches
  // the handle (per spec, even before any movement).
  const SNAP_ZONE_DEG = 5;
  const SNAP_TARGETS_DEG = [0, 90, 180, -90];

  /** Normalise an angle in degrees to the (-180, 180] range. */
  function normaliseAngle(deg: number): number {
    let a = deg % 360;
    if (a > 180) a -= 360;
    if (a <= -180) a += 360;
    return a;
  }

  /** Apply cardinal-angle snapping within the snap zone. */
  function snapAngle(deg: number): number {
    const norm = normaliseAngle(deg);
    for (const target of SNAP_TARGETS_DEG) {
      if (Math.abs(norm - target) <= SNAP_ZONE_DEG) {
        return target;
      }
    }
    // Also handle the wrap-around at 180 / -180 (treated as the same
    // angle but different signs after normalisation).
    if (Math.abs(norm - 180) <= SNAP_ZONE_DEG || Math.abs(norm + 180) <= SNAP_ZONE_DEG) {
      return 180;
    }
    return norm;
  }

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
    setIsRotating(true);
  };

  const onRotatePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = rotateRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    const angle = Math.atan2(e.clientY - r.centreY, e.clientX - r.centreX);
    const deltaDeg = ((angle - r.startAngle) * 180) / Math.PI;
    const rawRotation = r.layerStartRotation + deltaDeg;
    const newRotation = snapAngle(rawRotation);
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
    setIsRotating(false);
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
  // Wrap-width handle (text-only, May 2026).
  const rightMidX = (geom.tr.x + geom.br.x) / 2;
  const rightMidY = (geom.tr.y + geom.br.y) / 2;

  // Angle-label position (May 2026 rotate behaviour). Sits a fixed
  // distance "above" the top-edge midpoint in the layer's LOCAL
  // frame. We compute the unit vector pointing from the box centre
  // outward along (top-mid → outside) by negating the (top-mid →
  // bottom-mid) direction; then offset by ANGLE_LABEL_OFFSET_PX in
  // DOM space. The label's own rotation matches the layer's so it
  // reads naturally regardless of orientation.
  const ANGLE_LABEL_OFFSET_PX = 36;
  const tmToBmX = bottomMidX - topMidX;
  const tmToBmY = bottomMidY - topMidY;
  const tmToBmLen = Math.max(1, Math.hypot(tmToBmX, tmToBmY));
  const outwardX = -tmToBmX / tmToBmLen;
  const outwardY = -tmToBmY / tmToBmLen;
  const angleLabelX = topMidX + outwardX * ANGLE_LABEL_OFFSET_PX;
  const angleLabelY = topMidY + outwardY * ANGLE_LABEL_OFFSET_PX;
  const angleLabelText = `${Math.round(
    normaliseAngle(selectedLayer.transform.rotation),
  )}°`;

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
        ariaLabel="Stretch vertically — drag past opposite edge to flip"
        drag
        onPointerDown={(e) => onStretchPointerDown("y", e)}
        onPointerMove={onStretchPointerMove}
        onPointerUp={onStretchPointerUp}
        onPointerCancel={onStretchPointerUp}
        color={iconColor}
      >
        <MoveVertical className="w-5 h-5" strokeWidth={2.25} />
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
        ariaLabel="Stretch horizontally — drag past opposite edge to flip"
        drag
        onPointerDown={(e) => onStretchPointerDown("x", e)}
        onPointerMove={onStretchPointerMove}
        onPointerUp={onStretchPointerUp}
        onPointerCancel={onStretchPointerUp}
        color={iconColor}
      >
        <MoveHorizontal className="w-5 h-5" strokeWidth={2.25} />
      </CornerBtn>

      {isText && (
        <CornerBtn
          x={rightMidX}
          y={rightMidY}
          ariaLabel="Wrap width — drag to set, double-tap to auto-fit"
          drag
          onPointerDown={onWrapWidthPointerDown}
          onPointerMove={onWrapWidthPointerMove}
          onPointerUp={onWrapWidthPointerUp}
          onPointerCancel={onWrapWidthPointerUp}
          color={iconColor}
        >
          <WrapText className="w-5 h-5" strokeWidth={2.25} />
        </CornerBtn>
      )}

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

      {/* Live angle label — visible only during an active rotation
          drag. Positioned above the top-edge midpoint in the layer's
          local frame and rotated with the layer so the digits read
          naturally. Pointer-events disabled so it never intercepts
          taps on the box behind it. (May 2026 — rotate behaviour from
          the reference Add Text app.) */}
      {isRotating && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: angleLabelX,
            top: angleLabelY,
            transform: `translate(-50%, -50%) rotate(${selectedLayer.transform.rotation}deg)`,
            transformOrigin: "center",
            pointerEvents: "none",
            color: iconColor,
            fontSize: 14,
            fontWeight: 500,
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            // Subtle shadow so the digits stay legible against any
            // canvas content (matches the reference app's look).
            textShadow: isLightLayer
              ? "0 1px 2px rgba(255,255,255,0.6)"
              : "0 1px 2px rgba(0,0,0,0.6)",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {angleLabelText}
        </div>
      )}
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
