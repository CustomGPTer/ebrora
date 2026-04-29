// src/components/photo-editor/toolbar/BottomDock.tsx
//
// The mobile bottom dock — two stacked sections that change behaviour
// based on whether anything is selected.
//
// Top section:
//   • No selection / multi-select  → "Add Layer"
//       Add Text / Photo / Shape / Sticker / Style
//   • Single text selected         → "Edit Text"
//       Edit / Font / Format / Color / Stroke / Shadow / Erase
//   • Single image selected        → "Edit Image"
//       Effects / Position / Erase / Replace
//   • Single sticker selected      → "Edit Sticker"
//       Color / Position
//   • Single shape selected        → "Edit Shape"
//       Color / Stroke / Position
//
// Bottom section: "Background" — only shown when nothing is
// selected. These actions (Replace / Effects / Crop / Resize /
// Flip-Rotate) operate on the canvas background image rather than
// on any layer, so they're hidden the moment the user has a
// selection (single or multi). To reach them again, the user taps
// empty canvas / the grey area around it to deselect.
//
// Why swap rather than add a third section? Vertical real estate on
// mobile is precious — adding a section means scrolling, which hides
// the canvas. The reference Add Text app swaps the top section.
//
// Type-specific options surface the existing right-side panels:
//   FormatPanel / ColorPanel / StrokePanel / HighlightPanel /
//   ShadowPanel / PositionPanel / FontPanel — those panels were
//   built for text but ColorPanel + PositionPanel work for any layer
//   kind. The other text-only panels are gated by layer kind.
//
// Edit (text) re-opens the BottomEditDrawer for the selected text
// layer — same path as tap-on-text and as the SelectionTools
// floating toolbar's pencil icon. Three ways to enter edit mode is
// fine; users discover whichever one they reach for first.

"use client";

