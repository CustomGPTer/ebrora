// src/components/photo-editor/toolbar/AddLayerSheet.tsx
//
// Dropdown popover triggered by the "+" button in the editor top bar.
// Mirrors the reference Add-Text-on-Photo app's Add Layer popover —
// a small white card anchored under the trigger with a vertical list
// of six items:
//
//      ┌──────────────────────────┐
//      │  T  Text                  │
//      │  ⫷  Style                 │
//      │  📷+ Photo                │
//      │  △○ Shape                 │
//      │  😀 Sticker               │
//      │  🖼 Background            │
//      └──────────────────────────┘
//
// Behaviour:
//   • Backdrop tap, Escape key, scroll, or any item tap closes the
//     popover.
//   • Any action button performs its action AND closes the popover.
//   • The card is positioned via `getBoundingClientRect()` on the
//     anchor ref — top edge sits 8px below the anchor's bottom edge,
//     right edge aligned with the anchor's right edge so the card
//     visually "drops out" of the + icon. If the card would overflow
//     the right viewport edge, we clamp the right edge to 8px from
//     the viewport edge.
//   • Z-index 220 — above all panel drawers, below EraseTool / future
//     Crop modal (which use 300).
//
// Batch A — Apr 2026: replaced the previous full-width bottom sheet
// (drag handle, "Try PRO" trailing chip, four-cell tile grid) with
// this anchored dropdown to match the reference exactly. The five-
// tile add-layer grid still exists in the BottomDock when no layer
// is selected — that's the primary entry point. This popover is
// the secondary, top-bar-anchored entry point.
//
// On "Add Text" the popover also opens the BottomEditDrawer (via
// useMobileEdit().beginEditing) for the new layer in `isFresh` mode,
// so users land in the keyboard ready to type. Cancelling the drawer
// before typing tidies up the empty layer.

"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  Image as ImageIcon,
  ImagePlus,
  Layers as StyleIcon,
  Shapes,
  Smile,
  Type,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { useMobileEdit } from "../context/MobileEditContext";
import { createDefaultTextForCanvas } from "@/lib/photo-editor/rich-text/factory";
import { createImageLayer } from "@/lib/photo-editor/canvas/factories";
import { centreLayerOnCanvas } from "@/lib/photo-editor/canvas/selection";
import { MAX_CANVAS_DIMENSION } from "@/lib/photo-editor/types";
import type { ActivePanel } from "../EditorShell";

interface AddLayerSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenPanel: (panel: Exclude<ActivePanel, null>) => void;
  onStub: (label: string) => void;
  /** Ref to the trigger button (the "+" in the editor top bar). The
   *  popover positions itself under this element. */
  anchorRef: RefObject<HTMLButtonElement | null>;
}

interface PopoverPosition {
  top: number;
  right: number;
}

const POPOVER_WIDTH = 240;
const POPOVER_OFFSET_Y = 8; // gap between anchor bottom edge and card top
const VIEWPORT_PADDING = 8;

export function AddLayerSheet({
  open,
  onClose,
  onOpenPanel,
  onStub,
  anchorRef,
}: AddLayerSheetProps) {
  const { state, dispatch } = useEditor();
  const { beginEditing, focusForKeyboardPop } = useMobileEdit();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  // Compute popover position whenever it opens or the viewport changes.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    function compute() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      // Right-align with the anchor by default — the popover's right
      // edge sits at the anchor's right edge.
      let right = window.innerWidth - rect.right;
      // Clamp so the popover never overflows the viewport.
      if (right < VIEWPORT_PADDING) right = VIEWPORT_PADDING;
      const maxRight = window.innerWidth - POPOVER_WIDTH - VIEWPORT_PADDING;
      if (right > maxRight) right = Math.max(VIEWPORT_PADDING, maxRight);
      setPosition({
        top: rect.bottom + POPOVER_OFFSET_Y,
        right,
      });
    }
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, anchorRef]);

  // Close on Escape.
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
    // Phase 1 keyboard-pop fix — see MobileEditContext.focusForKeyboardPop.
    // Must run synchronously inside the user-gesture handler before
    // the dispatch so iOS / Android pop the keyboard.
    focusForKeyboardPop();
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
      {/* Always-mounted file input so the ref is stable across
       *  open/close cycles. The photo flow triggers it
       *  programmatically via photoInputRef.current.click(). */}
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

      {open && position && (
        <>
          {/* Invisible backdrop — captures outside taps to close. No
           *  visible dimming, matches the reference's lightweight
           *  popover. */}
          <div
            className="fixed inset-0 z-[219]"
            onClick={onClose}
            aria-hidden
          />

          {/* Popover card */}
          <div
            ref={cardRef}
            role="menu"
            aria-label="Add layer"
            className="fixed z-[220] overflow-hidden"
            style={{
              top: position.top,
              right: position.right,
              width: POPOVER_WIDTH,
              background: "var(--pe-toolbar-bg)",
              border: "1px solid var(--pe-border)",
              borderRadius: 12,
              boxShadow: "var(--pe-shadow-lg)",
              paddingTop: 6,
              paddingBottom: 6,
            }}
          >
            <PopoverItem
              icon={<Type className="w-5 h-5" strokeWidth={2} />}
              label="Text"
              onClick={handleAddText}
            />
            <PopoverItem
              icon={<StyleIcon className="w-5 h-5" strokeWidth={1.75} />}
              label="Style"
              onClick={() => {
                onClose();
                onStub("Saved Styles — coming soon");
              }}
            />
            <PopoverItem
              icon={<ImagePlus className="w-5 h-5" strokeWidth={1.75} />}
              label="Photo"
              onClick={() => photoInputRef.current?.click()}
            />
            <PopoverItem
              icon={<Shapes className="w-5 h-5" strokeWidth={1.75} />}
              label="Shape"
              onClick={() => {
                onOpenPanel("shapes");
                onClose();
              }}
            />
            <PopoverItem
              icon={<Smile className="w-5 h-5" strokeWidth={1.75} />}
              label="Sticker"
              onClick={() => {
                onOpenPanel("stickers");
                onClose();
              }}
            />
            <PopoverItem
              icon={<ImageIcon className="w-5 h-5" strokeWidth={1.75} />}
              label="Background"
              onClick={() => {
                // Background editing lives in the no-selection
                // BottomDock. Clearing the selection surfaces the
                // Background section — the closest analogue to
                // "open background tools" without a dedicated panel.
                dispatch({ type: "SET_SELECTION", ids: [] });
                onClose();
              }}
            />
          </div>
        </>
      )}
    </>
  );
}

// ─── Popover item ──────────────────────────────────────────────

function PopoverItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
      style={{
        color: "var(--pe-text)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--pe-surface-2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "transparent";
      }}
    >
      <span
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: 24,
          height: 24,
          color: "var(--pe-tool-icon)",
        }}
      >
        {icon}
      </span>
      <span className="text-[15px] font-medium">{label}</span>
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
