// src/components/photo-editor/text-tools/ColorPanel.tsx
//
// Color panel — solid-fill colour for the active run range. Patches
// `{ fill: "#RRGGBB" }` via patchRuns. The fill field on GlyphRun is
// `fill` (a ColorString), NOT `color` — gotcha sitting in §5.4.
//
// Three sub-views toggled by a segmented control:
//   • Swatches — 24 curated colours.
//   • Picker   — custom HSV picker.
//   • Eyedropper — only mounted when `EyeDropper` is in the global
//     scope (Chromium + recent Edge). Other browsers see "Not supported
//     in this browser." — we don't pretend.

"use client";

import { useState } from "react";
import { Palette, Pipette } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useTextTool } from "./use-text-tool";
import {
  Row,
  Section,
  SectionDivider,
  Segmented,
  ActionButton,
  MixedHint,
} from "./controls";
import { ColorSwatches } from "./ColorSwatches";
import { HsvPicker } from "./HsvPicker";

interface ColorPanelProps {
  open: boolean;
  onClose: () => void;
}

type ColorTab = "swatches" | "picker" | "eyedropper";

const TABS = [
  { value: "swatches" as const, label: "Swatches", ariaLabel: "Swatches" },
  { value: "picker" as const, label: "Picker", ariaLabel: "Picker" },
  { value: "eyedropper" as const, label: "Pick", ariaLabel: "Eyedropper" },
] as const;

export function ColorPanel({ open, onClose }: ColorPanelProps) {
  const tool = useTextTool();
  const [tab, setTab] = useState<ColorTab>("swatches");

  const fill = tool.runValue("fill");
  const fillNorm = typeof fill === "string" ? fill : null;

  function applyColor(hex: string) {
    tool.patchRuns({ fill: hex });
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      icon={<Palette className="w-5 h-5" strokeWidth={1.75} />}
      title="Color"
      footer={
        tool.hasRange ? (
          <span>Applied to selected text.</span>
        ) : (
          <span>Applied to the whole layer.</span>
        )
      }
    >
      <div className="flex-1 overflow-y-auto">
        {!tool.layer ? (
          <EmptyState />
        ) : (
          <>
            <Section title="Mode">
              <Segmented<ColorTab>
                ariaLabel="Color picker mode"
                value={tab}
                options={TABS}
                onChange={setTab}
              />
            </Section>
            <SectionDivider />

            {tab === "swatches" ? (
              <Section
                title="Swatches"
                right={fillNorm === null ? <MixedHint /> : <CurrentSwatch hex={fillNorm} />}
              >
                <ColorSwatches value={fillNorm} onPick={applyColor} />
              </Section>
            ) : null}

            {tab === "picker" ? (
              <Section
                title="Picker"
                right={fillNorm === null ? <MixedHint /> : null}
              >
                <HsvPicker value={fillNorm ?? "#000000"} onChange={applyColor} />
              </Section>
            ) : null}

            {tab === "eyedropper" ? (
              <Section title="Eyedropper">
                <EyedropperRow onPick={applyColor} />
              </Section>
            ) : null}
          </>
        )}
      </div>
    </PanelDrawer>
  );
}

function CurrentSwatch({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 12,
          height: 12,
          borderRadius: 9999,
          background: hex,
          border: "1px solid var(--pe-border)",
        }}
      />
      <span className="text-[11px] tabular-nums uppercase">{hex}</span>
    </span>
  );
}

function EmptyState() {
  return (
    <div
      className="px-4 py-6 text-xs"
      style={{ color: "var(--pe-text-subtle)" }}
    >
      Select a text layer to apply colour.
    </div>
  );
}

// ─── Eyedropper sub-view ────────────────────────────────────────

function EyedropperRow({ onPick }: { onPick: (hex: string) => void }) {
  // Capability check at render time — `EyeDropper` is a Chromium-only
  // global; SSR-safe via `typeof`.
  const supported =
    typeof window !== "undefined" && "EyeDropper" in window;

  if (!supported) {
    return (
      <Row label="Pick a colour from the screen">
        <p
          className="text-xs"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          Not supported in this browser. Use Swatches or Picker instead.
        </p>
      </Row>
    );
  }

  async function pick() {
    try {
      // EyeDropper isn't in the lib.dom.d.ts shipped with TS yet —
      // cast via `any` rather than declaring a global to keep the
      // diff minimal.
      const ED = (window as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } })
        .EyeDropper;
      if (!ED) return;
      const ed = new ED();
      const result = await ed.open();
      onPick(result.sRGBHex.toUpperCase());
    } catch {
      // User cancelled the picker — no-op.
    }
  }

  return (
    <Row label="Pick a colour from the screen">
      <ActionButton onClick={pick} ariaLabel="Open eyedropper" fullWidth>
        <Pipette className="w-4 h-4" />
        <span>Open eyedropper</span>
      </ActionButton>
    </Row>
  );
}