import { useRef, useState } from "react";
import {
  Box,
  Blend,
  Cloud,
  Crop as CropIcon,
  Droplet,
  Eraser,
  FilePlus,
  Grid2x2,
  Highlighter,
  Image as ImageIcon,
  LayoutTemplate,
  Maximize as ResizeIcon,
  Move,
  MoveHorizontal,
  Palette,
  PenLine,
  RotateCw,
  Smile,
  Sparkles,
  Spline,
  Square,
  TextCursor,
  Wand2,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import { DockButton } from "./DockButton";
import { TabStrip, type TabStripItem } from "./TabStrip";
import { PropertyPanelHost } from "./PropertyPanelHost";
import { EditableLayerName } from "./EditableLayerName";
import { ColorPanel } from "../text-tools/ColorPanel";
import { StrokePanel } from "../text-tools/StrokePanel";
import { PositionPanel } from "../text-tools/PositionPanel";
import { OpacityPanel } from "../text-tools/OpacityPanel";
import { FormatPanel } from "../text-tools/FormatPanel";
import { HighlightPanel } from "../text-tools/HighlightPanel";
import { ShadowPanel } from "../text-tools/ShadowPanel";
import { SpacingPanel } from "../text-tools/SpacingPanel";
import { StylePanel } from "../text-tools/StylePanel";
import { BendPanel } from "../text-tools/BendPanel";
import { GradientPanel } from "../text-tools/GradientPanel";
import { TexturePanel } from "../text-tools/TexturePanel";
import { BackgroundPanel } from "../text-tools/BackgroundPanel";
import { PerspectivePanel } from "../text-tools/PerspectivePanel";
import { ImageStrokePanel } from "../text-tools/ImageStrokePanel";
import { FontPanel } from "../fonts/FontPanel";
import { useTextTool } from "../text-tools/use-text-tool";
import { createDefaultTextForCanvas, defaultTextBackground } from "@/lib/photo-editor/rich-text/factory";
import { createImageLayer } from "@/lib/photo-editor/canvas/factories";
import { centreLayerOnCanvas } from "@/lib/photo-editor/canvas/selection";
import { MAX_CANVAS_DIMENSION } from "@/lib/photo-editor/types";
import type {
  AnyLayer,
  Background,
  GradientFill,
  Highlight,
  ImageLayer,
  Shadow,
  ShapeLayer,
  StickerLayer,
  Stroke,
  TextBackground,
  TextLayer,
  TextureFill,
} from "@/lib/photo-editor/types";
import type { ActivePanel } from "../EditorShell";

type TogglePanel = (panel: Exclude<ActivePanel, null>) => () => void;

interface BottomDockProps {
  activePanel: ActivePanel;
  onTogglePanel: TogglePanel;
  /** Open a panel without toggling (used for "switch to font panel"
   *  type buttons that should always end up showing the panel
   *  rather than closing it if it happened to already be open). */
  onOpenPanel: (panel: Exclude<ActivePanel, null>) => void;
  onStub: (label: string) => void;
  onOpenCrop: () => void;
  onOpenLayerCrop: () => void;
  onOpenResize: () => void;
  onOpenFlipRotate: () => void;
  onOpenEffects: () => void;
}

export function BottomDock({
  activePanel,
  onTogglePanel,
  onOpenPanel,
  onStub,
  onOpenCrop,
  onOpenLayerCrop,
  onOpenResize,
  onOpenFlipRotate,
  onOpenEffects,
}: BottomDockProps) {
  const { state, dispatch } = useEditor();
  const { beginEditing, focusForKeyboardPop } = useMobileEdit();

  const photoLayerInputRef = useRef<HTMLInputElement>(null);
  const replaceBgInputRef = useRef<HTMLInputElement>(null);

  const [adding, setAdding] = useState(false);

  // Resolve the single-selected layer (if any) so we know which
  // top-section variant to render.
  const selectedLayer: AnyLayer | null =
    state.selection.length === 1
      ? state.project.layers.find((l) => l.id === state.selection[0]) ?? null
      : null;

  // ── Add Layer handlers ─────────────────────────────────────────

  function handleAddText() {
    const project = state.project;
    // ── Phase 1 keyboard-pop fix ─────────────────────────────────
    // Focus the always-mounted BottomEditDrawer textarea SYNCHRONOUSLY
    // inside this click handler, before any state dispatch. iOS Safari
    // and Android Chrome only honour the focus request when it sits
    // inside a user-gesture event handler — the previous implementation
    // focused inside a useEffect after the drawer mounted, which fires
    // after the gesture has completed and the keyboard refused to open.
    focusForKeyboardPop();
    // Size to ~40% of canvas width (soft default — user can drag-
    // scale beyond after). Empty text content; the BottomEditDrawer
    // shows "your text here" as a placeholder until the user types.
    const baseLayer = createDefaultTextForCanvas(
      project.width,
      project.height,
      { text: "" },
    );
    const positioned = centreLayerOnCanvas(
      baseLayer,
      project.width,
      project.height,
    );
    dispatch({ type: "ADD_LAYER", layer: positioned });
    dispatch({ type: "SET_SELECTION", ids: [positioned.id] });
    beginEditing(positioned.id, { isFresh: true });
  }

  async function handleAddImageLayer(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (adding) return;
    setAdding(true);
    const objectUrl = URL.createObjectURL(file);
    try {
      const dim = await loadImageDimensions(objectUrl);
      const project = state.project;
      const targetMax = Math.min(
        project.width * 0.6,
        project.height * 0.6,
        MAX_CANVAS_DIMENSION,
      );
      const scale = Math.min(
        1,
        targetMax / dim.naturalWidth,
        targetMax / dim.naturalHeight,
      );
      const visibleW = dim.naturalWidth * scale;
      const visibleH = dim.naturalHeight * scale;
      const layer = createImageLayer({
        src: objectUrl,
        naturalWidth: dim.naturalWidth,
        naturalHeight: dim.naturalHeight,
        name: file.name.replace(/\.[^.]+$/, "") || "Image",
        transform: {
          x: (project.width - visibleW) / 2,
          y: (project.height - visibleH) / 2,
          scaleX: scale,
          scaleY: scale,
        },
      });
      dispatch({ type: "ADD_LAYER", layer });
      dispatch({ type: "SET_SELECTION", ids: [layer.id] });
    } catch {
      URL.revokeObjectURL(objectUrl);
      onStub("Couldn't read that image");
    } finally {
      setAdding(false);
    }
  }

  async function handleReplaceBackground(file: File) {
    if (!file.type.startsWith("image/")) {
      onStub("That's not an image file");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    try {
      const dim = await loadImageDimensions(objectUrl);
      const next: Background = {
        kind: "photo",
        src: objectUrl,
        naturalWidth: dim.naturalWidth,
        naturalHeight: dim.naturalHeight,
        crop: null,
        flip: { horizontal: false, vertical: false },
        rotation: 0,
      };
      dispatch({ type: "SET_BACKGROUND", background: next });
    } catch {
      URL.revokeObjectURL(objectUrl);
      onStub("Couldn't read that image");
    }
  }

  return (
    <div
      className="flex-none flex flex-col"
      style={{
        borderTop: "1px solid var(--pe-toolbar-border)",
        background: "var(--pe-toolbar-bg)",
      }}
    >
      {/* ── Top section — varies by selection ─────────────────── */}
      {selectedLayer === null ? (
        <AddLayerSection
          activePanel={activePanel}
          onTogglePanel={onTogglePanel}
          onAddText={handleAddText}
          onPickPhoto={() => photoLayerInputRef.current?.click()}
          onStub={onStub}
        />
      ) : (
        <SelectedLayerSection
          layer={selectedLayer}
          onOpenPanel={onOpenPanel}
          onStub={onStub}
          onOpenLayerCrop={onOpenLayerCrop}
        />
      )}

      {/* ── Background section — canvas-level tools, only shown
              when nothing is selected ─────────────────────────────
          Background actions (Replace / Effects / Crop / Resize /
          Flip-Rotate) operate on the *canvas background image*, not
          on any layer, so they're contextually unrelated whenever
          the user is editing a layer. We hide this whole block —
          header + row — for both single-selection and multi-select.
          To reach Background again, the user taps empty canvas (or
          the grey area around it) to deselect.

          Note: the file <input> below stays mounted unconditionally
          so the React ref is stable regardless of selection state. */}
      {state.selection.length === 0 ? (
        <>
          <DockSectionHeader title="Background" />
          <DockRow mode="spread">
            <DockButton
              fluid
              icon={<FilePlus className="w-6 h-6" strokeWidth={1.75} />}
              label="Replace"
              onClick={() => replaceBgInputRef.current?.click()}
            />
            <DockButton
              fluid
              icon={<Wand2 className="w-6 h-6" strokeWidth={1.75} />}
              label="Effects"
              onClick={onOpenEffects}
            />
            <DockButton
              fluid
              icon={<CropIcon className="w-6 h-6" strokeWidth={1.75} />}
              label="Crop"
              onClick={onOpenCrop}
            />
            <DockButton
              fluid
              icon={<ResizeIcon className="w-6 h-6" strokeWidth={1.75} />}
              label="Resize"
              onClick={onOpenResize}
            />
            <DockButton
              fluid
              icon={<RotateCw className="w-6 h-6" strokeWidth={1.75} />}
              label="Flip/Rotate"
              onClick={onOpenFlipRotate}
            />
          </DockRow>
        </>
      ) : null}

      <input
        ref={photoLayerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleAddImageLayer(file);
        }}
      />
      <input
        ref={replaceBgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleReplaceBackground(file);
        }}
      />
    </div>
  );
}

