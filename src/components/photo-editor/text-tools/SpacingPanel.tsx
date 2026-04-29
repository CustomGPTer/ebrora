// src/components/photo-editor/text-tools/SpacingPanel.tsx
//
// Spacing tab body — letter spacing + line height sliders for the
// selected text layer. New for Batch D1.
//
// These controls also live inside `FormatPanel` for legacy drawer
// callers (where Format is one tab handling alignment + style +
// spacing). When `FormatPanel` is rendered inline (i.e. as the
// Format tab body in the new selected-text strip) it omits its
// Spacing section because this panel owns it instead — no
// duplicate UI.
//
// Inline-only: there's no drawer mount path because Spacing isn't
// a legacy panel. The `inline` prop on the props interface exists
// only for API symmetry with the other panels in `text-tools/*`.
//
// Reset semantics (Batch C kickoff Q2): when this tab is active in
// the inline strip, `PropertyPanelHost`'s reset (↻) should restore
// `letterSpacing = 0` and `lineHeight = 1.2`. The reset hook is
// wired by `BottomDock`'s `TextEditPanel`, not here.

"use client";

import { useTextTool } from "./use-text-tool";
import { Row, Section, Slider } from "./controls";

interface SpacingPanelProps {
  /** API-symmetry only — the panel always renders inline. */
  inline?: boolean;
}

export function SpacingPanel(_props: SpacingPanelProps = {}) {
  const tool = useTextTool();
  const layer = tool.layer;
  const letterSpacing = layer?.styling.letterSpacing ?? 0;
  const lineHeight = layer?.styling.lineHeight ?? 1.2;

  if (!layer) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-6 text-xs"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          Select a text layer to access spacing controls.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Section title="Spacing">
        <Row label="Letter spacing">
          <Slider
            ariaLabel="Letter spacing"
            value={letterSpacing}
            min={-5}
            max={30}
            step={0.5}
            onChange={(v) => tool.patchStyling({ letterSpacing: v })}
            format={(n) => `${n.toFixed(1)} px`}
          />
        </Row>
        <Row label="Line height">
          <Slider
            ariaLabel="Line height"
            value={lineHeight}
            min={0.8}
            max={3}
            step={0.05}
            onChange={(v) => tool.patchStyling({ lineHeight: v })}
            format={(n) => `${n.toFixed(2)}×`}
          />
        </Row>
      </Section>
    </div>
  );
}
