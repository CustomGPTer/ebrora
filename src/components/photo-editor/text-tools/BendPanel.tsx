// src/components/photo-editor/text-tools/BendPanel.tsx
//
// Bend tab body — single slider that arcs the selected text along a
// circular path. New for Batch D2a.
//
// The slider value is `layer.styling.bend.amount`, an integer-ish in
// [-100, 100] where:
//   • 0   = flat
//   • +100 = full ∩ rainbow (semicircle, apex up)
//   • -100 = full ∪ smile   (semicircle, apex down)
//
// The engine builds a BendContext from this amount + layer.width and
// applies a per-glyph rotated transform during render (see
// `lib/photo-editor/rich-text/bend.ts` and `engine.ts`'s bent-mode
// passes). Wrap-line layout is unchanged — bend is a paint-time warp,
// not a layout-time reflow, so multi-line text simply shares the same
// arc geometry across every line.
//
// Inline-only. Like SpacingPanel, this panel doesn't have a drawer
// mount path; the `inline` prop exists only for API symmetry with the
// rest of `text-tools/*`.
//
// Reset semantics: when this tab is active in the inline strip,
// `PropertyPanelHost`'s reset (↻) restores `bend.amount = 0`. Wired by
// `BottomDock`'s `TextEditPanel` (case "bend" → `tool.patchStyling`).

"use client";

import { useTextTool } from "./use-text-tool";
import { Row, Section, Slider } from "./controls";

interface BendPanelProps {
  /** API-symmetry only — the panel always renders inline. */
  inline?: boolean;
}

export function BendPanel(_props: BendPanelProps = {}) {
  const tool = useTextTool();
  const layer = tool.layer;
  const amount = layer?.styling.bend?.amount ?? 0;

  if (!layer) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-6 text-xs"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          Select a text layer to access bend.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Section title="Bend">
        <Row label="Amount">
          <Slider
            ariaLabel="Bend amount"
            value={amount}
            min={-100}
            max={100}
            step={1}
            onChange={(v) =>
              tool.patchStyling({ bend: { amount: Math.round(v) } })
            }
            format={(n) => `${Math.round(n)}`}
          />
        </Row>
      </Section>
    </div>
  );
}
