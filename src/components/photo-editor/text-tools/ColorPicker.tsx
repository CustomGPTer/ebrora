// src/components/photo-editor/text-tools/ColorPicker.tsx
//
// The colour-picking surface. Drop-in: takes `value` and `onChange`,
// used by every panel that needs a colour.
//
// Layout (one horizontal scrollable strip):
//
//   ┌─ pinned (sticky, doesn't scroll) ─┐ ┌─ scrolls ──────────────────────────────┐
//   [⊘ eyedropper]  [🎨 palette]       [current chip?] [favs ≤5] [200 standard]
//
// May 2026 — chip-into-scroll + tighter icon gap + cap=5 + long-press.
//
// Behaviour notes:
//
//   • Current colour chip is the first item in the SCROLL region (it
//     used to be pinned far-left). It scrolls with favourites and
//     standard swatches. It's hidden when the active value matches
//     a favourite or a standard swatch — the matching swatch shows
//     the selection ring instead, so there's never a "double ring".
//   • When the active value matches BOTH a favourite AND a standard
//     swatch, the standard swatch wins the selection ring; the
//     favourite renders unselected. (Possible if the user added a
//     hex from the standard palette to favourites.)
//   • The gap between the eyedropper icon and the palette icon is
//     20% narrower than before (6px → 4.8px). Every other gap in
//     the strip is unchanged.
//   • Long-press (500ms) on a favourite swatch opens an in-app
//     "Remove favourite?" confirm dialog. Standard swatches and the
//     current chip do NOT respond to long-press. No haptic feedback
//     and no animation — instant reflow on confirm (per spec).
//   • Tap eyedropper — engages CanvasPickerContext. The existing
//     CanvasPickerOverlay shows the loupe. Icon shows active state
//     while picking. Tap again to cancel.
//   • Tap palette — opens ColorPickerModal. Live preview, hex
//     editable, "Add to Favourites" button.
//   • Tap a swatch / favourite / current chip — applies instantly.
//
// Long-press implementation note. We use pointer events (not touch)
// so the same code path handles mouse, pen, and touch. The timer is
// cancelled by pointerup, pointercancel, pointerleave, AND by a
// pointermove past a small distance threshold — the latter is so
// that dragging horizontally to scroll the strip never accidentally
// triggers the remove dialog. After the timer fires, a ref flag
// suppresses the click that would otherwise follow pointerup, so
// the colour isn't ALSO applied behind the dialog.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Palette, Pipette } from "lucide-react";
import { useCanvasPicker } from "../context/CanvasPickerContext";
import { ColorPickerModal } from "@/components/photo-editor/colour/ColorPickerModal";
import { Dialog, DialogCancelButton, DialogApplyButton } from "../tools/Dialog";
import { STANDARD_PALETTE } from "@/lib/photo-editor/colour/swatch-palette";
import {
  removeFavourite,
  useFavourites,
} from "@/lib/photo-editor/colour/favourites";

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
// 6px × 0.8 = 4.8px — 20% tighter than the previous cluster gap.
// Applied only between the eyedropper and the palette icons; every
// other inter-item spacing in the strip is unchanged.
const ICON_TO_ICON_GAP = 4.8;
const LONG_PRESS_MS = 500;
// 10px-squared distance threshold — pointermove past this cancels
// the long-press timer (lets the user scroll the strip without
// accidentally triggering the remove dialog).
const LONG_PRESS_MOVE_THRESHOLD_SQ = 100;
const ACCENT = "#1B5B50";

