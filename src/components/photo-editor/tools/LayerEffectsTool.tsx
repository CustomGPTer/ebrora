// src/components/photo-editor/tools/LayerEffectsTool.tsx
//
// Full-screen modal for editing the effects of a single image layer.
// Consolidates the previously-separate ImageFilterPanel /
// ImageAdjustPanel / ImageBlurPanel drawers into one screen with three
// sub-tabs.
//
// Batch E — Apr 2026.
//
// Layout (top → bottom):
//   ┌──────────────────────────────────────────────┐
//   │ [✕]    Effects    [✓]                        │
//   ├──────────────────────────────────────────────┤
//   │                                              │
//   │  [live CSS-filtered preview of the layer]    │
//   │                                              │
//   ├──────────────────────────────────────────────┤
//   │  [ Adjust ] [ Filters ] [ Blur ]             │  ← sub-tabs
//   ├──────────────────────────────────────────────┤
//   │  (sub-tab content)                           │
//   │                          [ Reset ]           │
//   └──────────────────────────────────────────────┘
//
// Pattern mirrors `tools/EffectsTool.tsx` (background-level effects):
//   • Same ToolModal chrome (X / title / ✓).
//   • Same draft + Apply / Cancel semantics — local state holds the
//     pending edits, dispatch happens on Apply, Cancel discards.
//   • Same CSS-filter preview approximation (Konva is the source of
//     truth on the canvas after Apply; the preview is "close enough").
//
// The naming distinction from the existing EffectsTool:
//   tools/EffectsTool.tsx           — project background filters
//   tools/LayerEffectsTool.tsx      — single image-layer filters (this)
//
// Both live in tools/ because both are full-screen takeovers driven by
// the parent shell's state (different state machines: backgroundTool
// for the bg one, ActivePanel for this one). The naming is slightly
// asymmetrical but the bg EffectsTool predates the per-layer fields.
//
// Reset behaviour:
//   The Reset button is scoped to the currently-active sub-tab. The
//   reasoning matches the inline tab strip pattern used for text /
//   shape — per-tab reset, not whole-layer reset. So:
//     Adjust  → zero brightness/contrast/saturation/exposure
//     Filters → set filterEffect to null (Original)
//     Blur    → enabled=false, radius=0

"use client";

import { useEffect, useState } from "react";
import { ToolModal } from "./ToolModal";
import { useEditor } from "../context/EditorContext";
import { FILTER_EFFECT_PRESETS } from "@/lib/photo-editor/canvas/image-filters";
import type { AnyLayer, ImageLayer } from "@/lib/photo-editor/types";

interface LayerEffectsToolProps {
  open: boolean;
  onClose: () => void;
}

type SubTab = "adjust" | "filters" | "blur";

interface EffectsDraft {
  adjust: ImageLayer["adjust"];
  filterEffect: ImageLayer["filterEffect"];
  blur: ImageLayer["blur"];
}

const DEFAULT_DRAFT: EffectsDraft = {
  adjust: { brightness: 0, contrast: 0, saturation: 0, exposure: 0 },
  filterEffect: null,
  blur: { enabled: false, radius: 0, kind: "gaussian" },
};

