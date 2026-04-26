// src/components/photo-editor/EditorShell.tsx
//
// The editor view: top chrome, canvas area, and bottom toolbar.
//
// Top chrome (Session 8 — HANDOVER-7 §6.5 Q1 default a):
//   • Hamburger drawer (left)        ← editor commands live here now
//   • Project name (centred)
//   • Right cluster: Undo / Redo / Save / Export
//
// All other commands (Save-As, Open project, Reset zoom, Layers,
// Theme, Install) moved into the hamburger drawer — see
// HamburgerCorner. Keeps the chrome calm at 360 px.
//
// Right-side overlays share a single activePanel discriminator owned
// here. Adding "export" extends the union; the union is *not* forked.
//
// Session 8 wiring summary:
//   • activePanel union now includes "export"; ExportPanel mounts the
//     same as every other right-drawer
//   • Cmd/Ctrl-S triggers Save (Cmd/Ctrl-Shift-S already handled
//     Save-As in Session 7)
//   • The Konva stage ref now lives on EditorContext rather than
//     being fished out of Konva.stages[0] — both thumbnail generation
//     and the export pipeline read it from there
//   • StorageQuotaError on save surfaces a "browser storage is full"
//     message rather than a generic failure
//
// Custom-font bring-up: as soon as the editor mounts we enumerate
// IndexedDB and re-register every previously-uploaded custom font with
// document.fonts so the canvas engine can paint with them immediately.

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Download as DownloadIcon,
  Redo2,
  Save as SaveIcon,
  Undo2,
} from "lucide-react";
import { CanvasShell } from "./canvas/CanvasShell";
import { HamburgerCorner, type HamburgerCommands } from "./mobile/HamburgerCorner";
import { BottomToolbar } from "./toolbar/BottomToolbar";
import { LayersPanel } from "./layers/LayersPanel";
import { FontPanel } from "./fonts/FontPanel";
import { StickerPanel } from "./stickers/StickerPanel";
import { ShapePanel } from "./shapes/ShapePanel";
import { FormatPanel } from "./text-tools/FormatPanel";
import { ColorPanel } from "./text-tools/ColorPanel";
import { StrokePanel } from "./text-tools/StrokePanel";
import { HighlightPanel } from "./text-tools/HighlightPanel";
import { ShadowPanel } from "./text-tools/ShadowPanel";
import { PositionPanel } from "./text-tools/PositionPanel";
import { EraseTool } from "./erase/EraseTool";
import { ExportPanel } from "./export/ExportPanel";
import { ProjectsModal } from "./projects/ProjectsModal";
import { SaveProjectDialog } from "./projects/SaveProjectDialog";
import { useEditor } from "./context/EditorContext";
import { useTheme } from "./context/ThemeContext";
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
import { useInstallPrompt } from "@/lib/photo-editor/pwa/install-prompt";
import { DEFAULT_VIEWPORT, type SavedProject } from "@/lib/photo-editor/types";

/** Every right-side panel the editor can show. Single-slot — only one
 *  may be open at a time. The text-tool panels (format..position) are
 *  reachable only when a text layer is selected; stickers / shapes are
 *  always available. The "erase" entry opens a full-screen modal rather
 *  than a side drawer but lives on the same discriminator (Session 6).
 *  Session 8 adds "export" — extend, don't fork. */
export type ActivePanel =
  | "layers"
  | "fonts"
  | "stickers"
  | "shapes"
  | "format"
  | "color"
  | "stroke"
  | "highlight"
  | "shadow"
  | "position"
  | "erase"
  | "export"
  | null;

interface EditorShellProps {
  onExit: () => void;
  /** SavedProject id passed in from PhotoEditorClient when the editor
   *  was entered via Recent / Projects modal. null = fresh project. */
  initialSavedProjectId?: string | null;
}

