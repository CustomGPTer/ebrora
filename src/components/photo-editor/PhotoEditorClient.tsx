// src/components/photo-editor/PhotoEditorClient.tsx
//
// Top-level client component for the Photo Editor.
//
// Provider tree:
//   ThemeProvider          ← theme state hook with localStorage
//     ThemeStyles          ← injects CSS variables into the page once
//     ThemeRoot            ← div with data-pe-theme that scopes the variables
//       ViewportShell      ← positions the editor (fixed inset-0 on small screens,
//                            normal page flow on lg+)
//         EmptyState       ← home view: Background swatches / Gallery / Projects
//                            (Batch 2 rebuild — replaces the previous
//                            "Upload photo / Start blank" two-button hero)
//         EditorProvider   ← editor reducer + history (only mounted in editor view)
//           EditorShell    ← top chrome + canvas + bottom dock
//
// Batch 2 (April 2026): the EmptyState API simplifies — `onStartBlank`
// is gone because the new Background row covers "start with a colour /
// gradient." All entries into the editor now go through the single
// `onProjectLoaded(project, savedProjectId | null)` channel.

"use client";

import { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ThemeRoot, ThemeStyles } from "./theme/ThemeStyles";
import { EditorProvider } from "./context/EditorContext";
import { EmptyState } from "./home/EmptyState";
import { EditorShell } from "./EditorShell";
import type { Project } from "@/lib/photo-editor/types";

type View = { kind: "home" } | { kind: "editor" };

export default function PhotoEditorClient() {
  return (
    <ThemeProvider>
      <ThemeStyles />
      <ThemeRoot>
        <ViewportShell />
      </ThemeRoot>
    </ThemeProvider>
  );
}

function ViewportShell() {
  const [view, setView] = useState<View>({ kind: "home" });
  const [seedProject, setSeedProject] = useState<Project | undefined>(
    undefined,
  );
  const [seedSavedId, setSeedSavedId] = useState<string | null>(null);

  function openWithProject(project: Project, savedProjectId: string | null) {
    setSeedProject(project);
    setSeedSavedId(savedProjectId);
    setView({ kind: "editor" });
  }

  function returnHome() {
    setView({ kind: "home" });
    setSeedProject(undefined);
    setSeedSavedId(null);
  }

  // On lg+ screens the editor sits inside the normal page flow under the
  // global Ebrora NavBar. On smaller screens (phones, most tablets) it
  // takes over the viewport with position:fixed inset-0 so we get the
  // full-bleed app feel Q11 calls for.
  return (
    <div
      className="max-lg:fixed max-lg:inset-0 max-lg:z-[60]"
      style={{ background: "var(--pe-bg)", minHeight: "100vh" }}
    >
      {view.kind === "home" ? (
        <EmptyState onProjectLoaded={openWithProject} />
      ) : (
        <EditorProvider initialProject={seedProject}>
          <EditorShell
            onExit={returnHome}
            initialSavedProjectId={seedSavedId}
          />
        </EditorProvider>
      )}
    </div>
  );
}