export function LayerEffectsTool({ open, onClose }: LayerEffectsToolProps) {
  const { state, dispatch } = useEditor();

  // Resolve the selected image layer at render time. We don't memoise
  // because state.selection / state.project.layers churn is fine for a
  // single-pass modal.
  const layer: ImageLayer | null = (() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const found = state.project.layers.find((l) => l.id === id);
    if (!found || found.kind !== "image") return null;
    return found;
  })();

  const [tab, setTab] = useState<SubTab>("adjust");
  const [draft, setDraft] = useState<EffectsDraft>(DEFAULT_DRAFT);

  // Re-snapshot from the current layer every time the modal opens so
  // the user can iterate without drift between sessions. Mirrors
  // EffectsTool.tsx's pattern.
  useEffect(() => {
    if (!open) return;
    if (!layer) {
      setDraft(DEFAULT_DRAFT);
      return;
    }
    setDraft({
      adjust: { ...layer.adjust },
      filterEffect: layer.filterEffect,
      blur: { ...layer.blur },
    });
    // We deliberately depend on `open` and the layer's data fields
    // rather than the layer object identity, so opening the modal
    // re-snapshots even if the same layer reference comes back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function handleApply() {
    if (!layer) {
      onClose();
      return;
    }
    dispatch({
      type: "UPDATE_LAYER",
      id: layer.id,
      patch: {
        adjust: { ...draft.adjust },
        filterEffect: draft.filterEffect,
        blur: { ...draft.blur },
      } as Partial<AnyLayer>,
    });
    onClose();
  }

  function handleResetActiveTab() {
    setDraft((d) => {
      switch (tab) {
        case "adjust":
          return { ...d, adjust: { ...DEFAULT_DRAFT.adjust } };
        case "filters":
          return { ...d, filterEffect: null };
        case "blur":
          return { ...d, blur: { ...DEFAULT_DRAFT.blur } };
      }
    });
  }

  // ─── No-image placeholder ───────────────────────────────────
  if (!layer) {
    return (
      <ToolModal
        open={open}
        title="Effects"
        onCancel={onClose}
        onApply={onClose}
      >
        <div className="flex-1 flex items-center justify-center p-6">
          <p
            className="text-center max-w-sm"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Effects work on an image layer. Select an image first.
          </p>
        </div>
      </ToolModal>
    );
  }

  // Bind layer.src locally so the preview img tag has stable
  // narrowed access (avoids null check inside JSX).
  const previewSrc = layer.src;

  return (
    <ToolModal
      open={open}
      title="Effects"
      onCancel={onClose}
      onApply={handleApply}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Live CSS preview ─────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-4 py-4 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt=""
            className="max-w-full max-h-full"
            style={{
              filter: draftToCss(draft),
              objectFit: "contain",
              transition: "filter 0.10s linear",
            }}
            draggable={false}
          />
        </div>

        {/* Sub-tab strip ────────────────────────────────────── */}
        <div
          className="flex-none border-t"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 overflow-x-auto"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <SubTabChip
              label="Adjust"
              active={tab === "adjust"}
              edited={isAdjustEdited(draft)}
              onClick={() => setTab("adjust")}
            />
            <SubTabChip
              label="Filters"
              active={tab === "filters"}
              edited={isFilterEdited(draft)}
              onClick={() => setTab("filters")}
            />
            <SubTabChip
              label="Blur"
              active={tab === "blur"}
              edited={isBlurEdited(draft)}
              onClick={() => setTab("blur")}
            />
          </div>
        </div>

        {/* Sub-tab body ─────────────────────────────────────── */}
        <div
          className="flex-none border-t px-4 py-3 space-y-3"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            minHeight: 180,
          }}
        >
          {tab === "adjust" && (
            <>
              <Slider
                label="Brightness"
                value={draft.adjust.brightness}
                min={-100}
                max={100}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    adjust: { ...d.adjust, brightness: v },
                  }))
                }
                format={(n) => `${n > 0 ? "+" : ""}${n}`}
              />
              <Slider
                label="Contrast"
                value={draft.adjust.contrast}
                min={-100}
                max={100}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    adjust: { ...d.adjust, contrast: v },
                  }))
                }
                format={(n) => `${n > 0 ? "+" : ""}${n}`}
              />
              <Slider
                label="Saturation"
                value={draft.adjust.saturation}
                min={-100}
                max={100}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    adjust: { ...d.adjust, saturation: v },
                  }))
                }
                format={(n) => `${n > 0 ? "+" : ""}${n}`}
              />
              <Slider
                label="Exposure"
                value={draft.adjust.exposure}
                min={-100}
                max={100}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    adjust: { ...d.adjust, exposure: v },
                  }))
                }
                format={(n) => `${n > 0 ? "+" : ""}${n}`}
              />
            </>
          )}

          {tab === "filters" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {FILTER_EFFECT_PRESETS.map((p) => {
                const active = (draft.filterEffect ?? null) === p.id;
                return (
                  <PresetChip
                    key={p.id ?? "original"}
                    src={previewSrc}
                    label={p.label}
                    presetId={p.id}
                    active={active}
                    onClick={() =>
                      setDraft((d) => ({ ...d, filterEffect: p.id }))
                    }
                  />
                );
              })}
            </div>
          )}

          {tab === "blur" && (
            <>
              <ToggleRow
                label="Enable blur"
                checked={draft.blur.enabled}
                onChange={(next) =>
                  setDraft((d) => ({
                    ...d,
                    blur: { ...d.blur, enabled: next },
                  }))
                }
              />
              <Slider
                label="Radius"
                value={draft.blur.radius}
                min={0}
                max={50}
                disabled={!draft.blur.enabled}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    blur: { ...d.blur, radius: v },
                  }))
                }
                format={(n) => `${Math.round(n)} px`}
              />
            </>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleResetActiveTab}
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

// ─── Sub-tab chip ───────────────────────────────────────────────

