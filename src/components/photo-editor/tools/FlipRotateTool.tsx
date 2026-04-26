// src/components/photo-editor/tools/FlipRotateTool.tsx
//
// Full-screen modal for rotating and flipping the project's background
// photo. Mirrors the reference Add Text app's Flip/Rotate screen
// (Image 6 from the design brief).
//
// Operations exposed:
//   • Rotate left  → bg.rotation = (current + 270) mod 360
//   • Rotate right → bg.rotation = (current + 90)  mod 360
//   • Flip H       → bg.flip.horizontal = !current
//   • Flip V       → bg.flip.vertical   = !current
//
// Live preview: an <img> inside the modal with CSS transforms matching
// the draft state. CSS transforms are pixel-cheap and instantly
// reactive — no need to spin up a second Konva stage just to preview
// "what would this image look like rotated 90° and flipped?"
//
// We keep the modal open between operations (rotate-rotate-flip is one
// continuous editing flow) and only commit the draft to the project on
// ✓. Cancel restores the original.
//
// Constraint: the tool only makes sense for photo backgrounds. If the
// modal is opened with a non-photo background, we render a friendly
// "Add a photo first" message instead of operations. This shouldn't
// happen in practice because BottomDock guards the entry, but the
// message is a defensive fallback.

"use client";

import { useEffect, useState } from "react";
import { FlipHorizontal, FlipVertical, RotateCcw, RotateCw } from "lucide-react";
import { ToolModal } from "./ToolModal";
import { useEditor } from "../context/EditorContext";
import type { Background } from "@/lib/photo-editor/types";

interface FlipRotateToolProps {
  open: boolean;
  onClose: () => void;
}

type Rotation = 0 | 90 | 180 | 270;

interface DraftState {
  rotation: Rotation;
  flipH: boolean;
  flipV: boolean;
}

export function FlipRotateTool({ open, onClose }: FlipRotateToolProps) {
  const { state, dispatch } = useEditor();
  const bg = state.project.background;
  const photoBg: Extract<Background, { kind: "photo" }> | null =
    bg.kind === "photo" ? bg : null;

  // Initial draft snapshots the current photo's rotation/flip state.
  // Re-snapshot whenever the modal opens so the user can iterate.
  const [draft, setDraft] = useState<DraftState>({
    rotation: 0,
    flipH: false,
    flipV: false,
  });

  useEffect(() => {
    if (!open) return;
    if (!photoBg) return;
    setDraft({
      rotation: photoBg.rotation,
      flipH: photoBg.flip.horizontal,
      flipV: photoBg.flip.vertical,
    });
  }, [open, photoBg]);

  function handleApply() {
    if (!photoBg) {
      onClose();
      return;
    }
    const next: Background = {
      ...photoBg,
      rotation: draft.rotation,
      flip: { horizontal: draft.flipH, vertical: draft.flipV },
    };
    dispatch({ type: "SET_BACKGROUND", background: next });
    onClose();
  }

  if (!open) return null;

  // Defensive: if the user somehow gets here without a photo background,
  // show a friendly message rather than blowing up. The bottom dock
  // does guard this entry but defence in depth is cheap.
  if (!photoBg) {
    return (
      <ToolModal
        open={open}
        title="Flip / Rotate"
        onCancel={onClose}
        onApply={onClose}
      >
        <div className="flex-1 flex items-center justify-center p-6">
          <p
            className="text-center max-w-sm"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Flip and Rotate work on a photo background. Tap Replace in
            the dock to add a photo first.
          </p>
        </div>
      </ToolModal>
    );
  }

  return (
    <ToolModal
      open={open}
      title="Flip / Rotate"
      onCancel={onClose}
      onApply={handleApply}
      bottom={
        <BottomBar
          onRotateLeft={() =>
            setDraft((d) => ({
              ...d,
              rotation: addRotation(d.rotation, -90),
            }))
          }
          onRotateRight={() =>
            setDraft((d) => ({
              ...d,
              rotation: addRotation(d.rotation, 90),
            }))
          }
          onFlipH={() => setDraft((d) => ({ ...d, flipH: !d.flipH }))}
          onFlipV={() => setDraft((d) => ({ ...d, flipV: !d.flipV }))}
        />
      }
    >
      {/* Live preview ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <Preview
          src={photoBg.src}
          rotation={draft.rotation}
          flipH={draft.flipH}
          flipV={draft.flipV}
        />
      </div>
    </ToolModal>
  );
}

// ─── Preview ────────────────────────────────────────────────────
//
// CSS transform handles rotation + scale (= flip). The image is
// constrained to fit the available area; rotation by 90/270 swaps the
// effective bounds, which we account for by sizing the wrapper square
// (max-side) so neither orientation overflows.

function Preview({
  src,
  rotation,
  flipH,
  flipV,
}: {
  src: string;
  rotation: Rotation;
  flipH: boolean;
  flipV: boolean;
}) {
  const transform = [
    `rotate(${rotation}deg)`,
    `scaleX(${flipH ? -1 : 1})`,
    `scaleY(${flipV ? -1 : 1})`,
  ].join(" ");

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: "min(80vw, 80vh)",
        height: "min(80vw, 80vh)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="max-w-full max-h-full"
        style={{
          transform,
          transformOrigin: "center center",
          transition:
            "transform 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
          objectFit: "contain",
        }}
        draggable={false}
      />
    </div>
  );
}

// ─── Bottom-bar controls ────────────────────────────────────────

function BottomBar({
  onRotateLeft,
  onRotateRight,
  onFlipH,
  onFlipV,
}: {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
}) {
  return (
    <div className="flex items-center justify-around px-4 py-4">
      <ControlButton
        icon={<RotateCcw className="w-6 h-6" strokeWidth={1.75} />}
        label="Rotate left"
        onClick={onRotateLeft}
      />
      <ControlButton
        icon={<RotateCw className="w-6 h-6" strokeWidth={1.75} />}
        label="Rotate right"
        onClick={onRotateRight}
      />
      <ControlButton
        icon={<FlipHorizontal className="w-6 h-6" strokeWidth={1.75} />}
        label="Flip horizontally"
        onClick={onFlipH}
      />
      <ControlButton
        icon={<FlipVertical className="w-6 h-6" strokeWidth={1.75} />}
        label="Flip vertically"
        onClick={onFlipV}
      />
    </div>
  );
}

function ControlButton({
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
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-colors"
      style={{ color: "#FFFFFF" }}
    >
      <span
        className="w-12 h-12 inline-flex items-center justify-center rounded-full"
        style={{ background: "rgba(255,255,255,0.10)" }}
      >
        {icon}
      </span>
      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>
        {label.replace(" ", "\u00a0").split("\u00a0")[0]}
      </span>
    </button>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function addRotation(current: Rotation, delta: number): Rotation {
  const next = ((current + delta) % 360 + 360) % 360;
  return next as Rotation;
}
