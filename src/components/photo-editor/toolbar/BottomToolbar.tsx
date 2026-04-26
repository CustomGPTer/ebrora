// src/components/photo-editor/toolbar/BottomToolbar.tsx
//
// Bottom toolbar — the host for tool / action buttons across the foot of
// the editor.
//
// Layout (left → right):
//   • Layer-creation cluster (always visible):
//       Add Text, Add Image, Add Sticker, Add Shape
//   • Vertical divider
//   • Primary tool row (visible only when exactly one text layer is
//     selected):
//       Font (Session 4)
//       Format / Color / Stroke / Highlight / Shadow / Position
//         (Batch C of Session 5)
//       Erase (Session 6 — opens the full-screen erase modal)
//
// Selection rules for the primary tool row:
//   • Selection length must be exactly 1
//   • That selection must be a text layer
//   • Mixed selections (multi-select with non-text members, or no
//     selection) collapse the row away
//
// Panel state is owned by EditorShell via its `activePanel` discriminator.
// We receive the current value plus a per-panel toggle factory and wire
// each tool button to the matching panel id. No parallel boolean flags.
//
// The Erase button's `activePanel === "erase"` lights the button while
// the erase modal is open, mirroring how the side-drawer panels behave —
// EditorShell extends the activePanel union with "erase" in this same
// session so this stays consistent (gotcha #27 — extend the union, don't
// fork).

"use client";

