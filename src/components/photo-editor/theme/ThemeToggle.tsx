// src/components/photo-editor/theme/ThemeToggle.tsx
//
// Light / dark toggle button. Sun icon when in light mode (clicking
// switches to dark), moon icon when in dark mode (clicking switches to
// light). Uses lucide-react icons (already in the repo dependencies).

"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  /** Render a smaller variant for compact toolbars. */
  size?: "default" | "small";
}

export function ThemeToggle({ className = "", size = "default" }: ThemeToggleProps) {
  const { theme, toggle, loaded } = useTheme();

  const sideClass = size === "small" ? "w-8 h-8" : "w-9 h-9";
  const iconSize = size === "small" ? "w-4 h-4" : "w-5 h-5";

  if (!loaded) {
    // Reserve the same footprint while we resolve from localStorage so the
    // toolbar layout doesn't shift when the theme loads.
    return <div className={`${sideClass} ${className}`} aria-hidden />;
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Dark mode" : "Light mode"}
      className={`${sideClass} inline-flex items-center justify-center rounded-full transition-colors ${className}`}
      style={{ color: "var(--pe-tool-icon)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--pe-surface-2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {isLight ? (
        <Moon className={iconSize} strokeWidth={1.75} />
      ) : (
        <Sun className={iconSize} strokeWidth={1.75} />
      )}
    </button>
  );
}
