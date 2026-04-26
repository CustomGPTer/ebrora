// src/components/photo-editor/home/BackgroundQuickPick.tsx
//
// "Background" section of the home screen — two horizontal-scroll rows
// of swatches mirroring the reference Add Text app:
//
//   Row 1 — Solid:     [palette] [transparent] [white] [black] [red] [pink] [purple] [blue]
//   Row 2 — Gradients: [grayscale] [blue→red] [orange→teal] [red→green] …
//
// Tapping any swatch creates a fresh blank Project with that background
// (1080×1080 — Instagram square — same as createBlankProject's default)
// and hands it up to PhotoEditorClient via onBackgroundChosen, which
// then enters editor view with the seeded project.
//
// The "palette" swatch (first tile) opens a hidden <input type="color">
// so the user can pick any solid colour from the OS-native picker. We
// chose this over a fully custom HSV picker because:
//   1. The HsvPicker primitive lives inside a panel drawer scope and
//      pulling it onto the home screen would drag along ColorSwatches
//      and ColorPanel state plumbing for a single one-shot use.
//   2. The OS native picker gives users wheel + recents + accessibility
//      affordances at no cost.
// A Batch-N polish could swap in HsvPicker if Jon wants the in-app feel.
//
// The "transparent" swatch sets the project background to
// { kind: "transparent" } which CanvasStage already paints as a soft
// checkerboard, so no special-casing is needed downstream.

"use client";

import { useRef } from "react";
import { Palette } from "lucide-react";
import { createBlankProject } from "@/lib/photo-editor/canvas/state";
import type {
  Background,
  GradientFill,
  Project,
} from "@/lib/photo-editor/types";

// ─── Solid colour swatches (first row, after palette + transparent) ───

const SOLID_COLOURS: { color: string; label: string }[] = [
  { color: "#FFFFFF", label: "White" },
  { color: "#0F1115", label: "Black" },
  { color: "#EF4444", label: "Red" },
  { color: "#EC4899", label: "Pink" },
  { color: "#8B5CF6", label: "Purple" },
  { color: "#3B82F6", label: "Blue" },
  { color: "#10B981", label: "Green" },
  { color: "#F59E0B", label: "Amber" },
];

// ─── Gradient presets (second row) ──────────────────────────────
//
// Each preset is two stops at 0 / 1; angle is in degrees with 0 = L→R.
// We picked angles + colour pairs that resemble the reference's row
// without copying it verbatim. Angles default to 180° (top→bottom) which
// matches the reference's vertical-blend look.

interface GradientPreset {
  id: string;
  label: string;
  angle: number;
  from: string;
  to: string;
}

const GRADIENT_PRESETS: GradientPreset[] = [
  { id: "g-grayscale", label: "Grayscale", angle: 180, from: "#111827", to: "#F3F4F6" },
  { id: "g-blue-red", label: "Blue → Red", angle: 180, from: "#1D4ED8", to: "#DC2626" },
  { id: "g-orange-teal", label: "Orange → Teal", angle: 180, from: "#F97316", to: "#14B8A6" },
  { id: "g-red-green", label: "Red → Green", angle: 180, from: "#DC2626", to: "#10B981" },
  { id: "g-blue-purple", label: "Blue → Purple", angle: 180, from: "#3B82F6", to: "#8B5CF6" },
  { id: "g-amber-pink", label: "Amber → Pink", angle: 180, from: "#F59E0B", to: "#EC4899" },
  { id: "g-purple-pink", label: "Purple → Pink", angle: 180, from: "#7C3AED", to: "#F472B6" },
  { id: "g-emerald-teal", label: "Emerald → Teal", angle: 180, from: "#059669", to: "#06B6D4" },
];

interface BackgroundQuickPickProps {
  /** Called with a freshly seeded blank project ready for the editor. */
  onBackgroundChosen: (project: Project) => void;
}

export function BackgroundQuickPick({
  onBackgroundChosen,
}: BackgroundQuickPickProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  function startWith(background: Background, name: string) {
    const project = createBlankProject({
      background,
      name,
    });
    onBackgroundChosen(project);
  }

  return (
    <section aria-label="Choose a background">
      <h2
        className="text-base font-semibold mb-2 px-1"
        style={{ color: "var(--pe-text)" }}
      >
        Background
      </h2>

      {/* ── Row 1: Custom + Transparent + Solid colours ───────── */}
      <div
        className="flex items-stretch gap-2 overflow-x-auto pb-2 px-1"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Custom colour — opens OS-native colour picker ────── */}
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          aria-label="Pick a custom colour"
          className="flex-none rounded-full inline-flex items-center justify-center transition-shadow"
          style={{
            width: 56,
            height: 56,
            background:
              "conic-gradient(from 0deg, #ef4444, #f59e0b, #facc15, #10b981, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)",
            color: "#FFFFFF",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.4)",
          }}
        >
          <span
            className="w-8 h-8 rounded-full inline-flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            <Palette className="w-4 h-4" strokeWidth={2} />
          </span>
        </button>

        {/* Transparent ──────────────────────────────────────── */}
        <button
          type="button"
          onClick={() =>
            startWith({ kind: "transparent" }, "Transparent canvas")
          }
          aria-label="Transparent background"
          className="flex-none rounded-full inline-flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            background: `
              repeating-conic-gradient(
                #E5E7EB 0% 25%, #FFFFFF 0% 50%
              ) 50% / 14px 14px
            `,
            border: "1px solid var(--pe-border-strong)",
          }}
        />

        {/* Solid colours ────────────────────────────────────── */}
        {SOLID_COLOURS.map((c) => (
          <button
            key={c.color}
            type="button"
            onClick={() =>
              startWith({ kind: "solid", color: c.color }, `${c.label} canvas`)
            }
            aria-label={`${c.label} background`}
            className="flex-none rounded-full transition-transform"
            style={{
              width: 56,
              height: 56,
              background: c.color,
              border:
                c.color === "#FFFFFF"
                  ? "1px solid var(--pe-border-strong)"
                  : "1px solid rgba(0,0,0,0.06)",
            }}
          />
        ))}
      </div>

      {/* ── Row 2: Gradient presets ───────────────────────────── */}
      <div
        className="flex items-stretch gap-2 overflow-x-auto pb-1 px-1"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {GRADIENT_PRESETS.map((g) => {
          const gradient: GradientFill = {
            enabled: true,
            angle: g.angle,
            stops: [
              { position: 0, color: g.from },
              { position: 1, color: g.to },
            ],
          };
          // Linear-gradient angle helper: CSS uses "to bottom" for 180°
          // — convert from our 0=L→R convention by subtracting 90°.
          const cssAngle = g.angle - 90;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() =>
                startWith({ kind: "gradient", gradient }, `${g.label}`)
              }
              aria-label={`${g.label} gradient background`}
              className="flex-none rounded-2xl transition-transform"
              style={{
                width: 64,
                height: 64,
                background: `linear-gradient(${cssAngle}deg, ${g.from}, ${g.to})`,
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            />
          );
        })}
      </div>

      {/* Hidden colour input — fires on `change` after the OS picker
          confirms. Resetting `.value = ""` is unnecessary here because
          the user can re-pick the same colour without retrigger needs. */}
      <input
        ref={colorInputRef}
        type="color"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          const color = e.target.value;
          if (!color) return;
          startWith({ kind: "solid", color }, "Custom colour canvas");
        }}
      />
    </section>
  );
}
