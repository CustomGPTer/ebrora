// src/components/photo-editor/tools/ResizeTool.tsx
//
// Full-screen modal for resizing the project canvas. Provides:
//   • Live preview of current canvas dimensions
//   • Preset buttons for common social-media aspect ratios
//   • Custom W × H inputs
//   • Apply on ✓ dispatches RESIZE_CANVAS (existing reducer action)
//
// What "resize" does in this engine: changes project.width and
// project.height. The background photo (if any) re-fits to the new
// dimensions on the next render — no scaling of layer transforms.
// That matches the reference Add Text app's behaviour: resizing the
// canvas leaves layers in place, so a 1080×1080 layer at (200, 200)
// stays at (200, 200) after resizing to 1080×1920 (now closer to
// the top of the canvas instead of centred).
//
// Aspect ratio presets (matching common Instagram / TikTok / story
// formats most Ebrora users will recognise):
//   • Square        1080 × 1080
//   • Portrait      1080 × 1350   (Instagram portrait, 4:5)
//   • Story         1080 × 1920   (Instagram story, 9:16)
//   • Landscape     1920 × 1080   (16:9)
//   • Site board    1080 × 1080   default for blank canvases
//   • Custom        user-entered
//
// Custom WxH inputs are clamped to MAX_CANVAS_DIMENSION (8000) and
// minimum 100 px to keep history snapshots sane.

"use client";

import { useEffect, useState } from "react";
import { ToolModal } from "./ToolModal";
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
];

const MIN_DIM = 100;

export function ResizeTool({ open, onClose }: ResizeToolProps) {
  const { state, dispatch } = useEditor();
  const project = state.project;

  // Local draft — only committed on Apply (✓). Cancel reverts.
  const [draftW, setDraftW] = useState<number>(project.width);
  const [draftH, setDraftH] = useState<number>(project.height);

  // Sync the draft from the project whenever the modal opens. Without
  // this the previous editing session's draft would leak into a fresh
  // open after the user switched projects.
  useEffect(() => {
    if (!open) return;
    setDraftW(project.width);
    setDraftH(project.height);
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

  function applyPreset(p: Preset) {
    setDraftW(p.width);
    setDraftH(p.height);
  }

  // Highlight the preset whose dimensions match the current draft.
  const activePresetId = PRESETS.find(
    (p) => p.width === draftW && p.height === draftH,
  )?.id;

  return (
    <ToolModal
      open={open}
      title="Resize"
      onCancel={onClose}
      onApply={handleApply}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-y-auto">
        {/* Live preview rectangle — visualises the new aspect ratio */}
        <div
          className="rounded-lg flex items-center justify-center mb-6"
          style={{
            width: previewWidth(draftW, draftH),
            height: previewHeight(draftW, draftH),
            background: "rgba(255,255,255,0.06)",
            border: "2px dashed rgba(255,255,255,0.30)",
            transition: "width 0.15s, height 0.15s",
          }}
        >
          <span
            className="text-sm tabular-nums"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {draftW} × {draftH}
          </span>
        </div>

        <div className="w-full max-w-md space-y-5">
          {/* Custom W × H inputs ───────────────────────────── */}
          <div>
            <div
              className="text-xs uppercase tracking-wider font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Custom size
            </div>
            <div className="flex items-center gap-2">
              <DimensionInput
                label="W"
                value={draftW}
                onChange={setDraftW}
              />
              <span style={{ color: "rgba(255,255,255,0.5)" }}>×</span>
              <DimensionInput
                label="H"
                value={draftH}
                onChange={setDraftH}
              />
            </div>
          </div>

          {/* Preset buttons ──────────────────────────────────── */}
          <div>
            <div
              className="text-xs uppercase tracking-wider font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Presets
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="text-left px-3 py-2.5 rounded-lg transition-colors"
                  style={{
                    background:
                      activePresetId === p.id
                        ? "rgba(27, 91, 80, 0.40)"
                        : "rgba(255,255,255,0.06)",
                    border:
                      activePresetId === p.id
                        ? "1px solid #4ECDC4"
                        : "1px solid rgba(255,255,255,0.10)",
                    color: "#FFFFFF",
                  }}
                >
                  <div className="text-sm font-medium">{p.label}</div>
                  <div
                    className="text-[11px] tabular-nums mt-0.5"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {p.width} × {p.height}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolModal>
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
    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span
        className="text-xs font-semibold"
        style={{ color: "rgba(255,255,255,0.6)" }}
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
        style={{ color: "#FFFFFF" }}
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
 *  preserving the draft aspect ratio. */
function previewWidth(w: number, h: number): number {
  const max = 200;
  if (w >= h) return max;
  return Math.round((max * w) / h);
}

function previewHeight(w: number, h: number): number {
  const max = 200;
  if (h >= w) return max;
  return Math.round((max * h) / w);
}
