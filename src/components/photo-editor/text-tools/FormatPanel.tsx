// src/components/photo-editor/text-tools/FormatPanel.tsx
//
// Format panel — covers alignment, the B/I/U/S toggles, and letter /
// line spacing. Replicates what the Add Text app's "Format" tray does.
//
// What lives here vs elsewhere:
//   • Alignment (`styling.align`) — layer-level. Patches via patchStyling.
//   • Bold / Italic — per-run. Bold = fontWeight 700; Italic = fontStyle
//     "italic". MUST `pickVariant` + `loadGoogleFont` for the resolved
//     family BEFORE dispatching, so the canvas doesn't paint the wrong
//     face for one frame (gotcha #26).
//   • Underline / Strike — per-run. Combine into the four-state
//     `decoration` enum.
//   • Letter spacing / Line height — layer-level styling.
//
// What does NOT live here:
//   • Font size — intentional. The Add Text app's "size" lives in the
//     Adjust tool; we model it as transform.scale in the Position panel.
//   • Font family — the Font panel.

"use client";

import { useEffect, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignLeft as FormatIcon,
} from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useTextTool } from "./use-text-tool";
import {
  DimmedWhen,
  Row,
  Section,
  SectionDivider,
  Segmented,
  Slider,
  ToggleButton,
} from "./controls";
import {
  loadCatalogue,
  pickVariant,
  type FontCatalogue,
  type GoogleFontFamily,
} from "@/lib/photo-editor/fonts/catalogue";
import { loadGoogleFont } from "@/lib/photo-editor/fonts/load-google-font";

interface FormatPanelProps {
  open: boolean;
  onClose: () => void;
}

const ALIGN_OPTIONS = [
  { value: "left" as const, label: <AlignLeft className="w-4 h-4" />, ariaLabel: "Align left" },
  { value: "center" as const, label: <AlignCenter className="w-4 h-4" />, ariaLabel: "Align centre" },
  { value: "right" as const, label: <AlignRight className="w-4 h-4" />, ariaLabel: "Align right" },
  { value: "justify" as const, label: <AlignJustify className="w-4 h-4" />, ariaLabel: "Justify" },
] as const;

export function FormatPanel({ open, onClose }: FormatPanelProps) {
  const tool = useTextTool();
  // Lazy-load the Google catalogue when the panel first opens so the
  // Bold / Italic toggles can resolve a variant. Stays cached for the
  // session via loadCatalogue's own memoisation.
  const [catalogue, setCatalogue] = useState<FontCatalogue | null>(null);
  useEffect(() => {
    if (!open || catalogue !== null) return;
    let cancelled = false;
    loadCatalogue()
      .then((c) => {
        if (!cancelled) setCatalogue(c);
      })
      .catch(() => {
        // Catalogue fetch failures are non-fatal — toggles still work,
        // they just skip the variant pre-load. Logged in the loader.
      });
    return () => {
      cancelled = true;
    };
  }, [open, catalogue]);

  const layer = tool.layer;
  const align = layer?.styling.align ?? "left";
  const letterSpacing = layer?.styling.letterSpacing ?? 0;
  const lineHeight = layer?.styling.lineHeight ?? 1.2;

  const fontWeight = tool.runValue("fontWeight");
  const fontStyle = tool.runValue("fontStyle");
  const decoration = tool.runValue("decoration");
  const isBold = fontWeight === 700;
  const isItalic = fontStyle === "italic";
  const hasUnderline =
    decoration === "underline" || decoration === "underline-strikethrough";
  const hasStrike =
    decoration === "strikethrough" || decoration === "underline-strikethrough";

  // Bold / italic toggles — resolve the family in the Google catalogue
  // and pre-load the matching variant before patching. If the family
  // isn't a Google font (custom upload, or catalogue still loading) we
  // skip the pre-load — the patch still applies, just without the
  // pre-warm.
  async function ensureVariantLoaded(weight: number, style: "normal" | "italic") {
    if (!catalogue || !layer) return;
    const familyName = tool.runValue("fontFamily");
    if (!familyName) return;
    const family: GoogleFontFamily | undefined = catalogue.items.find(
      (f) => f.family === familyName,
    );
    if (!family) return;
    const variant = pickVariant(family, weight, style) ?? "regular";
    try {
      await loadGoogleFont(family, variant);
    } catch {
      // Failed loads fall back to whatever's already registered.
    }
  }

  async function toggleBold() {
    const next = isBold ? 400 : 700;
    const style = (fontStyle === "italic" ? "italic" : "normal") as
      | "normal"
      | "italic";
    await ensureVariantLoaded(next, style);
    tool.patchRuns({ fontWeight: next });
  }

  async function toggleItalic() {
    const nextStyle: "normal" | "italic" = isItalic ? "normal" : "italic";
    const weight = fontWeight === 700 ? 700 : 400;
    await ensureVariantLoaded(weight, nextStyle);
    tool.patchRuns({ fontStyle: nextStyle });
  }

  function toggleUnderline() {
    const nextU = !hasUnderline;
    tool.patchRuns({ decoration: composeDecoration(nextU, hasStrike) });
  }

  function toggleStrike() {
    const nextS = !hasStrike;
    tool.patchRuns({ decoration: composeDecoration(hasUnderline, nextS) });
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      icon={<FormatIcon className="w-5 h-5" strokeWidth={1.75} />}
      title="Format"
      footer={
        tool.hasRange ? (
          <span>Applied to selected text.</span>
        ) : (
          <span>Applied to the whole layer.</span>
        )
      }
    >
      <div className="flex-1 overflow-y-auto">
        {!layer ? (
          <EmptyState />
        ) : (
          <>
            <Section title="Alignment">
              <Segmented
                ariaLabel="Text alignment"
                value={align}
                options={ALIGN_OPTIONS}
                onChange={(next) => tool.patchStyling({ align: next })}
              />
            </Section>

            <SectionDivider />

            <Section title="Style">
              <div className="flex items-center gap-2">
                <ToggleButton
                  active={isBold}
                  onClick={() => void toggleBold()}
                  label="Bold"
                >
                  <span style={{ fontWeight: 700 }}>B</span>
                </ToggleButton>
                <ToggleButton
                  active={isItalic}
                  onClick={() => void toggleItalic()}
                  label="Italic"
                >
                  <span style={{ fontStyle: "italic", fontWeight: 600 }}>I</span>
                </ToggleButton>
                <ToggleButton
                  active={hasUnderline}
                  onClick={toggleUnderline}
                  label="Underline"
                >
                  <span style={{ textDecoration: "underline", fontWeight: 600 }}>
                    U
                  </span>
                </ToggleButton>
                <ToggleButton
                  active={hasStrike}
                  onClick={toggleStrike}
                  label="Strikethrough"
                >
                  <span
                    style={{ textDecoration: "line-through", fontWeight: 600 }}
                  >
                    S
                  </span>
                </ToggleButton>
              </div>
            </Section>

            <SectionDivider />

            <Section title="Spacing">
              <DimmedWhen disabled={false}>
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
              </DimmedWhen>
            </Section>
          </>
        )}
      </div>
    </PanelDrawer>
  );
}

function composeDecoration(
  underline: boolean,
  strike: boolean,
): "none" | "underline" | "strikethrough" | "underline-strikethrough" {
  if (underline && strike) return "underline-strikethrough";
  if (underline) return "underline";
  if (strike) return "strikethrough";
  return "none";
}

function EmptyState() {
  return (
    <div
      className="px-4 py-6 text-xs"
      style={{ color: "var(--pe-text-subtle)" }}
    >
      Select a text layer to access formatting controls.
    </div>
  );
}
