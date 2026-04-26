// src/components/photo-editor/home/SettingsMenu.tsx
//
// The settings menu surfaced by tapping the cog in HomeHeader. Replaces
// the editor-view HamburgerCorner that Batch 1 removed — only home-
// relevant commands live here:
//
//   • Theme              ← Light / Dark toggle (also surfaced in
//                          HomeHeader inline; included here for parity)
//   • All projects       ← opens the existing ProjectsModal which lists
//                          every SavedProject with rename / delete
//   • Install            ← when the browser captured a beforeinstallprompt
//                          event, surface a one-tap install
//   • Back to Ebrora     ← <Link> to "/" — same as the logo, repeated
//                          here for discoverability
//
// Editor-only commands (Save As, Reset Zoom) are deliberately omitted —
// they don't apply on the home screen. Inside the editor they're bound
// to keyboard shortcuts (Cmd/Ctrl-Shift-S, Cmd/Ctrl-0) until Batch 5 (or
// later) brings back a context-appropriate overflow menu.
//
// Visual: bottom-anchored sheet on mobile (matches AddLayerSheet's look),
// centred dialog on lg+. We don't extract a shared "BottomSheet"
// primitive yet — two consumers isn't enough to justify the abstraction.

"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Folder,
  Moon,
  Smartphone,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface SettingsMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenProjects: () => void;
  canInstall: boolean;
  onInstall: () => void;
}

export function SettingsMenu({
  open,
  onClose,
  onOpenProjects,
  canInstall,
  onInstall,
}: SettingsMenuProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  // Close on Escape — same convention as PanelDrawer / AddLayerSheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[220] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "var(--pe-overlay)" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className={`fixed left-0 right-0 bottom-0 z-[221] transition-transform duration-200 ease-out lg:left-1/2 lg:right-auto lg:bottom-auto lg:top-1/2 lg:-translate-x-1/2 lg:w-[400px] lg:rounded-2xl ${
          open
            ? "translate-y-0 lg:-translate-y-1/2"
            : "translate-y-full lg:opacity-0 lg:pointer-events-none lg:-translate-y-1/2"
        }`}
        style={{
          background: "var(--pe-surface)",
          borderTop: "1px solid var(--pe-border)",
          boxShadow: "var(--pe-shadow-lg)",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2 pb-1 lg:hidden">
          <span
            className="block rounded-full"
            style={{
              width: 36,
              height: 4,
              background: "var(--pe-border-strong)",
            }}
          />
        </div>

        <div className="flex items-center justify-between px-4 pt-1 pb-2">
          <span
            className="text-[15px] font-semibold"
            style={{ color: "var(--pe-text)" }}
          >
            Settings
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--pe-tool-icon)" }}
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-col px-2 pb-3">
          <MenuItem
            icon={
              isDark ? (
                <Sun className="w-5 h-5" strokeWidth={1.75} />
              ) : (
                <Moon className="w-5 h-5" strokeWidth={1.75} />
              )
            }
            label={isDark ? "Light mode" : "Dark mode"}
            onClick={() => {
              toggle();
            }}
          />
          <MenuItem
            icon={<Folder className="w-5 h-5" strokeWidth={1.75} />}
            label="All projects"
            onClick={() => {
              onClose();
              onOpenProjects();
            }}
          />
          {canInstall && (
            <MenuItem
              icon={<Smartphone className="w-5 h-5" strokeWidth={1.75} />}
              label="Install Photo Editor"
              onClick={() => {
                onClose();
                onInstall();
              }}
            />
          )}
          <MenuLink
            href="/"
            icon={<ArrowUpRight className="w-5 h-5" strokeWidth={1.75} />}
            label="Back to Ebrora"
            onClick={onClose}
          />
        </div>
      </div>
    </>
  );
}

// ─── Menu rows ──────────────────────────────────────────────────

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors"
      style={{ color: "var(--pe-text)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--pe-surface-2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <span
        className="w-9 h-9 rounded-lg inline-flex items-center justify-center shrink-0"
        style={{
          background: "var(--pe-surface-2)",
          color: "var(--pe-tool-icon)",
        }}
      >
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors"
      style={{ color: "var(--pe-text)" }}
    >
      <span
        className="w-9 h-9 rounded-lg inline-flex items-center justify-center shrink-0"
        style={{
          background: "var(--pe-surface-2)",
          color: "var(--pe-tool-icon)",
        }}
      >
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
