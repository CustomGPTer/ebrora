// src/components/photo-editor/mobile/HamburgerCorner.tsx
//
// Top-corner hamburger button. When tapped, slides in a drawer from
// the left with editor commands at the top, the rest-of-Ebrora nav
// links below.
//
// Session 8 expansion (HANDOVER-7 §6.5 Q1 default a):
// editor commands moved off the top chrome and into this drawer so the
// header stays calm on mobile. The drawer renders a "Commands" group
// when those callbacks are passed in (editor view), and falls back to
// nav-only when they aren't (home view). The conditional Install item
// only shows when the browser captured a beforeinstallprompt event.

"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  FileDown,
  FileText,
  Folder,
  Layers as LayersIcon,
  Maximize2,
  Menu,
  Moon,
  Save as SaveIcon,
  Smartphone,
  Sun,
  X,
} from "lucide-react";

const NAV_LINKS: { title: string; href: string }[] = [
  { title: "Home", href: "/" },
  { title: "RAMS Builder", href: "/rams-builder" },
  { title: "Free Tools", href: "/tools" },
  { title: "Free Templates", href: "/free-templates" },
  { title: "Toolbox Talks", href: "/toolbox-talks" },
  { title: "Site Photo Stamp", href: "/site-photo-stamp" },
  { title: "Sign Maker", href: "/construction-sign-maker" },
  { title: "Pricing", href: "/pricing" },
  { title: "Account", href: "/account" },
];

interface HamburgerCornerProps {
  /** When present, drawer shows "Back to home screen" so the user can
   *  return to Upload / Start blank without leaving /photo-editor. */
  onExit?: () => void;
  /** Editor command callbacks. When supplied, the drawer renders a
   *  "Commands" group above the nav links. Pass null/undefined on the
   *  empty-state view where these don't apply. */
  commands?: HamburgerCommands;
}

export interface HamburgerCommands {
  onSave: () => void;
  onSaveAs: () => void;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  onResetZoom: () => void;
  onToggleLayers: () => void;
  layersOpen: boolean;
  onToggleTheme: () => void;
  /** Current theme so the menu item label reflects the *next* state. */
  currentTheme: "light" | "dark";
  /** When true, render the "Install Ebrora Photo Editor" item. */
  canInstall: boolean;
  onInstall: () => void;
}

export function HamburgerCorner({ onExit, commands }: HamburgerCornerProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while the drawer is open so the page underneath
  // doesn't scroll behind the overlay on iOS.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const closeAndRun = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="w-9 h-9 inline-flex items-center justify-center rounded-full transition-colors"
        style={{ color: "var(--pe-tool-icon)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--pe-surface-2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        <Menu className="w-5 h-5" strokeWidth={1.75} />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[300] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "var(--pe-overlay)" }}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-[310] h-full w-[80vw] max-w-[320px] transition-transform duration-200 ease-out flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--pe-surface)",
          borderRight: "1px solid var(--pe-border)",
          boxShadow: "var(--pe-shadow-lg)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
      >
        <div
          className="flex items-center justify-between px-4 h-14 flex-none"
          style={{ borderBottom: "1px solid var(--pe-border)" }}
        >
          <span
            className="text-base font-semibold"
            style={{ color: "var(--pe-text)" }}
          >
            Ebrora
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full"
            style={{ color: "var(--pe-tool-icon)" }}
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {onExit && (
            <DrawerItem
              icon={<ChevronLeft className="w-5 h-5" strokeWidth={1.75} />}
              label="Back to home screen"
              onClick={closeAndRun(onExit)}
            />
          )}

          {commands && (
            <>
              {onExit && <Divider />}
              <SectionLabel>Project</SectionLabel>
              <DrawerItem
                icon={<SaveIcon className="w-5 h-5" strokeWidth={1.75} />}
                label="Save"
                shortcut="⌘S"
                onClick={closeAndRun(commands.onSave)}
              />
              <DrawerItem
                icon={<FileText className="w-5 h-5" strokeWidth={1.75} />}
                label="Save as new project"
                shortcut="⌘⇧S"
                onClick={closeAndRun(commands.onSaveAs)}
              />
              <DrawerItem
                icon={<Folder className="w-5 h-5" strokeWidth={1.75} />}
                label="Open project…"
                onClick={closeAndRun(commands.onOpenProjects)}
              />
              <DrawerItem
                icon={<FileDown className="w-5 h-5" strokeWidth={1.75} />}
                label="Export…"
                onClick={closeAndRun(commands.onOpenExport)}
              />

              <Divider />
              <SectionLabel>View</SectionLabel>
              <DrawerItem
                icon={<LayersIcon className="w-5 h-5" strokeWidth={1.75} />}
                label={commands.layersOpen ? "Hide layers panel" : "Show layers panel"}
                onClick={closeAndRun(commands.onToggleLayers)}
              />
              <DrawerItem
                icon={<Maximize2 className="w-5 h-5" strokeWidth={1.75} />}
                label="Reset zoom"
                onClick={closeAndRun(commands.onResetZoom)}
              />
              <DrawerItem
                icon={
                  commands.currentTheme === "dark" ? (
                    <Sun className="w-5 h-5" strokeWidth={1.75} />
                  ) : (
                    <Moon className="w-5 h-5" strokeWidth={1.75} />
                  )
                }
                label={
                  commands.currentTheme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
                }
                onClick={closeAndRun(commands.onToggleTheme)}
              />

              {commands.canInstall && (
                <>
                  <Divider />
                  <DrawerItem
                    icon={<Smartphone className="w-5 h-5" strokeWidth={1.75} />}
                    label="Install Ebrora Photo Editor"
                    onClick={closeAndRun(commands.onInstall)}
                  />
                </>
              )}
            </>
          )}

          <Divider />
          <SectionLabel>Browse Ebrora</SectionLabel>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 transition-colors"
              style={{ color: "var(--pe-text)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "var(--pe-surface-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "transparent";
              }}
            >
              <span className="text-sm">{link.title}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}

// ─── Drawer primitives ──────────────────────────────────────────

function DrawerItem({
  icon,
  label,
  shortcut,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
      style={{ color: "var(--pe-text)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--pe-surface-2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <span aria-hidden style={{ color: "var(--pe-tool-icon)" }}>
        {icon}
      </span>
      <span className="text-sm font-medium flex-1">{label}</span>
      {shortcut && (
        <span
          className="text-[11px] font-medium tabular-nums"
          style={{ color: "var(--pe-text-subtle)" }}
        >
          {shortcut}
        </span>
      )}
    </button>
  );
}

function Divider() {
  return (
    <div
      className="my-1.5"
      style={{ borderTop: "1px solid var(--pe-border)" }}
      aria-hidden
    />
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="px-4 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: "var(--pe-text-subtle)" }}
    >
      {children}
    </div>
  );
}
