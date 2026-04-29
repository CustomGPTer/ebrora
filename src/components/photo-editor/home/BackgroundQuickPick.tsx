// src/components/photo-editor/home/BackgroundQuickPick.tsx
//
// "Background" section of the home screen — Batch B redesign to
// match the reference Add Text app more closely.
//
// Layout (mobile, top → bottom):
//
//   ┌────────────────────────────────────────────────────────┐
//   │  Background                                            │
//   │  ◯ ▦ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯  →                                │  Row 1: 40px circles (palette · transparent · solids)
//   │  ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢   ▼                                  │  Row 2: 44px squares (gradients) + chevron
//   └────────────────────────────────────────────────────────┘
//
// Tapping the chevron flips the gradients into a 4-column wrapping
// grid that reveals all 16 presets inline (no modal, no overlay) —
// per Q1A in the Batch B kickoff. Chevron icon flips up while
// expanded; tapping again collapses back to a single scroll row.
//
// Tapping any swatch creates a fresh blank Project with that
// background (1080×1080 — Instagram square — same as
// createBlankProject's default) and hands it up to PhotoEditorClient
// via onBackgroundChosen, which then enters editor view with the
// seeded project.
//
// The "palette" swatch (first tile) opens a hidden <input type=
// "color"> so the user can pick any solid colour from the OS-native
// picker.
//
// The "transparent" swatch is rendered as an inline SVG <pattern>
// checkerboard (per Q2A — no asset pipeline, theme-tunable colours,
// crisp at any DPR) and sets the project background to
// { kind: "transparent" } which CanvasStage already paints as a
// soft checkerboard, so no special-casing is needed downstream.
//
// Sizes: row 1 circles 40×40, row 2 squares 44×44 (slightly larger
// to differentiate gradients from solids visually).

"use client";

import { useId, useRef, useState } from "react";
import { ChevronDown, Palette } from "lucide-react";
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
// 16 presets total — first 8 visible in compact mode, all 16 visible
// in expanded mode (4-column grid). Each preset is two stops at 0/1;
// angle is in degrees with 0 = L→R, 180 = top→bottom.

interface GradientPreset {
  id: string;
  label: string;
  angle: number;
  from: string;
  to: string;
}

const GRADIENT_PRESETS: GradientPreset[] = [
  // Compact set — 8 presets shown by default
  { id: "g-grayscale", label: "Grayscale", angle: 180, from: "#111827", to: "#F3F4F6" },
  { id: "g-blue-red", label: "Blue → Red", angle: 180, from: "#1D4ED8", to: "#DC2626" },
  { id: "g-orange-teal", label: "Orange → Teal", angle: 180, from: "#F97316", to: "#14B8A6" },
  { id: "g-red-green", label: "Red → Green", angle: 180, from: "#DC2626", to: "#10B981" },
  { id: "g-blue-purple", label: "Blue → Purple", angle: 180, from: "#3B82F6", to: "#8B5CF6" },
  { id: "g-amber-pink", label: "Amber → Pink", angle: 180, from: "#F59E0B", to: "#EC4899" },
  { id: "g-purple-pink", label: "Purple → Pink", angle: 180, from: "#7C3AED", to: "#F472B6" },
  { id: "g-emerald-teal", label: "Emerald → Teal", angle: 180, from: "#059669", to: "#06B6D4" },

  // Extended set — surfaced when expanded
  { id: "g-cyan-magenta", label: "Cyan → Magenta", angle: 180, from: "#06B6D4", to: "#D946EF" },
  { id: "g-yellow-pink", label: "Yellow → Pink", angle: 180, from: "#FACC15", to: "#EC4899" },
  { id: "g-indigo-fuchsia", label: "Indigo → Fuchsia", angle: 180, from: "#4F46E5", to: "#D946EF" },
  { id: "g-mint-blue", label: "Mint → Blue", angle: 180, from: "#A7F3D0", to: "#3B82F6" },
  { id: "g-sunset", label: "Sunset", angle: 200, from: "#F59E0B", to: "#7C3AED" },
  { id: "g-ocean", label: "Ocean", angle: 180, from: "#0E7490", to: "#0F172A" },
  { id: "g-coral", label: "Coral", angle: 180, from: "#FB7185", to: "#FCA5A5" },
  { id: "g-forest", label: "Forest", angle: 180, from: "#064E3B", to: "#84CC16" },
];

const COMPACT_VISIBLE_COUNT = 8;

interface BackgroundQuickPickProps {
  /** Called with a freshly seeded blank project ready for the editor. */
  onBackgroundChosen: (project: Project) => void;
}