// ─── Top section — Add Layer (no selection) ─────────────────────

function AddLayerSection({
  activePanel,
  onTogglePanel,
  onAddText,
  onPickPhoto,
  onStub,
}: {
  activePanel: ActivePanel;
  onTogglePanel: TogglePanel;
  onAddText: () => void;
  onPickPhoto: () => void;
  onStub: (label: string) => void;
}) {
  return (
    <>
      <DockSectionHeader title="Add Layer" />
      <DockRow mode="spread">
        <DockButton
          fluid
          icon={<PlusTextGlyph className="w-6 h-6" />}
          label="Add Text"
          onClick={onAddText}
          accent={{
            from: "#1B5B50",
            to: "#1B5B50",
            iconColor: "#FFFFFF",
          }}
        />
        <DockButton
          fluid
          icon={<ImageIcon className="w-6 h-6" strokeWidth={1.75} />}
          label="Photo"
          onClick={onPickPhoto}
        />
        <DockButton
          fluid
          icon={<Square className="w-6 h-6" strokeWidth={1.75} />}
          label="Shape"
          onClick={onTogglePanel("shapes")}
          active={activePanel === "shapes"}
        />
        <DockButton
          fluid
          icon={<Smile className="w-6 h-6" strokeWidth={1.75} />}
          label="Sticker"
          onClick={onTogglePanel("stickers")}
          active={activePanel === "stickers"}
        />
        <DockButton
          fluid
          icon={<Sparkles className="w-6 h-6" strokeWidth={1.75} />}
          label="Style"
          onClick={() => onStub("Saved Styles — coming soon")}
        />
      </DockRow>
    </>
  );
}

// ─── "+T" glyph ─────────────────────────────────────────────────
//
// The reference Add Text app's Add Text tile shows a small "+" mark
// floating above-left of a bold "T". lucide-react has no equivalent,
// so we hand-roll a 24×24 SVG that pairs cleanly with the 44×44
// green tile in DockButton's accent slot. Stroked paths use
// currentColor so the white vs Ebrora-green contrast follows the
// `accent.iconColor` plumbing.

function PlusTextGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* small + at top-left */}
      <path
        d="M5 4v4M3 6h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* bold T centred-right */}
      <path
        d="M9 11h12M15 11v10"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Top section — Selected Layer (single-selection) ────────────

function SelectedLayerSection({
  layer,
  onOpenPanel,
  onStub,
  onOpenLayerCrop,
}: {
  layer: AnyLayer;
  onOpenPanel: (panel: Exclude<ActivePanel, null>) => void;
  onStub: (label: string) => void;
  onOpenLayerCrop: () => void;
}) {
  // Every layer kind now uses the inline tab-strip pattern (TabStrip +
  // PropertyPanelHost mounting an inline-mode panel). The migration
  // happened across:
  //
  //   Batch C   — shape (4-tab strip)
  //   Batch D1  — text (initial 11 tabs; later D2a/D2b/D2c grew it
  //               to 16 tabs)
  //   Batch E   — image dock's Filter/Adjust/Blur consolidated into
  //               one Effects launcher
  //   Batch E2  — image (7-tab strip)
  //   Batch H   — sticker (2-tab strip — this batch)
  //
  // No fallback DockRow path remains — AnyLayer is exhaustively the
  // four kinds below, so TS catches any future kind addition that
  // forgets a branch.
  switch (layer.kind) {
    case "shape":
      return <ShapeEditPanel layer={layer} />;
    case "text":
      return <TextEditPanel layer={layer} onOpenPanel={onOpenPanel} />;
    case "image":
      return (
        <ImageEditPanel
          layer={layer}
          onOpenPanel={onOpenPanel}
          onOpenLayerCrop={onOpenLayerCrop}
          onStub={onStub}
        />
      );
    case "sticker":
      return <StickerEditPanel layer={layer} />;
  }
}

