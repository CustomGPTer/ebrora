// src/components/photo-editor/tools/EffectsTool.tsx
//
// Full-screen modal for applying filters and adjustments to the
// project's background photo. Mirrors the reference Add Text app's
// "Effects" pattern (preset filter chips + adjustment sliders).
//
// Layout (top → bottom):
//   ┌──────────────────────────────────────────────┐
//   │ [✕]    Effects    [✓]                        │
//   ├──────────────────────────────────────────────┤
//   │                                              │
//   │  [live CSS-filtered preview of the photo]    │
//   │                                              │
//   ├──────────────────────────────────────────────┤
//   │ [Original] [Mono] [Sepia] [Vivid] [Faded] …  │  ← preset chips
//   ├──────────────────────────────────────────────┤
//   │ Brightness   ───●─────────   +20             │  ← sliders
//   │ Contrast     ─●───────────   −15             │
//   │ Saturation   ───────●─────    +5             │
//   │ Exposure     ─────●───────     0             │
//   ├──────────────────────────────────────────────┤
//   │              [Reset]                         │
//   └──────────────────────────────────────────────┘
//
// Live preview uses CSS `filter:` to approximate the result. CSS
// filters are not pixel-identical to Konva's filter chain — Konva
// uses additive brightness while CSS is multiplicative, sepia
// matrices differ slightly, etc — so the preview is "close enough"
// rather than WYSIWYG. We document this in-file rather than ship a
// second Konva stage just to render a tiny preview. The committed
// result is rendered by CanvasStage's PhotoRect through Konva, so
// the canvas after Apply is the source of truth.
//
// Apply (✓) dispatches SET_FILTERS with the draft. Cancel discards.
// Reset zeros the draft to DEFAULT_BACKGROUND_FILTERS without
// dispatching — the user can then apply or cancel as usual.

"use client";

import { useEffect, useState } from "react";
import { ToolModal } from "./ToolModal";
import { useEditor } from "../context/EditorContext";
import {
  DEFAULT_BACKGROUND_FILTERS,
  type Background,
  type BackgroundFilters,
} from "@/lib/photo-editor/types";

interface EffectsToolProps {
  open: boolean;
  onClose: () => void;
}

interface PresetDef {
  id: string;
  label: string;
  filters: BackgroundFilters;
}

// ─── Preset filters ─────────────────────────────────────────────
//
// "effect" maps to a single colour-transform filter applied AFTER
// the linear adjust filters (brightness/contrast/saturation/
// exposure). Most presets use one OR the other for simplicity; a
// few combine them.

const PRESETS: PresetDef[] = [
  {
    id: "none",
    label: "Original",
    filters: DEFAULT_BACKGROUND_FILTERS,
  },
  {
    id: "mono",
    label: "Mono",
    filters: {
      adjust: { brightness: 0, contrast: 10, saturation: 0, exposure: 0 },
      effect: "mono",
      blur: { radius: 0, kind: "gaussian" },
    },
  },
  {
    id: "sepia",
    label: "Sepia",
    filters: {
      adjust: { brightness: 0, contrast: 0, saturation: 0, exposure: 0 },
      effect: "sepia",
      blur: { radius: 0, kind: "gaussian" },
    },
  },
  {
    id: "vivid",
    label: "Vivid",
    filters: {
      adjust: { brightness: 0, contrast: 20, saturation: 40, exposure: 0 },
      effect: null,
      blur: { radius: 0, kind: "gaussian" },
    },
  },
  {
    id: "faded",
    label: "Faded",
    filters: {
      adjust: { brightness: 5, contrast: -25, saturation: -30, exposure: 0 },
      effect: null,
      blur: { radius: 0, kind: "gaussian" },
    },
  },
  {
    id: "bright",
    label: "Bright",
    filters: {
      adjust: { brightness: 20, contrast: 5, saturation: 10, exposure: 10 },
      effect: null,
      blur: { radius: 0, kind: "gaussian" },
    },
  },
  {
    id: "dark",
    label: "Dark",
    filters: {
      adjust: { brightness: -15, contrast: 20, saturation: -10, exposure: -10 },
      effect: null,
      blur: { radius: 0, kind: "gaussian" },
    },
  },
  {
    id: "drama",
    label: "Drama",
    filters: {
      adjust: { brightness: -5, contrast: 35, saturation: -10, exposure: 0 },
      effect: null,
      blur: { radius: 0, kind: "gaussian" },
    },
  },
];