import { useMemo, useRef } from "react";
import {
  AlignLeft,
  Baseline,
  Cloud,
  Eraser,
  Highlighter,
  ImageIcon,
  Move,
  Palette,
  Pencil,
  Smile,
  Square,
  Type,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { ToolButton } from "./ToolButton";
import { ToolDivider } from "./ToolDivider";
import { createTextLayer } from "@/lib/photo-editor/rich-text/factory";
import { createImageLayer } from "@/lib/photo-editor/canvas/factories";
import { centreLayerOnCanvas } from "@/lib/photo-editor/canvas/selection";
import { MAX_CANVAS_DIMENSION } from "@/lib/photo-editor/types";
import type { TextLayer } from "@/lib/photo-editor/types";
import type { ActivePanel } from "../EditorShell";

type TogglePanel = (panel: Exclude<ActivePanel, null>) => () => void;

interface BottomToolbarProps {
  activePanel: ActivePanel;
  onTogglePanel: TogglePanel;
}

export function BottomToolbar({
  activePanel,
  onTogglePanel,
}: BottomToolbarProps) {
  const { dispatch, state } = useEditor();

  // The primary tool row surfaces only when a text layer is the sole
  // selection (matches the spec — "show only when a text layer is
  // selected"). Multi-select with mixed kinds collapses back to the
  // layer-creation actions.
  const selectedTextLayer = useMemo<TextLayer | null>(() => {
    if (state.selection.length !== 1) return null;
    const id = state.selection[0];
    const layer = state.project.layers.find((l) => l.id === id);
    if (!layer || layer.kind !== "text") return null;
    return layer as TextLayer;
  }, [state.selection, state.project.layers]);

  function handleAddText() {
    const project = state.project;

    // Default text layer — black sans-serif 96px word "Text", text box
    // width 800px (matches the engine sandbox defaults). Then centred
    // on the canvas via the layout's natural dimensions.
    const baseLayer = createTextLayer({ width: 800 });
    const positioned = centreLayerOnCanvas(
      baseLayer,
      project.width,
      project.height,
    );

    dispatch({ type: "ADD_LAYER", layer: positioned });
    dispatch({ type: "SET_SELECTION", ids: [positioned.id] });
  }

  // Hidden file input for Add Image — opened programmatically when the
  // Add Image button is tapped. Same flow EmptyState uses for the photo
  // background, applied here to a layer-level image instead.
  async function handleAddImage(file: File) {
    if (!file.type.startsWith("image/")) return;

    const objectUrl = URL.createObjectURL(file);
    let dim: { naturalWidth: number; naturalHeight: number };
    try {
      dim = await loadImageDimensions(objectUrl);
    } catch {
      // If the file can't be decoded, drop the object URL and bail.
      URL.revokeObjectURL(objectUrl);
      return;
    }

    // Clamp the *initial display size* of an inserted image so it doesn't
    // blow past the canvas. This is purely cosmetic — the underlying
    // naturalWidth / naturalHeight stay accurate so future tools (crop,
    // export at native resolution) get the real pixel dimensions.
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

    // centreLayerOnCanvas works off naturalSize (un-scaled); when we
    // pass scaleX/scaleY < 1 the visible image ends up off-centre toward
    // the top-left. Compute the centred transform manually so the
    // *visible* image (natural × scale) sits at the canvas centre.
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
  }

  return (
    <div
      className="flex-none flex items-center"
      style={{
        height: 72,
        borderTop: "1px solid var(--pe-toolbar-border)",
        background: "var(--pe-toolbar-bg)",
      }}
    >
      {/* Horizontal scroll container so the button row degrades
          gracefully on very narrow viewports as more buttons join. */}
      <div
        className="flex items-stretch gap-1 px-3 overflow-x-auto"
        style={{
          width: "100%",
          height: "100%",
          // Hide the scrollbar visually while keeping the area scrollable
          // (consistency across browsers).
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* ── Layer-creation cluster (always visible) ─────────── */}
        <ToolButton
          icon={<Type className="w-5 h-5" strokeWidth={1.75} />}
          label="Add Text"
          onClick={handleAddText}
        />
        <AddImageButton onPick={handleAddImage} />
        <ToolButton
          icon={<Smile className="w-5 h-5" strokeWidth={1.75} />}
          label="Add Sticker"
          onClick={onTogglePanel("stickers")}
          active={activePanel === "stickers"}
        />
        <ToolButton
          icon={<Square className="w-5 h-5" strokeWidth={1.75} />}
          label="Add Shape"
          onClick={onTogglePanel("shapes")}
          active={activePanel === "shapes"}
        />

        {/* ── Divider — only when the primary tool row is visible.
                Hiding it when the row collapses keeps the toolbar from
                looking like it has a trailing decoration. ─────────── */}
        {selectedTextLayer ? <ToolDivider /> : null}

        {/* ── Primary tool row (text-layer-selected only) ─────── */}
        {selectedTextLayer ? (
          <>
            <ToolButton
              icon={<Baseline className="w-5 h-5" strokeWidth={1.75} />}
              label="Font"
              onClick={onTogglePanel("fonts")}
              active={activePanel === "fonts"}
            />
            <ToolButton
              icon={<AlignLeft className="w-5 h-5" strokeWidth={1.75} />}
              label="Format"
              onClick={onTogglePanel("format")}
              active={activePanel === "format"}
            />
            <ToolButton
              icon={<Palette className="w-5 h-5" strokeWidth={1.75} />}
              label="Color"
              onClick={onTogglePanel("color")}
              active={activePanel === "color"}
            />
            <ToolButton
              icon={<Pencil className="w-5 h-5" strokeWidth={1.75} />}
              label="Stroke"
              onClick={onTogglePanel("stroke")}
              active={activePanel === "stroke"}
            />
            <ToolButton
              icon={<Highlighter className="w-5 h-5" strokeWidth={1.75} />}
              label="Highlight"
              onClick={onTogglePanel("highlight")}
              active={activePanel === "highlight"}
            />
            <ToolButton
              icon={<Cloud className="w-5 h-5" strokeWidth={1.75} />}
              label="Shadow"
              onClick={onTogglePanel("shadow")}
              active={activePanel === "shadow"}
            />
            <ToolButton
              icon={<Move className="w-5 h-5" strokeWidth={1.75} />}
              label="Position"
              onClick={onTogglePanel("position")}
              active={activePanel === "position"}
            />
            <ToolButton
              icon={<Eraser className="w-5 h-5" strokeWidth={1.75} />}
              label="Erase"
              onClick={onTogglePanel("erase")}
              active={activePanel === "erase"}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Add Image button ───────────────────────────────────────────
//
// Wraps a hidden <input type="file"> so tapping the visible ToolButton
// opens the OS file picker. Picking a file fires onPick. Resetting the
// input's value after each pick lets the user re-pick the same file
// later (browsers don't fire `change` for an unchanged value).

function AddImageButton({
  onPick,
}: {
  onPick: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <ToolButton
        icon={<ImageIcon className="w-5 h-5" strokeWidth={1.75} />}
        label="Add Image"
        onClick={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset before the async work so re-picking the same file
          // later still fires `change`.
          e.target.value = "";
          if (file) void onPick(file);
        }}
      />
    </>
  );
}

// ─── Image dimension probe ──────────────────────────────────────
//
// Same technique as EmptyState.tsx — synthesise an HTMLImageElement
// from the object URL and read its natural dimensions on load. We
// don't share the helper because EmptyState is for the photo
// background (a Project-level concern) and this is for layer-level
// images. Two callers, two short helpers — the duplication is tiny.

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