// ─── Shape edit panel — Batch C ─────────────────────────────────
//
// When a shape is selected the bottom dock renders an inline tab
// strip with four tabs (Color · Stroke · Position · Opacity). The
// active tab's body renders inside `PropertyPanelHost` above the
// strip, with a per-tab reset button at top-left.
//
// Perspective is intentionally NOT in this list. The existing
// PerspectivePanel is image-only (its resolver filters
// `kind !== "image"` and the Konva `sceneFunc` rendering is
// hard-wired to the ImageLayer pipeline). Surfacing a Perspective
// tab for shapes would expose a panel that can't operate on the
// selected layer. Defer to a follow-up batch that extends the
// perspective engine to shapes.
//
// "Edited" red-dot semantics (per Q1A — any non-default value):
//   • Color    → never (shapes always have a fill colour)
//   • Stroke   → when stroke.enabled is true
//   • Position → never (shapes always have a position)
//   • Opacity  → when opacity < 1
//
// Reset semantics (per Q2 — scope is just the active tab):
//   • Color    → no reset (no canonical default — would be arbitrary)
//   • Stroke   → stroke.enabled = false (back to no-stroke)
//   • Position → translate / rotate / scale to identity-ish (Z-order
//                stays — re-stacking on reset would be surprising)
//   • Opacity  → opacity = 1

const SHAPE_DEFAULT_STROKE: Stroke = {
  enabled: false,
  color: "#000000",
  width: 2,
  opacity: 1,
};

type ShapeTabId = "color" | "stroke" | "position" | "opacity";

const SHAPE_TABS: TabStripItem[] = [
  {
    id: "color",
    label: "Color",
    icon: <Palette className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "stroke",
    label: "Stroke",
    icon: <Square className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "position",
    label: "Position",
    icon: <Move className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "opacity",
    label: "Opacity",
    icon: <Droplet className="w-6 h-6" strokeWidth={1.75} />,
  },
];

function ShapeEditPanel({ layer }: { layer: ShapeLayer }) {
  const { dispatch } = useEditor();
  const [activeTab, setActiveTab] = useState<ShapeTabId>("color");

  const editedIds = new Set<string>();
  if (layer.stroke?.enabled) editedIds.add("stroke");
  if (layer.opacity < 1) editedIds.add("opacity");

  function resetActiveTab() {
    switch (activeTab) {
      case "stroke":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: { stroke: SHAPE_DEFAULT_STROKE } as Partial<AnyLayer>,
        });
        return;
      case "position":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: {
            transform: {
              ...layer.transform,
              x: 0,
              y: 0,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              skewX: 0,
              skewY: 0,
            },
          } as Partial<AnyLayer>,
        });
        return;
      case "opacity":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: { opacity: 1 } as Partial<AnyLayer>,
        });
        return;
      // "color" has no canonical reset target — fall through.
    }
  }

  const tabHasReset = activeTab !== "color";

  return (
    <>
      <EditableLayerName layer={layer} />
      <PropertyPanelHost
        onReset={tabHasReset ? resetActiveTab : undefined}
      >
        <div className="px-1 pb-3">
          {activeTab === "color" && <ColorPanel inline />}
          {activeTab === "stroke" && <StrokePanel inline />}
          {activeTab === "position" && <PositionPanel inline />}
          {activeTab === "opacity" && <OpacityPanel inline />}
        </div>
      </PropertyPanelHost>
      <TabStrip
        tabs={SHAPE_TABS}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as ShapeTabId)}
        editedIds={editedIds}
      />
    </>
  );
}

