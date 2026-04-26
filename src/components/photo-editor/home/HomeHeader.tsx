// src/components/photo-editor/home/HomeHeader.tsx
//
// Top-of-home header matching the reference Add Text app's home screen:
//
//   ┌───────────────────────────────────────────────────────────┐
//   │  Dark mode  ⚪──○                  [Subscribe] [⚙]        │
//   └───────────────────────────────────────────────────────────┘
//
// On mobile the global Ebrora NavBar is hidden behind PhotoEditorClient's
// fixed z-60 wrapper, so we surface Ebrora branding here directly: an
// "E" logo + "Ebrora" wordmark on the left, dark-mode toggle + Subscribe
// chip + Settings cog on the right. On desktop the global NavBar is
// visible above this so there's slight branding duplication — matches
// the reference design and keeps the home screen self-contained.
//
// Behaviour:
//   • Logo/wordmark: links to "/" (full Ebrora homepage exit)
//   • Dark mode toggle: cycles light ↔ dark via ThemeContext (instant)
//   • Subscribe chip: SubscribeChip from /toolbar (suppressed for paid)
//   • Settings cog: opens the SettingsMenu sheet
//
// Why a Link to "/" on the logo? The user is inside a PWA-installable
// scope (/photo-editor/manifest.webmanifest) — tapping the logo should
// take them out of the editor scope to the marketing site. If they
// install the editor as a standalone PWA, the link behaves like any
// external nav (opens a browser tab depending on display-mode).

"use client";

import Link from "next/link";
import { Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { SubscribeChip } from "../toolbar/SubscribeChip";

interface HomeHeaderProps {
  onOpenSettings: () => void;
}

export function HomeHeader({ onOpenSettings }: HomeHeaderProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <header
      className="flex-none flex items-center justify-between px-4"
      style={{
        height: 56,
        borderBottom: "1px solid var(--pe-border)",
        background: "var(--pe-toolbar-bg)",
      }}
    >
      {/* ── Logo + wordmark ────────────────────────────────────── */}
      <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Ebrora home">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{
            background: "#1B5B50",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          E
        </span>
        <span
          className="text-lg font-bold tracking-tight"
          style={{
            color: "#1B5B50",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Ebrora
        </span>
      </Link>

      {/* ── Right cluster ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={isDark}
          className="w-9 h-9 inline-flex items-center justify-center rounded-full transition-colors"
          style={{ color: "var(--pe-tool-icon)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--pe-surface-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          {isDark ? (
            <Sun className="w-5 h-5" strokeWidth={1.75} />
          ) : (
            <Moon className="w-5 h-5" strokeWidth={1.75} />
          )}
        </button>

        <SubscribeChip compact />

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings menu"
          className="w-9 h-9 inline-flex items-center justify-center rounded-full transition-colors"
          style={{ color: "var(--pe-tool-icon)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--pe-surface-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          <Settings className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
