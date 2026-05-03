// src/components/photo-editor/home/EmptyState.tsx
//
// Home view — Batch 2 mobile rebuild.
//
// Layout (mobile, top → bottom):
//   ┌────────────────────────────────────────────┐
//   │ HomeHeader (Ebrora E + theme + Subscribe + ⚙)│
//   ├────────────────────────────────────────────┤
//   │ Background (solid swatches + gradients)    │
//   │ Gallery (large upload card)                │
//   │ Style presets (4-card row — Batch F)       │
//   │ Projects (3-col grid — Batch F)            │
//   └────────────────────────────────────────────┘
//
// Versus the previous EmptyState — gone:
//   • The two big buttons "Upload photo" / "Start blank" (the new
//     Background row + Gallery card cover both intents in fewer taps)
//   • The Sparkles hero illustration + tagline (the design language
//     calls for content-first, not marketing-on-home)
//   • The standalone HamburgerCorner top-corner drawer (replaced by
//     HomeHeader's Settings cog; commands live inside SettingsMenu now)
//
// What's preserved:
//   • The "drop a photo to start" flow — same MAX_CANVAS_DIMENSION
//     clamp, same createBlankProject seed shape, same onProjectLoaded
//     contract upward to PhotoEditorClient
//   • Recent saved projects via listProjects() (now rendered by
//     ProjectsGrid, but the data path is unchanged)
//   • The ability to enter the Projects modal for full project
//     management (rename / delete / soft-cap warnings) — accessed via
//     the Settings cog rather than as a top-level link
//
// Why ProjectsModal here? Because EmptyState already controls
// the home view's modal stack and PhotoEditorClient doesn't have
// awareness of "open the projects browser without entering edit
// mode." Routing the modal through here keeps the editor path
// (EditorShell.tsx) leaner.

"use client";

import { useEffect, useState } from "react";
import { HomeHeader } from "./HomeHeader";
import { BackgroundQuickPick } from "./BackgroundQuickPick";
import { GalleryCard } from "./GalleryCard";
import { HomePresets } from "./HomePresets";
import { ProjectsGrid } from "./ProjectsGrid";
import { SettingsMenu } from "./SettingsMenu";
import { RestoreDraftDialog } from "./RestoreDraftDialog";
import { ProjectsModal } from "../projects/ProjectsModal";
import { deserializeSavedProject } from "@/lib/photo-editor/saved-projects/serialize";
import {
  loadDraft,
  deleteDraft,
} from "@/lib/photo-editor/saved-projects/draft";
import { useInstallPrompt, useIsStandaloneMode } from "@/lib/photo-editor/pwa/install-prompt";
import { PwaInstallBanner } from "./PwaInstallBanner";
import type { Project } from "@/lib/photo-editor/types";

interface EmptyStateProps {
  /** Called when a project is ready to load. savedProjectId is non-
   *  null when the project came from the saved-projects store
   *  (existing record), null when the project came from a fresh
   *  upload / colour pick / gradient pick. */
  onProjectLoaded: (project: Project, savedProjectId: string | null) => void;
}

export function EmptyState({ onProjectLoaded }: EmptyStateProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const { canInstall, install } = useInstallPrompt();
  const isStandalone = useIsStandaloneMode();

  // ── Draft-restore prompt ──────────────────────────────────────
  // On home mount, look for an autosaved draft (saved by the editor's
  // always-on draft autosaver in EditorShell). If one exists, hold the
  // deserialized Project in state and show the RestoreDraftDialog.
  // The user must explicitly choose Yes (load it) or No (delete it) —
  // the dialog has no backdrop-dismiss so a draft can't be lost
  // accidentally.
  //
  // Race with explicit project loads: if the user picks a saved
  // project from ProjectsGrid before the loadDraft() promise resolves,
  // the editor takes over and EmptyState unmounts — the draft prompt
  // never appears, which is the desired outcome.
  const [pendingDraft, setPendingDraft] = useState<Project | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadDraft();
      if (cancelled || !saved) return;
      try {
        setPendingDraft(deserializeSavedProject(saved));
      } catch {
        // Corrupted draft snapshot — wipe it so we don't loop on every
        // home visit, and continue silently.
        await deleteDraft();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRestoreDraft = () => {
    const draft = pendingDraft;
    setPendingDraft(null);
    if (!draft) return;
    // savedProjectId = null because the draft is not a "saved
    // project". The editor's draft autosaver will continue persisting
    // changes; if the user explicitly Saves, the draft gets cleared.
    onProjectLoaded(draft, null);
  };

  const handleDiscardDraft = () => {
    setPendingDraft(null);
    void deleteDraft();
  };

  // ── Scroll container behaviour ──────────────────────────────
  // On mobile (≤ lg breakpoint) the photo editor is wrapped in a
  // `fixed inset-0` container in PhotoEditorClient and the document
  // body has `overflow: hidden` applied. That means the page document
  // can't scroll, so anything taller than the viewport (notably the
  // Projects grid at the bottom of this view) is clipped and
  // unreachable. To fix that, on mobile this outer div becomes its
  // own scroll container — height is pinned to the viewport and
  // overflow-y is auto. On desktop the page document scrolls
  // naturally, so we keep min-height: 100vh and leave overflow alone.
  return (
    <div
      className="flex flex-col min-h-screen max-lg:h-screen max-lg:overflow-y-auto"
      style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
    >
      <HomeHeader onOpenSettings={() => setSettingsOpen(true)} />

      <main
        className="flex-1 w-full mx-auto px-4 sm:px-6 py-5 max-w-3xl space-y-6"
      >
        <BackgroundQuickPick
          onBackgroundChosen={(project) => onProjectLoaded(project, null)}
        />

        <GalleryCard
          onProjectReady={(project) => onProjectLoaded(project, null)}
        />

        <HomePresets
          onProjectReady={(project) => onProjectLoaded(project, null)}
        />

        <ProjectsGrid
          onProjectLoaded={(project, savedProjectId) =>
            onProjectLoaded(project, savedProjectId)
          }
        />
      </main>

      {/* ── PWA install banner — issue 5 (mobile-fixes batch 2) ─────
          Sticky-bottom CTA shown only when canInstall === true and the
          page is not already running as an installed PWA. Tapping
          fires the browser's captured install prompt in a single
          gesture. */}
      <PwaInstallBanner
        canInstall={canInstall}
        isStandalone={isStandalone}
        onInstall={() => void install()}
      />

      {/* ── Settings sheet (cog) ───────────────────────────────── */}
      <SettingsMenu
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenProjects={() => setProjectsModalOpen(true)}
        canInstall={canInstall}
        onInstall={() => void install()}
      />

      {/* ── Projects modal (rename / delete / full grid) ───────── */}
      <ProjectsModal
        open={projectsModalOpen}
        currentProjectId={null}
        onClose={() => setProjectsModalOpen(false)}
        onLoad={(saved) => {
          setProjectsModalOpen(false);
          const project = deserializeSavedProject(saved);
          onProjectLoaded(project, saved.id);
        }}
      />

      {/* ── Restore-draft prompt (after refresh) ───────────────── */}
      <RestoreDraftDialog
        open={pendingDraft !== null}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />
    </div>
  );
}