// ─── Text edit panel — Batch D1 ─────────────────────────────────
//
// Mirror of ShapeEditPanel but for text. 11 tabs in this batch:
//
//   Style · Font · Format · Color · Stroke · Highlight · Spacing
//   · Position · Shadow · Opacity · Erase
//
// Five tabs are deferred to Batch D2 because they need engine work
// (decision #15 forbids "Coming soon" placeholders, so they're
// hidden from the strip until they ship functional):
//
//   Background    — needs new TextLayer.background field + Konva
//                   background-box render path
//   Perspective   — existing PerspectivePanel is image-only; needs
//                   text/shape engine support
//   Bend          — Konva.TextPath migration with arc-path engine
//   Gradient      — fillLinearGradientStartPoint integration on text
//   Texture       — fillPatternImage with a built-in texture library
//
// One tab in this strip behaves specially: tapping it does NOT switch
// the active tab. Instead it routes to the existing legacy surface
// for that capability:
//
//   Erase  → dispatches openPanel("erase") to launch the existing
//            EraseTool full-screen takeover. The erase flow has its
//            own UX entirely (brushes, sliders) — surfacing it as
//            a tab body would feel cramped.
//
// Batch I (Apr 2026): Font migrated from launcher to inline. The
// FontPanel grew an `inline?` prop and is now rendered as the tab
// body when activeTab === "font". Previously the comment block here
// listed Font alongside Erase as a launcher; that's no longer true.
//
// Edited dot semantics (per Q1A — pragmatic interpretation):
//   • Style   → never (no canonical "default style")
//   • Font    → never (the tab routes to drawer; visual highlight
//                doesn't matter)
//   • Format  → bold/italic/underline/strike OR align != "left"
//   • Color   → never (always has fill)
//   • Stroke  → stroke.enabled === true
//   • Highlight → highlight.enabled === true
//   • Spacing → letterSpacing != 0 OR lineHeight != 1.2
//   • Position → never (always has a position)
//   • Shadow  → shadow.enabled === true
//   • Opacity → opacity < 1
//   • Erase   → never (it's a tool launcher)
//
// Mixed values (runValue returns null) don't show the dot — keeps
// the signal clean. Documented as a known limitation.
//
// Reset semantics (per Q2 — just-this-tab scope, never the layer):
//   • Style   → no reset (no canonical state)
//   • Font    → no reset (tab routes to drawer)
//   • Format  → align "left" + fontWeight 400 + fontStyle normal +
//                decoration none
//   • Color   → no reset
//   • Stroke  → stroke object back to default (enabled false)
//   • Highlight → highlight back to default (enabled false)
//   • Spacing → letterSpacing 0 + lineHeight 1.2
//   • Position → translate/rotate/scale to identity (Z-order kept)
//   • Shadow  → shadow back to default (enabled false)
//   • Opacity → 1
//   • Erase   → no reset

const TEXT_DEFAULT_HIGHLIGHT: Highlight = {
  enabled: false,
  color: "#FFEB3B",
  opacity: 0.5,
};

const TEXT_DEFAULT_SHADOW: Shadow = {
  enabled: false,
  color: "#000000",
  opacity: 0.5,
  blur: 8,
  offsetX: 4,
  offsetY: 4,
};

const TEXT_DEFAULT_GRADIENT: GradientFill = {
  enabled: false,
  angle: 0,
  stops: [
    { position: 0, color: "#FFFFFF" },
    { position: 1, color: "#1B5B50" },
  ],
};

const TEXT_DEFAULT_TEXTURE: TextureFill = {
  enabled: false,
  src: "",
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
};

// IDs of tabs whose body actually mounts inline. Font and Erase
// route to the legacy drawer/takeover so they don't appear here.
//
// Batch I (Apr 2026): "font" migrated from launcher to inline. Only
// "erase" remains as a launcher tab — its full-screen takeover UX
// genuinely needs the whole canvas.
type TextTabId =
  | "style"
  | "font"
  | "format"
  | "color"
  | "stroke"
  | "highlight"
  | "background"
  | "spacing"
  | "position"
  | "perspective"
  | "bend"
  | "shadow"
  | "gradient"
  | "texture"
  | "opacity";

const TEXT_TABS: TabStripItem[] = [
  {
    id: "style",
    label: "Style",
    icon: <Sparkles className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "font",
    label: "Font",
    icon: <TextCursor className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "format",
    label: "Format",
    icon: <PenLine className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "color",
    label: "Color",
    icon: <Palette className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "stroke",
    label: "Stroke",
    icon: <Square className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "highlight",
    label: "Highlight",
    icon: <Highlighter className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "background",
    label: "Background",
    icon: <LayoutTemplate className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "spacing",
    label: "Spacing",
    icon: <MoveHorizontal className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "position",
    label: "Position",
    icon: <Move className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "perspective",
    label: "Perspective",
    icon: <Box className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "bend",
    label: "Bend",
    icon: <Spline className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "shadow",
    label: "Shadow",
    icon: <Cloud className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "gradient",
    label: "Gradient",
    icon: <Blend className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "texture",
    label: "Texture",
    icon: <Grid2x2 className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "opacity",
    label: "Opacity",
    icon: <Droplet className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "erase",
    label: "Erase",
    icon: <Eraser className="w-6 h-6" strokeWidth={1.75} />,
  },
];