export function EffectsTool({ open, onClose }: EffectsToolProps) {
  const { state, dispatch } = useEditor();
  const bg = state.project.background;
  const photoBg: Extract<Background, { kind: "photo" }> | null =
    bg.kind === "photo" ? bg : null;

  // Local draft — only committed on Apply (✓).
  const [draft, setDraft] = useState<BackgroundFilters>(
    DEFAULT_BACKGROUND_FILTERS,
  );

  useEffect(() => {
    if (!open) return;
    // Re-snapshot from the project on every open so the user can
    // iterate without drift between sessions.
    setDraft(cloneFilters(state.project.filters));
  }, [open, state.project.filters]);

  if (!open) return null;

  function handleApply() {
    dispatch({ type: "SET_FILTERS", filters: cloneFilters(draft) });
    onClose();
  }

  function handleReset() {
    setDraft(cloneFilters(DEFAULT_BACKGROUND_FILTERS));
  }

  function applyPreset(p: PresetDef) {
    setDraft(cloneFilters(p.filters));
  }

  // Highlight the preset that exactly matches the draft (the user
  // may have nudged a slider after applying a preset, in which case
  // no preset is "active").
  const activePresetId = PRESETS.find((p) =>
    filtersEqual(p.filters, draft),
  )?.id;

  if (!photoBg) {
    return (
      <ToolModal open={open} title="Effects" onCancel={onClose} onApply={onClose}>
        <div className="flex-1 flex items-center justify-center p-6">
          <p
            className="text-center max-w-sm"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Effects work on a photo background. Tap Replace in the dock
            to add a photo first.
          </p>
        </div>
      </ToolModal>
    );
  }

  return (
    <ToolModal
      open={open}
      title="Effects"
      onCancel={onClose}
      onApply={handleApply}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview ─────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-4 py-4 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoBg.src}
            alt=""
            className="max-w-full max-h-full"
            style={{
              filter: filtersToCss(draft),
              objectFit: "contain",
              transition: "filter 0.10s linear",
            }}
            draggable={false}
          />
        </div>

        {/* Preset chips ───────────────────────────────────────── */}
        <div
          className="flex-none border-t"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 overflow-x-auto"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {PRESETS.map((p) => (
              <PresetChip
                key={p.id}
                src={photoBg.src}
                label={p.label}
                filters={p.filters}
                active={activePresetId === p.id}
                onClick={() => applyPreset(p)}
              />
            ))}
          </div>
        </div>

        {/* Adjust sliders ─────────────────────────────────────── */}
        <div
          className="flex-none border-t px-4 py-3 space-y-3"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <Slider
            label="Brightness"
            value={draft.adjust.brightness}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                adjust: { ...d.adjust, brightness: v },
              }))
            }
          />
          <Slider
            label="Contrast"
            value={draft.adjust.contrast}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                adjust: { ...d.adjust, contrast: v },
              }))
            }
          />
          <Slider
            label="Saturation"
            value={draft.adjust.saturation}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                adjust: { ...d.adjust, saturation: v },
              }))
            }
          />
          <Slider
            label="Exposure"
            value={draft.adjust.exposure}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                adjust: { ...d.adjust, exposure: v },
              }))
            }
          />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                color: "rgba(255,255,255,0.85)",
                background: "rgba(255,255,255,0.10)",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </ToolModal>
  );
}

// ─── Preset chip — small thumbnail with filter applied ─────────

function PresetChip({
  src,
  label,
  filters,
  active,
  onClick,
}: {
  src: string;
  label: string;
  filters: BackgroundFilters;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className="flex-none flex flex-col items-center gap-1.5 transition-opacity"
    >
      <div
        className="rounded-lg overflow-hidden"
        style={{
          width: 56,
          height: 56,
          border: active
            ? "2px solid #4ECDC4"
            : "2px solid rgba(255,255,255,0.18)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: filtersToCss(filters) }}
          draggable={false}
        />
      </div>
      <span
        className="text-[11px]"
        style={{
          color: active ? "#FFFFFF" : "rgba(255,255,255,0.65)",
          fontWeight: active ? 600 : 500,
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Slider with value readout ──────────────────────────────────

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[12px] font-medium"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          {label}
        </span>
        <span
          className="text-[11px] tabular-nums"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {value > 0 ? "+" : ""}
          {value}
        </span>
      </div>
      <input
        type="range"
        min={-100}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={label}
        className="w-full"
        style={{
          accentColor: "#4ECDC4",
        }}
      />
    </div>
  );
}

// ─── CSS filter approximation ───────────────────────────────────

/** Map our internal filter object to a CSS `filter:` string for the
 *  modal's preview. Approximation only — Konva is the source of
 *  truth for the committed canvas (see CanvasStage.PhotoRect). */
function filtersToCss(f: BackgroundFilters): string {
  const parts: string[] = [];
  // brightness / exposure: combined into one CSS brightness(...).
  // Our scale is -100..100 with 0 = no change. CSS brightness is a
  // multiplier with 1 = no change. Map: 0 → 1, -100 → 0, +100 → 2.
  const combinedBrightness = 1 + (f.adjust.brightness + f.adjust.exposure) / 100;
  if (combinedBrightness !== 1) {
    parts.push(`brightness(${Math.max(0, combinedBrightness).toFixed(3)})`);
  }
  if (f.adjust.contrast !== 0) {
    const c = 1 + f.adjust.contrast / 100;
    parts.push(`contrast(${Math.max(0, c).toFixed(3)})`);
  }
  if (f.adjust.saturation !== 0) {
    const s = 1 + f.adjust.saturation / 100;
    parts.push(`saturate(${Math.max(0, s).toFixed(3)})`);
  }
  if (f.effect === "mono") parts.push("grayscale(1)");
  else if (f.effect === "sepia") parts.push("sepia(1)");
  else if (f.effect === "invert") parts.push("invert(1)");
  if (f.blur.radius > 0) {
    parts.push(`blur(${f.blur.radius}px)`);
  }
  return parts.length > 0 ? parts.join(" ") : "none";
}

// ─── Helpers ────────────────────────────────────────────────────

function cloneFilters(f: BackgroundFilters): BackgroundFilters {
  return {
    adjust: { ...f.adjust },
    effect: f.effect,
    blur: { ...f.blur },
  };
}

function filtersEqual(a: BackgroundFilters, b: BackgroundFilters): boolean {
  return (
    a.adjust.brightness === b.adjust.brightness &&
    a.adjust.contrast === b.adjust.contrast &&
    a.adjust.saturation === b.adjust.saturation &&
    a.adjust.exposure === b.adjust.exposure &&
    a.effect === b.effect &&
    a.blur.radius === b.blur.radius &&
    a.blur.kind === b.blur.kind
  );
}
