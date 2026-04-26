// src/components/photo-editor/toolbar/AddLayerSheet.tsx
//
// Bottom-sheet modal triggered by the "+" button in the editor top bar.
// Mirrors the dock's Add Layer row — Add Text / Photo / Shape / Sticker
// / Style — so the action is one tap away regardless of how the user is
// scrolled or which panel is open.
//
// Behaviour:
//   • Backdrop tap or Cancel button closes the sheet
//   • Any action button performs its action AND closes the sheet
//   • Slides up from the bottom edge with a 200ms transform transition
//   • Z-index sits above all panel drawers (220) and above the canvas
//     but below the EraseTool / future Crop modal (which use 300)
//
// Batch 3: Add Text now also opens the BottomEditDrawer (via
// useMobileEdit().beginEditing) for the new layer in `isFresh` mode,
// so users land in the keyboard ready to type. Cancelling the drawer
// before typing tidies up the empty layer.

"use client";

import { useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Smile,
  Sparkles,
  Square,
  Type,
  X,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import { createTextLayer } from "@/lib/photo-editor/rich-text/factory";
import { createImageLayer } from "@/lib/photo-editor/canvas/factories";
import { centreLayerOnCanvas } from "@/lib/photo-editor/canvas/selection";
import { MAX_CANVAS_DIMENSION } from "@/lib/photo-editor/types";
import type { ActivePanel } from "../EditorShell";

interface AddLayerSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenPanel: (panel: Exclude<ActivePanel, null>) => void;
  onStub: (label: string) => void;
}

export function AddLayerSheet({
  open,
  onClose,
  onOpenPanel,
  onStub,
}: AddLayerSheetProps) {
  const { state, dispatch } = useEditor();
  const { beginEditing } = useMobileEdit();
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
    onClose();
  }

  async function handlePickPhoto(file: File) {
    if (!file.type.startsWith("image/")) return;
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
      onClose();
    } catch {
      URL.revokeObjectURL(objectUrl);
      onStub("Couldn't read that image");
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[220] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "var(--pe-overlay)" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add layer"
        className={`fixed left-0 right-0 bottom-0 z-[221] transition-transform duration-200 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          background: "var(--pe-toolbar-bg)",
          borderTop: "1px solid var(--pe-toolbar-border)",
          boxShadow: "var(--pe-shadow-lg)",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <span
            className="block rounded-full"
            style={{
              width: 36,
              height: 4,
              background: "var(--pe-border-strong)",
            }}
          />
        </div>

        <div className="flex items-center justify-between px-4 pt-1 pb-2">
          <span
            className="text-[15px] font-semibold"
            style={{ color: "var(--pe-text)" }}
          >
            Add Layer
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add layer sheet"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--pe-tool-icon)" }}
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 px-4 pt-1 pb-4">
          <SheetButton
            icon={<Type className="w-6 h-6" strokeWidth={2} />}
            label="Text"
            onClick={handleAddText}
            accent={{ from: "#3FB6E6", to: "#1B5B50", iconColor: "#FFFFFF" }}
          />
          <SheetButton
            icon={<ImageIcon className="w-6 h-6" strokeWidth={1.75} />}
            label="Photo"
            onClick={() => photoInputRef.current?.click()}
          />
          <SheetButton
            icon={<Square className="w-6 h-6" strokeWidth={1.75} />}
            label="Shape"
            onClick={() => {
              onOpenPanel("shapes");
              onClose();
            }}
          />
          <SheetButton
            icon={<Smile className="w-6 h-6" strokeWidth={1.75} />}
            label="Sticker"
            onClick={() => {
              onOpenPanel("stickers");
              onClose();
            }}
          />
          {/* Second row */}
          <SheetButton
            icon={<Sparkles className="w-6 h-6" strokeWidth={1.75} />}
            label="Style"
            onClick={() => {
              onClose();
              onStub("Saved Styles — coming soon");
            }}
          />
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void handlePickPhoto(file);
          }}
        />
      </div>
    </>
  );
}

// ─── Sheet button ───────────────────────────────────────────────

function SheetButton({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: { from: string; to: string; iconColor: string };
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-colors"
      style={{
        background: "var(--pe-surface)",
        border: "1px solid var(--pe-border)",
      }}
    >
      <span
        className="inline-flex items-center justify-center rounded-2xl"
        style={{
          width: 44,
          height: 44,
          background: accent
            ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
            : "var(--pe-surface-2)",
          color: accent ? accent.iconColor : "var(--pe-tool-icon)",
          boxShadow: accent ? "0 2px 6px rgba(0,0,0,0.10)" : "none",
        }}
      >
        {icon}
      </span>
      <span
        className="text-[12px] font-medium"
        style={{ color: "var(--pe-text)" }}
      >
        {label}
      </span>
    </button>
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