function TextEditPanel({
  layer,
  onOpenPanel,
}: {
  layer: TextLayer;
  onOpenPanel: (panel: Exclude<ActivePanel, null>) => void;
}) {
  const { dispatch } = useEditor();
  const tool = useTextTool();
  const [activeTab, setActiveTab] = useState<TextTabId>("style");

  // Edited-indicator computation. runValue returns the uniform value
  // when all runs in scope agree, or null when they disagree. Null
  // doesn't mark "edited" here — keeps the signal clean (a partial
  // mix is treated as "investigate" rather than "definitely edited").
  const stroke = tool.runValue("stroke") as Stroke | null;
  const shadow = tool.runValue("shadow") as Shadow | null;
  const highlight = tool.runValue("highlight") as Highlight | null;
  const gradient = tool.runValue("gradient");
  const texture = tool.runValue("texture");
  const fontWeight = tool.runValue("fontWeight");
  const fontStyle = tool.runValue("fontStyle");
  const decoration = tool.runValue("decoration");

  const editedIds = new Set<string>();
  if (stroke?.enabled === true) editedIds.add("stroke");
  if (shadow?.enabled === true) editedIds.add("shadow");
  if (highlight?.enabled === true) editedIds.add("highlight");
  if (gradient?.enabled === true) editedIds.add("gradient");
  if (texture?.enabled === true) editedIds.add("texture");
  if (layer.background?.enabled === true) editedIds.add("background");
  if (
    fontWeight === 700 ||
    fontStyle === "italic" ||
    (decoration !== null && decoration !== "none") ||
    layer.styling.align !== "left"
  ) {
    editedIds.add("format");
  }
  if (
    layer.styling.letterSpacing !== 0 ||
    layer.styling.lineHeight !== 1.2
  ) {
    editedIds.add("spacing");
  }
  if ((layer.styling.bend?.amount ?? 0) !== 0) {
    editedIds.add("bend");
  }
  if (layer.perspective !== null) {
    editedIds.add("perspective");
  }
  if (layer.opacity < 1) editedIds.add("opacity");

  function resetActiveTab() {
    switch (activeTab) {
      case "format":
        tool.patchStyling({ align: "left" });
        tool.patchRuns({
          fontWeight: 400,
          fontStyle: "normal",
          decoration: "none",
        });
        return;
      case "stroke":
        tool.patchRuns({ stroke: SHAPE_DEFAULT_STROKE });
        return;
      case "highlight":
        tool.patchRuns({ highlight: TEXT_DEFAULT_HIGHLIGHT });
        return;
      case "background":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: { background: defaultTextBackground() } as Partial<AnyLayer>,
        });
        return;
      case "shadow":
        tool.patchRuns({ shadow: TEXT_DEFAULT_SHADOW });
        return;
      case "gradient":
        tool.patchRuns({ gradient: TEXT_DEFAULT_GRADIENT });
        return;
      case "texture":
        tool.patchRuns({ texture: TEXT_DEFAULT_TEXTURE });
        return;
      case "spacing":
        tool.patchStyling({ letterSpacing: 0, lineHeight: 1.2 });
        return;
      case "bend":
        tool.patchStyling({ bend: { amount: 0 } });
        return;
      case "perspective":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: { perspective: null } as Partial<AnyLayer>,
        });
        return;
      case "position":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: {
            transform: {
              ...layer.transform,
              x: 0,
              y: 0,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              skewX: 0,
              skewY: 0,
            },
          } as Partial<AnyLayer>,
        });
        return;
      case "opacity":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: { opacity: 1 } as Partial<AnyLayer>,
        });
        return;
      // "style" and "color" have no canonical reset target.
    }
  }

  const tabsWithoutReset: TextTabId[] = ["style", "color"];
  const showReset = !tabsWithoutReset.includes(activeTab);

  return (
    <>
      <EditableLayerName layer={layer} />
      <PropertyPanelHost onReset={showReset ? resetActiveTab : undefined}>
        <div className="px-1 pb-3">
          {activeTab === "style" && <StylePanel />}
          {activeTab === "font" && <FontPanel inline />}
          {activeTab === "format" && <FormatPanel inline />}
          {activeTab === "color" && <ColorPanel inline />}
          {activeTab === "stroke" && <StrokePanel inline />}
          {activeTab === "highlight" && <HighlightPanel inline />}
          {activeTab === "background" && <BackgroundPanel />}
          {activeTab === "spacing" && <SpacingPanel />}
          {activeTab === "position" && <PositionPanel inline />}
          {activeTab === "perspective" && <PerspectivePanel inline />}
          {activeTab === "bend" && <BendPanel />}
          {activeTab === "shadow" && <ShadowPanel inline />}
          {activeTab === "gradient" && <GradientPanel />}
          {activeTab === "texture" && <TexturePanel />}
          {activeTab === "opacity" && <OpacityPanel inline />}
        </div>
      </PropertyPanelHost>
      <TabStrip
        tabs={TEXT_TABS}
        activeId={activeTab}
        onSelect={(id) => {
          // Erase still launches the existing full-screen takeover
          // (EraseTool — its UX needs the whole canvas). Every other
          // tab including Font is now inline.
          if (id === "erase") {
            onOpenPanel("erase");
            return;
          }
          setActiveTab(id as TextTabId);
        }}
        editedIds={editedIds}
      />
    </>
  );
}

