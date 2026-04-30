// src/components/photo-editor/text-tools/StylePanel.tsx
//
// Style tab body — preset cards that one-tap-apply a bundle of
// styling changes to the selected text layer. Batch D1 ships 5
// presets that map directly to existing engine capabilities
// (Shadow / Stroke / Outline / Glow / Bold-fill). Batch D2 will
// add Bend / Neon / Vintage once their respective engine paths
// land (Konva.TextPath for Bend; the gradient/texture engines for
// Neon's combo treatment; a noise/grain shader for Vintage).
//
// Visual contract (per handover §6, Style tab):
//   • Standard / My Styles segmented toggle at the top
//   • Standard tab — horizontal-scroll preset cards, each ~92px
//     wide showing "Aa" rendered with a CSS approximation of the
//     preset's effect, label below
//   • My Styles tab — empty placeholder for now (saved-styles
//     library ships in a later batch)
//
// Decision #10 confirms style presets are kept; decision #15 says
// no "Coming soon" placeholders for Bend/Gradient/Texture — the
// presets that REQUIRE those engines (Bend, Neon, Vintage) are
// simply not surfaced in D1. The five we ship here are functional
// out of the gate.

"use client";

import { useState } from "react";
import { useTextTool } from "./use-text-tool";
import { Section, SectionDivider, Segmented } from "./controls";
import type {
  GradientFill,
  Shadow,
  Stroke,
  TextureFill,
} from "@/lib/photo-editor/types";

interface StylePanelProps {
  /** API-symmetry only — the panel always renders inline. */
  inline?: boolean;
}

type StyleMode = "standard" | "my";

interface StylePreset {
  id: string;
  label: string;
  /** CSS used to render the preview "Aa" — an approximation, not a
   *  pixel-faithful render of what the preset will do on canvas.
   *  Cards are illustrative; the source of truth is `apply()`. */
  preview: React.CSSProperties;
  /** Imperative apply — given the text tool, dispatch the patches
   *  needed to apply this preset to the current layer (and the
   *  active run-selection if one is set). */
  apply: (tool: ReturnType<typeof useTextTool>) => void;
}

