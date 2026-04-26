// src/components/photo-editor/toolbar/ToolDivider.tsx
//
// Vertical divider primitive used in the bottom toolbar to separate the
// layer-creation cluster (Add Text / Add Image / Add Sticker / Add
// Shape) from the primary tool row (Font / Format / Color / …). Sized to
// match the inner padding of ToolButton so it feels visually balanced
// with the surrounding 44×44 button bodies.
//
// Decorative — not a focusable element. role="separator" gives screen
// readers a hint without making it interactable.

"use client";

interface ToolDividerProps {
  /** Optional className passthrough for layout adjustments. */
  className?: string;
}

export function ToolDivider({ className }: ToolDividerProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={`flex-none self-center mx-1 ${className ?? ""}`}
      style={{
        width: 1,
        height: 32,
        background: "var(--pe-toolbar-border)",
      }}
    />
  );
}