// ─── Image edit panel — Batch E2 ────────────────────────────────
//
// When an image is selected the bottom dock renders a 7-tab inline
// strip:
//
//   Crop · Effects · Stroke · Position · Perspective · Opacity · Replace
//
// Three tabs are launchers (they don't have inline bodies — tapping
// them opens an existing takeover/tool/file-input):
//
//   Crop     → onOpenLayerCrop()  (LayerCropTool full-screen modal)
//   Effects  → onOpenPanel("effects")  (LayerEffectsTool, Batch E)
//   Replace  → onStub("Replace layer image — coming soon")
//
// Four tabs are inline panels (mounted inside PropertyPanelHost):
//
//   Stroke      → ImageStrokePanel inline (Batch E2 added inline? prop)
//   Position    → PositionPanel inline (already inline-capable)
//   Perspective → PerspectivePanel inline (D2c generalised it)
//   Opacity     → OpacityPanel inline (already inline-capable)
//
// The Erase tab from the legacy image dock is intentionally dropped:
// the existing EraseTool only supports text layers (it gates on
// `kind === "text"` and refuses to render otherwise), so the
// pre-E2 Erase button on the image dock was a dead button. Image
// erase is a future feature, not part of E2.
//
// Edited red-dot semantics:
//   • Crop        → layer.crop !== null
//   • Effects     → adjust != zero || filterEffect != null ||
//                   blur.enabled || blur.radius > 0
//   • Stroke      → layer.stroke.enabled === true
//   • Position    → never (no canonical default)
//   • Perspective → layer.perspective !== null
//   • Opacity     → layer.opacity < 1
//   • Replace     → never (action, not state)
//
// Reset semantics — only the four inline tabs have reset. Launcher
// tabs (Crop / Effects / Replace) hide the reset button because their
// bodies live inside the takeover and have their own reset UI there.
//   • Stroke      → set to IMAGE_DEFAULT_STROKE (matches the stroke
//                   panel's own DEFAULT_STROKE)
//   • Position    → reset transform to identity (mirrors text/shape)
//   • Perspective → set to null
//   • Opacity     → set to 1
//
// activeTab default is "stroke" — the first inline tab. When the user
// taps a launcher tab, activeTab is NOT updated (matches the text
// panel's Font/Erase pattern), so the body stays on whatever inline
// tab was active when the user comes back from the takeover.

type ImageTabId =
  | "crop"
  | "effects"
  | "stroke"
  | "position"
  | "perspective"
  | "opacity"
  | "replace";

const IMAGE_TABS: TabStripItem[] = [
  {
    id: "crop",
    label: "Crop",
    icon: <CropIcon className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "effects",
    label: "Effects",
    icon: <Wand2 className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "stroke",
    label: "Stroke",
    icon: <Square className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "position",
    label: "Position",
    icon: <Move className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "perspective",
    label: "Perspective",
    icon: <Box className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "opacity",
    label: "Opacity",
    icon: <Droplet className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "replace",
    label: "Replace",
    icon: <FilePlus className="w-6 h-6" strokeWidth={1.75} />,
  },
];

const IMAGE_DEFAULT_STROKE: Stroke = {
  enabled: false,
  color: "#000000",
  width: 4,
  opacity: 1,
};

function ImageEditPanel({
  layer,
  onOpenPanel,
  onOpenLayerCrop,
  onStub,
}: {
  layer: ImageLayer;
  onOpenPanel: (panel: Exclude<ActivePanel, null>) => void;
  onOpenLayerCrop: () => void;
  onStub: (label: string) => void;
}) {
  const { dispatch } = useEditor();
  const [activeTab, setActiveTab] = useState<ImageTabId>("stroke");

  const editedIds = new Set<string>();
  if (layer.crop !== null) editedIds.add("crop");
  if (
    layer.adjust.brightness !== 0 ||
    layer.adjust.contrast !== 0 ||
    layer.adjust.saturation !== 0 ||
    layer.adjust.exposure !== 0 ||
    layer.filterEffect !== null ||
    layer.blur.enabled ||
    layer.blur.radius > 0
  ) {
    editedIds.add("effects");
  }
  if (layer.stroke?.enabled === true) editedIds.add("stroke");
  if (layer.perspective !== null) editedIds.add("perspective");
  if (layer.opacity < 1) editedIds.add("opacity");

  function resetActiveTab() {
    switch (activeTab) {
      case "stroke":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: { stroke: IMAGE_DEFAULT_STROKE } as Partial<AnyLayer>,
        });
        return;
      case "position":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: {
            transform: {
              ...layer.transform,
              x: 0,
              y: 0,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              skewX: 0,
              skewY: 0,
            },
          } as Partial<AnyLayer>,
        });
        return;
      case "perspective":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: { perspective: null } as Partial<AnyLayer>,
        });
        return;
      case "opacity":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: { opacity: 1 } as Partial<AnyLayer>,
        });
        return;
      // crop / effects / replace are launcher tabs — never have
      // an inline body, so this reset path is never reached for
      // them (showReset gates on the active tab's kind).
    }
  }

  const launcherTabs: ImageTabId[] = ["crop", "effects", "replace"];
  const showReset = !launcherTabs.includes(activeTab);

  return (
    <>
      <EditableLayerName layer={layer} />
      <PropertyPanelHost onReset={showReset ? resetActiveTab : undefined}>
        <div className="px-1 pb-3">
          {activeTab === "stroke" && <ImageStrokePanel inline />}
          {activeTab === "position" && <PositionPanel inline />}
          {activeTab === "perspective" && <PerspectivePanel inline />}
          {activeTab === "opacity" && <OpacityPanel inline />}
        </div>
      </PropertyPanelHost>
      <TabStrip
        tabs={IMAGE_TABS}
        activeId={activeTab}
        onSelect={(id) => {
          // Crop, Effects, and Replace are launcher tabs — they
          // route to the existing takeover/tool/file-input rather
          // than swapping the inline body. Matches the Font/Erase
          // pattern in TextEditPanel.
          if (id === "crop") {
            onOpenLayerCrop();
            return;
          }
          if (id === "effects") {
            onOpenPanel("effects");
            return;
          }
          if (id === "replace") {
            onStub("Replace layer image — coming soon");
            return;
          }
          setActiveTab(id as ImageTabId);
        }}
        editedIds={editedIds}
      />
    </>
  );
}

