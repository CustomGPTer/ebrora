// src/components/photo-editor/tools/ResizeTool.tsx
//
// Compact dialog for resizing the project canvas. Provides:
//   • Live preview rectangle of current draft dimensions
//   • Aspect-ratio lock toggle (default ON — V3 §13 G/Q3)
//   • Custom W × H inputs
//   • Preset buttons for common social-media aspect ratios
//   • Apply on the green button dispatches RESIZE_CANVAS
//   • Cancel / X / Escape / backdrop-tap revert
//
// Batch G — Apr 2026:
//   Refactored from a full-screen ToolModal takeover to the new
//   Dialog primitive (centred card with semi-transparent backdrop).
//   The reasoning: resize is a low-density action — a dozen-ish
//   widgets — that doesn't need full-screen real estate. The smaller
//   modal lets the user see the canvas behind the dialog as they
//   adjust dimensions, which is the right UX for "what aspect ratio
//   do I want my canvas to be?".
//
//   Also added the aspect-lock toggle. When on (the default),
//   editing one dimension auto-adjusts the other to preserve the
//   current draft ratio. When off, both dimensions edit independently.
//   Tapping a preset always sets both at once and bypasses the lock.
//
// What "resize" does in this engine: changes project.width and
// project.height. The background photo (if any) re-fits to the new
// dimensions on the next render — no scaling of layer transforms.
// That matches the reference Add Text app's behaviour: resizing the
// canvas leaves layers in place, so a 1080×1080 layer at (200, 200)
// stays at (200, 200) after resizing to 1080×1920 (now closer to the
// top of the canvas instead of centred).
//
// Aspect ratio presets:
//   • Square          1080 × 1080   (Instagram square)
//   • Portrait        1080 × 1350   (Instagram portrait, 4:5)
//   • Story           1080 × 1920   (Instagram story, 9:16)
//   • Landscape       1920 × 1080   (16:9)
//   • Post 4:3        1200 × 900
//   • Wide 16:9       1600 × 900
//   • A4 Portrait     2480 × 3508   (ISO 216 A4 at 300 DPI)
//   • A4 Landscape    3508 × 2480
//   • A3 Portrait     3508 × 4961   (ISO 216 A3 at 300 DPI)
//   • A3 Landscape    4961 × 3508
//
// The A-size presets target a print-grade 300 DPI so the exported PNG
// or JPEG hits a sharp page on a real printer / large-format site
// signage. Pixel dimensions are derived from the ISO 216 mm sizes
// (A4 = 210 × 297 mm, A3 = 297 × 420 mm) at 300 dots per inch — i.e.
// `mm × (300 / 25.4)` rounded to the nearest pixel. A3 landscape lands
// at 4961 × 3508 — large but well under MAX_CANVAS_DIMENSION (8000).
//
// Custom W×H inputs are clamped to MAX_CANVAS_DIMENSION (8000) and
// minimum 100 px to keep history snapshots sane.

"use client";

import { useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Dialog, DialogCancelButton, DialogApplyButton } from "./Dialog";
import { useEditor } from "../context/EditorContext";
import { MAX_CANVAS_DIMENSION } from "@/lib/photo-editor/types";

interface ResizeToolProps {
  open: boolean;
  onClose: () => void;
}

interface Preset {
  id: string;
  label: string;
  width: number;
  height: number;
}

const PRESETS: Preset[] = [
  { id: "square", label: "Square", width: 1080, height: 1080 },
  { id: "portrait", label: "Portrait", width: 1080, height: 1350 },
  { id: "story", label: "Story", width: 1080, height: 1920 },
  { id: "landscape", label: "Landscape", width: 1920, height: 1080 },
  { id: "post-4-3", label: "Post 4:3", width: 1200, height: 900 },
  { id: "wide", label: "Wide 16:9", width: 1600, height: 900 },
  // ISO 216 paper sizes at 300 DPI for print-quality export. Pairs
  // appear consecutively so the 2-column preset grid renders portrait
  // and landscape variants on the same row.
  { id: "a4-portrait", label: "A4 Portrait", width: 2480, height: 3508 },
  { id: "a4-landscape", label: "A4 Landscape", width: 3508, height: 2480 },
  { id: "a3-portrait", label: "A3 Portrait", width: 3508, height: 4961 },
  { id: "a3-landscape", label: "A3 Landscape", width: 4961, height: 3508 },
];