export function ColorPicker({
  value,
  onChange,
  ariaLabel = "Colour",
}: ColorPickerProps) {
  const picker = useCanvasPicker();
  const favs = useFavourites();
  const [modalOpen, setModalOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const valueNorm = value ? value.toUpperCase() : null;

  // Pre-compute membership so each swatch's `selected` is O(1) and
  // the chip-visibility rule is single-source.
  const isInStandard =
    !!valueNorm &&
    STANDARD_PALETTE.some((sw) => sw.hex.toUpperCase() === valueNorm);
  const isInFavs =
    !!valueNorm && favs.some((f) => f.toUpperCase() === valueNorm);
  // Current chip renders only for hexes that aren't already a swatch
  // somewhere in the strip — i.e. custom colours from the picker
  // modal or from the eyedropper.
  const showChip = !!valueNorm && !isInStandard && !isInFavs;

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

  // ── Long-press → remove favourite ─────────────────────────────
  function onFavLongPress(hex: string) {
    setRemoveTarget(hex.toUpperCase());
  }
  function confirmRemoveFavourite() {
    if (removeTarget) removeFavourite(removeTarget);
    setRemoveTarget(null);
  }
  function cancelRemoveFavourite() {
    setRemoveTarget(null);
  }

  return (
    <>
      <div className="relative w-full">
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
          {/* Pinned cluster: eyedropper + palette only. The current
              chip used to live here; it now sits in the scroll
              region as the first swatch. */}
          <div
            className="flex items-center flex-none"
            style={{
              position: "sticky",
              left: 0,
              background:
                "linear-gradient(to right, var(--pe-toolbar-bg) 0%, var(--pe-toolbar-bg) 80%, transparent 100%)",
              paddingRight: 8,
              gap: ICON_TO_ICON_GAP,
              zIndex: 2,
            }}
          >
            <IconButton
              ariaLabel={
                picker.isPicking ? "Cancel colour pick" : "Pick colour from canvas"
              }
              active={picker.isPicking}
              onClick={onEyedropperTap}
            >
              <Pipette className="w-5 h-5" strokeWidth={1.75} />
            </IconButton>

            <IconButton
              ariaLabel="Open custom colour picker"
              active={modalOpen}
              onClick={openModal}
            >
              <Palette className="w-5 h-5" strokeWidth={1.75} />
            </IconButton>
          </div>

          {/* Current colour chip — first item in scroll region.
              Hidden when the value duplicates a fav / standard
              swatch (selection ring lives on the matching swatch
              instead). Tap-to-reapply behaves like any other
              swatch (no modal shortcut). */}
          {showChip ? (
            <Swatch
              hex={valueNorm!}
              selected
              onTap={() => onChange(valueNorm!)}
              ariaLabel={`${ariaLabel}: current ${valueNorm}`}
            />
          ) : null}

          {/* Favourites (newest at end — order from store). When the
              active value matches both a favourite AND a standard
              swatch, standard wins the ring (per spec). */}
          {favs.length > 0 ? (
            <>
              {favs.map((hex) => {
                const matches = valueNorm === hex.toUpperCase();
                return (
                  <Swatch
                    key={`fav-${hex}`}
                    hex={hex}
                    selected={matches && !isInStandard}
                    onTap={() => onChange(hex.toUpperCase())}
                    onLongPress={() => onFavLongPress(hex)}
                    isFavourite
                  />
                );
              })}
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

      {/* Remove-favourite confirm dialog (long-press → here). Uses
          the editor's standard Dialog primitive for consistency
          with other in-editor confirmations (z-1100, sits above the
          panel drawer). */}
      <Dialog
        open={removeTarget !== null}
        title="Remove favourite?"
        onCancel={cancelRemoveFavourite}
        ariaLabel="Remove favourite colour"
        footer={
          <>
            <DialogCancelButton onClick={cancelRemoveFavourite} />
            <DialogApplyButton onClick={confirmRemoveFavourite}>
              Remove
            </DialogApplyButton>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: removeTarget ?? "#000",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.18)",
              flex: "0 0 auto",
            }}
          />
          <span style={{ color: "var(--pe-text)", fontSize: 14 }}>
            Remove <strong>{removeTarget}</strong> from your favourites?
          </span>
        </div>
      </Dialog>
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
  onLongPress,
  isFavourite = false,
  ariaLabel,
}: {
  hex: string;
  selected: boolean;
  onTap: () => void;
  /** When provided, a 500ms hold fires this callback. Tap-vs-long-
   *  press disambiguation: on long-press fire we set a ref flag that
   *  suppresses the click which would otherwise follow pointerup. */
  onLongPress?: () => void;
  isFavourite?: boolean;
  ariaLabel?: string;
}) {
  const timerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!onLongPress) return;
      longPressFiredRef.current = false;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      cancelTimer();
      timerRef.current = window.setTimeout(() => {
        longPressFiredRef.current = true;
        timerRef.current = null;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    [onLongPress, cancelTimer],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (timerRef.current === null || startPosRef.current === null) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      if (dx * dx + dy * dy > LONG_PRESS_MOVE_THRESHOLD_SQ) {
        cancelTimer();
      }
    },
    [cancelTimer],
  );

  // Cleanup if the component unmounts mid-press.
  useEffect(() => cancelTimer, [cancelTimer]);

  function onClickButton(e: React.MouseEvent) {
    if (longPressFiredRef.current) {
      // Long-press already opened the confirm dialog; suppress the
      // tap action so the colour doesn't ALSO get applied.
      e.preventDefault();
      e.stopPropagation();
      longPressFiredRef.current = false;
      return;
    }
    onTap();
  }

  const a11yLabel =
    ariaLabel ?? `${isFavourite ? "Favourite " : ""}colour ${hex}`;

  return (
    <button
      type="button"
      onClick={onClickButton}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={cancelTimer}
      onPointerCancel={cancelTimer}
      onPointerLeave={cancelTimer}
      onContextMenu={onLongPress ? (e) => e.preventDefault() : undefined}
      aria-label={a11yLabel}
      aria-pressed={selected}
      className="flex-none inline-flex items-center justify-center"
      style={{
        width: SWATCH_SIZE + SWATCH_GAP,
        height: SWATCH_SIZE,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        // Suppresses iOS's text-select callout during long-press so
        // our custom dialog isn't fighting the share/copy popup.
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
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
