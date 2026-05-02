// src/components/photo-editor/EditorShell.tsx
//
// The editor view: top chrome, canvas area, and bottom dock.
//
// Batch 1 — Mobile editor rebuild (top bar, dock, +, Subscribe).
// Batch 3 — MobileEditProvider + BottomEditDrawer (tap text → edit).
// Batch 4 — SelectionTools overlay (mounted inside CanvasShell).
// Batch 5 — Crop / FlipRotate / Resize background-tool modals.
// Batch 6 — Effects modal (filters), wired to the previously-stubbed
//           Effects button in the dock. Mounted as the fourth slot in
//           the `backgroundTool` state machine.
// Batch 7 — Save and Share page. The top-bar arrow no longer triggers
//           the IndexedDB save directly; instead it opens the new
//           SaveAndSharePage (Project / Image / PDF / Share To). The
//           existing handleSaveClick is reused as the page's Project
//           handler, and Cmd/Ctrl-S still triggers it directly so
//           keyboard users keep their fast-save path.
//
// What's preserved:
//   • activePanel discriminator + every right-side drawer
//   • Erase modal + ProjectsModal + SaveProjectDialog
//   • Custom-font bring-up, autosave, keyboard shortcuts, beforeunload
//     thumbnail flush

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CanvasShell } from "./canvas/CanvasShell";
import { BottomEditDrawer } from "./canvas/BottomEditDrawer";
import { EditorTopBar } from "./toolbar/EditorTopBar";
import { BottomDock } from "./toolbar/BottomDock";
import { AddLayerSheet } from "./toolbar/AddLayerSheet";
import { CropTool } from "./tools/CropTool";
import { LayerCropTool } from "./tools/LayerCropTool";
import { FlipRotateTool } from "./tools/FlipRotateTool";
import { ResizeTool } from "./tools/ResizeTool";
import { EffectsTool } from "./tools/EffectsTool";
import { LayersPanel } from "./layers/LayersPanel";
import { StickerPanel } from "./stickers/StickerPanel";
import { ShapePanel } from "./shapes/ShapePanel";
import { EraseTool } from "./erase/EraseTool";
import { ProjectsModal } from "./projects/ProjectsModal";
import { SaveProjectDialog } from "./projects/SaveProjectDialog";
import { SaveAndSharePage } from "./save-and-share/SaveAndSharePage";
import { useEditor } from "./context/EditorContext";
import {
  MobileEditProvider,
  useMobileEdit,
} from "./context/MobileEditContext";
import { SmartGuidesProvider } from "./canvas/SmartGuidesContext";
import { CanvasPickerProvider } from "./context/CanvasPickerContext";
import { CanvasPickerOverlay } from "./canvas/CanvasPickerOverlay";
import { LayerEffectsTool } from "./tools/LayerEffectsTool";
import { loadAllCustomFonts } from "@/lib/photo-editor/fonts/custom-fonts-db";
import {
  loadProject as loadProjectRecord,
  saveProject,
  StorageQuotaError,
} from "@/lib/photo-editor/saved-projects/db";
import {
  deserializeSavedProject,
  serializeSavedProject,
} from "@/lib/photo-editor/saved-projects/serialize";
import { generateThumbnail } from "@/lib/photo-editor/saved-projects/thumbnail";
import { createAutosaver } from "@/lib/photo-editor/saved-projects/autosave";
import {
  saveDraft,
  deleteDraft,
} from "@/lib/photo-editor/saved-projects/draft";
import type { SavedProject } from "@/lib/photo-editor/types";

/** Every right-side panel the editor can show. Single-slot — only one
 *  may be open at a time.
 *
 *  Membership is driven by what UI elements actually dispatch a value
 *  to this slot. Post-I (FontPanel inline migration):
 *    layers   — toggleLayersPanel (top bar / nav)
 *    stickers — AddLayerSheet + bg dock
 *    shapes   — AddLayerSheet + bg dock
 *    erase    — text Erase tab launcher
 *    effects  — image Effects tab launcher (Batch E)
 *
 *  Earlier batches' members removed in D3 (text/shape/image now use
 *  inline TabStrip + PropertyPanelHost): format, stroke, image-stroke,
 *  highlight, shadow, perspective, opacity. Plus "export" — the
 *  ExportPanel.tsx file became orphaned when SaveAndSharePage replaced
 *  the legacy drawer flow in Batch A.
 *
 *  Removed in H (sticker migrated to inline strip): color, position.
 *
 *  Removed in I (FontPanel grew an inline? prop, text Font tab no
 *  longer launches a drawer): fonts. */
export type ActivePanel =
  | "layers"
  | "stickers"
  | "shapes"
  | "erase"
  | "effects"
  | null;

/** Full-screen modals. Includes layer-crop (the per-image-layer crop
 *  tool, distinct from the project-background crop). */
