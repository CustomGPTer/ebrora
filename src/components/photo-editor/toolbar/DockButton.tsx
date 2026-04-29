// src/components/photo-editor/toolbar/DockButton.tsx
//
// Vertical icon-over-label button used by the bottom dock — bigger,
// squarer hit target than ToolButton and a bolder icon. Mirrors the
// reference Add Text app's "Add Text / Photo / Shape / Sticker / Style"
// row aesthetic.
//
// Two layout modes:
//   • Default (`fluid={false}`)  — fixed 72px minWidth, used by long
//     rows that scroll horizontally (the 11-tile selected-image dock,
//     the 7-tile selected-text dock).
//   • `fluid={true}`              — `flex-1` and no minWidth, used by
//     5-tile rows that should spread evenly across the container
//     (Add Layer + Background rows in the no-selection state).
//
// Visuals:
//   • Icon block 44px (matches the reference Add Text app's tile
//     dimensions — was 48px previously).
//   • Label sits directly below at 12px. When `fluid={true}` the
//     label is allowed to wrap to two lines (so "Flip/Rotate" still
//     reads on narrow viewports); in `scroll` mode it stays on one
//     line because the row scrolls anyway.
//   • Optional `accent` colour for the icon — the reference uses a
//     coloured tile only on Add Text and selected-text Edit;
//     everything else is mono.
//
// Hit target: ≥44×44 (WCAG 2.5.5). The icon block itself is 44px
// with extra `py-1.5 px-2` padding around it, so the button is
// comfortably above the threshold even when `fluid` shrinks the
// horizontal footprint.

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
  accent,
}: DockButtonProps) {
  const widthClass = fluid ? "flex-1 min-w-0" : "flex-none";
  const widthStyle = fluid ? undefined : { minWidth: 72 };
  const labelClass = fluid
    ? "text-[12px] leading-tight text-center"
    : "text-[12px] leading-tight whitespace-nowrap";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${widthClass} inline-flex flex-col items-center justify-start gap-1.5 px-2 py-1.5 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed`}
      style={widthStyle}
    >
      <span
        className="inline-flex items-center justify-center rounded-2xl transition-colors"
        style={{
          width: 44,
          height: 44,
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
        className={labelClass}
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
