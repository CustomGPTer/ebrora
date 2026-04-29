// src/components/photo-editor/home/HomePresets.tsx
//
// "Style presets" section on the home screen — 4 curated cold-start
// presets (Bold · Glow · Neon · Vintage) that, when tapped, drop the
// user straight into the editor with a centred placeholder text layer
// already wearing the preset's styling.
//
// Batch F — Apr 2026.
//
// Why curated subset, not the full StylePanel library?
//   The StylePanel ships 8 presets (D1 + D2a + D2b). Surfacing all 8
//   on home would compete with the BackgroundQuickPick / GalleryCard /
//   ProjectsGrid sections. A 4-preset shortlist is enough to give a
//   "tap-and-go" affordance without overwhelming. The user can apply
//   any preset (curated or not) once inside the editor via the Style
//   tab on the text strip.
//
// Why not import StylePanel.PRESETS directly?
//   StylePanel's `PRESETS[i].apply(tool)` requires a live `useTextTool`
//   hook with a selected text layer in scope. There is no live tool /
//   selection on the home screen — we're seeding a fresh Project from
//   scratch. So the home presets define their preset-specific GlyphRun
//   overrides directly. The visual approximations (CSS `preview`) are
//   intentionally re-defined here too so the home cards can render
//   without a Konva canvas.
//
//   Trade-off: two sources of truth (StylePanel.PRESETS + this file).
//   Drift is acceptable — the home preset is "what the user gets cold-
//   start", the StylePanel preset is "what gets applied to the
//   currently-selected text". They serve adjacent but distinct surfaces.
//
// Tap behaviour:
//   Each card runs its own `seed()` factory, which returns a fresh
//   Project with one centred TextLayer. The Project is handed up via
//   `onProjectLoaded(project, null)` — null savedProjectId because
//   nothing has been saved yet. PhotoEditorClient routes through to
//   EditorShell which mounts the editor view.

"use client";

import { useId } from "react";
import { createBlankProject } from "@/lib/photo-editor/canvas/state";
import {
  createDefaultTextForCanvas,
  defaultGlyphRun,
} from "@/lib/photo-editor/rich-text/factory";
import { centreLayerOnCanvas } from "@/lib/photo-editor/canvas/selection";
import type {
  GlyphRun,
  Project,
  TextLayer,
} from "@/lib/photo-editor/types";

interface HomePresetsProps {
  /** Same callback as the rest of the home view — receives a fresh
   *  Project with the preset-styled text layer + null savedProjectId
   *  (nothing has been saved yet). */
  onProjectReady: (project: Project) => void;
}

interface HomePreset {
  id: string;
  label: string;
  /** CSS approximation rendered inside the card thumbnail. Not a
   *  pixel-faithful render of the engine output — illustrative
   *  (mirrors StylePanel.PRESETS[i].preview). */
  preview: React.CSSProperties;
  /** Text shown inside the card thumbnail (usually "Aa"). */
  sampleText: string;
  /** Build a fresh Project with this preset's styling already applied
   *  to a centred placeholder text layer. */
  seed: () => Project;
}

// ─── Preset seeds ──────────────────────────────────────────────
//
// Each preset:
//   1. Creates a default blank project (1080×1080 white bg)
//   2. Calls createDefaultTextForCanvas to size a centred text layer
//      with placeholder copy ("Tap to edit")
//   3. Replaces the auto-generated GlyphRun with one that overrides
//      preset-specific fields (fontWeight, shadow, gradient, texture,
//      fill, etc.)
//   4. Centres the layer and returns the assembled Project

function seedWithStyledRun(
  presetName: string,
  applyRun: (base: GlyphRun) => GlyphRun,
  applyLayer: (layer: TextLayer) => TextLayer = (l) => l,
): Project {
  const project = createBlankProject({ name: `${presetName} preset` });
  const base = createDefaultTextForCanvas(project.width, project.height, {
    text: "Tap to edit",
  });
  // Replace the default run with the preset-styled version (preserves
  // the auto-computed fontSize / fontFamily / etc. from
  // createDefaultTextForCanvas).
  const styledRun = applyRun(base.runs[0]);
  let layer: TextLayer = applyLayer({ ...base, runs: [styledRun] });
  layer = centreLayerOnCanvas(layer, project.width, project.height);
  return {
    ...project,
    layers: [layer],
    layerOrder: [layer.id],
  };
}

