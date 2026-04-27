// src/lib/photo-editor/canvas/snap.ts
//
// Smart-guide snap calculation. Pure logic — no React, no Konva, no DOM.
// Given the dragged layer's current bbox, the bboxes of every other
// visible layer, and the canvas dimensions, returns the snapped (x, y)
// position for the dragged box plus the list of guide lines that should
// be drawn.
//
// Snap targets: canvas centres + canvas edges + every other visible
// layer's centres + edges. 5 px threshold in canvas pixels.
//
// Guide visibility: a guide is rendered ONLY when an actual snap is in
// effect on that axis. Phase 1 — Apr 2026.

export const SNAP_THRESHOLD = 5;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapInput {
  draggedBox: Box;
  otherBoxes: readonly Box[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface SnapResult {
  x: number;
  y: number;
  verticalGuides: number[];
  horizontalGuides: number[];
}

interface AxisCandidate {
  pos: number;
  guide: number;
}

export function computeSnap(input: SnapInput): SnapResult {
  const { draggedBox, otherBoxes, canvasWidth, canvasHeight } = input;

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
    { pos: 0, guide: 0 },
    { pos: canvasWidth / 2, guide: canvasWidth / 2 },
    { pos: canvasWidth, guide: canvasWidth },
  ];
  const yCandidates: AxisCandidate[] = [
    { pos: 0, guide: 0 },
    { pos: canvasHeight / 2, guide: canvasHeight / 2 },
    { pos: canvasHeight, guide: canvasHeight },
  ];
  for (const b of otherBoxes) {
    xCandidates.push({ pos: b.x, guide: b.x });
    xCandidates.push({ pos: b.x + b.width / 2, guide: b.x + b.width / 2 });
    xCandidates.push({ pos: b.x + b.width, guide: b.x + b.width });
    yCandidates.push({ pos: b.y, guide: b.y });
    yCandidates.push({ pos: b.y + b.height / 2, guide: b.y + b.height / 2 });
    yCandidates.push({ pos: b.y + b.height, guide: b.y + b.height });
  }

  let bestX: { delta: number; newRef: number; guide: number } | null = null;
  for (const draggedRef of draggedRefsX) {
    for (const cand of xCandidates) {
      const delta = cand.pos - draggedRef.ref;
      const absDelta = Math.abs(delta);
      if (absDelta > SNAP_THRESHOLD) continue;
      if (bestX === null || absDelta < Math.abs(bestX.delta)) {
        bestX = {
          delta,
          newRef: cand.pos - draggedRef.offset,
          guide: cand.guide,
        };
      }
    }
  }

  let bestY: { delta: number; newRef: number; guide: number } | null = null;
  for (const draggedRef of draggedRefsY) {
    for (const cand of yCandidates) {
      const delta = cand.pos - draggedRef.ref;
      const absDelta = Math.abs(delta);
      if (absDelta > SNAP_THRESHOLD) continue;
      if (bestY === null || absDelta < Math.abs(bestY.delta)) {
        bestY = {
          delta,
          newRef: cand.pos - draggedRef.offset,
          guide: cand.guide,
        };
      }
    }
  }

  return {
    x: bestX !== null ? bestX.newRef : draggedBox.x,
    y: bestY !== null ? bestY.newRef : draggedBox.y,
    verticalGuides: bestX !== null ? [bestX.guide] : [],
    horizontalGuides: bestY !== null ? [bestY.guide] : [],
  };
}
