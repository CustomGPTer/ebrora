// src/components/photo-editor/text-tools/BackgroundPanel.tsx
//
// Background tab body — drives `TextLayer.background` (layer-level
// rectangle painted behind the text). New for Batch D2b.
//
// Distinct from `GlyphRun.highlight` (per-glyph fill behind individual
// characters / runs). Background is one rect for the whole layer, sized
// as the flat layout bbox + widthDelta / heightDelta on each side, with
// optional rounded corners.
//
// Round Corner is layer-level (one rounded rect around the whole text),
// not glyph-accurate — this matches the kickoff Q3 decision. Konva
// itself doesn't ship glyph-accurate text background-radius; the
// per-glyph version would need a custom sceneFunc and isn't worth the
// engine work for a feature most users won't notice.
//
// Inline-only — no drawer mount path. Patches via `tool.patchLayer`
// because background is a layer-level field, not a per-run one.

"use client";

import { useState } from "react";
import { useTextTool } from "./use-text-tool";
import {
  Row,
  Section,
  SectionDivider,
  Slider,
} from "./controls";
import { ColorSwatches } from "./ColorSwatches";
import { HsvPicker } from "./HsvPicker";
import { defaultTextBackground } from "@/lib/photo-editor/rich-text/factory";
import type { TextBackground } from "@/lib/photo-editor/types";

interface BackgroundPanelProps {
  /** API-symmetry only — the panel always renders inline. */
  inline?: boolean;
}

export function BackgroundPanel(_props: BackgroundPanelProps = {}) {
  const tool = useTextTool();
  const [showHsv, setShowHsv] = useState(false);

  const layer = tool.layer;
  const background: TextBackground = layer?.background ?? defaultTextBackground();

  function patchBackground(next: Partial<TextBackground>) {
    tool.patchLayer({ background: { ...background, ...next } });
  }

  if (!layer) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-6 text-xs"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          Select a text layer to apply a background.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Section title="Background">
        <Row label="Opacity">
          <Slider
            ariaLabel="Background opacity"
            value={background.opacity}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => patchBackground({ opacity: v })}
            format={(n) => `${Math.round(n * 100)}%`}
          />
        </Row>
      </Section>

      <SectionDivider />

      <Section title="Colour">
        <ColorSwatches
          value={background.color}
          onPick={(c) => patchBackground({ color: c })}
        />
        <Row>
          <button
            type="button"
            onClick={() => setShowHsv((s) => !s)}
            className="text-xs underline self-start"
            style={{ color: "var(--pe-text-muted)" }}
          >
            {showHsv ? "Hide custom picker" : "Custom colour…"}
          </button>
        </Row>
        {showHsv ? (
          <HsvPicker
            value={background.color}
            onChange={(c) => patchBackground({ color: c })}
          />
        ) : null}
      </Section>

      <SectionDivider />

      <Section title="Padding">
        <Row label="Horizontal">
          <Slider
            ariaLabel="Background horizontal padding"
            value={background.widthDelta}
            min={0}
            max={80}
            step={1}
            onChange={(v) => patchBackground({ widthDelta: Math.round(v) })}
            format={(n) => `${Math.round(n)} px`}
          />
        </Row>
        <Row label="Vertical">
          <Slider
            ariaLabel="Background vertical padding"
            value={background.heightDelta}
            min={0}
            max={80}
            step={1}
            onChange={(v) => patchBackground({ heightDelta: Math.round(v) })}
            format={(n) => `${Math.round(n)} px`}
          />
        </Row>
      </Section>

      <SectionDivider />

      <Section title="Corner">
        <Row label="Round corner">
          <Slider
            ariaLabel="Background corner radius"
            value={background.roundCorner}
            min={0}
            max={64}
            step={1}
            onChange={(v) => patchBackground({ roundCorner: Math.round(v) })}
            format={(n) => `${Math.round(n)} px`}
          />
        </Row>
      </Section>
    </div>
  );
}
