// src/components/photo-editor/text-tools/HighlightPanel.tsx
//
// Highlight (background-fill behind glyphs) panel. Same shape as the
// Stroke panel but with no width control — Highlight is just colour +
// opacity. Padding / radius intentionally absent — the engine doesn't
// support them in v1 (gotcha #20 / §5.4).

"use client";

import { useEffect, useRef } from "react";
import { Highlighter } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useTextTool } from "./use-text-tool";
import {
  MixedHint,
  Row,
  Section,
  SectionDivider,
  Slider,
} from "./controls";
import { ColorPicker } from "./ColorPicker";
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

// Default opacity 1 (was 0): the slider used to start invisible, so
// users had to drag it before the highlight showed up. Visible-by-default
// matches user expectation for a feature whose whole point is being
// visible — they can dial it down if needed.
const DEFAULT_HIGHLIGHT: Highlight = {
  color: "#FFEB3B",
  opacity: 1,
};

export function HighlightPanel({
  open = false,
  onClose,
  inline = false,
}: HighlightPanelProps) {
  const tool = useTextTool();
  // showHsv state removed (May 2026) — ColorPicker handles its own modal.

  const current = tool.runValue("highlight");
  const mixed = current === null;
  const highlight: Highlight = current ?? DEFAULT_HIGHLIGHT;

  function patchHighlight(next: Partial<Highlight>) {
    tool.patchRuns({ highlight: { ...highlight, ...next } });
  }

  // Auto-bump opacity to 100% once on mount when the current opacity is
  // 0. Tapping into the Highlight tab is treated as "turn highlight on",
  // so the user sees colour immediately rather than having to drag the
  // slider before anything renders. Guarded by a ref so re-renders don't
  // re-fire (the patch flips opacity to 1 on first run, the guard then
  // blocks the effect from running again even if the user manually drags
  // back to 0 inside this panel session).
  const autoBumpedRef = useRef(false);
  useEffect(() => {
    if (autoBumpedRef.current) return;
    if (!tool.layer) return;
    // Only bump for non-mixed runs with explicit 0 opacity. Mixed runs
    // (current === null) are left alone — the user picked a span where
    // some glyphs already have non-zero highlight, and overwriting that
    // would surprise them.
    if (current !== null && current.opacity === 0) {
      autoBumpedRef.current = true;
      patchHighlight({ opacity: 1 });
    } else {
      // Mark as "handled" anyway so we don't keep checking on every
      // re-render. If the user dials back to 0 themselves, that's their
      // call — we won't fight them.
      autoBumpedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.layer]);

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

          <SectionDivider />

          <Section title="Colour">
            <ColorPicker
              value={highlight.color}
              onChange={(c) => patchHighlight({ color: c })}
              ariaLabel="Highlight colour"
            />
          </Section>
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
