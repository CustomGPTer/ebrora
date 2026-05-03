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
// Mobile-fixes batch 5 (May 2026) — the dock is height-locked on
// mobile to MOBILE_DOCK_HEIGHT_PX so that switching between empty
// state, layer-edit, and tab transitions never causes the canvas
// above to jump. See the matching changes in DockButton (compact
// mode), DockSectionHeader (compact mode), and PropertyPanelHost
// (flex-1 body so it fills the locked height). Desktop (lg+)
// preserves the legacy natural-height behaviour because the chip
// row above the panel changes height with content there too and
// the wider viewport tolerates the variance.
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

/** Mobile dock height lock (px). Sized so that a content-rich
 *  edit-panel tab (shape Color: section label + ColorPicker row,
 *  ~135 px) plus the tab strip (~57 px) fit comfortably, AND so
 *  that the empty state (Add Layer + Background, both compact)
 *  fits naturally within the same envelope. Picked once, applied
 *  everywhere — see header comment.
 *
 *  IMPORTANT: this constant duplicates the literal `192` in the
 *  outer dock's `max-lg:h-[192px]` Tailwind class. Tailwind's JIT
 *  cannot read class names from template strings, so the class has
 *  to be a literal — keep both in sync if you change the lock
 *  height. eslint-disable-next-line is on the constant declaration
 *  so the unused-var lint is satisfied since the value is referenced
 *  only from doc-comments. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOBILE_DOCK_HEIGHT_PX = 192;

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
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
  Minus,
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
import { WidthPanel } from "../text-tools/WidthPanel";
import { LineStylePanel } from "../text-tools/LineStylePanel";
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
import { createDefaultTextForCanvas } from "@/lib/photo-editor/rich-text/factory";
import { createImageLayer } from "@/lib/photo-editor/canvas/factories";
import { centreLayerOnCanvas } from "@/lib/photo-editor/canvas/selection";
import { MAX_CANVAS_DIMENSION } from "@/lib/photo-editor/types";
import type {
  AnyLayer,
  Background,
  Highlight,
  ImageLayer,
  Shadow,
  ShapeLayer,
  StickerLayer,
  Stroke,
  TextLayer,
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
    // ── Apr 2026 keyboard-pop fix (revision 3) ────────────────────
    // Build the layer first, then flushSync the dispatches so the
    // BottomEditDrawer mounts SYNCHRONOUSLY inside this user-gesture
    // handler. After flushSync returns, the drawer's textarea is in
    // the DOM in its final layout AND has registered itself with
    // MobileEditContext via registerEditTextarea. We then call
    // focusForKeyboardPop, which targets that real, fully-rendered
    // textarea — still inside the same user gesture — and the OS
    // keyboard pops with the IME bound to the correct layout.
    //
    // Why flushSync: React 18 batches state updates inside event
    // handlers, so without it the drawer wouldn't mount until after
    // the handler returns, by which point the keyboard's user-
    // gesture window has closed.
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
    flushSync(() => {
      dispatch({ type: "ADD_LAYER", layer: positioned });
      dispatch({ type: "SET_SELECTION", ids: [positioned.id] });
      beginEditing(positioned.id, { isFresh: true });
    });
    focusForKeyboardPop();
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
      className="flex-none flex flex-col max-lg:overflow-hidden max-lg:h-[192px]"
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

          Mobile-fixes batch 5 (May 2026): when the empty state is
          mounted, the section uses compact mode (smaller icons, no
          labels under each, tighter section header) so two such
          sections fit inside MOBILE_DOCK_HEIGHT_PX without scrolling
          or clipping.

          Note: the file <input> below stays mounted unconditionally
          so the React ref is stable regardless of selection state. */}
      {state.selection.length === 0 ? (
        <>
          <DockSectionHeader title="Background" mobileCompact />
          <DockRow mode="spread" mobileCompact>
            <DockButton
              fluid
              mobileCompact
              icon={<FilePlus className="w-6 h-6" strokeWidth={1.75} />}
              label="Replace"
              onClick={() => replaceBgInputRef.current?.click()}
            />
            <DockButton
              fluid
              mobileCompact
              icon={<Wand2 className="w-6 h-6" strokeWidth={1.75} />}
              label="Effects"
              onClick={onOpenEffects}
            />
            <DockButton
              fluid
              mobileCompact
              icon={<CropIcon className="w-6 h-6" strokeWidth={1.75} />}
              label="Crop"
              onClick={onOpenCrop}
            />
            <DockButton
              fluid
              mobileCompact
              icon={<ResizeIcon className="w-6 h-6" strokeWidth={1.75} />}
              label="Resize"
              onClick={onOpenResize}
            />
            <DockButton
              fluid
              mobileCompact
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
      <DockSectionHeader title="Add Layer" mobileCompact />
      <DockRow mode="spread" mobileCompact>
        <DockButton
          fluid
          mobileCompact
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
          mobileCompact
          icon={<ImageIcon className="w-6 h-6" strokeWidth={1.75} />}
          label="Photo"
          onClick={onPickPhoto}
        />
        <DockButton
          fluid
          mobileCompact
          icon={<Square className="w-6 h-6" strokeWidth={1.75} />}
          label="Shape"
          onClick={onTogglePanel("shapes")}
          active={activePanel === "shapes"}
        />
        <DockButton
          fluid
          mobileCompact
          icon={<Smile className="w-6 h-6" strokeWidth={1.75} />}
          label="Sticker"
          onClick={onTogglePanel("stickers")}
          active={activePanel === "stickers"}
        />
        <DockButton
          fluid
          mobileCompact
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
//   • Stroke   → when stroke.width > 0 (a visible stroke is configured)
//   • Position → never (shapes always have a position)
//   • Opacity  → when opacity < 1
//
// (The per-tab ↻ Reset button was removed in May 2026; universal
// Undo/Redo from EditorTopBar covers this — no dedicated reset
// targets per tab anymore.)

type ShapeTabId = "color" | "stroke" | "position" | "opacity" | "width" | "line";

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
  {
    id: "width",
    label: "Width",
    icon: <Minus className="w-6 h-6" strokeWidth={2.5} />,
  },
];

// Line-shape tab strip — adds a 6th "Line" tab for arrowhead presets.
// Surfaced only when the selected shape is a line-* catalogue id.
// May 2026 — Width + Lines build.
const SHAPE_TABS_WITH_LINE: TabStripItem[] = [
  ...SHAPE_TABS,
  {
    id: "line",
    label: "Line",
    icon: <Spline className="w-6 h-6" strokeWidth={1.75} />,
  },
];

function ShapeEditPanel({ layer }: { layer: ShapeLayer }) {
  const [activeTab, setActiveTab] = useState<ShapeTabId>("color");

  const isLine = layer.shapeId.startsWith("line-");
  const tabs = isLine ? SHAPE_TABS_WITH_LINE : SHAPE_TABS;

  const editedIds = new Set<string>();
  if (layer.stroke && layer.stroke.width > 0) {
    // Both Stroke and Width edit the same field — light both dots
    // when a non-zero thickness is set so the indicator stays in
    // sync no matter which tab the user used.
    editedIds.add("stroke");
    editedIds.add("width");
  }
  if (layer.opacity < 1) editedIds.add("opacity");
  if (
    isLine &&
    layer.lineProps &&
    (layer.lineProps.arrowStart || layer.lineProps.arrowEnd)
  ) {
    editedIds.add("line");
  }

  // Guard: if the user clicked the line tab on a non-line shape (can
  // happen if selection changes mid-tab), fall back to color.
  const safeActive: ShapeTabId =
    activeTab === "line" && !isLine ? "color" : activeTab;

  return (
    <>
      <EditableLayerName layer={layer} />
      <PropertyPanelHost>
        <div className="px-1 pb-3">
          {safeActive === "color" && <ColorPanel inline />}
          {safeActive === "stroke" && <StrokePanel inline />}
          {safeActive === "position" && <PositionPanel inline />}
          {safeActive === "opacity" && <OpacityPanel inline />}
          {safeActive === "width" && <WidthPanel inline />}
          {safeActive === "line" && <LineStylePanel inline />}
        </div>
      </PropertyPanelHost>
      <TabStrip
        tabs={tabs}
        activeId={safeActive}
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
//   • Stroke  → stroke.width > 0
//   • Highlight → highlight.opacity > 0
//   • Spacing → letterSpacing != 0 OR lineHeight != 1.2
//   • Position → never (always has a position)
//   • Shadow  → shadow.opacity > 0
//   • Opacity → opacity < 1
//   • Erase   → never (it's a tool launcher)
//
// Mixed values (runValue returns null) don't show the dot — keeps
// the signal clean. Documented as a known limitation.
//
// (The per-tab ↻ Reset button was removed in May 2026; universal
// Undo/Redo from EditorTopBar covers this — no dedicated reset
// targets per tab anymore.)

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
  if (stroke && stroke.width > 0) editedIds.add("stroke");
  if (shadow && shadow.opacity > 0) editedIds.add("shadow");
  if (highlight && highlight.opacity > 0) editedIds.add("highlight");
  if (gradient?.enabled === true) editedIds.add("gradient");
  if (texture?.enabled === true) editedIds.add("texture");
  if (layer.background && layer.background.opacity > 0) editedIds.add("background");
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

  return (
    <>
      <EditableLayerName layer={layer} />
      <PropertyPanelHost>
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
//                   blur.radius > 0
//   • Stroke      → layer.stroke.width > 0
//   • Position    → never (no canonical default)
//   • Perspective → layer.perspective !== null
//   • Opacity     → layer.opacity < 1
//   • Replace     → never (action, not state)
//
// (The per-tab ↻ Reset button was removed in May 2026; universal
// Undo/Redo from EditorTopBar covers this — no dedicated reset
// targets per tab anymore.)
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
  const [activeTab, setActiveTab] = useState<ImageTabId>("stroke");

  const editedIds = new Set<string>();
  if (layer.crop !== null) editedIds.add("crop");
  if (
    layer.adjust.brightness !== 0 ||
    layer.adjust.contrast !== 0 ||
    layer.adjust.saturation !== 0 ||
    layer.adjust.exposure !== 0 ||
    layer.filterEffect !== null ||
    layer.blur.radius > 0
  ) {
    editedIds.add("effects");
  }
  if (layer.stroke && layer.stroke.width > 0) editedIds.add("stroke");
  if (layer.perspective !== null) editedIds.add("perspective");
  if (layer.opacity < 1) editedIds.add("opacity");

  return (
    <>
      <EditableLayerName layer={layer} />
      <PropertyPanelHost>
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
  const [activeTab, setActiveTab] = useState<StickerTabId>("position");

  const editedIds = new Set<string>();
  if (layer.opacity < 1) editedIds.add("opacity");

  return (
    <>
      <EditableLayerName layer={layer} />
      <PropertyPanelHost>
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
  mobileCompact = false,
}: {
  title: string;
  trailing?: React.ReactNode;
  /** When true, the header uses tighter padding and a slightly
   *  smaller min-height on mobile (max-lg) so empty-state sections
   *  fit within MOBILE_DOCK_HEIGHT_PX. Desktop is unchanged.
   *
   *  Note (May 2026): mobileCompact previously also forced an
   *  uppercase / muted-colour / smaller-font treatment on mobile that
   *  turned "Add Layer" / "Background" into eyebrow-style ALL-CAPS
   *  labels. That regressed the original design — section titles are
   *  meant to read as dark sentence-case headings on mobile too —
   *  so the typography was reverted. Only the tighter padding /
   *  reduced min-height survive under mobileCompact now. */
  mobileCompact?: boolean;
}) {
  return (
    <div
      className={
        mobileCompact
          ? "flex-none flex items-center justify-between px-4 max-lg:px-3 pt-2.5 max-lg:pt-1.5 pb-1 max-lg:pb-0.5"
          : "flex-none flex items-center justify-between px-4 pt-2.5 pb-1"
      }
      style={{ minHeight: mobileCompact ? undefined : 32 }}
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
//
// `mobileCompact` (Mobile-fixes batch 5): tightens padding on mobile
// only so empty-state rows fit inside the locked dock height.

function DockRow({
  children,
  mode = "scroll",
  mobileCompact = false,
}: {
  children: React.ReactNode;
  mode?: "scroll" | "spread";
  mobileCompact?: boolean;
}) {
  const paddingClass = mobileCompact
    ? "gap-1 px-3 max-lg:px-2 pb-2 max-lg:pb-1"
    : "gap-1 px-3 pb-2";
  if (mode === "spread") {
    return (
      <div className={`flex items-stretch ${paddingClass}`}>{children}</div>
    );
  }
  return (
    <div
      className={`flex items-stretch ${paddingClass} overflow-x-auto`}
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
