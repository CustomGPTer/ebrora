// src/components/photo-editor/text-tools/HighlightPanel.tsx
//
// Highlight (background-fill behind glyphs) panel. Same shape as the
// Stroke panel but with no width control — Highlight is just colour +
// opacity. Padding / radius intentionally absent — the engine doesn't
// support them in v1 (gotcha #20 / §5.4).

"use client";

import { useState } from "react";
import { Highlighter } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
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
import { ColorSwatches } from "./ColorSwatches";
import { HsvPicker } from "./HsvPicker";
import type { Highlight } from "@/lib/photo-editor/types";

interface HighlightPanelProps {
  /** Drawer open state — ignored when `inline` is set. */
  open?: boolean;
  /** Drawer close handler — ignored when `inline` is set. */
  onClose?: () => void;
  /** When true, render body without PanelDrawer chrome (used by the
   *  bottom tab strip in BottomDock). Defaults to false. */
  inline?: boolean;
}

const DEFAULT_HIGHLIGHT: Highlight = {
  enabled: false,
  color: "#FFEB3B",
  opacity: 0.5,
};

export function HighlightPanel({
  open = false,
  onClose,
  inline = false,
}: HighlightPanelProps) {
  const tool = useTextTool();
  const [showHsv, setShowHsv] = useState(false);

  const current = tool.runValue("highlight");
  const mixed = current === null;
  const highlight: Highlight = current ?? DEFAULT_HIGHLIGHT;

  function patchHighlight(next: Partial<Highlight>) {
    tool.patchRuns({ highlight: { ...highlight, ...next } });
  }

  const body = (
    <div className="flex-1 overflow-y-auto">
      {!tool.layer ? (
        <EmptyState />
      ) : (
        <>
          <Section
            title="Highlight"
            right={mixed ? <MixedHint /> : null}
          >
            <Toggle
              checked={highlight.enabled}
              onChange={(next) => patchHighlight({ enabled: next })}
              label="Enable highlight"
            />
          </Section>

          <SectionDivider />

          <DimmedWhen disabled={!highlight.enabled}>
            <Section title="Colour">
              <ColorSwatches
                value={highlight.color}
                onPick={(c) => patchHighlight({ color: c })}
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
                  value={highlight.color}
                  onChange={(c) => patchHighlight({ color: c })}
                />
              ) : null}
            </Section>

            <SectionDivider />

            <Section title="Opacity">
              <Row label="Opacity">
                <Slider
                  ariaLabel="Highlight opacity"
                  value={highlight.opacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => patchHighlight({ opacity: v })}
                  format={(n) => `${Math.round(n * 100)}%`}
                />
              </Row>
            </Section>
          </DimmedWhen>
        </>
      )}
    </div>
  );

  if (inline) {
    return body;
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose ?? (() => {})}
      icon={<Highlighter className="w-5 h-5" strokeWidth={1.75} />}
      title="Highlight"
      footer={
        tool.hasRange ? (
          <span>Applied to selected text.</span>
        ) : (
          <span>Applied to the whole layer.</span>
        )
      }
    >
      {body}
    </PanelDrawer>
  );
}

function EmptyState() {
  return (
    <div
      className="px-4 py-6 text-xs"
      style={{ color: "var(--pe-text-subtle)" }}
    >
      Select a text layer to apply a highlight.
    </div>
  );
}