const MIN_DIM = 100;

export function ResizeTool({ open, onClose }: ResizeToolProps) {
  const { state, dispatch } = useEditor();
  const project = state.project;

  // Local draft — only committed on Apply. Cancel / backdrop reverts.
  const [draftW, setDraftW] = useState<number>(project.width);
  const [draftH, setDraftH] = useState<number>(project.height);

  // Aspect-lock toggle. Per V3 §13 G/Q3 the default is ON — most
  // common use is proportional resize. The user can toggle off to
  // change aspect ratio manually, or tap a preset (which always
  // bypasses the lock).
  const [aspectLocked, setAspectLocked] = useState<boolean>(true);

  // Sync the draft from the project whenever the dialog opens. Without
  // this the previous editing session's draft would leak into a fresh
  // open after the user switched projects.
  useEffect(() => {
    if (!open) return;
    setDraftW(project.width);
    setDraftH(project.height);
    // Re-default the lock to ON each open. If the user opens a 1080x1080
    // canvas, the lock starts on (proportional resizing). If they
    // unlock to change ratio, that unlocks state isn't remembered
    // across opens — opinionated default that's safer for quick edits.
    setAspectLocked(true);
  }, [open, project.width, project.height]);

  if (!open) return null;

  function handleApply() {
    const w = clampDim(draftW);
    const h = clampDim(draftH);
    if (w === project.width && h === project.height) {
      onClose();
      return;
    }
    dispatch({ type: "RESIZE_CANVAS", width: w, height: h });
    onClose();
  }

  function handleWidthChange(next: number) {
    if (aspectLocked && draftW > 0 && draftH > 0) {
      const ratio = draftH / draftW;
      const newH = clampDim(Math.round(next * ratio));
      setDraftW(next);
      setDraftH(newH);
    } else {
      setDraftW(next);
    }
  }

  function handleHeightChange(next: number) {
    if (aspectLocked && draftW > 0 && draftH > 0) {
      const ratio = draftW / draftH;
      const newW = clampDim(Math.round(next * ratio));
      setDraftH(next);
      setDraftW(newW);
    } else {
      setDraftH(next);
    }
  }

  function applyPreset(p: Preset) {
    // Presets always set both dimensions atomically — bypasses the
    // aspect lock since the user explicitly chose a target shape.
    setDraftW(p.width);
    setDraftH(p.height);
  }

  // Highlight the preset whose dimensions match the current draft.
  const activePresetId = PRESETS.find(
    (p) => p.width === draftW && p.height === draftH,
  )?.id;

  return (
    <Dialog
      open={open}
      title="Resize canvas"
      onCancel={onClose}
      maxWidthClass="max-w-md"
      footer={
        <>
          <DialogCancelButton onClick={onClose}>Cancel</DialogCancelButton>
          <DialogApplyButton onClick={handleApply}>Apply</DialogApplyButton>
        </>
      }
    >
      <div className="px-4 py-4 space-y-5">
        {/* Live preview rectangle ─────────────────────────────── */}
        <div className="flex items-center justify-center">
          <div
            className="rounded-lg flex items-center justify-center"
            style={{
              width: previewWidth(draftW, draftH),
              height: previewHeight(draftW, draftH),
              background: "var(--pe-surface-2)",
              border: "2px dashed var(--pe-border-strong)",
              transition: "width 0.15s, height 0.15s",
            }}
          >
            <span
              className="text-sm tabular-nums"
              style={{ color: "var(--pe-text-muted)" }}
            >
              {draftW} × {draftH}
            </span>
          </div>
        </div>

        {/* Custom W × H inputs + aspect lock ───────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--pe-text-muted)" }}
            >
              Custom size
            </span>
            <button
              type="button"
              onClick={() => setAspectLocked((v) => !v)}
              aria-pressed={aspectLocked}
              aria-label={
                aspectLocked
                  ? "Unlock aspect ratio"
                  : "Lock aspect ratio"
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background: aspectLocked
                  ? "var(--pe-accent)"
                  : "var(--pe-surface-2)",
                color: aspectLocked ? "#FFFFFF" : "var(--pe-text-muted)",
                border: aspectLocked
                  ? "1px solid var(--pe-accent)"
                  : "1px solid var(--pe-border-strong)",
              }}
            >
              {aspectLocked ? (
                <Lock className="w-3 h-3" strokeWidth={2} />
              ) : (
                <Unlock className="w-3 h-3" strokeWidth={2} />
              )}
              <span>{aspectLocked ? "Locked" : "Free"}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <DimensionInput
              label="W"
              value={draftW}
              onChange={handleWidthChange}
            />
            <span style={{ color: "var(--pe-text-muted)" }}>×</span>
            <DimensionInput
              label="H"
              value={draftH}
              onChange={handleHeightChange}
            />
          </div>
        </div>

        {/* Preset buttons ───────────────────────────────────────── */}
        <div>
          <div
            className="text-xs uppercase tracking-wider font-semibold mb-2"
            style={{ color: "var(--pe-text-muted)" }}
          >
            Presets
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-left px-3 py-2 rounded-lg transition-colors"
                style={{
                  background:
                    activePresetId === p.id
                      ? "var(--pe-accent)"
                      : "var(--pe-surface-2)",
                  border:
                    activePresetId === p.id
                      ? "1px solid var(--pe-accent)"
                      : "1px solid var(--pe-border-strong)",
                  color:
                    activePresetId === p.id ? "#FFFFFF" : "var(--pe-text)",
                }}
              >
                <div className="text-sm font-medium">{p.label}</div>
                <div
                  className="text-[11px] tabular-nums mt-0.5"
                  style={{
                    color:
                      activePresetId === p.id
                        ? "rgba(255,255,255,0.85)"
                        : "var(--pe-text-muted)",
                  }}
                >
                  {p.width} × {p.height}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Numeric input with clamp + label ───────────────────────────

function DimensionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: "var(--pe-surface-2)",
        border: "1px solid var(--pe-border-strong)",
      }}
    >
      <span
        className="text-xs font-semibold"
        style={{ color: "var(--pe-text-muted)" }}
      >
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={MIN_DIM}
        max={MAX_CANVAS_DIMENSION}
        onChange={(e) => {
          const next = parseInt(e.target.value, 10);
          if (Number.isFinite(next)) onChange(next);
        }}
        onBlur={(e) => {
          // Clamp on blur so transient out-of-range values don't
          // dispatch but the user can type freely.
          const next = clampDim(parseInt(e.target.value, 10) || MIN_DIM);
          onChange(next);
        }}
        className="flex-1 bg-transparent outline-none text-base tabular-nums"
        style={{ color: "var(--pe-text)" }}
      />
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function clampDim(n: number): number {
  if (!Number.isFinite(n)) return MIN_DIM;
  return Math.round(Math.max(MIN_DIM, Math.min(MAX_CANVAS_DIMENSION, n)));
}

/** Width of the preview rect — scales to fit a max envelope while
 *  preserving the draft aspect ratio. Smaller envelope (140 vs the
 *  pre-G 200) suits the more compact dialog. */
function previewWidth(w: number, h: number): number {
  const max = 140;
  if (w >= h) return max;
  return Math.round((max * w) / h);
}

function previewHeight(w: number, h: number): number {
  const max = 140;
  if (h >= w) return max;
  return Math.round((max * h) / w);
}
