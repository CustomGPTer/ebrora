// src/components/photo-editor/text-tools/GradientPanel.tsx
//
// Gradient tab body — drives `GlyphRun.gradient` (two-stop linear
// gradient with angle). New for Batch D2b. The engine path
// (`engine.ts::resolveFillStyle`) was already in place pre-D2b; this
// panel just exposes it through the UI.
//
// Mode is "per-glyph" — each character gets the full gradient range
// across its own bounding box. This is what the engine ships today;
// "across whole text run" mode is a future extension if desired.
//
// Inline-only — no drawer mount path. Default 2 stops; users can edit
// either stop's colour and the angle.

"use client";

import { useState } from "react";
import { useTextTool } from "./use-text-tool";
import {
  DimmedWhen,
  MixedHint,
  Row,
  Section,
  SectionDivider,
  Slider,
  Toggle,
} from "./controls";
import { ColorPicker } from "./ColorPicker";
import type { GradientFill, GradientStop } from "@/lib/photo-editor/types";

interface GradientPanelProps {
  /** API-symmetry only — the panel always renders inline. */
  inline?: boolean;
}

const DEFAULT_GRADIENT: GradientFill = {
  enabled: false,
  angle: 0,
  stops: [
    { position: 0, color: "#FFFFFF" },
    { position: 1, color: "#1B5B50" },
  ],
};

export function GradientPanel(_props: GradientPanelProps = {}) {
  const tool = useTextTool();
  const [activeStop, setActiveStop] = useState<0 | 1>(0);
  // showHsv state removed (May 2026) — ColorPicker handles its own modal.

  const current = tool.runValue("gradient");
  const mixed = current === null;
  const gradient: GradientFill = current ?? DEFAULT_GRADIENT;

  // Defensive — engine assumes ≥ 2 stops, but rebuild if a corrupted
  // payload ever arrives. Stops 0 and 1 are the editable two-stop pair.
  const stops: [GradientStop, GradientStop] = [
    gradient.stops[0] ?? DEFAULT_GRADIENT.stops[0],
    gradient.stops[1] ?? DEFAULT_GRADIENT.stops[1],
  ];

  function patchGradient(next: Partial<GradientFill>) {
    tool.patchRuns({ gradient: { ...gradient, ...next } });
  }

  function patchStop(index: 0 | 1, color: string) {
    const newStops = [...stops];
    newStops[index] = { ...stops[index], color };
    patchGradient({ stops: newStops });
  }

  if (!tool.layer) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-6 text-xs"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          Select a text layer to apply a gradient.
        </div>
      </div>
    );
  }

  const activeColor = stops[activeStop].color;

  return (
    <div className="flex-1 overflow-y-auto">
      <Section title="Gradient" right={mixed ? <MixedHint /> : null}>
        <Toggle
          checked={gradient.enabled}
          onChange={(v) => patchGradient({ enabled: v })}
          label="Enable gradient"
        />
      </Section>

      <SectionDivider />

      <DimmedWhen disabled={!gradient.enabled}>
        <Section title="Stops">
          <div className="flex gap-2 px-1">
            {[0, 1].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveStop(i as 0 | 1);
                }}
                className="flex-1 rounded-md py-2 text-xs font-medium transition"
                style={{
                  background:
                    activeStop === i
                      ? "var(--pe-surface-2)"
                      : "transparent",
                  color:
                    activeStop === i
                      ? "var(--pe-text)"
                      : "var(--pe-text-muted)",
                  border: `1px solid ${
                    activeStop === i
                      ? "var(--pe-border)"
                      : "transparent"
                  }`,
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span
                    aria-hidden
                    className="w-4 h-4 rounded-full border"
                    style={{
                      backgroundColor: stops[i].color,
                      borderColor: "var(--pe-border)",
                    }}
                  />
                  Stop {i + 1}
                </div>
              </button>
            ))}
          </div>
        </Section>

        <SectionDivider />

        <Section title="Colour">
          <ColorPicker
            value={activeColor}
            onChange={(c) => patchStop(activeStop, c)}
            ariaLabel="Gradient stop colour"
          />
        </Section>

        <SectionDivider />

        <Section title="Angle">
          <Row label="Angle">
            <Slider
              ariaLabel="Gradient angle"
              value={gradient.angle}
              min={0}
              max={360}
              step={1}
              onChange={(v) => patchGradient({ angle: Math.round(v) })}
              format={(n) => `${Math.round(n)}°`}
            />
          </Row>
        </Section>
      </DimmedWhen>
    </div>
  );
}