const PRESETS: StylePreset[] = [
  {
    id: "shadow",
    label: "Shadow",
    preview: {
      color: "#1F2937",
      textShadow: "3px 3px 6px rgba(0,0,0,0.45)",
    },
    apply: (tool) => {
      const shadow: Shadow = {
        color: "#000000",
        opacity: 0.5,
        blur: 8,
        offsetX: 4,
        offsetY: 4,
      };
      tool.patchRuns({ shadow });
    },
  },
  {
    id: "stroke",
    label: "Stroke",
    preview: {
      color: "#FFFFFF",
      WebkitTextStroke: "2px #000000",
    },
    apply: (tool) => {
      const stroke: Stroke = {
        color: "#000000",
        width: 2,
        opacity: 1,
      };
      tool.patchRuns({ stroke, fill: "#FFFFFF" });
    },
  },
  {
    id: "outline",
    label: "Outline",
    preview: {
      color: "transparent",
      WebkitTextStroke: "2.5px #1F2937",
    },
    apply: (tool) => {
      const stroke: Stroke = {
        color: "#1F2937",
        width: 4,
        opacity: 1,
      };
      // Fill = white so the inside of glyphs doesn't show whatever
      // the layer was. True hollow outline (transparent fill) would
      // require alpha-rendering across the export pipeline; ship the
      // simpler approximation for D1.
      tool.patchRuns({ stroke, fill: "#FFFFFF" });
    },
  },
  {
    id: "glow",
    label: "Glow",
    preview: {
      color: "#1B5B50",
      textShadow: "0 0 12px rgba(27,91,80,0.85)",
    },
    apply: (tool) => {
      const shadow: Shadow = {
        color: "#1B5B50",
        opacity: 0.85,
        blur: 16,
        offsetX: 0,
        offsetY: 0,
      };
      tool.patchRuns({ shadow, fill: "#1B5B50" });
    },
  },
  {
    id: "bold",
    label: "Bold",
    preview: {
      color: "#1B5B50",
      fontWeight: 800,
    },
    apply: (tool) => {
      tool.patchRuns({ fontWeight: 700, fill: "#1B5B50" });
    },
  },
  {
    id: "bend",
    label: "Bend",
    // CSS preview is illustrative only — a flat italic-ish lean hints at
    // the warp without trying to replicate the engine's per-glyph arc
    // (which CSS can't faithfully reproduce on text). Source of truth
    // is `apply()`, which patches `styling.bend.amount`.
    preview: {
      color: "#1F2937",
      fontStyle: "italic",
      transform: "rotate(-6deg)",
      transformOrigin: "center",
    },
    apply: (tool) => {
      // +50 lands on a comfortable ∩ arch — readable, clearly bent, not
      // a gimmicky semicircle. Users can scrub the Bend tab afterwards
      // for finer control.
      tool.patchStyling({ bend: { amount: 50 } });
    },
  },
  {
    id: "neon",
    label: "Neon",
    // Vivid magenta-cyan gradient hint via CSS background-clip; not a
    // pixel-faithful preview of the engine's per-glyph gradient + glow,
    // just enough to read as "neon-y".
    preview: {
      background: "linear-gradient(90deg, #ff3df0, #00e5ff)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      textShadow: "0 0 10px rgba(0,229,255,0.6)",
      fontWeight: 700,
    },
    apply: (tool) => {
      const gradient: GradientFill = {
        enabled: true,
        angle: 0,
        stops: [
          { position: 0, color: "#ff3df0" },
          { position: 1, color: "#00e5ff" },
        ],
      };
      const shadow: Shadow = {
        color: "#00e5ff",
        opacity: 0.85,
        blur: 18,
        offsetX: 0,
        offsetY: 0,
      };
      // Disable any existing texture so the gradient wins (engine's
      // texture-takes-precedence rule).
      const texture: TextureFill = {
        enabled: false,
        src: "",
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      };
      tool.patchRuns({ gradient, shadow, texture, fontWeight: 700 });
    },
  },
  {
    id: "vintage",
    label: "Vintage",
    // Sepia-tinted card with a subtle shadow approximating the
    // paper-texture + warm-fill + soft-shadow combo applied below.
    preview: {
      color: "#8a6a3a",
      textShadow: "1px 1px 2px rgba(80,60,30,0.35)",
      fontStyle: "italic",
    },
    apply: (tool) => {
      const texture: TextureFill = {
        enabled: true,
        src: "paper",
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      };
      const shadow: Shadow = {
        color: "#3a2a10",
        opacity: 0.4,
        blur: 4,
        offsetX: 1,
        offsetY: 1,
      };
      // Ensure gradient is off so texture wins; the engine's resolveFill
      // already prefers texture over gradient when both are enabled, but
      // explicit-off keeps the runs clean.
      const gradient: GradientFill = {
        enabled: false,
        angle: 0,
        stops: [
          { position: 0, color: "#FFFFFF" },
          { position: 1, color: "#1B5B50" },
        ],
      };
      tool.patchRuns({
        texture,
        shadow,
        gradient,
        fill: "#8a6a3a",
        fontStyle: "italic",
      });
    },
  },
];

export function StylePanel(_props: StylePanelProps = {}) {
  const tool = useTextTool();
  const [mode, setMode] = useState<StyleMode>("standard");

  if (!tool.layer) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-6 text-xs"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          Select a text layer to apply a style preset.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Section title="Mode">
        <Segmented<StyleMode>
          ariaLabel="Style mode"
          value={mode}
          options={[
            {
              value: "standard",
              label: "Standard",
              ariaLabel: "Standard presets",
            },
            { value: "my", label: "My Styles", ariaLabel: "Saved styles" },
          ]}
          onChange={setMode}
        />
      </Section>
      <SectionDivider />
      {mode === "standard" ? (
        <Section title="Presets">
          <div
            className="flex items-stretch gap-3 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => p.apply(tool)}
                aria-label={`Apply ${p.label} style`}
                className="flex-none flex flex-col items-center gap-1.5 transition-opacity"
                style={{ width: 92 }}
              >
                <div
                  className="w-full inline-flex items-center justify-center rounded-xl"
                  style={{
                    height: 64,
                    background: "var(--pe-surface-2)",
                    border: "1px solid var(--pe-border)",
                  }}
                >
                  <span
                    className="text-2xl"
                    style={{ fontWeight: 700, ...p.preview }}
                  >
                    Aa
                  </span>
                </div>
                <span
                  className="text-[12px]"
                  style={{ color: "var(--pe-text)" }}
                >
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </Section>
      ) : (
        <Section title="My Styles">
          <p
            className="text-xs px-1 py-2"
            style={{ color: "var(--pe-text-subtle)" }}
          >
            Saved styles will appear here. Save a layer's style by tapping a
            preset card and tweaking — the save-style flow ships in a future
            update.
          </p>
        </Section>
      )}
    </div>
  );
}
