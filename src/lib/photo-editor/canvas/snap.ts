// src/lib/photo-editor/canvas/snap.ts
//
// Smart-guide snap calculation. Pure logic — no React, no Konva, no DOM.
// Given the dragged layer's current bbox, the bboxes of every other
// visible layer, and the canvas dimensions, returns the snapped (x, y)
// position for the dragged box plus the list of guide lines that should
// be drawn.
//
// Snap targets: canvas centres + canvas edges + every other visible
// layer's centres + edges. Threshold in canvas pixels.
//
// Guide visibility: a guide is rendered ONLY when an actual snap is in
// effect on that axis. Phase 1 — Apr 2026.
//
// May 2026 — threshold widened from 5px to 10px. Earlier value made the
// snap very weak — users had to land within a 5px window of a target
// to trigger it, which on a phone with finger-size touch points is
// almost imperceptible. 10px makes the magnetic zone large enough that
// the snap actually grabs as you approach a centre / edge, without
// being so strong it interferes with deliberate near-centre placement.
//
// Mobile-fixes batch 1 (May 2026): canvas-centre hysteresis.
//   Every snap target used the same ±10px symmetric attractor — drift
//   in, snap; drift out, release. The rotate-handle's cardinal-angle
//   snap, by contrast, has hysteresis (lock at ±5°, release at ±8°),
//   which makes it feel "sticky" — you really feel it grab and have
//   to deliberately yank past to break free. Jon asked for the same
//   feel on the canvas centre lines (and only those — applying it to
//   every layer-edge target would make complex compositions feel
//   stuck). New: a `prevCentreLock` argument lets the caller pass
//   in last-frame's lock state; we use a 9px lock zone and a 15px
//   release zone for canvas-centre H/V only. Other targets keep the
//   simple 10px attractor. The caller (LayerRenderer) tracks the
//   per-drag lock state in a ref and passes it back in each frame.

export const SNAP_THRESHOLD = 10;

/** Lock zone for canvas-centre H/V snap. Tighter than the regular
 *  threshold so non-locked drags don't accidentally grab the centre,
 *  but the user still feels a clear pull within range. */
export const CENTRE_SNAP_LOCK = 9;

/** Release zone for canvas-centre H/V snap. Wider than the lock zone —
 *  this is the hysteresis band. Once locked, the user has to drag past
 *  this distance from the centre line to break free. Mirrors the
 *  rotate-handle's 5°/8° lock/release ratio. */
export const CENTRE_SNAP_RELEASE = 15;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Per-drag hysteresis state for canvas-centre snap. Caller owns this
 *  state across pointermove ticks and passes it in / receives it back. */
export interface CentreLockState {
  /** True when the dragged box's x-centre is currently locked to the
   *  canvas vertical centreline. */
  xLocked: boolean;
  /** True when the dragged box's y-centre is currently locked to the
   *  canvas horizontal centreline. */
  yLocked: boolean;
}

export const NO_CENTRE_LOCK: CentreLockState = {
  xLocked: false,
  yLocked: false,
};

export interface SnapInput {
  draggedBox: Box;
  otherBoxes: readonly Box[];
  canvasWidth: number;
  canvasHeight: number;
  /** Previous frame's centre-lock state (canvas H/V only). When omitted
   *  or NO_CENTRE_LOCK, behaves as a fresh drag. */
  prevCentreLock?: CentreLockState;
}

export interface SnapResult {
  x: number;
  y: number;
  verticalGuides: number[];
  horizontalGuides: number[];
  /** Updated centre-lock state — caller persists this for the next
   *  frame's prevCentreLock input. */
  centreLock: CentreLockState;
}

interface AxisCandidate {
  pos: number;
  guide: number;
  /** True for canvas-centre lines (which get hysteresis). False for
   *  every other target (canvas edges, layer edges, layer centres). */
  isCanvasCentre: boolean;
}