export function EditorShell({
  onExit,
  initialSavedProjectId = null,
}: EditorShellProps) {
  const { state, dispatch, undo, redo, canUndo, canRedo, stageRef } =
    useEditor();
  const { theme, toggle: toggleTheme } = useTheme();
  const { canInstall, install } = useInstallPrompt();

  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
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

  const togglePanel = useCallback(
    (panel: Exclude<ActivePanel, null>) => () =>
      setActivePanel((p) => (p === panel ? null : panel)),
    [],
  );
  const closePanel = useCallback(() => setActivePanel(null), []);

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

  useEffect(() => {
    function onBeforeUnload() {
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
  }, [persist]);

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
      if (e.shiftKey) return; // Save-As listener handles this case.
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveClick();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSaveClick]);

  // ── Hamburger commands ────────────────────────────────────────
  const handleResetZoom = useCallback(() => {
    dispatch({ type: "SET_VIEWPORT", viewport: DEFAULT_VIEWPORT });
  }, [dispatch]);

  const handleInstall = useCallback(() => {
    void install();
  }, [install]);

  const hamburgerCommands = useMemo<HamburgerCommands>(
    () => ({
      onSave: handleSaveClick,
      onSaveAs: handleSaveAsClick,
      onOpenProjects: () => setProjectsModalOpen(true),
      onOpenExport: () => setActivePanel("export"),
      onResetZoom: handleResetZoom,
      onToggleLayers: () =>
        setActivePanel((p) => (p === "layers" ? null : "layers")),
      layersOpen: activePanel === "layers",
      onToggleTheme: toggleTheme,
      currentTheme: theme,
      canInstall,
      onInstall: handleInstall,
    }),
    [
      handleSaveClick,
      handleSaveAsClick,
      handleResetZoom,
      activePanel,
      toggleTheme,
      theme,
      canInstall,
      handleInstall,
    ],
  );

  const saveButtonLabel = useMemo(() => {
    if (savingInFlight) return "Saving…";
    if (savedProjectId === null) return "Save";
    return "Saved";
  }, [savingInFlight, savedProjectId]);

  return (
    <div
      className="flex flex-col w-full"
      style={{
        background: "var(--pe-bg)",
        minHeight: "100vh",
        height: "100vh",
      }}
    >
      {/* ── Top chrome ─────────────────────────────────────────── */}
      <div
        className="flex-none flex items-center justify-between px-3"
        style={{
          height: 52,
          borderBottom: "1px solid var(--pe-border)",
          background: "var(--pe-toolbar-bg)",
        }}
      >
        <HamburgerCorner onExit={onExit} commands={hamburgerCommands} />
        <ProjectNameDisplay />
        <div className="flex items-center gap-1">
          <ChromeIconButton
            onClick={undo}
            disabled={!canUndo}
            ariaLabel="Undo"
            icon={<Undo2 className="w-5 h-5" strokeWidth={1.75} />}
          />
          <ChromeIconButton
            onClick={redo}
            disabled={!canRedo}
            ariaLabel="Redo"
            icon={<Redo2 className="w-5 h-5" strokeWidth={1.75} />}
          />
          <ChromeIconButton
            onClick={handleSaveClick}
            ariaLabel={saveButtonLabel}
            icon={<SaveIcon className="w-5 h-5" strokeWidth={1.75} />}
            active={savedProjectId !== null}
          />
          <ChromeIconButton
            onClick={togglePanel("export")}
            ariaLabel={
              activePanel === "export" ? "Close export panel" : "Open export panel"
            }
            icon={<DownloadIcon className="w-5 h-5" strokeWidth={1.75} />}
            active={activePanel === "export"}
            ariaPressed={activePanel === "export"}
          />
        </div>
      </div>

      {/* Save error banner (StorageQuotaError, etc) ──────────── */}
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

      {/* ── Canvas area ────────────────────────────────────────── */}
      <CanvasShell />

      {/* ── Bottom toolbar ─────────────────────────────────────── */}
      <BottomToolbar
        activePanel={activePanel}
        onTogglePanel={togglePanel}
      />

      {/* ── Right-side overlays (mutually exclusive via activePanel) ── */}
      <LayersPanel
        open={activePanel === "layers"}
        onClose={closePanel}
      />
      <FontPanel open={activePanel === "fonts"} onClose={closePanel} />
      <StickerPanel open={activePanel === "stickers"} onClose={closePanel} />
      <ShapePanel open={activePanel === "shapes"} onClose={closePanel} />
      <FormatPanel open={activePanel === "format"} onClose={closePanel} />
      <ColorPanel open={activePanel === "color"} onClose={closePanel} />
      <StrokePanel open={activePanel === "stroke"} onClose={closePanel} />
      <HighlightPanel
        open={activePanel === "highlight"}
        onClose={closePanel}
      />
      <ShadowPanel open={activePanel === "shadow"} onClose={closePanel} />
      <PositionPanel
        open={activePanel === "position"}
        onClose={closePanel}
      />
      <ExportPanel open={activePanel === "export"} onClose={closePanel} />

      {/* ── Full-screen modals ─────────────────────────────────── */}
      <EraseTool open={activePanel === "erase"} onClose={closePanel} />

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

      <SaveAsKeyboardListener onTrigger={handleSaveAsClick} />
    </div>
  );
}

// ─── Top-chrome helpers ──────────────────────────────────────────

function ProjectNameDisplay() {
  const { state } = useEditor();
  return (
    <div
      className="text-sm font-medium truncate max-w-[30vw] sm:max-w-[40vw]"
      style={{ color: "var(--pe-text-muted)" }}
    >
      {state.project.name}
    </div>
  );
}

function ChromeIconButton({
  onClick,
  ariaLabel,
  icon,
  active = false,
  disabled = false,
  ariaPressed,
}: {
  onClick: () => void;
  ariaLabel: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className="w-9 h-9 inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

// ─── Save-As keyboard listener ──────────────────────────────────

function SaveAsKeyboardListener({ onTrigger }: { onTrigger: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && isEditableTarget(target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "s" && e.shiftKey) {
        e.preventDefault();
        onTrigger();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTrigger]);
  return null;
}

function isEditableTarget(el: HTMLElement): boolean {
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}

// ─── Reusable thumbnail helper (autosave path) ──────────────────

async function getReusableThumbnail(id: string | null): Promise<string> {
  if (!id) return "";
  try {
    const rec = await loadProjectRecord(id);
    return rec?.thumbnail ?? "";
  } catch {
    return "";
  }
}
