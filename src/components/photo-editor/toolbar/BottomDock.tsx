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
// Bottom section: always "Background"
//   Replace / Effects / Crop / Resize / Flip-Rotate
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
  Crop as CropIcon,
  Droplet,
  Droplets,
  FilePlus,
  Image as ImageIcon,
  Maximize as ResizeIcon,
  Move,
  Palette,
  PenLine,
  Pencil,
  RotateCw,
  Sliders,
  Smile,
  Sparkles,
  Square,
  TextCursor,
  Type,
  Wand2,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import { DockButton } from "./DockButton";
import { SubscribeChip } from "./SubscribeChip";
import { createDefaultTextForCanvas } from "@/lib/photo-editor/rich-text/factory";
import { createImageLayer } from "@/lib/photo-editor/canvas/factories";
import { centreLayerOnCanvas } from "@/lib/photo-editor/canvas/selection";
import { MAX_CANVAS_DIMENSION } from "@/lib/photo-editor/types";
import type { AnyLayer, Background } from "@/lib/photo-editor/types";
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
          activePanel={activePanel}
          onOpenPanel={onOpenPanel}
          onEditText={(id) => beginEditing(id)}
          onStub={onStub}
          onOpenLayerCrop={onOpenLayerCrop}
        />
      )}

      {/* ── Background section — always present ───────────────── */}
      <DockSectionHeader title="Background" />
      <DockRow>
        <DockButton
          icon={<FilePlus className="w-6 h-6" strokeWidth={1.75} />}
          label="Replace"
          onClick={() => replaceBgInputRef.current?.click()}
        />
        <DockButton
          icon={<Wand2 className="w-6 h-6" strokeWidth={1.75} />}
          label="Effects"
          onClick={onOpenEffects}
        />
        <DockButton
          icon={<CropIcon className="w-6 h-6" strokeWidth={1.75} />}
          label="Crop"
          onClick={onOpenCrop}
        />
        <DockButton
          icon={<ResizeIcon className="w-6 h-6" strokeWidth={1.75} />}
          label="Resize"
          onClick={onOpenResize}
        />
        <DockButton
          icon={<RotateCw className="w-6 h-6" strokeWidth={1.75} />}
          label="Flip/Rotate"
          onClick={onOpenFlipRotate}
        />
      </DockRow>

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
      <DockSectionHeader title="Add Layer" trailing={<SubscribeChip compact />} />
      <DockRow>
        <DockButton
          icon={<Type className="w-6 h-6" strokeWidth={2} />}
          label="Add Text"
          onClick={onAddText}
          accent={{
            from: "#3FB6E6",
            to: "#1B5B50",
            iconColor: "#FFFFFF",
          }}
        />
        <DockButton
          icon={<ImageIcon className="w-6 h-6" strokeWidth={1.75} />}
          label="Photo"
          onClick={onPickPhoto}
        />
        <DockButton
          icon={<Square className="w-6 h-6" strokeWidth={1.75} />}
          label="Shape"
          onClick={onTogglePanel("shapes")}
          active={activePanel === "shapes"}
        />
        <DockButton
          icon={<Smile className="w-6 h-6" strokeWidth={1.75} />}
          label="Sticker"
          onClick={onTogglePanel("stickers")}
          active={activePanel === "stickers"}
        />
        <DockButton
          icon={<Sparkles className="w-6 h-6" strokeWidth={1.75} />}
          label="Style"
          onClick={() => onStub("Saved Styles — coming soon")}
        />
      </DockRow>
    </>
  );
}

// ─── Top section — Selected Layer (single-selection) ────────────

