// src/components/photo-editor/theme/ThemeStyles.tsx
//
// Injects the editor's CSS variables, scoped to a wrapper element keyed
// by data-pe-theme. The rest of the site is unaffected — only elements
// inside the editor's wrapper see these variables.
//
// Variables are referenced throughout the editor's component tree via
// var(--pe-bg), var(--pe-surface), etc., so a single theme switch flips
// the entire UI without per-component prop wiring.
//
// Variable index:
//   --pe-bg               page background (the area outside the canvas)
//   --pe-surface          panel / dialog / toolbar surfaces
//   --pe-surface-2        hover / pressed surface tint
//   --pe-canvas-bg        the colour shown around the canvas itself
//   --pe-border           default panel border
//   --pe-border-strong    emphasised border (selection rings, etc.)
//   --pe-text             primary text colour
//   --pe-text-muted       secondary text
//   --pe-text-subtle      tertiary / placeholder text
//   --pe-accent           brand colour (Ebrora green in light, teal in dark)
//   --pe-accent-hover     hover state for accent buttons
//   --pe-accent-fg        foreground colour to use on accent backgrounds
//   --pe-toolbar-bg       toolbar surface
//   --pe-toolbar-border   toolbar separator border
//   --pe-tool-icon        tool icon default colour
//   --pe-tool-icon-active active tool icon colour
//   --pe-tool-icon-active-bg  active tool icon background tint
//   --pe-shadow           default surface shadow
//   --pe-shadow-lg        modal / dialog shadow
//   --pe-overlay          modal backdrop colour

"use client";

import { type ReactNode } from "react";
import { useTheme } from "../context/ThemeContext";

const STYLES = `
[data-pe-theme="light"] {
  --pe-bg: #FFFFFF;
  --pe-surface: #F8F9FA;
  --pe-surface-2: #F1F3F5;
  --pe-canvas-bg: #E9ECEF;
  --pe-border: #E5E7EB;
  --pe-border-strong: #D1D5DB;
  --pe-text: #111827;
  --pe-text-muted: #6B7280;
  --pe-text-subtle: #9CA3AF;
  --pe-accent: #1B5B50;
  --pe-accent-hover: #144540;
  --pe-accent-fg: #FFFFFF;
  --pe-toolbar-bg: #FFFFFF;
  --pe-toolbar-border: #E5E7EB;
  --pe-tool-icon: #4B5563;
  --pe-tool-icon-active: #1B5B50;
  --pe-tool-icon-active-bg: rgba(27, 91, 80, 0.10);
  --pe-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  --pe-shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.08);
  --pe-overlay: rgba(17, 24, 39, 0.40);
  color-scheme: light;
}

[data-pe-theme="dark"] {
  --pe-bg: #0F1115;
  --pe-surface: #181B21;
  --pe-surface-2: #1F232B;
  --pe-canvas-bg: #0A0B0E;
  --pe-border: #2A2F38;
  --pe-border-strong: #3A4150;
  --pe-text: #F3F4F6;
  --pe-text-muted: #9CA3AF;
  --pe-text-subtle: #6B7280;
  --pe-accent: #4ECDC4;
  --pe-accent-hover: #6FE3DA;
  --pe-accent-fg: #0F1115;
  --pe-toolbar-bg: #181B21;
  --pe-toolbar-border: #2A2F38;
  --pe-tool-icon: #9CA3AF;
  --pe-tool-icon-active: #4ECDC4;
  --pe-tool-icon-active-bg: rgba(78, 205, 196, 0.12);
  --pe-shadow: 0 4px 16px rgba(0, 0, 0, 0.40);
  --pe-shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.50);
  --pe-overlay: rgba(0, 0, 0, 0.60);
  color-scheme: dark;
}
`.trim();

/** Injects the theme stylesheet into the page. Render once near the editor root. */
export function ThemeStyles() {
  return <style dangerouslySetInnerHTML={{ __html: STYLES }} />;
}

/** Convenience wrapper — applies the editor theme attribute and base
 *  background / text colour to its children. Render this just inside the
 *  ThemeProvider, near the top of the editor's component tree. */
export function ThemeRoot({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <div
      data-pe-theme={theme}
      style={{
        minHeight: "100vh",
        background: "var(--pe-bg)",
        color: "var(--pe-text)",
        transition: "background-color 0.18s ease, color 0.18s ease",
      }}
    >
      {children}
    </div>
  );
}