// ─── Sticker edit panel — Batch H ──────────────────────────────
//
// When a sticker is selected the bottom dock renders a 2-tab inline
// strip: Position · Opacity. Both are inline panels (no launchers).
//
// The legacy sticker dock had a Color button alongside Position, but
// stickers don't actually support colour changes — `ColorPanel`
// returns an empty state ("Stickers don't support colour changes")
// when its resolved layer is a sticker. So the Color button was
// effectively dead, like the Erase button on the pre-E2 image dock.
// Sticker migration drops Color.
//
// Edited red-dot semantics:
//   • Position → never (no canonical default for transform)
//   • Opacity  → when opacity < 1
//
// Reset semantics — both tabs have reset:
//   • Position → reset transform x/y/scale/rotation/skew to identity
//   • Opacity  → opacity = 1
//
// activeTab default is "position" — same as image's "stroke" rationale
// (first inline tab; the body always shows something on first
// selection).

type StickerTabId = "position" | "opacity";

const STICKER_TABS: TabStripItem[] = [
  {
    id: "position",
    label: "Position",
    icon: <Move className="w-6 h-6" strokeWidth={1.75} />,
  },
  {
    id: "opacity",
    label: "Opacity",
    icon: <Droplet className="w-6 h-6" strokeWidth={1.75} />,
  },
];

function StickerEditPanel({ layer }: { layer: StickerLayer }) {
  const { dispatch } = useEditor();
  const [activeTab, setActiveTab] = useState<StickerTabId>("position");

  const editedIds = new Set<string>();
  if (layer.opacity < 1) editedIds.add("opacity");

  function resetActiveTab() {
    switch (activeTab) {
      case "position":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: {
            transform: {
              ...layer.transform,
              x: 0,
              y: 0,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              skewX: 0,
              skewY: 0,
            },
          } as Partial<AnyLayer>,
        });
        return;
      case "opacity":
        dispatch({
          type: "UPDATE_LAYER",
          id: layer.id,
          patch: { opacity: 1 } as Partial<AnyLayer>,
        });
        return;
    }
  }

  return (
    <>
      <EditableLayerName layer={layer} />
      <PropertyPanelHost onReset={resetActiveTab}>
        <div className="px-1 pb-3">
          {activeTab === "position" && <PositionPanel inline />}
          {activeTab === "opacity" && <OpacityPanel inline />}
        </div>
      </PropertyPanelHost>
      <TabStrip
        tabs={STICKER_TABS}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as StickerTabId)}
        editedIds={editedIds}
      />
    </>
  );
}

// ─── Section header ─────────────────────────────────────────────

function DockSectionHeader({
  title,
  trailing,
}: {
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      className="flex-none flex items-center justify-between px-4 pt-2.5 pb-1"
      style={{ minHeight: 32 }}
    >
      <span
        className="text-[13px] font-semibold tracking-tight"
        style={{ color: "var(--pe-text)" }}
      >
        {title}
      </span>
      {trailing ? <div>{trailing}</div> : null}
    </div>
  );
}

// ─── Horizontal scroll row ──────────────────────────────────────
//
// Two layout modes:
//   • `mode="scroll"` (default) — items keep their natural width
//     (DockButton's 72px minWidth) and the row scrolls horizontally
//     when they overflow. Used by the long type-specific rows
//     (image dock = 11 tiles, text dock = 7 tiles) where horizontal
//     swipe is the only way they can ever fit.
//   • `mode="spread"`            — items are flex-1 and share the
//     available width evenly with no scrollbar. Used by the
//     no-selection 5-tile rows (Add Layer, Background) which the
//     reference renders as a single fixed row spanning the screen.
//     Children should be passed `fluid` so they cooperate.

function DockRow({
  children,
  mode = "scroll",
}: {
  children: React.ReactNode;
  mode?: "scroll" | "spread";
}) {
  if (mode === "spread") {
    return (
      <div className="flex items-stretch gap-1 px-3 pb-2">{children}</div>
    );
  }
  return (
    <div
      className="flex items-stretch gap-1 px-3 pb-2 overflow-x-auto"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {children}
    </div>
  );
}

function loadImageDimensions(
  src: string,
): Promise<{ naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () =>
      resolve({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
