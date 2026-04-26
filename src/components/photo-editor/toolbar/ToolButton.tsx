// src/components/photo-editor/toolbar/ToolButton.tsx
//
// Circular tool icon button. The visual primitive used by the bottom
// toolbar and (later) by the side drawer for advanced tools. Mirrors the
// Add Text app's "big circular tool icon" aesthetic (Q26) without
// pixel-copying.
//
// Variants:
//   • "default" — passive button, dispatches an action on tap (e.g. Add Text)
//   • "tool"    — toggle button representing an active tool; shows the
//                 accent backdrop when its tool id matches the active tool
//
// Sizing: 44×44 hit target so it meets WCAG 2.5.5 minimum on touch.

"use client";

import { type ReactNode } from "react";

interface ToolButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  /** Visual size variant. "lg" used in the bottom toolbar; "md" in
   *  drawers / nested grids. */
  size?: "md" | "lg";
}

export function ToolButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  size = "lg",
}: ToolButtonProps) {
  const dim = size === "lg" ? 44 : 40;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex flex-col items-center justify-center gap-1 px-2 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ minWidth: 56 }}
    >
      <span
        className="inline-flex items-center justify-center rounded-full transition-colors"
        style={{
          width: dim,
          height: dim,
          background: active
            ? "var(--pe-tool-icon-active-bg)"
            : "transparent",
          color: active
            ? "var(--pe-tool-icon-active)"
            : "var(--pe-tool-icon)",
        }}
        onMouseEnter={(e) => {
          if (disabled) return;
          (e.currentTarget as HTMLSpanElement).style.background = active
            ? "var(--pe-tool-icon-active-bg)"
            : "var(--pe-surface-2)";
        }}
        onMouseLeave={(e) => {
          if (disabled) return;
          (e.currentTarget as HTMLSpanElement).style.background = active
            ? "var(--pe-tool-icon-active-bg)"
            : "transparent";
        }}
      >
        {icon}
      </span>
      <span
        className="text-[11px] leading-none truncate max-w-[68px]"
        style={{
          color: active ? "var(--pe-tool-icon-active)" : "var(--pe-text-muted)",
          fontWeight: active ? 600 : 500,
        }}
      >
        {label}
      </span>
    </button>
  );
}
