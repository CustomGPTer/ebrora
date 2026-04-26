// src/components/photo-editor/toolbar/DockButton.tsx
//
// Vertical icon-over-label button used by the bottom dock — bigger,
// squarer hit target than ToolButton and a bolder icon. Mirrors the
// reference Add Text app's "Add Text / Photo / Shape / Sticker / Style"
// row aesthetic.
//
// Differences from ToolButton (which is the bottom-toolbar primitive):
//   • Icon block 36px (vs 44px round badge)
//   • Label sits directly below at 11–12px, no badge background unless
//     the button is active
//   • Wider min-width so labels like "Flip/Rotate" don't truncate
//   • Optional `accent` colour for the icon — the reference uses a
//     coloured tile only on Add Text (cyan); everything else is mono.
//     We expose this as a prop so future buttons (e.g. Style) can adopt
//     a coloured tile without forking the primitive.
//
// Hit target: 64×64 minimum (WCAG 2.5.5 — pointer target ≥ 44px). The
// outer button is at least that size; the icon within is centred.

"use client";

import { type ReactNode } from "react";

interface DockButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  /** Optional coloured tile background for the icon (used on Add Text
   *  in the reference). When omitted the icon is rendered mono. */
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
  accent,
}: DockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex-none inline-flex flex-col items-center justify-start gap-1.5 px-2 py-1.5 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ minWidth: 72 }}
    >
      <span
        className="inline-flex items-center justify-center rounded-2xl transition-colors"
        style={{
          width: 48,
          height: 48,
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
        className="text-[12px] leading-tight whitespace-nowrap"
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
