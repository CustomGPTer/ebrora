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
//         EmptyState       ← home view
//         EditorProvider   ← editor reducer + history (only mounted in editor view)
//           EditorShell    ← top chrome + canvas + bottom dock
//
// Batch 7 (April 2026): full-screen takeover on mobile.
//   The site's NavBar (fixed, z-[500]) was layering over the editor on
//   small screens — modals lost their X / ✓, the canvas had a 64-px
//   strip of site chrome at the top, and a NavBar spacer + Footer were
//   bleeding into the viewport. We now:
//     1. Inject a one-shot <style> tag that hides every site-level
//        chrome element on mobile while the editor is mounted, scoped
//        with a `body.pe-fullscreen` class so it can't leak.
//     2. Bump the wrapper z-index from 60 to 1000 so even if a
//        future site element sneaks in at z-500/600, the editor still
//        wins.
//     3. Add `overflow:hidden` to the body while open to suppress any
//        scrollbar-induced grey strip on the right edge from the
//        underlying page document being taller than the viewport.

"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ThemeRoot, ThemeStyles } from "./theme/ThemeStyles";
import { EditorProvider } from "./context/EditorContext";
import { EmptyState } from "./home/EmptyState";
import { EditorShell } from "./EditorShell";
import type { Project } from "@/lib/photo-editor/types";

type View = { kind: "home" } | { kind: "editor" };

export default function PhotoEditorClient() {
  // Take over the full mobile viewport: hide the site's NavBar, its
  // 64-px spacer, the Footer, and any other site-level chrome that
  // would otherwise overlap or push the editor around. The injected
  // CSS only applies when `body.pe-fullscreen` is present, and only
  // up to the lg breakpoint (so desktop visitors still see the site
  // nav and the editor is embedded normally).
  useEffect(() => {
    const STYLE_ID = "pe-fullscreen-overrides";
    if (document.getElementById(STYLE_ID)) {
      // Already mounted by another instance — bail out gracefully.
      document.body.classList.add("pe-fullscreen");
      return () => {
        document.body.classList.remove("pe-fullscreen");
      };
    }

    const styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    styleEl.textContent = `
      @media (max-width: 1023px) {
        /* Hide site NavBar (it's fixed at z-500 and was sitting on
           top of the editor + every editor modal). The selector is
           narrow enough not to touch the editor's own <nav>-like
           toolbars (they don't carry role="navigation"). */
        body.pe-fullscreen nav[role="navigation"] {
          display: none !important;
        }
        /* The NavBar emits a 64-px spacer div as a sibling so page
           content sits below the fixed nav. Hide it too — without
           this our editor gets pushed down 64 px on mobile. */
        body.pe-fullscreen nav[role="navigation"] + div {
          display: none !important;
        }
        /* Site footer (in normal flow) — irrelevant inside the
           editor, hide it so vertical scroll doesn't fight us. */
        body.pe-fullscreen footer {
          display: none !important;
        }
        /* Suppress page-level scroll while the editor is open. The
           grey vertical strip the user was seeing on the right edge
           was the page document's scrollbar gutter. */
        body.pe-fullscreen {
          overflow: hidden !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
    document.body.classList.add("pe-fullscreen");

    return () => {
      document.body.classList.remove("pe-fullscreen");
      const el = document.getElementById(STYLE_ID);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, []);

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

  // On lg+ screens the editor sits inside the normal page flow.
  // On smaller screens (phones, most tablets) it takes over the
  // viewport — z-[1000] so we're above the site NavBar (z-500), the
  // hidden site Footer, and every other piece of site chrome.
  return (
    <div
      className="max-lg:fixed max-lg:inset-0 max-lg:z-[1000]"
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
