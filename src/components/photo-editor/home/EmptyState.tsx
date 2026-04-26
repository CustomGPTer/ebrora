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
//   │ Projects (horizontal-scroll cards)         │
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

import { useState } from "react";
import { HomeHeader } from "./HomeHeader";
import { BackgroundQuickPick } from "./BackgroundQuickPick";
import { GalleryCard } from "./GalleryCard";
import { ProjectsGrid } from "./ProjectsGrid";
import { SettingsMenu } from "./SettingsMenu";
import { ProjectsModal } from "../projects/ProjectsModal";
import { deserializeSavedProject } from "@/lib/photo-editor/saved-projects/serialize";
import { useInstallPrompt } from "@/lib/photo-editor/pwa/install-prompt";
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

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
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

        <ProjectsGrid
          onProjectLoaded={(project, savedProjectId) =>
            onProjectLoaded(project, savedProjectId)
          }
        />
      </main>

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
    </div>
  );
}
