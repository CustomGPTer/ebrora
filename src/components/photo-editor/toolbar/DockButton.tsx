// src/components/photo-editor/toolbar/DockButton.tsx
//
// Vertical icon-over-label button used by the bottom dock — bigger,
// squarer hit target than ToolButton and a bolder icon. Mirrors the
// reference Add Text app's "Add Text / Photo / Shape / Sticker / Style"
// row aesthetic.
//
// Three layout modes:
//   • Default (`fluid={false}`)         — fixed 72px minWidth, used by long
//     rows that scroll horizontally (the 11-tile selected-image dock,
//     the 7-tile selected-text dock).
//   • `fluid={true}`                    — `flex-1` and no minWidth, used by
//     5-tile rows that should spread evenly across the container
//     (Add Layer + Background rows in the no-selection state).
//   • `mobileCompact={true}`            — on mobile (max-lg) only, the
//     button renders smaller (36px icon, 12px outer height drop, label
//     hidden — still announced via aria-label / title for tooltips).
//     Desktop is UNCHANGED — same 44px icon + label as default.
//     Used inside the height-locked mobile empty-state dock so 10
//     tiles + 2 section headers fit under the lock height. Combines
//     with `fluid` for spread layout.
//
// Visuals:
//   • Icon block 44px in default / fluid (mirrors the reference Add
//     Text app's tile dimensions). On mobile when `mobileCompact` is
//     set, the block shrinks to 36px.
//   • Label sits directly below at 12px. With `mobileCompact` the
//     label is hidden on mobile only.
//   • Optional `accent` colour for the icon — the reference uses a
//     coloured tile only on Add Text and selected-text Edit;
//     everything else is mono.
//
// Hit target: ≥44×44 (WCAG 2.5.5). Compact tiles (mobile only) are
// 36px icon + py-0.5 + the row's gap; outer hit area is ~44px so
// still touch-target compliant.

"use client";

import { type ReactNode } from "react";

interface DockButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  /** When true, the button uses `flex-1` (no minWidth) so 5-tile
   *  rows spread evenly across the container and labels are
   *  allowed to wrap to two lines. Defaults to false (legacy
   *  fixed-width-with-overflow-scroll behaviour). */
  fluid?: boolean;
  /** When true, on MOBILE ONLY (max-lg) the button shrinks to a 36px
   *  icon, the label is hidden, and padding tightens — used by the
   *  height-locked empty-state dock so its 10 tiles + 2 section
   *  headers fit within the lock height. Desktop renders identically
   *  to the non-compact button. */
  mobileCompact?: boolean;
  /** Optional coloured tile background for the icon (used on Add
   *  Text in the reference). When omitted the icon is rendered
   *  mono. */
  accent?: {
    from: string;
    to: string;
    iconColor: string;
  };
}

export function DockButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  fluid = false,
  mobileCompact = false,
  accent,
}: DockButtonProps) {
  const widthClass = fluid ? "flex-1 min-w-0" : "flex-none";
  const widthStyle = fluid ? undefined : { minWidth: 72 };
  const labelClass = fluid
    ? "text-[12px] leading-tight text-center"
    : "text-[12px] leading-tight whitespace-nowrap";

  // Mobile-compact styling lives in Tailwind's max-lg utility so the
  // shrink applies on mobile only. Desktop classes remain identical
  // to the legacy non-compact button.
  //
  // Note: label visibility is no longer driven by mobileCompact.
  // Earlier "Mobile-fixes batch 5" hid labels on mobile under
  // mobileCompact to claw back vertical space inside
  // MOBILE_DOCK_HEIGHT_PX, but labels are core wayfinding for the
  // no-selection state ("Add Text / Photo / Shape / Sticker / Style"
  // and "Replace / Effects / Crop / Resize / Flip-Rotate"). They fit
  // fine in 192px once the icon-box / padding shrinks below are
  // applied; the empty-state rows aren't tile-dense enough to need
  // both compaction levers.
  const buttonPaddingClass = mobileCompact
    ? "px-2 py-1.5 max-lg:px-1 max-lg:py-0.5"
    : "px-2 py-1.5";
  const buttonGapClass = mobileCompact
    ? "gap-1.5 max-lg:gap-0.5"
    : "gap-1.5";
  const iconBoxClass = mobileCompact
    ? "w-11 h-11 max-lg:w-9 max-lg:h-9"
    : "w-11 h-11";
  const labelMobileClass = "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${widthClass} inline-flex flex-col items-center justify-center ${buttonGapClass} ${buttonPaddingClass} transition-opacity disabled:opacity-40 disabled:cursor-not-allowed`}
      style={widthStyle}
    >
      <span
        className={`inline-flex items-center justify-center rounded-2xl transition-colors ${iconBoxClass}`}
        style={{
          background: accent
            ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
            : active
              ? "var(--pe-tool-icon-active-bg)"
              : "transparent",
          color: accent
            ? accent.iconColor
            : active
              ? "var(--pe-tool-icon-active)"
              : "var(--pe-tool-icon)",
          boxShadow: accent ? "0 2px 6px rgba(0,0,0,0.10)" : "none",
        }}
      >
        {icon}
      </span>
      <span
        className={`${labelClass} ${labelMobileClass}`}
        style={{
          color: active ? "var(--pe-tool-icon-active)" : "var(--pe-text)",
          fontWeight: active ? 600 : 500,
        }}
      >
        {label}
      </span>
    </button>
  );
}
