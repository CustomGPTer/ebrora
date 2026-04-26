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
//         EmptyState       ← home view: Upload photo / Start blank / Recents
//         EditorProvider   ← editor reducer + history (only mounted in editor view)
//           EditorShell    ← top chrome + canvas + bottom toolbar
//
// Session 7: ViewportShell now also tracks the SavedProject id when
// the user enters the editor by tapping a Recent project (or by
// loading from the Projects modal — that path runs while EditorShell
// is mounted, so it's owned there). The id is passed to EditorShell
// as initialSavedProjectId so autosave knows whether the project is
// already named.

"use client";

import { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ThemeRoot, ThemeStyles } from "./theme/ThemeStyles";
import { EditorProvider } from "./context/EditorContext";
import { EmptyState } from "./home/EmptyState";
import { EditorShell } from "./EditorShell";
import { createBlankProject } from "@/lib/photo-editor/canvas/state";
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

  function startBlank() {
    setSeedProject(createBlankProject({ name: "Untitled" }));
    setSeedSavedId(null);
    setView({ kind: "editor" });
  }

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
        <EmptyState
          onStartBlank={startBlank}
          onProjectLoaded={openWithProject}
        />
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