export function BackgroundQuickPick({
  onBackgroundChosen,
}: BackgroundQuickPickProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const patternId = useId();
  const [expanded, setExpanded] = useState(false);

  function startWith(background: Background, name: string) {
    const project = createBlankProject({
      background,
      name,
    });
    onBackgroundChosen(project);
  }

  const visibleGradients = expanded
    ? GRADIENT_PRESETS
    : GRADIENT_PRESETS.slice(0, COMPACT_VISIBLE_COUNT);

  return (
    <section aria-label="Choose a background">
      <h2
        className="text-base font-semibold mb-2 px-1"
        style={{ color: "var(--pe-text)" }}
      >
        Background
      </h2>

      {/* ── Row 1: Custom + Transparent + Solid colours ─────────── */}
      <div
        className="flex items-stretch gap-2 overflow-x-auto pb-2 px-1"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Custom colour — opens OS-native colour picker ──────── */}
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          aria-label="Pick a custom colour"
          className="flex-none rounded-full inline-flex items-center justify-center transition-shadow"
          style={{
            width: 40,
            height: 40,
            background:
              "conic-gradient(from 0deg, #ef4444, #f59e0b, #facc15, #10b981, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)",
            color: "#FFFFFF",
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.5)",
          }}
        >
          <span
            className="inline-flex items-center justify-center rounded-full"
            style={{
              width: 22,
              height: 22,
              background: "rgba(0,0,0,0.55)",
            }}
          >
            <Palette className="w-3.5 h-3.5" strokeWidth={2} />
          </span>
        </button>

        {/* Transparent — inline SVG <pattern> checkerboard ────── */}
        <button
          type="button"
          onClick={() =>
            startWith({ kind: "transparent" }, "Transparent canvas")
          }
          aria-label="Transparent background"
          className="flex-none rounded-full inline-flex items-center justify-center overflow-hidden"
          style={{
            width: 40,
            height: 40,
            border: "1px solid var(--pe-border-strong)",
          }}
        >
          <svg
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
            width={40}
            height={40}
            aria-hidden
          >
            <defs>
              <pattern
                id={patternId}
                x={0}
                y={0}
                width={10}
                height={10}
                patternUnits="userSpaceOnUse"
              >
                <rect x={0} y={0} width={5} height={5} fill="#FFFFFF" />
                <rect x={5} y={0} width={5} height={5} fill="#E5E7EB" />
                <rect x={0} y={5} width={5} height={5} fill="#E5E7EB" />
                <rect x={5} y={5} width={5} height={5} fill="#FFFFFF" />
              </pattern>
            </defs>
            <rect
              x={0}
              y={0}
              width={40}
              height={40}
              fill={`url(#${patternId})`}
            />
          </svg>
        </button>

        {/* Solid colours ──────────────────────────────────────── */}
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
              width: 40,
              height: 40,
              background: c.color,
              border:
                c.color === "#FFFFFF"
                  ? "1px solid var(--pe-border-strong)"
                  : "1px solid rgba(0,0,0,0.06)",
            }}
          />
        ))}
      </div>

      {/* ── Row 2: Gradient presets (with expand chevron) ───────── */}
      {expanded ? (
        // Expanded grid — 4 columns wrapping, all 16 presets visible
        <div
          className="grid gap-2 px-1 pb-1"
          style={{
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          }}
        >
          {visibleGradients.map((g) => (
            <GradientButton
              key={g.id}
              preset={g}
              onChoose={() =>
                startWith(
                  { kind: "gradient", gradient: gradientFillFor(g) },
                  g.label,
                )
              }
              fluid
            />
          ))}
          {/* Chevron sits in the grid as the final tile when expanded */}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Show fewer gradients"
            aria-expanded
            className="rounded-2xl inline-flex items-center justify-center transition-colors"
            style={{
              aspectRatio: "1 / 1",
              background: "var(--pe-surface-2)",
              border: "1px solid var(--pe-border)",
              color: "var(--pe-text-muted)",
            }}
          >
            <ChevronDown
              className="w-5 h-5"
              strokeWidth={2}
              style={{ transform: "rotate(180deg)" }}
            />
          </button>
        </div>
      ) : (
        // Compact row — 8 presets in a horizontal scroll, chevron at end
        <div
          className="flex items-stretch gap-2 overflow-x-auto pb-1 px-1"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {visibleGradients.map((g) => (
            <GradientButton
              key={g.id}
              preset={g}
              onChoose={() =>
                startWith(
                  { kind: "gradient", gradient: gradientFillFor(g) },
                  g.label,
                )
              }
            />
          ))}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Show more gradients"
            aria-expanded={false}
            className="flex-none rounded-2xl inline-flex items-center justify-center transition-colors"
            style={{
              width: 44,
              height: 44,
              background: "var(--pe-surface-2)",
              border: "1px solid var(--pe-border)",
              color: "var(--pe-text-muted)",
            }}
          >
            <ChevronDown className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Hidden colour input — fires on `change` after the OS picker
          confirms. Resetting `.value = ""` is unnecessary because the
          user can re-pick the same colour without retrigger needs. */}
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

// ─── Helpers ─────────────────────────────────────────────────────

function gradientFillFor(g: GradientPreset): GradientFill {
  return {
    enabled: true,
    angle: g.angle,
    stops: [
      { position: 0, color: g.from },
      { position: 1, color: g.to },
    ],
  };
}

// CSS uses "to bottom" for 180°. Convert from our 0=L→R convention by
// subtracting 90° so the visual matches the rendered project canvas.
function cssAngleFor(angle: number): number {
  return angle - 90;
}

function GradientButton({
  preset,
  onChoose,
  fluid = false,
}: {
  preset: GradientPreset;
  onChoose: () => void;
  /** When true, button takes full grid-cell width with 1:1 aspect.
   *  When false, button is fixed 44×44 for the compact scroll row. */
  fluid?: boolean;
}) {
  const cssAngle = cssAngleFor(preset.angle);
  const sizingStyle = fluid
    ? { aspectRatio: "1 / 1" as const }
    : { width: 44, height: 44 };

  return (
    <button
      type="button"
      onClick={onChoose}
      aria-label={`${preset.label} gradient background`}
      className={`${fluid ? "" : "flex-none"} rounded-2xl transition-transform`}
      style={{
        ...sizingStyle,
        background: `linear-gradient(${cssAngle}deg, ${preset.from}, ${preset.to})`,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    />
  );
}