function SubTabChip({
  label,
  active,
  edited,
  onClick,
}: {
  label: string;
  active: boolean;
  edited: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex-none relative px-4 py-1.5 rounded-full text-sm transition-colors"
      style={{
        color: active ? "#0F1115" : "rgba(255,255,255,0.85)",
        background: active ? "#FFFFFF" : "rgba(255,255,255,0.10)",
        fontWeight: active ? 600 : 500,
      }}
    >
      {label}
      {edited && !active && (
        <span
          aria-hidden
          className="absolute"
          style={{
            top: 4,
            right: 6,
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "#EF4444",
            boxShadow: "0 0 0 1.5px rgba(0,0,0,0.92)",
          }}
        />
      )}
    </button>
  );
}

// ─── Preset chip — small thumbnail with filter applied ─────────
//
// Mirrors EffectsTool's PresetChip but operates on a single preset id
// rather than a full BackgroundFilters set. The background-level
// EffectsTool's chips combine an `effect` AND `adjust` AND `blur` per
// preset; per-layer presets are pure filterEffect ids only.

function PresetChip({
  src,
  label,
  presetId,
  active,
  onClick,
}: {
  src: string;
  label: string;
  presetId: string | null;
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
            ? "2px solid #FFFFFF"
            : "2px solid rgba(255,255,255,0.18)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: presetIdToCss(presetId) }}
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
  min,
  max,
  onChange,
  format,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  format: (n: number) => string;
  disabled?: boolean;
}) {
  return (
    <div style={{ opacity: disabled ? 0.5 : 1 }}>
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
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={label}
        className="w-full"
        style={{
          accentColor: "#4FB89E",
        }}
      />
    </div>
  );
}

// ─── Toggle row ─────────────────────────────────────────────────

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span
        className="text-[12px] font-medium"
        style={{ color: "rgba(255,255,255,0.85)" }}
      >
        {label}
      </span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        tabIndex={0}
        className="relative inline-block transition-colors rounded-full"
        style={{
          width: 38,
          height: 22,
          background: checked ? "#4FB89E" : "rgba(255,255,255,0.18)",
        }}
      >
        <span
          aria-hidden
          className="absolute top-[2px] rounded-full transition-transform"
          style={{
            width: 18,
            height: 18,
            background: "#FFFFFF",
            transform: checked ? "translateX(18px)" : "translateX(2px)",
          }}
        />
      </span>
    </label>
  );
}

// ─── CSS filter approximation ───────────────────────────────────
//
// Same idea as tools/EffectsTool.tsx::filtersToCss but operates on the
// per-layer EffectsDraft shape (which uses `filterEffect`, not
// `effect`). Konva is the source of truth for the actual rendered
// canvas; this is for the modal preview only.

function draftToCss(d: EffectsDraft): string {
  const parts: string[] = [];
  // brightness / exposure: collapsed into one CSS brightness(...).
  // Map: 0 → 1, -100 → 0, +100 → 2 (linear approx).
  const combinedBrightness =
    1 + (d.adjust.brightness + d.adjust.exposure) / 100;
  if (combinedBrightness !== 1) {
    parts.push(`brightness(${Math.max(0, combinedBrightness).toFixed(3)})`);
  }
  if (d.adjust.contrast !== 0) {
    const c = 1 + d.adjust.contrast / 100;
    parts.push(`contrast(${Math.max(0, c).toFixed(3)})`);
  }
  if (d.adjust.saturation !== 0) {
    const s = 1 + d.adjust.saturation / 100;
    parts.push(`saturate(${Math.max(0, s).toFixed(3)})`);
  }
  if (d.filterEffect === "mono") parts.push("grayscale(1)");
  else if (d.filterEffect === "sepia") parts.push("sepia(1)");
  else if (d.filterEffect === "invert") parts.push("invert(1)");
  if (d.blur.enabled && d.blur.radius > 0) {
    parts.push(`blur(${d.blur.radius}px)`);
  }
  return parts.length > 0 ? parts.join(" ") : "none";
}

function presetIdToCss(presetId: string | null): string {
  if (presetId === "mono") return "grayscale(1)";
  if (presetId === "sepia") return "sepia(1)";
  if (presetId === "invert") return "invert(1)";
  return "none";
}

// ─── Edited-state predicates (per sub-tab) ──────────────────────

function isAdjustEdited(d: EffectsDraft): boolean {
  return (
    d.adjust.brightness !== 0 ||
    d.adjust.contrast !== 0 ||
    d.adjust.saturation !== 0 ||
    d.adjust.exposure !== 0
  );
}

function isFilterEdited(d: EffectsDraft): boolean {
  return d.filterEffect !== null;
}

function isBlurEdited(d: EffectsDraft): boolean {
  return d.blur.enabled || d.blur.radius > 0;
}
