// src/components/photo-editor/colour/ColorPickerModal.tsx
//
// Shared full-screen colour picker modal — Q2 = A. Matches the reference
// app's "Select Color" dialog from Image 1:
//
//   ┌─────────────────────────────────────┐
//   │           Select Color              │
//   │                                     │
//   │  ┌───────────────────┐  ┌──┐        │
//   │  │                   │  │  │        │
//   │  │   sat / light     │  │ h│        │
//   │  │      square       │  │ u│        │
//   │  │                   │  │ e│        │
//   │  └───────────────────┘  └──┘        │
//   │                                     │
//   │  ┌────┐ → ┌────┐    # 1B5B50       │
//   │  │ old│   │new │                   │
//   │  └────┘   └────┘                   │
//   │                                     │
//   │  ⊕ Add to Favorites                │
//   │                                     │
//   │           CANCEL          OK        │
//   └─────────────────────────────────────┘
//
// Behaviour (Q11 = A — live preview):
//
//   • Modal opens with the layer's current colour as `initial`.
//   • Internal `current` state seeds from `initial`; the SV / hue
//     drag handlers update `current` AND fire `onPreview` so the
//     layer behind the modal reflects the new colour live.
//   • OK fires `onCommit(current)` and closes; the layer's already
//     at the right colour because of the preview stream.
//   • CANCEL fires `onPreview(initial)` to revert and closes.
//   • Hex input is editable (Q22 = B); typing a valid 6-char hex
//     updates everything else live.
//   • Add to Favorites pushes the current hex into the favourites
//     store (hue-ordered, max 12).

"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { HsvPicker } from "@/components/photo-editor/text-tools/HsvPicker";
import { addFavourite } from "@/lib/photo-editor/colour/favourites";

interface ColorPickerModalProps {
  open: boolean;
  /** Colour at modal open time. Used for the "old" preview box and
   *  for revert-on-cancel. */
  initial: string;
  /** Live preview as the user drags. The parent should dispatch this
   *  to whichever layer field the picker drives. */
  onPreview: (hex: string) => void;
  /** Commit — fired on OK. Parent typically does the same dispatch
   *  as onPreview, but the explicit signal lets it know to close any
   *  history coalescing window. */
  onCommit: (hex: string) => void;
  /** Cancel — fired on backdrop tap, ✕, or Cancel button. The modal
   *  will have already called `onPreview(initial)` to revert before
   *  invoking this, so the parent can just close the dialog. */
  onCancel: () => void;
}

function isValidHex(s: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(s.trim());
}

function normaliseHex(s: string): string {
  const m = s.trim().match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return s;
  return "#" + m[1].toUpperCase();
}

export function ColorPickerModal({
  open,
  initial,
  onPreview,
  onCommit,
  onCancel,
}: ColorPickerModalProps) {
  const [current, setCurrent] = useState<string>(initial);
  const [hexInput, setHexInput] = useState<string>(initial.replace("#", ""));
  const initialRef = useRef(initial);

  // Sync internal state to a fresh `initial` when the modal re-opens
  // for a different field. We deliberately key on `open` going from
  // false → true so reopening the same modal resets state.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setCurrent(initial);
      setHexInput(initial.replace("#", "").toUpperCase());
      initialRef.current = initial;
    }
    wasOpenRef.current = open;
  }, [open, initial]);

  if (!open) return null;

  function applyColour(hex: string) {
    const norm = normaliseHex(hex);
    setCurrent(norm);
    setHexInput(norm.replace("#", ""));
    onPreview(norm);
  }

  function onHexInputChange(raw: string) {
    // Accept input as-is; only apply when 6 valid hex chars.
    setHexInput(raw.replace("#", "").toUpperCase().slice(0, 6));
    if (isValidHex(raw)) {
      applyColour(raw);
    }
  }

  function onAddFavourite() {
    addFavourite(current);
  }

  function commit() {
    onCommit(current);
  }

  function cancel() {
    onPreview(initialRef.current);
    onCancel();
  }

  return (
    <>
      {/* Backdrop — tap to cancel. */}
      <div
        onClick={cancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.55)",
          zIndex: 500,
        }}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select Color"
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(92vw, 420px)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#FFFFFF",
          color: "#1F2937",
          borderRadius: 16,
          boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
          zIndex: 501,
          padding: "20px 18px 16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div
          style={{
            textAlign: "center",
            fontSize: 18,
            fontWeight: 500,
            marginBottom: 16,
            color: "#374151",
          }}
        >
          Select Color
        </div>

        {/* HSV picker (sat/light square + vertical hue strip) — we
            reuse the existing HsvPicker which does both in one block. */}
        <div style={{ marginBottom: 16 }}>
          <HsvPicker value={current} onChange={applyColour} />
        </div>

        {/* Old → new preview + hex input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PreviewBox colour={initialRef.current} ariaLabel="Original colour" />
            <span aria-hidden style={{ color: "#9CA3AF" }}>→</span>
            <PreviewBox colour={current} ariaLabel="New colour" />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: "auto",
              fontSize: 14,
            }}
          >
            <span aria-hidden style={{ color: "#9CA3AF" }}>#</span>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => onHexInputChange(e.target.value)}
              aria-label="Hex colour code"
              maxLength={6}
              style={{
                width: 84,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 14,
                padding: "4px 6px",
                border: "none",
                borderBottom: "1px solid #9CA3AF",
                outline: "none",
                background: "transparent",
                color: "#1F2937",
                textTransform: "uppercase",
              }}
              spellCheck={false}
              autoCapitalize="characters"
              autoCorrect="off"
            />
          </div>
        </div>

        {/* Add to Favorites */}
        <button
          type="button"
          onClick={onAddFavourite}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: 0,
            background: "transparent",
            border: "none",
            color: "#1F2937",
            fontSize: 14,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#1F2937",
              color: "#FFFFFF",
            }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} aria-hidden />
          </span>
          <span>Add to Favorites</span>
        </button>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={cancel}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              color: "#1F2937",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={commit}
            style={{
              padding: "10px 24px",
              background: "#000000",
              color: "#FFFFFF",
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            OK
          </button>
        </div>

        {/* Top-right close — small × matching the reference's
            implicit "close" affordance. Optional cosmetic. */}
        <button
          type="button"
          onClick={cancel}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "transparent",
            border: "none",
            color: "#9CA3AF",
            cursor: "pointer",
            padding: 6,
          }}
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </>
  );
}

function PreviewBox({ colour, ariaLabel }: { colour: string; ariaLabel: string }) {
  return (
    <div
      role="img"
      aria-label={`${ariaLabel} ${colour}`}
      style={{
        width: 56,
        height: 32,
        background: colour,
        border: "2px solid #1F2937",
      }}
    />
  );
}