function SelectedLayerSection({
  layer,
  activePanel,
  onOpenPanel,
  onEditText,
  onStub,
  onOpenLayerCrop,
}: {
  layer: AnyLayer;
  activePanel: ActivePanel;
  onOpenPanel: (panel: Exclude<ActivePanel, null>) => void;
  onEditText: (id: string) => void;
  onStub: (label: string) => void;
  onOpenLayerCrop: () => void;
}) {
  const title = sectionTitleForLayer(layer);

  return (
    <>
      <DockSectionHeader title={title} />
      <DockRow>
        {layer.kind === "text" && (
          <>
            <DockButton
              icon={<Pencil className="w-6 h-6" strokeWidth={2} />}
              label="Edit"
              onClick={() => onEditText(layer.id)}
              accent={{
                from: "#3FB6E6",
                to: "#1B5B50",
                iconColor: "#FFFFFF",
              }}
            />
            <DockButton
              icon={<TextCursor className="w-6 h-6" strokeWidth={1.75} />}
              label="Font"
              onClick={() => onOpenPanel("fonts")}
              active={activePanel === "fonts"}
            />
            <DockButton
              icon={<PenLine className="w-6 h-6" strokeWidth={1.75} />}
              label="Format"
              onClick={() => onOpenPanel("format")}
              active={activePanel === "format"}
            />
            <DockButton
              icon={<Palette className="w-6 h-6" strokeWidth={1.75} />}
              label="Color"
              onClick={() => onOpenPanel("color")}
              active={activePanel === "color"}
            />
            <DockButton
              icon={<Square className="w-6 h-6" strokeWidth={1.75} />}
              label="Stroke"
              onClick={() => onOpenPanel("stroke")}
              active={activePanel === "stroke"}
            />
            <DockButton
              icon={<Sparkles className="w-6 h-6" strokeWidth={1.75} />}
              label="Shadow"
              onClick={() => onOpenPanel("shadow")}
              active={activePanel === "shadow"}
            />
            <DockButton
              icon={<Move className="w-6 h-6" strokeWidth={1.75} />}
              label="Position"
              onClick={() => onOpenPanel("position")}
              active={activePanel === "position"}
            />
          </>
        )}

        {layer.kind === "image" && (
          <>
            <DockButton
              icon={<CropIcon className="w-6 h-6" strokeWidth={1.75} />}
              label="Crop"
              onClick={onOpenLayerCrop}
            />
            <DockButton
              icon={<Sliders className="w-6 h-6" strokeWidth={1.75} />}
              label="Adjust"
              onClick={() => onOpenPanel("image-adjust")}
              active={activePanel === "image-adjust"}
            />
            <DockButton
              icon={<Wand2 className="w-6 h-6" strokeWidth={1.75} />}
              label="Filters"
              onClick={() => onOpenPanel("image-filter")}
              active={activePanel === "image-filter"}
            />
            <DockButton
              icon={<Droplets className="w-6 h-6" strokeWidth={1.75} />}
              label="Blur"
              onClick={() => onOpenPanel("image-blur")}
              active={activePanel === "image-blur"}
            />
            <DockButton
              icon={<Square className="w-6 h-6" strokeWidth={1.75} />}
              label="Stroke"
              onClick={() => onOpenPanel("image-stroke")}
              active={activePanel === "image-stroke"}
            />
            <DockButton
              icon={<Move className="w-6 h-6" strokeWidth={1.75} />}
              label="Position"
              onClick={() => onOpenPanel("position")}
              active={activePanel === "position"}
            />
            <DockButton
              icon={<Box className="w-6 h-6" strokeWidth={1.75} />}
              label="Perspective"
              onClick={() => onOpenPanel("perspective")}
              active={activePanel === "perspective"}
            />
            <DockButton
              icon={<Droplet className="w-6 h-6" strokeWidth={1.75} />}
              label="Opacity"
              onClick={() => onOpenPanel("opacity")}
              active={activePanel === "opacity"}
            />
            <DockButton
              icon={<Sparkles className="w-6 h-6" strokeWidth={1.75} />}
              label="Erase"
              onClick={() => onOpenPanel("erase")}
              active={activePanel === "erase"}
            />
            <DockButton
              icon={<FilePlus className="w-6 h-6" strokeWidth={1.75} />}
              label="Replace"
              onClick={() => onStub("Replace layer image — coming soon")}
            />
          </>
        )}

        {layer.kind === "shape" && (
          <>
            <DockButton
              icon={<Palette className="w-6 h-6" strokeWidth={1.75} />}
              label="Color"
              onClick={() => onOpenPanel("color")}
              active={activePanel === "color"}
            />
            <DockButton
              icon={<Square className="w-6 h-6" strokeWidth={1.75} />}
              label="Stroke"
              onClick={() => onOpenPanel("stroke")}
              active={activePanel === "stroke"}
            />
            <DockButton
              icon={<Move className="w-6 h-6" strokeWidth={1.75} />}
              label="Position"
              onClick={() => onOpenPanel("position")}
              active={activePanel === "position"}
            />
          </>
        )}

        {layer.kind === "sticker" && (
          <>
            <DockButton
              icon={<Palette className="w-6 h-6" strokeWidth={1.75} />}
              label="Color"
              onClick={() => onOpenPanel("color")}
              active={activePanel === "color"}
            />
            <DockButton
              icon={<Move className="w-6 h-6" strokeWidth={1.75} />}
              label="Position"
              onClick={() => onOpenPanel("position")}
              active={activePanel === "position"}
            />
          </>
        )}
      </DockRow>
    </>
  );
}

function sectionTitleForLayer(layer: AnyLayer): string {
  switch (layer.kind) {
    case "text":
      return "Edit Text";
    case "image":
      return "Edit Image";
    case "sticker":
      return "Edit Sticker";
    case "shape":
      return "Edit Shape";
  }
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

function DockRow({ children }: { children: React.ReactNode }) {
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
