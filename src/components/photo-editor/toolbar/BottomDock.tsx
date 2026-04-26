// src/components/photo-editor/toolbar/BottomDock.tsx
//
// The mobile bottom dock — two stacked sections (Add Layer + Background)
// mirroring the reference Add Text app's layout.
//
// Add Layer row:
//   • Add Text   → creates an empty TextLayer and opens BottomEditDrawer
//   • Photo      → file picker → ADD_LAYER (image)
//   • Shape      → activePanel = "shapes"
//   • Sticker    → activePanel = "stickers"
//   • Style      → stub (Saved Styles is a future batch)
//
// Background row (all real as of Batch 6):
//   • Replace    → file picker → SET_BACKGROUND (photo)
//   • Effects    → opens EffectsTool modal (Batch 6)
//   • Crop       → opens CropTool modal (Batch 5)
//   • Resize     → opens ResizeTool modal (Batch 5)
//   • Flip/Rotate → opens FlipRotateTool modal (Batch 5)

"use client";

import { useRef, useState } from "react";
import {
  Crop as CropIcon,
  FilePlus,
  Image as ImageIcon,
  Maximize as ResizeIcon,
  RotateCw,
  Smile,
  Sparkles,
  Square,
  Type,
  Wand2,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import { DockButton } from "./DockButton";
import { SubscribeChip } from "./SubscribeChip";
import { createTextLayer } from "@/lib/photo-editor/rich-text/factory";
import { createImageLayer } from "@/lib/photo-editor/canvas/factories";
import { centreLayerOnCanvas } from "@/lib/photo-editor/canvas/selection";
import { MAX_CANVAS_DIMENSION } from "@/lib/photo-editor/types";
import type { Background } from "@/lib/photo-editor/types";
import type { ActivePanel } from "../EditorShell";

type TogglePanel = (panel: Exclude<ActivePanel, null>) => () => void;

interface BottomDockProps {
  activePanel: ActivePanel;
  onTogglePanel: TogglePanel;
  onStub: (label: string) => void;
  onOpenCrop: () => void;
  onOpenResize: () => void;
  onOpenFlipRotate: () => void;
  /** Open the Effects modal (Batch 6). */
  onOpenEffects: () => void;
}

export function BottomDock({
  activePanel,
  onTogglePanel,
  onStub,
  onOpenCrop,
  onOpenResize,
  onOpenFlipRotate,
  onOpenEffects,
}: BottomDockProps) {
  const { state, dispatch } = useEditor();
  const { beginEditing } = useMobileEdit();

  const photoLayerInputRef = useRef<HTMLInputElement>(null);
  const replaceBgInputRef = useRef<HTMLInputElement>(null);

  const [adding, setAdding] = useState(false);

  function handleAddText() {
    const project = state.project;
    const baseLayer = createTextLayer({ width: 800, text: "" });
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
      <DockSectionHeader title="Add Layer" trailing={<SubscribeChip compact />} />
      <DockRow>
        <DockButton
          icon={<Type className="w-6 h-6" strokeWidth={2} />}
          label="Add Text"
          onClick={handleAddText}
          accent={{
            from: "#3FB6E6",
            to: "#1B5B50",
            iconColor: "#FFFFFF",
          }}
        />
        <DockButton
          icon={<ImageIcon className="w-6 h-6" strokeWidth={1.75} />}
          label="Photo"
          onClick={() => photoLayerInputRef.current?.click()}
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
