// src/components/photo-editor/home/HomeHeader.tsx
//
// Home-screen top bar — Batch A redesign.
//
// Reference layout (matches the Add-Text-on-Photo app exactly):
//
//   ┌──────────────────────────────────────────────────────────────┐
//   │  Dark mode  ⚪──○                                       [⚙]  │
//   └──────────────────────────────────────────────────────────────┘
//
// Changes from prior version:
//   • Removed the Ebrora logo + wordmark from this bar. The brand sits
//     in the global site nav above this view; inside the editor we
//     match the reference's chrome-light treatment so the Background
//     colour strip below has all the visual focus.
//   • Removed the "Subscribe" / "Try PRO" chip. All editor features
//     are now free — there are no PRO-only features inside the editor.
//   • The dark-mode toggle is rendered as a labelled pill switch (was
//     a sun/moon icon button) so it reads "Dark mode ⚪──○" exactly
//     like the reference rather than as a generic theme button.
//
// The settings cog opens the SettingsMenu sheet (existing component).

"use client";

import { useId } from "react";
import { Settings } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface HomeHeaderProps {
  onOpenSettings: () => void;
}

export function HomeHeader({ onOpenSettings }: HomeHeaderProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  const toggleId = useId();

  return (
    <header
      className="flex-none flex items-center justify-between px-4"
      style={{
        height: 56,
        borderBottom: "1px solid var(--pe-border)",
        background: "var(--pe-toolbar-bg)",
      }}
    >
      {/* ── Dark mode pill switch ─────────────────────────────── */}
      <div className="flex items-center gap-2">
        <label
          htmlFor={toggleId}
          className="text-[15px] font-medium select-none cursor-pointer"
          style={{ color: "var(--pe-text)" }}
        >
          Dark mode
        </label>
        <button
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggle}
          className="relative inline-flex items-center transition-colors"
          style={{
            width: 44,
            height: 24,
            borderRadius: 999,
            background: isDark ? "var(--pe-accent)" : "#D1D5DB",
            padding: 2,
          }}
        >
          <span
            aria-hidden
            className="inline-block transition-transform"
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#FFFFFF",
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              transform: isDark ? "translateX(20px)" : "translateX(0)",
            }}
          />
        </button>
      </div>

      {/* ── Settings cog ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Open settings menu"
        className="w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors"
        style={{ color: "var(--pe-tool-icon)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--pe-surface-2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        <Settings className="w-5 h-5" strokeWidth={1.75} />
      </button>
    </header>
  );
}
