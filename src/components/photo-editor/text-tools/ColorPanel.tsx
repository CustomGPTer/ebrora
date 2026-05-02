// src/components/photo-editor/text-tools/ColorPanel.tsx
//
// Color panel — solid-fill colour for the active layer.
//
// Two routing branches, decided per-render from the sole-selected
// layer's `kind`:
//
//   • Text layer  → patches `{ fill: "#RRGGBB" }` via patchRuns
//                   (selected range or whole layer).
//   • Shape layer → patches `{ fill: "#RRGGBB" }` on the layer itself
//                   via UPDATE_LAYER. ShapeNode reads `layer.fill`
//                   directly (and uses it as the outline colour for
//                   the "outlined" variant), so a single dispatch
//                   covers both variants.
//   • Anything else (image / sticker / nothing selected) → empty
//                   state with a kind-appropriate hint.
//
// Three sub-views toggled by a segmented control:
//   • Swatches — 24 curated colours.
//   • Picker   — custom HSV picker.
//   • Eyedropper — two implementations switched by capability:
//       – `window.EyeDropper` present (Chromium + recent Edge desktop)
//         → system eyedropper; samples anywhere on the screen.
//       – Anywhere else (every mobile browser, Safari + Firefox
//         desktop) → in-app canvas picker. Tapping the button engages
//         CanvasPickerContext; the next tap on the canvas samples a
//         pixel under the pointer and applies it. Limited to colours
//         already on the canvas, but works in every browser.
//
// Run-shape gotcha (text branch): the fill field on GlyphRun is `fill`
// (a ColorString), NOT `color` — this caught me once and is documented
// here in case it catches anyone else.

"use client";

import { useMemo, useState } from "react";
import { Palette, Pipette } from "lucide-react";
import { PanelDrawer } from "../panels/PanelDrawer";
import { useEditor } from "../context/EditorContext";
import { useCanvasPicker } from "../context/CanvasPickerContext";
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
import type { AnyLayer, ShapeLayer } from "@/lib/photo-editor/types";

interface ColorPanelProps {
  /** Drawer open state — ignored when `inline` is set. */
  open?: boolean;
  /** Drawer close handler — ignored when `inline` is set. */
  onClose?: () => void;
  /** When true, render body without PanelDrawer chrome (used by the
   *  bottom tab strip in BottomDock). Defaults to false. */
  inline?: boolean;
}

type ColorTab = "swatches" | "picker" | "eyedropper";

const TABS = [
  { value: "swatches" as const, label: "Swatches", ariaLabel: "Swatches" },
  { value: "picker" as const, label: "Picker", ariaLabel: "Picker" },
  { value: "eyedropper" as const, label: "Pick", ariaLabel: "Eyedropper" },
] as const;

export function ColorPanel({
  open = false,
  onClose,
  inline = false,
}: ColorPanelProps) {
  const { state, dispatch } = useEditor();
  const tool = useTextTool();
  const [tab, setTab] = useState<ColorTab>("swatches");

  // Resolve the sole-selected layer (any kind) for the shape branch.
  // The text branch keeps using useTextTool's stricter resolver because
  // it needs `runValue` / `patchRuns` for inline-range support.
  const selectedLayer = useMemo<AnyLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    return (
      state.project.layers.find((l) => l.id === state.selection[0]) ?? null
    );
  }, [state.selection, state.project.layers]);

  const isShape = selectedLayer?.kind === "shape";
  const isText = tool.layer !== null;

  // Read current colour:
  //   • Shape: layer.fill (always a string — never "mixed").
  //   • Text:  runValue("fill") returns null when the range mixes
  //            colours, otherwise the string colour.
  const fillNorm: string | null = isShape
    ? (selectedLayer as ShapeLayer).fill
    : isText
    ? (tool.runValue("fill") as string | null)
    : null;

  function applyColor(hex: string) {
    if (isShape && selectedLayer) {
      dispatch({
        type: "UPDATE_LAYER",
        id: selectedLayer.id,
        patch: { fill: hex } as Partial<AnyLayer>,
      });
      return;
    }
    if (isText) {
      tool.patchRuns({ fill: hex });
    }
  }

  const hasEditableLayer = isShape || isText;

  // Footer text reflects what the colour will apply to. For the text
  // range case we show "Applied to selected text"; in every other
  // editable case it's the whole layer.
  const footerNode = isText && tool.hasRange ? (
    <span>Applied to selected text.</span>
  ) : (
    <span>Applied to the whole layer.</span>
  );

  const body = (
    <div className="flex-1 overflow-y-auto">
      {!hasEditableLayer ? (
        <EmptyState kind={selectedLayer?.kind} />
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
  );

  if (inline) {
    return body;
  }

  return (
    <PanelDrawer
      open={open}
      onClose={onClose ?? (() => {})}
      icon={<Palette className="w-5 h-5" strokeWidth={1.75} />}
      title="Color"
      footer={footerNode}
    >
      {body}
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

function EmptyState({ kind }: { kind?: AnyLayer["kind"] }) {
  let msg = "Select a text or shape layer to apply colour.";
  if (kind === "image") {
    msg = "Use Adjust or Filters to recolour an image layer.";
  } else if (kind === "sticker") {
    msg = "Stickers don't support colour changes.";
  }
  return (
    <div
      className="px-4 py-6 text-xs"
      style={{ color: "var(--pe-text-subtle)" }}
    >
      {msg}
    </div>
  );
}

// ─── Eyedropper sub-view ────────────────────────────────────────

function EyedropperRow({ onPick }: { onPick: (hex: string) => void }) {
  // Capability check at render time — `EyeDropper` is a Chromium-only
  // global; SSR-safe via `typeof`.
  const supported =
    typeof window !== "undefined" && "EyeDropper" in window;

  const picker = useCanvasPicker();

  // Fallback for every non-Chromium browser (all mobile, plus Safari
  // and Firefox desktop): the in-app canvas picker. The user taps a
  // button here to engage pick mode, then taps anywhere on the
  // editor's canvas to sample a pixel — limited to colours already on
  // the canvas, but works everywhere.
  if (!supported) {
    return (
      <Row label="Pick a colour from the screen">
        <ActionButton
          onClick={() => picker.requestPick(onPick)}
          ariaLabel="Tap canvas to sample a colour"
          fullWidth
        >
          <Pipette className="w-4 h-4" />
          <span>
            {picker.isPicking ? "Tap canvas to sample…" : "Tap canvas to sample"}
          </span>
        </ActionButton>
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
