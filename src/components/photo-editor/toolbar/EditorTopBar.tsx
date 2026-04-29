// src/components/photo-editor/toolbar/EditorTopBar.tsx
//
// The mobile editor top bar. Mirrors the reference Add Text app's
// 7-icon strip exactly:
//
//   ⟨   ⊞   ↶   +   ↷   ⊟   →
//   Back Grid Undo Plus Redo Lyr Next
//
// Behaviour map:
//   ⟨    Back            → onExit() (returns to the home / EmptyState)
//   ⊞    Grid             → toggles state.gridVisible (existing TOGGLE_GRID)
//   ↶    Undo             → undo() from EditorContext
//   +    Plus             → onOpenAddSheet() — opens the AddLayerSheet
//                           popover (anchored under this button)
//   ↷    Redo             → redo() from EditorContext
//   ⊟    Layers           → toggles activePanel = "layers"
//   →    Next             → onOpenSaveAndShare() — opens the full-screen
//                           Save and Share page
//
// Save As / Open Project / Reset Zoom / Theme / Install live behind
// keyboard shortcuts; the hamburger drawer that owned them previously
// is intentionally removed from the editor view to match the reference.
//
// Visual contract:
//   • Single 52px-tall row, items spread evenly across the width
//   • Active state uses the Ebrora green accent (var(--pe-tool-icon-active))
//     so the green branding stays present in the chrome
//   • Disabled state uses the existing 0.4 opacity convention
//   • Saved-state for the Next arrow: the icon flips to a filled circle
//     when the project is saved (mirrors the reference's filled-state
//     trailing arrow once a step is "complete")
//
// Batch A — Apr 2026: the `+` button now exposes its DOM node via
// `addAnchorRef` so the AddLayerSheet popover can position itself
// directly under it (no more full-width modal sheet).

"use client";

import { useEffect, type RefObject } from "react";
import {
  ArrowRight,
  ChevronLeft,
  Grid3x3,
  Layers as LayersIcon,
  Plus,
  Redo2,
  Undo2,
} from "lucide-react";
import { useEditor } from "../context/EditorContext";

interface EditorTopBarProps {
  onExit: () => void;
  onOpenAddSheet: () => void;
  onToggleLayers: () => void;
  layersOpen: boolean;
  /** Open the full-screen Save and Share page. */
  onOpenSaveAndShare: () => void;
  /** Whether the project has been written to IndexedDB at least once.
   *  Drives the "filled vs outline" Next-arrow visual. */
  saved: boolean;
  /** Ref forwarded onto the `+` button so the AddLayerSheet popover
   *  can anchor itself directly underneath the trigger. Owned by
   *  EditorShell so both this component and AddLayerSheet receive
   *  the same ref. */
  addAnchorRef: RefObject<HTMLButtonElement>;
}

export function EditorTopBar({
  onExit,
  onOpenAddSheet,
  onToggleLayers,
  layersOpen,
  onOpenSaveAndShare,
  saved,
  addAnchorRef,
}: EditorTopBarProps) {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useEditor();

  // Cmd+0 → reset zoom (replaces the hamburger menu item we removed).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && isEditableTarget(target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "0") {
        e.preventDefault();
        dispatch({
          type: "SET_VIEWPORT",
          viewport: { translateX: 0, translateY: 0, zoom: 1, rotation: 0 },
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  return (
    <div
      className="flex-none flex items-center justify-between px-1.5"
      style={{
        height: 52,
        borderBottom: "1px solid var(--pe-border)",
        background: "var(--pe-toolbar-bg)",
      }}
    >
      <ChromeIconButton
        onClick={onExit}
        ariaLabel="Back to home"
        icon={<ChevronLeft className="w-6 h-6" strokeWidth={1.75} />}
      />
      <ChromeIconButton
        onClick={() => dispatch({ type: "TOGGLE_GRID" })}
        ariaLabel={state.gridVisible ? "Hide grid" : "Show grid"}
        icon={<Grid3x3 className="w-5 h-5" strokeWidth={1.75} />}
        active={state.gridVisible}
      />
      <ChromeIconButton
        onClick={undo}
        disabled={!canUndo}
        ariaLabel="Undo"
        icon={<Undo2 className="w-5 h-5" strokeWidth={1.75} />}
      />
      <ChromeIconButton
        buttonRef={addAnchorRef}
        onClick={onOpenAddSheet}
        ariaLabel="Add new layer"
        icon={<Plus className="w-6 h-6" strokeWidth={2} />}
      />
      <ChromeIconButton
        onClick={redo}
        disabled={!canRedo}
        ariaLabel="Redo"
        icon={<Redo2 className="w-5 h-5" strokeWidth={1.75} />}
      />
      <ChromeIconButton
        onClick={onToggleLayers}
        ariaLabel={layersOpen ? "Close layers panel" : "Open layers panel"}
        icon={<LayersIcon className="w-5 h-5" strokeWidth={1.75} />}
        active={layersOpen}
      />
      <NextArrowButton onClick={onOpenSaveAndShare} saved={saved} />
    </div>
  );
}

// ─── Standard top-bar icon button ───────────────────────────────

interface ChromeIconButtonProps {
  onClick: () => void;
  ariaLabel: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

function ChromeIconButton({
  onClick,
  ariaLabel,
  icon,
  active = false,
  disabled = false,
  buttonRef,
}: ChromeIconButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      className="w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        color: active ? "var(--pe-tool-icon-active)" : "var(--pe-tool-icon)",
        background: active ? "var(--pe-tool-icon-active-bg)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (active || disabled) return;
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--pe-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (active) return;
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {icon}
    </button>
  );
}

// ─── Next-arrow button — opens Save and Share ───────────────────
//
// The reference renders this as a filled dark circle with a white
// arrow when there's a "next step" available. We mirror that with
// the brand green when unsaved (call-to-action) and a subtler outline
// when already saved (project has a SavedProject record).

function NextArrowButton({
  onClick,
  saved,
}: {
  onClick: () => void;
  saved: boolean;
}) {
  const filled = !saved; // unsaved = prominent CTA

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Save and Share"
      className="w-10 h-10 inline-flex items-center justify-center rounded-full transition-opacity"
      style={{
        background: filled ? "#1B5B50" : "transparent",
        color: filled ? "#FFFFFF" : "var(--pe-tool-icon)",
        border: filled ? "none" : "1px solid var(--pe-border-strong)",
      }}
    >
      <ArrowRight className="w-5 h-5" strokeWidth={2} aria-hidden />
    </button>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function isEditableTarget(el: HTMLElement): boolean {
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}
