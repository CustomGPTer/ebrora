// src/components/photo-editor/text-tools/ShadowPanel.tsx
//
// Shadow panel. Per §6.6: enable toggle, colour, opacity 0–1, blur
// 0–40, offsetX -40..+40, offsetY -40..+40. Same Stroke / Highlight
// shape — full Shadow object reconstructed when patching individual
// fields (gotcha #20).

"use client";

import { useState } from "react";
import { Cloud } from "lucide-react";
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
import type { Shadow } from "@/lib/photo-editor/types";

interface ShadowPanelProps {
  /** Drawer open state — ignored when `inline` is set. */
  open?: boolean;
  /** Drawer close handler — ignored when `inline` is set. */
  onClose?: () => void;
  /** When true, render body without PanelDrawer chrome (used by the
   *  bottom tab strip in BottomDock). Defaults to false. */
  inline?: boolean;
}

const DEFAULT_SHADOW: Shadow = {
  enabled: false,
  color: "#000000",
  opacity: 0.5,
  blur: 8,
  offsetX: 4,
  offsetY: 4,
};

export function ShadowPanel({
  open = false,
  onClose,
  inline = false,
}: ShadowPanelProps) {
  const tool = useTextTool();
  const [showHsv, setShowHsv] = useState(false);

  const current = tool.runValue("shadow");
  const mixed = current === null;
  const shadow: Shadow = current ?? DEFAULT_SHADOW;

  function patchShadow(next: Partial<Shadow>) {
    tool.patchRuns({ shadow: { ...shadow, ...next } });
  }

  const body = (
    <div className="flex-1 overflow-y-auto">
      {!tool.layer ? (
        <EmptyState />
      ) : (
        <>
          <Section
            title="Shadow"
            right={mixed ? <MixedHint /> : null}
          >
            <Toggle
              checked={shadow.enabled}
              onChange={(next) => patchShadow({ enabled: next })}
              label="Enable shadow"
            />
          </Section>

          <SectionDivider />

          <DimmedWhen disabled={!shadow.enabled}>
            <Section title="Colour">
              <ColorSwatches
                value={shadow.color}
                onPick={(c) => patchShadow({ color: c })}
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
                  value={shadow.color}
                  onChange={(c) => patchShadow({ color: c })}
                />
              ) : null}
            </Section>

            <SectionDivider />

            <Section title="Strength">
              <Row label="Opacity">
                <Slider
                  ariaLabel="Shadow opacity"
                  value={shadow.opacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => patchShadow({ opacity: v })}
                  format={(n) => `${Math.round(n * 100)}%`}
                />
              </Row>
              <Row label="Blur">
                <Slider
                  ariaLabel="Shadow blur"
                  value={shadow.blur}
                  min={0}
                  max={40}
                  step={0.5}
                  onChange={(v) => patchShadow({ blur: v })}
                  format={(n) => `${n.toFixed(1)} px`}
                />
              </Row>
            </Section>

            <SectionDivider />

            <Section title="Offset">
              <Row label="Horizontal">
                <Slider
                  ariaLabel="Shadow horizontal offset"
                  value={shadow.offsetX}
                  min={-40}
                  max={40}
                  step={0.5}
                  onChange={(v) => patchShadow({ offsetX: v })}
                  format={(n) => `${n.toFixed(1)} px`}
                />
              </Row>
              <Row label="Vertical">
                <Slider
                  ariaLabel="Shadow vertical offset"
                  value={shadow.offsetY}
                  min={-40}
                  max={40}
                  step={0.5}
                  onChange={(v) => patchShadow({ offsetY: v })}
                  format={(n) => `${n.toFixed(1)} px`}
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
      icon={<Cloud className="w-5 h-5" strokeWidth={1.75} />}
      title="Shadow"
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
      Select a text layer to apply a shadow.
    </div>
  );
}
