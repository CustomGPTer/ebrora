// src/components/photo-editor/text-tools/ColorPicker.tsx
//
// The new colour-picking surface. Replaces the old segmented-control
// (Swatches / Picker / Pick) ColorPanel. Drop-in: takes `value` and
// `onChange`, used by every panel that needs a colour.
//
// Layout (one horizontal scrollable strip):
//
//   [current] [⊘ eyedropper] [🎨 palette] [favs ≤12] [200 standard]
//      ↑                                              ↑
//   pinned far-left (Q21 = A) — does NOT scroll       scroll past
//
// Behaviours:
//
//   • Tap a swatch / favourite — applies instantly (Q6 = A).
//     Selection ring (accent green) is drawn around any swatch
//     whose hex matches `value`.
//   • Tap eyedropper — engages CanvasPickerContext. The existing
//     CanvasPickerOverlay shows the loupe (Q15 / 20). Icon shows
//     active state while picking. Tap again to cancel.
//   • Tap palette — opens ColorPickerModal (Image 1 layout). Live
//     preview, hex editable, favourites button.
//   • Current chip — at the very start (Q21 = A). Always visible,
//     reflects the active colour even if not in the palette.
//     Tapping it opens the palette modal as a shortcut.
//
// May 2026 — new colour system build.

"use client";

import { useState } from "react";
import { Palette, Pipette } from "lucide-react";
import { useCanvasPicker } from "../context/CanvasPickerContext";
import { ColorPickerModal } from "./ColorPickerModal";
import {
  STANDARD_PALETTE,
} from "@/lib/photo-editor/colour/swatch-palette";
import { useFavourites } from "@/lib/photo-editor/colour/favourites";

interface ColorPickerProps {
  /** Current hex (#RRGGBB). Empty string is allowed and treated as
   *  "no value" — the current chip is hidden. */
  value: string | null;
  onChange: (hex: string) => void;
  /** Optional label for the current-colour chip's aria description
   *  (e.g. "Fill colour" / "Stroke colour"). */
  ariaLabel?: string;
}

const ICON_SIZE = 44;
const SWATCH_SIZE = 40;
const SWATCH_GAP = 8;
const ACCENT = "#1B5B50";

export function ColorPicker({
  value,
  onChange,
  ariaLabel = "Colour",
}: ColorPickerProps) {
  const picker = useCanvasPicker();
  const favs = useFavourites();
  const [modalOpen, setModalOpen] = useState(false);

  const valueNorm = value ? value.toUpperCase() : null;

  // ── Eyedropper ────────────────────────────────────────────────
  function onEyedropperTap() {
    if (picker.isPicking) {
      picker.cancelPick();
      return;
    }
    picker.requestPick((hex) => {
      onChange(hex.toUpperCase());
    });
  }

  // ── Palette modal ─────────────────────────────────────────────
  function openModal() {
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
  }

  return (
    <>
      <div
        className="relative w-full"
        style={{
          // Outer strip wrapper. The current-chip + icons section is
          // pinned via position: sticky so it stays put as the user
          // scrolls the swatches.
        }}
      >
        <div
          className="flex items-center"
          style={{
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            paddingTop: 6,
            paddingBottom: 6,
          }}
        >
          {/* Pinned left cluster: current chip + eyedropper + palette.
              Sticky so it floats over the scrolling swatches. */}
          <div
            className="flex items-center flex-none"
            style={{
              position: "sticky",
              left: 0,
              background:
                "linear-gradient(to right, var(--pe-toolbar-bg) 0%, var(--pe-toolbar-bg) 80%, transparent 100%)",
              paddingRight: 8,
              gap: 6,
              zIndex: 2,
            }}
          >
            {/* Current colour chip (Q21 = A: far left, before icons).
                Tapping opens the palette modal. */}
            {valueNorm ? (
              <button
                type="button"
                onClick={openModal}
                aria-label={`${ariaLabel}: current ${valueNorm}. Open colour picker.`}
                className="flex-none inline-flex items-center justify-center"
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: SWATCH_SIZE - 4,
                    height: SWATCH_SIZE - 4,
                    borderRadius: "50%",
                    background: valueNorm,
                    boxShadow:
                      "inset 0 0 0 1px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)",
                  }}
                />
              </button>
            ) : null}

            {/* Eyedropper icon */}
            <IconButton
              ariaLabel={
                picker.isPicking ? "Cancel colour pick" : "Pick colour from canvas"
              }
              active={picker.isPicking}
              onClick={onEyedropperTap}
            >
              <Pipette className="w-5 h-5" strokeWidth={1.75} />
            </IconButton>

            {/* Palette icon */}
            <IconButton
              ariaLabel="Open custom colour picker"
              active={modalOpen}
              onClick={openModal}
            >
              <Palette className="w-5 h-5" strokeWidth={1.75} />
            </IconButton>
          </div>

          {/* Favourites strip */}
          {favs.length > 0 ? (
            <>
              {favs.map((hex) => (
                <Swatch
                  key={`fav-${hex}`}
                  hex={hex}
                  selected={valueNorm === hex.toUpperCase()}
                  onTap={() => onChange(hex.toUpperCase())}
                  isFavourite
                />
              ))}
              {/* Subtle divider between favs and the standard set. */}
              <div
                aria-hidden
                style={{
                  flex: "0 0 auto",
                  width: 1,
                  height: 28,
                  background: "var(--pe-border)",
                  margin: `0 ${SWATCH_GAP}px`,
                }}
              />
            </>
          ) : null}

          {/* 200 standard swatches */}
          {STANDARD_PALETTE.map((sw, i) => (
            <Swatch
              key={`std-${i}-${sw.hex}`}
              hex={sw.hex}
              selected={valueNorm === sw.hex}
              onTap={() => onChange(sw.hex)}
            />
          ))}
        </div>
      </div>

      <ColorPickerModal
        open={modalOpen}
        initial={valueNorm ?? "#000000"}
        onPreview={(hex) => onChange(hex)}
        onCommit={(hex) => {
          onChange(hex);
          closeModal();
        }}
        onCancel={closeModal}
      />
    </>
  );
}

// ─── Internal pieces ────────────────────────────────────────────

function IconButton({
  children,
  ariaLabel,
  active,
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className="flex-none inline-flex items-center justify-center transition-colors"
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        background: active ? ACCENT : "transparent",
        color: active ? "#FFFFFF" : "var(--pe-tool-icon)",
        border: "none",
        borderRadius: 8,
        padding: 0,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Swatch({
  hex,
  selected,
  onTap,
  isFavourite = false,
}: {
  hex: string;
  selected: boolean;
  onTap: () => void;
  isFavourite?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`${isFavourite ? "Favourite " : ""}colour ${hex}`}
      aria-pressed={selected}
      className="flex-none inline-flex items-center justify-center"
      style={{
        width: SWATCH_SIZE + SWATCH_GAP,
        height: SWATCH_SIZE,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: SWATCH_SIZE - 4,
          height: SWATCH_SIZE - 4,
          borderRadius: "50%",
          background: hex,
          boxShadow: selected
            ? `inset 0 0 0 1px rgba(0,0,0,0.12), 0 0 0 2.5px ${ACCENT}, 0 0 0 4px #FFFFFF`
            : "inset 0 0 0 1px rgba(0,0,0,0.12)",
          transition: "box-shadow 100ms ease",
        }}
      />
    </button>
  );
}