export function computeSnap(input: SnapInput): SnapResult {
  const {
    draggedBox,
    otherBoxes,
    canvasWidth,
    canvasHeight,
    prevCentreLock = NO_CENTRE_LOCK,
  } = input;

  const draggedRefsX = [
    { offset: 0, ref: draggedBox.x },
    { offset: draggedBox.width / 2, ref: draggedBox.x + draggedBox.width / 2 },
    { offset: draggedBox.width, ref: draggedBox.x + draggedBox.width },
  ];
  const draggedRefsY = [
    { offset: 0, ref: draggedBox.y },
    { offset: draggedBox.height / 2, ref: draggedBox.y + draggedBox.height / 2 },
    { offset: draggedBox.height, ref: draggedBox.y + draggedBox.height },
  ];

  const xCandidates: AxisCandidate[] = [
    { pos: 0, guide: 0, isCanvasCentre: false },
    { pos: canvasWidth / 2, guide: canvasWidth / 2, isCanvasCentre: true },
    { pos: canvasWidth, guide: canvasWidth, isCanvasCentre: false },
  ];
  const yCandidates: AxisCandidate[] = [
    { pos: 0, guide: 0, isCanvasCentre: false },
    { pos: canvasHeight / 2, guide: canvasHeight / 2, isCanvasCentre: true },
    { pos: canvasHeight, guide: canvasHeight, isCanvasCentre: false },
  ];
  for (const b of otherBoxes) {
    xCandidates.push({ pos: b.x, guide: b.x, isCanvasCentre: false });
    xCandidates.push({
      pos: b.x + b.width / 2,
      guide: b.x + b.width / 2,
      isCanvasCentre: false,
    });
    xCandidates.push({
      pos: b.x + b.width,
      guide: b.x + b.width,
      isCanvasCentre: false,
    });
    yCandidates.push({ pos: b.y, guide: b.y, isCanvasCentre: false });
    yCandidates.push({
      pos: b.y + b.height / 2,
      guide: b.y + b.height / 2,
      isCanvasCentre: false,
    });
    yCandidates.push({
      pos: b.y + b.height,
      guide: b.y + b.height,
      isCanvasCentre: false,
    });
  }

  const bestX = pickAxisSnap(
    draggedRefsX,
    xCandidates,
    prevCentreLock.xLocked,
    draggedBox.width,
  );
  const bestY = pickAxisSnap(
    draggedRefsY,
    yCandidates,
    prevCentreLock.yLocked,
    draggedBox.height,
  );

  return {
    x: bestX !== null ? bestX.newRef : draggedBox.x,
    y: bestY !== null ? bestY.newRef : draggedBox.y,
    verticalGuides: bestX !== null ? [bestX.guide] : [],
    horizontalGuides: bestY !== null ? [bestY.guide] : [],
    centreLock: {
      xLocked: bestX !== null && bestX.lockedToCanvasCentre,
      yLocked: bestY !== null && bestY.lockedToCanvasCentre,
    },
  };
}

interface PickResult {
  delta: number;
  newRef: number;
  guide: number;
  lockedToCanvasCentre: boolean;
}

/** Pick the best snap target along one axis, applying hysteresis on
 *  the canvas-centre line only.
 *
 *  Hysteresis logic per frame:
 *    1. Compute distance from the dragged-box's centre to the canvas-
 *       centre line.
 *    2. If the previous frame was locked: keep the lock UNLESS distance
 *       exceeds the release zone. While locked, ignore every other
 *       candidate — the centre line wins absolutely.
 *    3. If not previously locked: only acquire a lock when distance is
 *       within the (tighter) lock zone. Otherwise consider centre as a
 *       regular candidate competing on the standard ±SNAP_THRESHOLD.
 *
 *  Non-canvas-centre candidates (canvas edges, layer centres / edges)
 *  always use the simple ±SNAP_THRESHOLD attractor. */
function pickAxisSnap(
  draggedRefs: { offset: number; ref: number }[],
  candidates: AxisCandidate[],
  prevLocked: boolean,
  draggedExtent: number,
): PickResult | null {
  // Distance from the dragged-box's centre to each canvas-centre
  // candidate, in canvas pixels. We compare against centre-of-box
  // because that's the snap reference point that "feels" centred to
  // the user — pinning a corner to the centre line wouldn't.
  const draggedCentre = draggedRefs[1]; // centre is index 1 (0=start, 1=mid, 2=end)
  const _ = draggedExtent; // reserved for future use

  // Find the canvas-centre candidate (there's at most one per axis).
  const centreCandidate = candidates.find((c) => c.isCanvasCentre) ?? null;
  const centreDistance =
    centreCandidate !== null
      ? Math.abs(centreCandidate.pos - draggedCentre.ref)
      : Infinity;

  // Decide whether to lock to the canvas centre this frame.
  let lockCentre = false;
  if (centreCandidate !== null) {
    if (prevLocked) {
      // Currently locked — release only on crossing the wider release
      // zone. Anywhere inside that zone, stay locked.
      lockCentre = centreDistance <= CENTRE_SNAP_RELEASE;
    } else {
      // Not currently locked — acquire only inside the tighter lock
      // zone. Outside, the centre is allowed to compete as a normal
      // candidate via the threshold check below (loses its hysteresis
      // privilege but still snaps within ±SNAP_THRESHOLD if no other
      // better target wins).
      lockCentre = centreDistance <= CENTRE_SNAP_LOCK;
    }
  }

  if (lockCentre && centreCandidate !== null) {
    // Force the box centre to the canvas centre. Ignore other targets
    // entirely while locked — that's the whole point of hysteresis.
    return {
      delta: centreCandidate.pos - draggedCentre.ref,
      newRef: centreCandidate.pos - draggedCentre.offset,
      guide: centreCandidate.guide,
      lockedToCanvasCentre: true,
    };
  }

  // Normal attractor logic — every candidate competes on ±SNAP_THRESHOLD
  // including the centre (which now plays by the same rules as everyone
  // else, since hysteresis didn't claim it).
  let best: PickResult | null = null;
  for (const draggedRef of draggedRefs) {
    for (const cand of candidates) {
      const delta = cand.pos - draggedRef.ref;
      const absDelta = Math.abs(delta);
      if (absDelta > SNAP_THRESHOLD) continue;
      if (best === null || absDelta < Math.abs(best.delta)) {
        best = {
          delta,
          newRef: cand.pos - draggedRef.offset,
          guide: cand.guide,
          lockedToCanvasCentre: false,
        };
      }
    }
  }
  return best;
}