type BackgroundTool =
  | "crop"
  | "flip-rotate"
  | "resize"
  | "effects"
  | "layer-crop"
  | null;

interface EditorShellProps {
  onExit: () => void;
  initialSavedProjectId?: string | null;
}

export function EditorShell(props: EditorShellProps) {
  return (
    <MobileEditProvider>
      <SmartGuidesProvider>
        <CanvasPickerProvider>
          <EditorShellInner {...props} />
        </CanvasPickerProvider>
      </SmartGuidesProvider>
    </MobileEditProvider>
  );
}

function EditorShellInner({
  onExit,
  initialSavedProjectId = null,
}: EditorShellProps) {
  const { state, dispatch, stageRef } = useEditor();
  const { state: mobileEdit, endEditing } = useMobileEdit();

  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [backgroundTool, setBackgroundTool] = useState<BackgroundTool>(null);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(
    initialSavedProjectId,
  );
  const [savedCreatedAt, setSavedCreatedAt] = useState<number | null>(null);

  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [saveDialogMode, setSaveDialogMode] = useState<
    "first-save" | "save-as" | null
  >(null);
  const [savingInFlight, setSavingInFlight] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(
    null,
  );

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  // Batch A — shared ref to the "+" button in the top bar so the
  // AddLayerSheet popover can anchor itself directly underneath it.
  const addAnchorRef = useRef<HTMLButtonElement>(null);

  // Batch 7 — Save and Share full-screen page (destination of the
  // top-bar arrow). Mounted at the modal layer, z-[290]; sits above
  // the panels (210) and AddLayerSheet (221), below EraseTool (300)
  // and the toast (400).
  const [saveAndShareOpen, setSaveAndShareOpen] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const togglePanel = useCallback(
    (panel: Exclude<ActivePanel, null>) => () =>
      setActivePanel((p) => (p === panel ? null : panel)),
    [],
  );
  const closePanel = useCallback(() => setActivePanel(null), []);
  const openPanel = useCallback(
    (panel: Exclude<ActivePanel, null>) => setActivePanel(panel),
    [],
  );
  const toggleLayersPanel = useCallback(
    () => setActivePanel((p) => (p === "layers" ? null : "layers")),
    [],
  );

  // Auto-commit BottomEditDrawer when selection clears.
  useEffect(() => {
    if (mobileEdit.editingLayerId === null) return;
    if (!state.selection.includes(mobileEdit.editingLayerId)) {
      endEditing(true);
    }
  }, [state.selection, mobileEdit.editingLayerId, endEditing]);

  // ── Custom-font bring-up ──────────────────────────────────────
  useEffect(() => {
    void loadAllCustomFonts();
  }, []);

  // ── Hydrate savedCreatedAt when entering with an existing id ──
  useEffect(() => {
    if (!initialSavedProjectId) return;
    let cancelled = false;
    (async () => {
      try {
        const rec = await loadProjectRecord(initialSavedProjectId);
        if (!cancelled && rec) setSavedCreatedAt(rec.createdAt);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSavedProjectId]);

  // ── Save callback used by both autosave and explicit save ─────
  const projectRef = useRef(state.project);
  projectRef.current = state.project;
  const savedIdRef = useRef(savedProjectId);
  savedIdRef.current = savedProjectId;
  const savedCreatedAtRef = useRef(savedCreatedAt);
  savedCreatedAtRef.current = savedCreatedAt;

  const persist = useCallback(
    async (
      explicitName: string | null,
      withThumbnail: boolean,
    ): Promise<SavedProject> => {
      const project = projectRef.current;
      const stage = stageRef.current;
      const thumbnail = withThumbnail
        ? await generateThumbnail(stage)
        : await getReusableThumbnail(savedIdRef.current);
      const record = serializeSavedProject(project, {
        id: savedIdRef.current ?? undefined,
        name: explicitName ?? project.name,
        createdAt: savedCreatedAtRef.current ?? undefined,
        thumbnail,
      });
      await saveProject(record);
      setSavedProjectId(record.id);
      setSavedCreatedAt(record.createdAt);
      if (explicitName && explicitName !== project.name) {
        dispatch({ type: "RENAME_PROJECT", name: explicitName });
      }
      return record;
    },
    [dispatch, stageRef],
  );

  // ── Autosave wiring ───────────────────────────────────────────
  const autosaverRef = useRef(
    createAutosaver(async () => {
      try {
        await persist(null, false);
      } catch (err) {
        if (err instanceof StorageQuotaError) {
          setSaveErrorMessage(
            "Browser storage is full. Open the Projects panel and delete saved projects you no longer need.",
          );
        }
      }
    }),
  );

  useEffect(() => {
    autosaverRef.current.setArmed(savedProjectId !== null);
  }, [savedProjectId]);

  useEffect(() => {
    autosaverRef.current.schedule();
  }, [state.project]);

  useEffect(() => {
    const autosaver = autosaverRef.current;
    return () => {
      autosaver.destroy();
    };
  }, []);

  // ── Draft autosave (always-armed) ─────────────────────────────
  // The Autosaver above only fires for projects that have been
  // explicitly saved (savedProjectId !== null). That left a hole: a
  // user could spend ten minutes editing a fresh, never-named project,
  // hit refresh, and lose everything. The draft autosaver fills it —
  // it persists the current project to a single reserved IndexedDB
  // record (DRAFT_PROJECT_ID, see saved-projects/draft.ts) on every
  // edit, debounced. EmptyState picks it up on next page load and
  // shows the Restore prompt.
  //
  // Whenever the project is explicitly saved (savedProjectId becomes
  // non-null) we delete the draft — the project now lives under a
  // real id in the projects list, so keeping a duplicate draft would
  // be confusing and waste storage.
  const draftAutosaverRef = useRef(
    createAutosaver(async () => {
      await saveDraft(projectRef.current);
    }, 1500),
  );

  useEffect(() => {
    // Draft autosave runs for ALL projects including unnamed ones — no
    // armed gate. We arm it once and leave it on for the editor's
    // lifetime.
    draftAutosaverRef.current.setArmed(true);
  }, []);

  useEffect(() => {
    draftAutosaverRef.current.schedule();
  }, [state.project]);

  useEffect(() => {
    if (savedProjectId !== null) {
      // Project is now persisted under a real id — the draft is
      // redundant and would re-trigger the Restore dialog after a
      // refresh even though the user already has the work in their
      // Projects list.
      void deleteDraft();
    }
  }, [savedProjectId]);

  useEffect(() => {
    const autosaver = draftAutosaverRef.current;
    return () => {
      autosaver.destroy();
    };
  }, []);

  useEffect(() => {
    function onBeforeUnload() {
      // Best-effort draft flush so even edits made within the 1.5s
      // debounce window get a chance to persist before unload. flush()
      // is async; modern browsers run a little JS during unload but
      // don't await promises, so this isn't a hard guarantee — the
      // regular debounced save remains the primary protection.
      void saveDraft(projectRef.current);

      if (savedIdRef.current === null) return;
      const stage = stageRef.current;
      void (async () => {
        try {
          const thumb = await generateThumbnail(stage);
          const record = serializeSavedProject(projectRef.current, {
            id: savedIdRef.current ?? undefined,
            name: projectRef.current.name,
            createdAt: savedCreatedAtRef.current ?? undefined,
            thumbnail: thumb,
          });
          await saveProject(record);
        } catch {
          // ignore — nothing to do at unload time
        }
      })();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [stageRef]);

  // ── Save / Save-As / Load handlers ────────────────────────────

  const handleSaveClick = useCallback(() => {
    if (savedIdRef.current === null) {
      setSaveDialogMode("first-save");
      return;
    }
    autosaverRef.current.cancel();
    setSavingInFlight(true);
    setSaveErrorMessage(null);
    void (async () => {
      try {
        await persist(null, true);
        showToast("Saved");
      } catch (err) {
        if (err instanceof StorageQuotaError) {
          setSaveErrorMessage(
            "Browser storage is full. Delete some saved projects and try again.",
          );
        } else {
          setSaveErrorMessage("Couldn't save the project. Try again.");
        }
      } finally {
        setSavingInFlight(false);
      }
    })();
  }, [persist, showToast]);

  const handleSaveAsClick = useCallback(() => {
    setSaveDialogMode("save-as");
  }, []);

  async function handleSaveDialogSubmit(name: string) {
    const mode = saveDialogMode;
    setSaveDialogMode(null);
    autosaverRef.current.cancel();
    setSavingInFlight(true);
    setSaveErrorMessage(null);
    try {
      if (mode === "save-as") {
        savedIdRef.current = null;
        savedCreatedAtRef.current = null;
        setSavedProjectId(null);
        setSavedCreatedAt(null);
      }
      await persist(name, true);
      showToast("Saved");
    } catch (err) {
      if (err instanceof StorageQuotaError) {
        setSaveErrorMessage(
          "Browser storage is full. Delete some saved projects and try again.",
        );
      } else {
        setSaveErrorMessage("Couldn't save the project. Try again.");
      }
    } finally {
      setSavingInFlight(false);
    }
  }

  async function handleProjectsModalLoad(record: SavedProject) {
    autosaverRef.current.cancel();
    autosaverRef.current.setArmed(false);
    const project = deserializeSavedProject(record);
    dispatch({ type: "LOAD_PROJECT", project });
    setSavedProjectId(record.id);
    setSavedCreatedAt(record.createdAt);
    setProjectsModalOpen(false);
  }

  // ── Cmd/Ctrl-S keyboard shortcut ──────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && isEditableTarget(target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.shiftKey) {
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          handleSaveAsClick();
        }
        return;
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveClick();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSaveClick, handleSaveAsClick]);

  return (
    <div
      className="flex flex-col w-full"
      style={{
        background: "var(--pe-bg)",
        minHeight: "100vh",
        height: "100vh",
      }}
    >
      <EditorTopBar
        onExit={onExit}
        onOpenAddSheet={() => setAddSheetOpen(true)}
        onToggleLayers={toggleLayersPanel}
        layersOpen={activePanel === "layers"}
        onOpenSaveAndShare={() => setSaveAndShareOpen(true)}
        saved={savedProjectId !== null}
        addAnchorRef={addAnchorRef}
      />

      {saveErrorMessage && (
        <div
          role="alert"
          className="flex-none px-4 py-2 text-sm flex items-center justify-between gap-3"
          style={{
            background: "rgba(220, 38, 38, 0.1)",
            color: "#991B1B",
            borderBottom: "1px solid rgba(220, 38, 38, 0.4)",
          }}
        >
          <span>{saveErrorMessage}</span>
          <button
            type="button"
            onClick={() => setSaveErrorMessage(null)}
            aria-label="Dismiss save error"
            className="text-xs font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <CanvasShell />

      <CanvasPickerOverlay />

      <BottomDock
        activePanel={activePanel}
        onTogglePanel={togglePanel}
        onOpenPanel={openPanel}
        onStub={showToast}
        onOpenCrop={() => setBackgroundTool("crop")}
        onOpenLayerCrop={() => setBackgroundTool("layer-crop")}
        onOpenResize={() => setBackgroundTool("resize")}
        onOpenFlipRotate={() => setBackgroundTool("flip-rotate")}
        onOpenEffects={() => setBackgroundTool("effects")}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-full text-sm pointer-events-none"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 220px)",
            background: "rgba(17, 24, 39, 0.92)",
            color: "#FFFFFF",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
          {toast}
        </div>
      )}

      <AddLayerSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onOpenPanel={openPanel}
        onStub={showToast}
        anchorRef={addAnchorRef}
      />

      <BottomEditDrawer />

      {/* Right-side overlays — only kinds still dispatched by UI
          live here post-I. Color/position migrated to inline in H,
          fonts migrated in I. The format/stroke/image-stroke/highlight/
          shadow/perspective/opacity panels migrated to inline mounts
          inside BottomDock (Batches C/D1/D2c/E2). ExportPanel was
          orphaned by Batch A's SaveAndSharePage. */}
      <LayersPanel open={activePanel === "layers"} onClose={closePanel} />
      <StickerPanel open={activePanel === "stickers"} onClose={closePanel} />
      <ShapePanel open={activePanel === "shapes"} onClose={closePanel} />

      {/* Full-screen modals */}
      <EraseTool open={activePanel === "erase"} onClose={closePanel} />
      <LayerEffectsTool
        open={activePanel === "effects"}
        onClose={closePanel}
      />

      <CropTool
        open={backgroundTool === "crop"}
        onClose={() => setBackgroundTool(null)}
      />
      <LayerCropTool
        open={backgroundTool === "layer-crop"}
        onClose={() => setBackgroundTool(null)}
      />
      <FlipRotateTool
        open={backgroundTool === "flip-rotate"}
        onClose={() => setBackgroundTool(null)}
      />
      <ResizeTool
        open={backgroundTool === "resize"}
        onClose={() => setBackgroundTool(null)}
      />
      <EffectsTool
        open={backgroundTool === "effects"}
        onClose={() => setBackgroundTool(null)}
      />

      <SaveAndSharePage
        open={saveAndShareOpen}
        onClose={() => setSaveAndShareOpen(false)}
        onProjectSave={handleSaveClick}
        savedProjectId={savedProjectId}
        projectSaving={savingInFlight}
        onToast={showToast}
      />

      <ProjectsModal
        open={projectsModalOpen}
        currentProjectId={savedProjectId}
        onClose={() => setProjectsModalOpen(false)}
        onLoad={(record) => void handleProjectsModalLoad(record)}
      />

      <SaveProjectDialog
        open={saveDialogMode !== null}
        initialName={state.project.name}
        title={
          saveDialogMode === "save-as" ? "Save as new project" : "Save project"
        }
        submitLabel={
          saveDialogMode === "save-as" ? "Save as new" : "Save"
        }
        onCancel={() => setSaveDialogMode(null)}
        onSubmit={(name) => void handleSaveDialogSubmit(name)}
      />
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function isEditableTarget(el: HTMLElement): boolean {
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}

async function getReusableThumbnail(id: string | null): Promise<string> {
  if (!id) return "";
  try {
    const rec = await loadProjectRecord(id);
    return rec?.thumbnail ?? "";
  } catch {
    return "";
  }
}