// Match StylePanel.PRESETS for visual consistency. Brand-green
// (#1B5B50) for Bold/Glow; Neon's signature pink→cyan for Neon;
// sepia/paper for Vintage.

const HOME_PRESETS: HomePreset[] = [
  {
    id: "bold",
    label: "Bold",
    sampleText: "Aa",
    preview: {
      color: "#1B5B50",
      fontWeight: 800,
    },
    seed: () =>
      seedWithStyledRun("Bold", (base) => ({
        ...base,
        fontWeight: 700,
        fill: "#1B5B50",
      })),
  },
  {
    id: "glow",
    label: "Glow",
    sampleText: "Aa",
    preview: {
      color: "#1B5B50",
      textShadow: "0 0 12px rgba(27,91,80,0.85)",
    },
    seed: () =>
      seedWithStyledRun("Glow", (base) => ({
        ...base,
        fill: "#1B5B50",
        shadow: {
          enabled: true,
          color: "#1B5B50",
          opacity: 0.85,
          blur: 16,
          offsetX: 0,
          offsetY: 0,
        },
      })),
  },
  {
    id: "neon",
    label: "Neon",
    sampleText: "Aa",
    preview: {
      // Same gradient + glow approximation StylePanel uses for the
      // Neon card preview.
      background: "linear-gradient(90deg, #ff3df0, #00e5ff)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      textShadow: "0 0 10px rgba(0,229,255,0.6)",
      fontWeight: 700,
    },
    seed: () =>
      seedWithStyledRun("Neon", (base) => ({
        ...base,
        fontWeight: 700,
        gradient: {
          enabled: true,
          angle: 0,
          stops: [
            { position: 0, color: "#ff3df0" },
            { position: 1, color: "#00e5ff" },
          ],
        },
        shadow: {
          enabled: true,
          color: "#00e5ff",
          opacity: 0.85,
          blur: 18,
          offsetX: 0,
          offsetY: 0,
        },
        // Texture explicitly off — engine's texture-takes-precedence
        // rule would otherwise mask the gradient.
        texture: {
          enabled: false,
          src: "",
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
        },
      })),
  },
  {
    id: "vintage",
    label: "Vintage",
    sampleText: "Aa",
    preview: {
      color: "#8a6a3a",
      textShadow: "1px 1px 2px rgba(80,60,30,0.35)",
      fontStyle: "italic",
    },
    seed: () =>
      seedWithStyledRun("Vintage", (base) => ({
        ...base,
        fill: "#8a6a3a",
        fontStyle: "italic",
        texture: {
          enabled: true,
          src: "paper",
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
        },
        shadow: {
          enabled: true,
          color: "#3a2a10",
          opacity: 0.4,
          blur: 4,
          offsetX: 1,
          offsetY: 1,
        },
        // Gradient explicitly off so texture wins.
        gradient: {
          enabled: false,
          angle: 0,
          stops: [
            { position: 0, color: "#FFFFFF" },
            { position: 1, color: "#1B5B50" },
          ],
        },
      })),
  },
];

export function HomePresets({ onProjectReady }: HomePresetsProps) {
  const headerId = useId();

  return (
    <section aria-labelledby={headerId}>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <h2
          id={headerId}
          className="text-base font-semibold"
          style={{ color: "var(--pe-text)" }}
        >
          Style presets
        </h2>
        <span
          className="text-xs"
          style={{ color: "var(--pe-text-muted)" }}
        >
          Tap to start
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 px-1">
        {HOME_PRESETS.map((p) => (
          <PresetCard
            key={p.id}
            preset={p}
            onClick={() => onProjectReady(p.seed())}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Preset card ──────────────────────────────────────────────

function PresetCard({
  preset,
  onClick,
}: {
  preset: HomePreset;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Start with ${preset.label} preset`}
      className="w-full rounded-xl overflow-hidden flex flex-col items-stretch transition-colors"
      style={{
        border: "1px solid var(--pe-border-strong)",
        background: "var(--pe-surface)",
      }}
    >
      <div
        className="w-full flex items-center justify-center"
        style={{
          aspectRatio: "1 / 1",
          background: "var(--pe-surface-2)",
        }}
      >
        <span
          className="text-2xl select-none"
          style={preset.preview}
        >
          {preset.sampleText}
        </span>
      </div>
      <div
        className="px-1.5 py-1.5 text-center text-[12px] font-medium truncate"
        style={{ color: "var(--pe-text)" }}
      >
        {preset.label}
      </div>
    </button>
  );
}
