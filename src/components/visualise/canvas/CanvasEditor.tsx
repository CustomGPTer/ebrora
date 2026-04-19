'use client';

// =============================================================================
// CanvasEditor — full-screen overlay that opens when a user clicks Edit on
// a VisualCard. Hosts the pan/zoom canvas, the preset gallery, the settings
// panel, and the top toolbar (undo/redo/zoom/fit/close).
//
// 6a scope: shell, pan/zoom, rulers, sidebars, palette swap, preset swap,
// whole-visual history, mobile lockout.
//
// 6b additions:
//   ✓ Node selection via click (single, shift-add, ctrl-toggle)
//   ✓ Marquee selection by drag over empty canvas
//   ✓ Drag-to-move selected nodes, with 8 px grid snap and alignment guides
//   ✓ 8 resize handles on the selection bbox (shift locks aspect ratio)
//   ✓ Gold dashed outline on selected nodes (non-scaling stroke)
//   ✓ Escape → deselect (then close if nothing selected)
//   ✓ canvas.nodes[id] override applied to the preset SVG via DOM after
//     every render — presets don't need to know about overrides
//
// 6c additions (this file):
//   ✓ Right-click → context menu (Bring forward / Send backward / Delete /
//     Copy style / Paste style)
//   ✓ Full keyboard shortcuts via buildCanvasKeyHandler (Delete, Ctrl+A,
//     arrow-nudge, Ctrl+G / Ctrl+Shift+G, Ctrl+C / Ctrl+V style clipboard)
//   ✓ Double-click text → inline edit via InlineTextEditor, path-resolved
//     through textEdit.ts registry
//   ✓ Expand-to-groups on click (clicking a group member selects the group)
//   ✓ Soft-delete via canvas.nodes[id].hidden → display:none on DOM apply
//   ✓ Bring forward / Send backward via canvas.nodes[id].zIndex → DOM reorder
//
// Duplicate (Ctrl+D) is intentionally not wired — see §4.1-Q2 in the 6c
// handover. Gated on a future `supportsDuplicate` flag on Preset<TData>.
//
// Integration: mounted by VisualiseClient. Opens via the
// `visualise:open-canvas` CustomEvent dispatched from VisualCard. Parent
// passes the live document + an onUpdateVisual callback.
// =============================================================================

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { getPresetById } from '@/lib/visualise/presets';
import type {
  VisualCanvasState,
  VisualInstance,
  VisualiseDocumentBlob,
} from '@/lib/visualise/types';
import { createHistory, type HistoryApi } from '@/lib/visualise/canvas/history';
import {
  addToSelection,
  currentNodeBBox,
  getSelectionBBox,
  hitTestMarquee,
  selectOnly,
  toggleSelection,
  type MarqueeRect,
  type NodeBBox,
} from '@/lib/visualise/canvas/selection';
import {
  findAlignmentGuides,
  snapToGrid,
  type AlignmentGuide,
} from '@/lib/visualise/canvas/snapping';
import {
  dissolveGroup,
  expandToGroups,
  groupNodes,
} from '@/lib/visualise/canvas/grouping';
import { buildCanvasKeyHandler } from '@/lib/visualise/canvas/keyboard';
import {
  copyStyleFrom,
  hasStyleInClipboard,
  pasteStyleInto,
} from '@/lib/visualise/canvas/styleClipboard';
import {
  applyTextEdit,
  resolveTextEditTarget,
  type TextEditTarget,
} from '@/lib/visualise/canvas/textEdit';
import SvgCanvas, { type SvgCanvasApi, type Viewport } from './SvgCanvas';
import Ruler from './Ruler';
import SelectionLayer from './SelectionLayer';
import NodeHandles, { type ResizeDirection } from './NodeHandles';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import InlineTextEditor, { type InlineTextEditorRect } from './InlineTextEditor';
import PresetGallery, { type PresetSwapOutcome } from './Sidebar/PresetGallery';
import SettingsPanel from './Sidebar/SettingsPanel';
// Batch 1b — modals reachable from the canvas editor's top toolbar and
// template gallery. RegenerateWarningModal already existed (used from
// VisualCard on the document view); we reuse it verbatim rather than
// duplicate the copy. ApplyTemplateModal is new in this batch.
import RegenerateWarningModal from '../RegenerateWarningModal';
import ApplyTemplateModal from './ApplyTemplateModal';

interface Props {
  document: VisualiseDocumentBlob;
  editingVisualId: string | null;
  /** Parent-level generating state — disables destructive toolbar actions
   *  (Regenerate, Apply template) while an AI call is in flight. */
  isGenerating: boolean;
  onUpdateVisual: (visualId: string, patch: Partial<VisualInstance>) => void;
  /** Full regenerate of the currently-edited visual using the AI + source.
   *  Fires the server-side generate route with `visualId` and optional
   *  `regenerateSource` ('original' | 'current-content'). Consumes one
   *  credit. Batch 1b + Batch 3a. */
  onRegenerateVisual: (
    visualId: string,
    source?: 'original' | 'current-content',
  ) => void;
  /** Silent auto-remap: force a specific preset and ask the AI to re-map
   *  the original source text into it. Used from the Apply-Template modal
   *  when the user picks an incompatible preset from the sidebar gallery.
   *  Consumes one credit. Batch 1b. */
  onGalleryPickVisual: (visualId: string, presetId: string) => void;
  /** Open the shared ExportModal (the same one DocumentView opens). Batch 1b. */
  onOpenExport: () => void;
  onClose: () => void;
}

const RULER_THICKNESS = 20;
const LEFT_SIDEBAR_WIDTH = 260;
const RIGHT_SIDEBAR_WIDTH = 280;
const TOP_BAR_HEIGHT = 48;
const CONTENT_W = 800;
const CONTENT_H = 400;
const GRID_SIZE = 8;
const SNAP_THRESHOLD = 4;

type HistoryEntry = Pick<VisualInstance, 'presetId' | 'data' | 'settings' | 'canvas' | 'title'>;

function toEntry(v: VisualInstance): HistoryEntry {
  return {
    presetId: v.presetId,
    data: v.data,
    settings: v.settings,
    canvas: v.canvas,
    title: v.title,
  };
}

const DEFAULT_NODE_ENTRY = { x: 0, y: 0, w: 1, h: 1, zIndex: 0 };

interface MoveDragState {
  kind: 'move';
  startClientX: number;
  startClientY: number;
  ids: string[];
  startOffsets: Record<string, { x: number; y: number }>;
  primaryId: string;
  primaryNaturalBBox: NodeBBox;
}

interface ResizeDragState {
  kind: 'resize';
  startClientX: number;
  startClientY: number;
  direction: ResizeDirection;
  startBBox: NodeBBox;
  nodeStarts: Record<string, { bbox: NodeBBox; override: { x: number; y: number; w: number; h: number } }>;
  pendingPatches?: Record<string, { x: number; y: number; w: number; h: number }>;
}

interface MarqueeDragState {
  kind: 'marquee';
  startClientX: number;
  startClientY: number;
  additive: boolean;
}

type DragState = MoveDragState | ResizeDragState | MarqueeDragState;

interface MenuState {
  left: number;
  top: number;
  /** The data-id that was under the cursor when right-clicked, or null for empty-canvas. */
  targetId: string | null;
}

interface TextEditState {
  dataId: string;
  target: TextEditTarget;
  rect: InlineTextEditorRect;
  initialValue: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export default function CanvasEditor({
  document: docBlob,
  editingVisualId,
  isGenerating,
  onUpdateVisual,
  onRegenerateVisual,
  onGalleryPickVisual,
  onOpenExport,
  onClose,
}: Props) {
  const visual = useMemo(() => {
    if (!editingVisualId) return null;
    return docBlob.visuals.find((v) => v.id === editingVisualId) ?? null;
  }, [docBlob, editingVisualId]);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [swapWarning, setSwapWarning] = useState<string | null>(null);

  // Batch 1b — modal state for the two new flows reachable from this editor.
  // `applyTemplateTarget` is the preset ID the user tapped in the sidebar
  // gallery that didn't schema-fit; when non-null the ApplyTemplateModal is
  // open. `regenerateOpen` drives the reused RegenerateWarningModal from
  // the toolbar Regenerate button. Both modals swallow Escape internally.
  const [applyTemplateTarget, setApplyTemplateTarget] = useState<string | null>(null);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  const [viewport, setViewport] = useState<Viewport>({ scale: 1, panX: 0, panY: 0 });
  const viewportRef = useRef(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  const canvasApiRef = useRef<SvgCanvasApi | null>(null);
  const svgWrapperRef = useRef<HTMLDivElement | null>(null);
  const svgContentRef = useRef<HTMLDivElement | null>(null);

  const mainRef = useRef<HTMLDivElement | null>(null);
  const [mainSize, setMainSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setMainSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [leftOpen, rightOpen, visual?.id]);

  // ── Natural bboxes (measured after preset render) ─────────────────────────
  const naturalBBoxesRef = useRef<Record<string, NodeBBox>>({});
  const [naturalBBoxesVersion, setNaturalBBoxesVersion] = useState(0);

  useLayoutEffect(() => {
    if (!visual) return;
    const contentEl = svgContentRef.current;
    if (!contentEl) return;
    // Remove any existing transform overrides + display:none so getBBox
    // sees the natural geometry.
    const gElements = contentEl.querySelectorAll<SVGGElement>('g[data-id]');
    gElements.forEach((g) => {
      g.removeAttribute('transform');
      g.style.removeProperty('display');
    });

    const next: Record<string, NodeBBox> = {};
    gElements.forEach((g) => {
      const id = g.getAttribute('data-id');
      if (!id) return;
      try {
        const b = g.getBBox();
        next[id] = { x: b.x, y: b.y, w: b.width, h: b.height };
      } catch {
        // getBBox can throw on display:none or detached — skip.
      }
    });
    naturalBBoxesRef.current = next;
    setNaturalBBoxesVersion((v) => v + 1);
  }, [visual?.presetId, visual?.data]);

  // ── Drag-time visual state ────────────────────────────────────────────────
  const [liveOffsets, setLiveOffsets] = useState<Record<string, { dx: number; dy: number }>>({});
  const liveOffsetsRef = useRef(liveOffsets);
  useEffect(() => {
    liveOffsetsRef.current = liveOffsets;
  }, [liveOffsets]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [guides, setGuides] = useState<AlignmentGuide[]>([]);

  // ── 6c: transient UI — context menu + inline text editor ─────────────────
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [textEdit, setTextEdit] = useState<TextEditState | null>(null);

  useEffect(() => {
    setSelectedIds(new Set());
    setLiveOffsets({});
    setGuides([]);
    setMarquee(null);
    setMenu(null);
    setTextEdit(null);
  }, [visual?.id]);

  // ── Apply canvas.nodes + liveOffsets + hidden + zIndex to preset SVG ──────
  // 6c extends the 6b effect:
  //   - Honour `hidden: true` → display:none
  //   - Reorder `<g data-id>` children by (zIndex asc, original order) so
  //     "Bring forward" / "Send backward" actually stack. SVG has no CSS
  //     z-index; document order wins, so we physically move the nodes.
  //     Critically, this must happen BEFORE transform application so every
  //     element is in its final parent position — otherwise the transform
  //     walk below could miss re-ordered nodes if a parent swaps mid-loop.
  useEffect(() => {
    const contentEl = svgContentRef.current;
    if (!contentEl || !visual) return;

    const gElements = Array.from(contentEl.querySelectorAll<SVGGElement>('g[data-id]'));

    // ── 1. Z-order reordering ──────────────────────────────────────────────
    // Group by parent (nested <g data-id> inside another would break a
    // single global reorder, so we sort siblings under each parent
    // independently). Each entry remembers its original DOM index to keep
    // the sort stable for equal zIndex values.
    const byParent = new Map<Element, Array<{ el: SVGGElement; z: number; origIdx: number }>>();
    gElements.forEach((g, i) => {
      const parent = g.parentElement;
      if (!parent) return;
      const id = g.getAttribute('data-id');
      const override = id ? visual.canvas.nodes[id] : undefined;
      const z = override?.zIndex ?? 0;
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent)!.push({ el: g, z, origIdx: i });
    });

    byParent.forEach((items, parent) => {
      // Only touch DOM if ordering actually needs to change — mass appendChild
      // costs layout every time.
      const wantsReorder = items.some((x) => x.z !== 0);
      if (!wantsReorder) return;
      items.sort((a, b) => (a.z - b.z) || (a.origIdx - b.origIdx));
      for (const item of items) parent.appendChild(item.el);
    });

    // ── 2. Apply transforms + hidden flag ──────────────────────────────────
    gElements.forEach((g) => {
      const id = g.getAttribute('data-id');
      if (!id) return;
      const override = visual.canvas.nodes[id];

      // Soft-delete.
      if (override?.hidden) {
        g.style.display = 'none';
        g.removeAttribute('transform');
        return;
      }
      g.style.removeProperty('display');

      const live = liveOffsets[id];
      const tx = (override?.x ?? 0) + (live?.dx ?? 0);
      const ty = (override?.y ?? 0) + (live?.dy ?? 0);
      const sx = override?.w && override.w > 0 ? override.w : 1;
      const sy = override?.h && override.h > 0 ? override.h : 1;

      const parts: string[] = [];
      if (tx !== 0 || ty !== 0) parts.push(`translate(${tx}, ${ty})`);
      if (sx !== 1 || sy !== 1) {
        const nat = naturalBBoxesRef.current[id];
        if (nat) {
          parts.push(`translate(${nat.x}, ${nat.y}) scale(${sx}, ${sy}) translate(${-nat.x}, ${-nat.y})`);
        } else {
          parts.push(`scale(${sx}, ${sy})`);
        }
      }
      if (parts.length === 0) g.removeAttribute('transform');
      else g.setAttribute('transform', parts.join(' '));
    });
  }, [visual, liveOffsets, naturalBBoxesVersion]);

  // ── Live bboxes (natural + canvas.nodes overrides) ─────────────────────────
  // Hidden nodes are excluded so selection/marquee/guides don't include them.
  const liveBBoxes = useMemo<Record<string, NodeBBox>>(() => {
    if (!visual) return {};
    const out: Record<string, NodeBBox> = {};
    for (const [id, natural] of Object.entries(naturalBBoxesRef.current)) {
      const override = visual.canvas.nodes[id];
      if (override?.hidden) continue;
      out[id] = currentNodeBBox(natural, override);
    }
    return out;
  }, [visual, naturalBBoxesVersion]);

  // Strip hidden ids from selection if they got hidden (e.g. by undo).
  useEffect(() => {
    if (!visual) return;
    const hidden = new Set<string>();
    for (const [id, o] of Object.entries(visual.canvas.nodes)) {
      if (o.hidden) hidden.add(id);
    }
    if (hidden.size === 0) return;
    let dirty = false;
    const next = new Set<string>();
    selectedIdsRef.current.forEach((id) => {
      if (hidden.has(id)) dirty = true;
      else next.add(id);
    });
    if (dirty) setSelectedIds(next);
  }, [visual]);

  // ── History (per-visual) ──────────────────────────────────────────────────
  const historyRef = useRef<HistoryApi<HistoryEntry> | null>(null);
  const skipHistoryRef = useRef(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const lastPushedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visual) {
      historyRef.current = null;
      return;
    }
    historyRef.current = createHistory<HistoryEntry>(toEntry(visual));
    lastPushedRef.current = hashEntry(toEntry(visual));
    setHistoryVersion((v) => v + 1);
  }, [visual?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visual || !historyRef.current) return;
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      lastPushedRef.current = hashEntry(toEntry(visual));
      return;
    }
    const entry = toEntry(visual);
    const hash = hashEntry(entry);
    if (hash === lastPushedRef.current) return;
    historyRef.current.push(entry);
    lastPushedRef.current = hash;
    setHistoryVersion((v) => v + 1);
  }, [visual]);

  const applyHistoryEntry = useCallback(
    (entry: HistoryEntry) => {
      if (!editingVisualId) return;
      skipHistoryRef.current = true;
      onUpdateVisual(editingVisualId, entry);
    },
    [editingVisualId, onUpdateVisual],
  );

  const handleUndo = useCallback(() => {
    const h = historyRef.current;
    if (!h) return;
    const entry = h.undo();
    if (entry) {
      applyHistoryEntry(entry);
      setHistoryVersion((v) => v + 1);
    }
  }, [applyHistoryEntry]);

  const handleRedo = useCallback(() => {
    const h = historyRef.current;
    if (!h) return;
    const entry = h.redo();
    if (entry) {
      applyHistoryEntry(entry);
      setHistoryVersion((v) => v + 1);
    }
  }, [applyHistoryEntry]);

  const handleVisualPatch = useCallback(
    (patch: Partial<VisualInstance>) => {
      if (!editingVisualId) return;
      onUpdateVisual(editingVisualId, patch);
    },
    [editingVisualId, onUpdateVisual],
  );

  const handlePresetSwap = useCallback(
    (out: PresetSwapOutcome) => {
      if (!editingVisualId || !visual) return;
      const target = getPresetById(out.presetId);
      if (!target) return;
      onUpdateVisual(editingVisualId, {
        presetId: out.presetId,
        data: out.data,
        settings: { ...visual.settings, customColors: {} },
        canvas: { ...visual.canvas, nodes: {}, groups: {} },
      });
      setSwapWarning(out.warning);
      setSelectedIds(new Set());
    },
    [editingVisualId, visual, onUpdateVisual],
  );

  // Batch 1b — incompatible preset pick. The gallery bubbles up the target
  // preset ID here instead of silently swapping to defaultData; we open the
  // ApplyTemplateModal which confirms before committing an AI re-map.
  const handleApplyIntent = useCallback((presetId: string) => {
    setApplyTemplateTarget(presetId);
  }, []);

  // Batch 1b — user confirmed "Apply template" in the modal. Fire the
  // silent auto-remap (same server path the VisualCard gallery uses) and
  // close the modal. The server will return the full document blob with
  // the swapped visual + preserved concept-level fields (caption,
  // nodeDescriptions, variants). We also clear any stale swap warning so
  // the amber banner doesn't linger across a successful remap.
  const handleConfirmApplyTemplate = useCallback(() => {
    if (!editingVisualId || !applyTemplateTarget) return;
    const targetId = applyTemplateTarget;
    onGalleryPickVisual(editingVisualId, targetId);
    setApplyTemplateTarget(null);
    setSwapWarning(null);
    setSelectedIds(new Set());
  }, [editingVisualId, applyTemplateTarget, onGalleryPickVisual]);

  // Batch 1b — the toolbar Regenerate button routes through the existing
  // RegenerateWarningModal for quota/edit awareness, then fires the parent's
  // onRegenerateVisual. Batch 3a — receives the user's source choice
  // (original vs tidy-up) from the modal and threads it through.
  const handleConfirmRegenerate = useCallback(
    (source: 'original' | 'current-content') => {
      if (!editingVisualId) return;
      onRegenerateVisual(editingVisualId, source);
      setRegenerateOpen(false);
      setSwapWarning(null);
      setSelectedIds(new Set());
    },
    [editingVisualId, onRegenerateVisual],
  );

  // Batch 3a — toggle templateLocked on the current visual. A pinned
  // visual keeps its preset across any regenerate. Click to toggle; we
  // just flip the flag locally and the next save persists it.
  const handleToggleTemplateLock = useCallback(() => {
    if (!editingVisualId || !visual) return;
    onUpdateVisual(editingVisualId, {
      templateLocked: !visual.templateLocked,
    });
  }, [editingVisualId, visual, onUpdateVisual]);

  // Memoised name for the Apply-Template modal copy — avoids a fallback
  // flash of "undefined" while the modal opens.
  const applyTemplateTargetName = useMemo(() => {
    if (!applyTemplateTarget) return '';
    const target = getPresetById(applyTemplateTarget);
    return target?.name ?? applyTemplateTarget;
  }, [applyTemplateTarget]);

  // ── Coord helpers ─────────────────────────────────────────────────────────
  const clientToWorld = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const wrap = svgWrapperRef.current;
    if (!wrap) return null;
    const r = wrap.getBoundingClientRect();
    const vp = viewportRef.current;
    return {
      x: (clientX - r.left - vp.panX) / vp.scale,
      y: (clientY - r.top - vp.panY) / vp.scale,
    };
  }, []);

  const bboxToScreenRect = useCallback(
    (bbox: NodeBBox): { left: number; top: number; width: number; height: number } | null => {
      const wrap = svgWrapperRef.current;
      if (!wrap) return null;
      const r = wrap.getBoundingClientRect();
      const vp = viewportRef.current;
      return {
        left: r.left + vp.panX + bbox.x * vp.scale,
        top: r.top + vp.panY + bbox.y * vp.scale,
        width: bbox.w * vp.scale,
        height: bbox.h * vp.scale,
      };
    },
    [],
  );

  // ── Drag state + commit helpers ──────────────────────────────────────────
  const dragStateRef = useRef<DragState | null>(null);
  const [dragKind, setDragKind] = useState<DragState['kind'] | null>(null);

  const commitMove = useCallback(
    (ids: string[], finalOffsets: Record<string, { dx: number; dy: number }>) => {
      if (!visual || !editingVisualId) return;
      const nextNodes: VisualCanvasState['nodes'] = { ...visual.canvas.nodes };
      for (const id of ids) {
        const off = finalOffsets[id];
        if (!off) continue;
        const existing = nextNodes[id] ?? DEFAULT_NODE_ENTRY;
        nextNodes[id] = {
          ...existing,
          x: (existing.x ?? 0) + off.dx,
          y: (existing.y ?? 0) + off.dy,
        };
      }
      onUpdateVisual(editingVisualId, { canvas: { ...visual.canvas, nodes: nextNodes } });
    },
    [visual, editingVisualId, onUpdateVisual],
  );

  const commitResize = useCallback(
    (patches: Record<string, { x: number; y: number; w: number; h: number }>) => {
      if (!visual || !editingVisualId) return;
      const nextNodes: VisualCanvasState['nodes'] = { ...visual.canvas.nodes };
      for (const [id, next] of Object.entries(patches)) {
        const existing = nextNodes[id] ?? DEFAULT_NODE_ENTRY;
        nextNodes[id] = { ...existing, ...next };
      }
      onUpdateVisual(editingVisualId, { canvas: { ...visual.canvas, nodes: nextNodes } });
    },
    [visual, editingVisualId, onUpdateVisual],
  );

  // ── 6c action helpers ─────────────────────────────────────────────────────
  const nudgeSelection = useCallback(
    (dx: number, dy: number) => {
      if (!visual || !editingVisualId) return;
      const ids = Array.from(selectedIdsRef.current);
      if (ids.length === 0) return;
      const nextNodes: VisualCanvasState['nodes'] = { ...visual.canvas.nodes };
      for (const id of ids) {
        const existing = nextNodes[id] ?? DEFAULT_NODE_ENTRY;
        nextNodes[id] = { ...existing, x: (existing.x ?? 0) + dx, y: (existing.y ?? 0) + dy };
      }
      onUpdateVisual(editingVisualId, { canvas: { ...visual.canvas, nodes: nextNodes } });
    },
    [visual, editingVisualId, onUpdateVisual],
  );

  const deleteSelection = useCallback(() => {
    if (!visual || !editingVisualId) return;
    const ids = Array.from(selectedIdsRef.current);
    if (ids.length === 0) return;
    const nextNodes: VisualCanvasState['nodes'] = { ...visual.canvas.nodes };
    for (const id of ids) {
      const existing = nextNodes[id] ?? DEFAULT_NODE_ENTRY;
      nextNodes[id] = { ...existing, hidden: true };
    }
    onUpdateVisual(editingVisualId, { canvas: { ...visual.canvas, nodes: nextNodes } });
    setSelectedIds(new Set());
  }, [visual, editingVisualId, onUpdateVisual]);

  const selectAll = useCallback(() => {
    // Includes every data-id in the rendered preset EXCEPT those marked hidden.
    if (!visual) return;
    const all = Object.keys(naturalBBoxesRef.current).filter(
      (id) => !visual.canvas.nodes[id]?.hidden,
    );
    setSelectedIds(expandToGroups(all, visual.canvas));
  }, [visual]);

  const groupSelection = useCallback(() => {
    if (!visual || !editingVisualId) return;
    const ids = Array.from(selectedIdsRef.current);
    if (ids.length < 2) return;
    const gid = `grp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const next = groupNodes(visual.canvas, ids, gid);
    onUpdateVisual(editingVisualId, { canvas: next });
  }, [visual, editingVisualId, onUpdateVisual]);

  const ungroupSelection = useCallback(() => {
    if (!visual || !editingVisualId) return;
    const ids = Array.from(selectedIdsRef.current);
    if (ids.length === 0) return;
    const seen = new Set<string>();
    let canvas = visual.canvas;
    for (const id of ids) {
      const gid = canvas.nodes[id]?.groupId;
      if (!gid || seen.has(gid)) continue;
      seen.add(gid);
      canvas = dissolveGroup(canvas, gid);
    }
    if (canvas !== visual.canvas) onUpdateVisual(editingVisualId, { canvas });
  }, [visual, editingVisualId, onUpdateVisual]);

  const copyStyle = useCallback(() => {
    if (!visual) return;
    copyStyleFrom(visual.settings);
  }, [visual]);

  const pasteStyle = useCallback(() => {
    if (!visual || !editingVisualId) return;
    if (!hasStyleInClipboard()) return;
    onUpdateVisual(editingVisualId, { settings: pasteStyleInto(visual.settings) });
  }, [visual, editingVisualId, onUpdateVisual]);

  const bringForward = useCallback(
    (id: string | null) => {
      if (!visual || !editingVisualId) return;
      const ids = id ? [id] : Array.from(selectedIdsRef.current);
      if (ids.length === 0) return;
      const existingZs = Object.values(visual.canvas.nodes).map((n) => n.zIndex ?? 0);
      const maxZ = existingZs.length > 0 ? Math.max(...existingZs, 0) : 0;
      const nextNodes: VisualCanvasState['nodes'] = { ...visual.canvas.nodes };
      ids.forEach((nid, i) => {
        const existing = nextNodes[nid] ?? DEFAULT_NODE_ENTRY;
        nextNodes[nid] = { ...existing, zIndex: maxZ + 1 + i };
      });
      onUpdateVisual(editingVisualId, { canvas: { ...visual.canvas, nodes: nextNodes } });
    },
    [visual, editingVisualId, onUpdateVisual],
  );

  const sendBackward = useCallback(
    (id: string | null) => {
      if (!visual || !editingVisualId) return;
      const ids = id ? [id] : Array.from(selectedIdsRef.current);
      if (ids.length === 0) return;
      const existingZs = Object.values(visual.canvas.nodes).map((n) => n.zIndex ?? 0);
      const minZ = existingZs.length > 0 ? Math.min(...existingZs, 0) : 0;
      const nextNodes: VisualCanvasState['nodes'] = { ...visual.canvas.nodes };
      ids.forEach((nid, i) => {
        const existing = nextNodes[nid] ?? DEFAULT_NODE_ENTRY;
        nextNodes[nid] = { ...existing, zIndex: minZ - 1 - i };
      });
      onUpdateVisual(editingVisualId, { canvas: { ...visual.canvas, nodes: nextNodes } });
    },
    [visual, editingVisualId, onUpdateVisual],
  );

  // ── Mousedown on content (selection / drag start / marquee) ──────────────
  const handleContentMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (!visual) return;
      // Close any open context menu on any content mousedown.
      if (menu) setMenu(null);
      const target = e.target as Element | null;
      const hit = target?.closest('[data-id]') as Element | null;
      const hitId = hit?.getAttribute('data-id') || null;
      const shift = e.shiftKey;
      const ctrlOrMeta = e.metaKey || e.ctrlKey;

      if (hitId && naturalBBoxesRef.current[hitId] && !visual.canvas.nodes[hitId]?.hidden) {
        // Node click.
        let baseSel: Set<string>;
        if (shift) baseSel = addToSelection(selectedIds, hitId);
        else if (ctrlOrMeta) baseSel = toggleSelection(selectedIds, hitId);
        else if (!selectedIds.has(hitId)) baseSel = selectOnly(selectedIds, hitId);
        else baseSel = selectedIds;

        // Expand to include any group memberships.
        const nextSel = expandToGroups(baseSel, visual.canvas);
        setSelectedIds(nextSel);

        const ids = Array.from(nextSel);
        if (ids.length === 0) return;
        const starts: Record<string, { x: number; y: number }> = {};
        for (const id of ids) {
          const o = visual.canvas.nodes[id];
          starts[id] = { x: o?.x ?? 0, y: o?.y ?? 0 };
        }
        dragStateRef.current = {
          kind: 'move',
          startClientX: e.clientX,
          startClientY: e.clientY,
          ids,
          startOffsets: starts,
          primaryId: hitId,
          primaryNaturalBBox: naturalBBoxesRef.current[hitId],
        };
        setDragKind('move');
        e.preventDefault();
      } else {
        // Empty-canvas click → marquee.
        if (!shift && !ctrlOrMeta) setSelectedIds(new Set());
        dragStateRef.current = {
          kind: 'marquee',
          startClientX: e.clientX,
          startClientY: e.clientY,
          additive: shift || ctrlOrMeta,
        };
        setDragKind('marquee');
      }
    },
    [visual, selectedIds, menu],
  );

  const handleResizeStart = useCallback(
    (direction: ResizeDirection, e: ReactMouseEvent) => {
      if (!visual || selectedIds.size === 0) return;
      const sel = Array.from(selectedIds);
      const startBBox = getSelectionBBox(sel, liveBBoxes);
      if (!startBBox) return;
      const nodeStarts: ResizeDragState['nodeStarts'] = {};
      for (const id of sel) {
        const nat = naturalBBoxesRef.current[id];
        if (!nat) continue;
        const override = visual.canvas.nodes[id];
        const bbox = currentNodeBBox(nat, override);
        nodeStarts[id] = {
          bbox,
          override: {
            x: override?.x ?? 0,
            y: override?.y ?? 0,
            w: override?.w ?? 1,
            h: override?.h ?? 1,
          },
        };
      }
      dragStateRef.current = {
        kind: 'resize',
        startClientX: e.clientX,
        startClientY: e.clientY,
        direction,
        startBBox,
        nodeStarts,
      };
      setDragKind('resize');
    },
    [visual, selectedIds, liveBBoxes],
  );

  // Window move/up — single pair handles all three drag kinds.
  useEffect(() => {
    if (!visual) return;
    const onMove = (e: MouseEvent) => {
      const st = dragStateRef.current;
      if (!st) return;
      const vp = viewportRef.current;

      if (st.kind === 'move') {
        const rawDx = (e.clientX - st.startClientX) / vp.scale;
        const rawDy = (e.clientY - st.startClientY) / vp.scale;

        const primary = st.startOffsets[st.primaryId];
        const activeBBox: NodeBBox = {
          x: st.primaryNaturalBBox.x + primary.x + rawDx,
          y: st.primaryNaturalBBox.y + primary.y + rawDy,
          w: st.primaryNaturalBBox.w,
          h: st.primaryNaturalBBox.h,
        };
        const others = Object.entries(liveBBoxes)
          .filter(([id]) => !st.ids.includes(id))
          .map(([id, b]) => ({ id, bbox: b }));
        const { guides: nextGuides, snapDx, snapDy } = findAlignmentGuides(
          activeBBox,
          others,
          SNAP_THRESHOLD,
        );

        let finalDx = rawDx + snapDx;
        let finalDy = rawDy + snapDy;
        if (snapDx === 0) {
          const target = primary.x + rawDx;
          finalDx = snapToGrid(target, GRID_SIZE) - primary.x;
        }
        if (snapDy === 0) {
          const target = primary.y + rawDy;
          finalDy = snapToGrid(target, GRID_SIZE) - primary.y;
        }

        const nextOffsets: Record<string, { dx: number; dy: number }> = {};
        for (const id of st.ids) nextOffsets[id] = { dx: finalDx, dy: finalDy };
        setLiveOffsets(nextOffsets);
        setGuides(nextGuides);
      } else if (st.kind === 'resize') {
        const shift = e.shiftKey;
        const rawDx = (e.clientX - st.startClientX) / vp.scale;
        const rawDy = (e.clientY - st.startClientY) / vp.scale;

        let { x, y, w, h } = st.startBBox;
        const dir = st.direction;

        if (dir.includes('w')) {
          x = st.startBBox.x + rawDx;
          w = st.startBBox.w - rawDx;
        }
        if (dir.includes('e')) {
          w = st.startBBox.w + rawDx;
        }
        if (dir.includes('n')) {
          y = st.startBBox.y + rawDy;
          h = st.startBBox.h - rawDy;
        }
        if (dir.includes('s')) {
          h = st.startBBox.h + rawDy;
        }

        const isCorner = dir.length === 2;
        if (shift && isCorner && st.startBBox.w > 0 && st.startBBox.h > 0) {
          const aspect = st.startBBox.w / st.startBBox.h;
          if (Math.abs(rawDx) >= Math.abs(rawDy)) {
            const newH = Math.abs(w) / aspect;
            if (dir.includes('n')) y = st.startBBox.y + st.startBBox.h - newH;
            h = newH;
          } else {
            const newW = Math.abs(h) * aspect;
            if (dir.includes('w')) x = st.startBBox.x + st.startBBox.w - newW;
            w = newW;
          }
        }

        if (w < 8) w = 8;
        if (h < 8) h = 8;

        const sx = w / st.startBBox.w;
        const sy = h / st.startBBox.h;

        const patches: Record<string, { x: number; y: number; w: number; h: number }> = {};
        const liveOffsetsPatch: Record<string, { dx: number; dy: number }> = {};
        for (const [id, start] of Object.entries(st.nodeStarts)) {
          const relX = start.bbox.x - st.startBBox.x;
          const relY = start.bbox.y - st.startBBox.y;
          const newX = x + relX * sx;
          const newY = y + relY * sy;
          const newW = start.override.w * sx;
          const newH = start.override.h * sy;
          const nat = naturalBBoxesRef.current[id];
          if (!nat) continue;
          patches[id] = {
            x: newX - nat.x,
            y: newY - nat.y,
            w: newW,
            h: newH,
          };
          liveOffsetsPatch[id] = {
            dx: patches[id].x - start.override.x,
            dy: patches[id].y - start.override.y,
          };
        }

        setLiveOffsets(liveOffsetsPatch);
        st.pendingPatches = patches;
      } else if (st.kind === 'marquee') {
        const world0 = clientToWorld(st.startClientX, st.startClientY);
        const world1 = clientToWorld(e.clientX, e.clientY);
        if (!world0 || !world1) return;
        const rect: MarqueeRect = {
          x: Math.min(world0.x, world1.x),
          y: Math.min(world0.y, world1.y),
          w: Math.abs(world1.x - world0.x),
          h: Math.abs(world1.y - world0.y),
        };
        setMarquee(rect);
        const hits = hitTestMarquee(rect, liveBBoxes);
        // Expand marquee hits through groups — if any group member is hit,
        // the whole group comes in.
        const expanded = visual ? Array.from(expandToGroups(hits, visual.canvas)) : hits;
        if (st.additive) {
          const next = new Set(selectedIds);
          for (const id of expanded) next.add(id);
          if (next.size !== selectedIds.size) setSelectedIds(next);
        } else {
          const prev = Array.from(selectedIds).sort().join(',');
          const nextStr = expanded.slice().sort().join(',');
          if (prev !== nextStr) setSelectedIds(new Set(expanded));
        }
      }
    };

    const onUp = () => {
      const st = dragStateRef.current;
      if (!st) return;
      if (st.kind === 'move') {
        commitMove(
          st.ids,
          st.ids.reduce<Record<string, { dx: number; dy: number }>>((acc, id) => {
            const live = liveOffsetsRef.current[id];
            if (live) acc[id] = live;
            return acc;
          }, {}),
        );
      } else if (st.kind === 'resize' && st.pendingPatches) {
        commitResize(st.pendingPatches);
      }
      dragStateRef.current = null;
      setDragKind(null);
      setLiveOffsets({});
      setGuides([]);
      setMarquee(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [visual, liveBBoxes, clientToWorld, commitMove, commitResize, selectedIds]);

  // ── Keyboard (centralised dispatcher) ──────────────────────────────────
  // The dispatcher is rebuilt on every relevant-dep change — acceptable
  // because window listener teardown is cheap and the handler closure
  // needs to reference the latest memoised callbacks.
  const handleEscape = useCallback(() => {
    if (textEdit) {
      setTextEdit(null);
      return;
    }
    if (menu) {
      setMenu(null);
      return;
    }
    if (selectedIdsRef.current.size > 0) {
      setSelectedIds(new Set());
      return;
    }
    onClose();
  }, [onClose, textEdit, menu]);

  useEffect(() => {
    const handler = buildCanvasKeyHandler({
      hasVisual: () => visual != null,
      selectionSize: () => selectedIdsRef.current.size,
      onEscape: handleEscape,
      onUndo: handleUndo,
      onRedo: handleRedo,
      onFit: () => canvasApiRef.current?.fitToContent(),
      onZoomReset: () => canvasApiRef.current?.resetTo100(),
      onSelectAll: selectAll,
      onDelete: deleteSelection,
      onGroup: groupSelection,
      onUngroup: ungroupSelection,
      onCopyStyle: copyStyle,
      onPasteStyle: pasteStyle,
      onNudge: nudgeSelection,
    });
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    visual,
    handleEscape,
    handleUndo,
    handleRedo,
    selectAll,
    deleteSelection,
    groupSelection,
    ungroupSelection,
    copyStyle,
    pasteStyle,
    nudgeSelection,
  ]);

  // ── Context menu — right-click on canvas ──────────────────────────────
  const handleContextMenu = useCallback(
    (e: ReactMouseEvent) => {
      if (!visual) return;
      e.preventDefault();
      const target = e.target as Element | null;
      const hit = target?.closest('[data-id]') as Element | null;
      const hitId = hit?.getAttribute('data-id') || null;

      // If right-click landed on a node that isn't already selected, swap
      // selection to just that node (expanded to its group).
      if (hitId && naturalBBoxesRef.current[hitId] && !visual.canvas.nodes[hitId]?.hidden) {
        if (!selectedIdsRef.current.has(hitId)) {
          setSelectedIds(expandToGroups([hitId], visual.canvas));
        }
      } else {
        // Right-click on empty canvas: keep existing selection (lets user
        // paste style onto the visual without losing selection).
      }

      setMenu({ left: e.clientX, top: e.clientY, targetId: hitId });
    },
    [visual],
  );

  const menuItems = useMemo<Array<ContextMenuItem | 'separator'>>(() => {
    const hasNodeTarget = menu?.targetId != null;
    const hasSelection = selectedIds.size > 0;
    const canStackAct = hasNodeTarget || hasSelection;
    return [
      {
        label: 'Bring forward',
        disabled: !canStackAct,
        onClick: () => bringForward(menu?.targetId ?? null),
      },
      {
        label: 'Send backward',
        disabled: !canStackAct,
        onClick: () => sendBackward(menu?.targetId ?? null),
      },
      {
        label: 'Delete',
        disabled: !canStackAct,
        onClick: () => {
          // Context-menu Delete acts on the right-clicked node if the
          // user right-clicked something outside the current selection
          // (we'd already have updated selection in handleContextMenu).
          deleteSelection();
        },
      },
      'separator',
      {
        label: 'Copy style',
        disabled: !visual,
        onClick: copyStyle,
      },
      {
        label: 'Paste style',
        disabled: !visual || !hasStyleInClipboard(),
        onClick: pasteStyle,
      },
    ];
  }, [menu, selectedIds.size, visual, bringForward, sendBackward, deleteSelection, copyStyle, pasteStyle]);

  // ── Inline text edit — double-click a <text> inside a <g data-id> ─────
  const handleDoubleClick = useCallback(
    (e: ReactMouseEvent) => {
      if (!visual) return;
      const target = e.target as Element | null;
      if (!target) return;
      // Only <text> elements are inline-editable.
      if (target.tagName.toLowerCase() !== 'text') return;
      const g = target.closest('[data-id]') as Element | null;
      if (!g) return;
      const dataId = g.getAttribute('data-id');
      if (!dataId) return;
      if (visual.canvas.nodes[dataId]?.hidden) return;

      // Count previous <text> siblings inside the <g data-id> to derive the index.
      let textIndex = 0;
      let sib = target.previousElementSibling;
      while (sib) {
        if (sib.tagName.toLowerCase() === 'text') textIndex++;
        sib = sib.previousElementSibling;
      }

      const resolved = resolveTextEditTarget(visual.presetId, dataId, textIndex, visual.data);
      if (!resolved) return;

      const r = target.getBoundingClientRect();
      // Widen slightly so ascenders/descenders and long typing don't clip.
      const rect: InlineTextEditorRect = {
        left: r.left - 4,
        top: r.top - 2,
        width: Math.max(r.width + 8, 60),
        height: r.height + 4,
      };

      const textEl = target as SVGTextElement;
      const cs = window.getComputedStyle(textEl);
      const fontSize = parseFloat(cs.fontSize) || 13;
      const fontFamily = cs.fontFamily || visual.settings.font || 'Inter, sans-serif';
      const fontWeight = cs.fontWeight || 400;
      const color = cs.fill && cs.fill !== 'rgb(0, 0, 0)' ? cs.fill : '#111827';
      const anchor = textEl.getAttribute('text-anchor');
      const textAlign: 'left' | 'center' | 'right' =
        resolved.textAlign ?? (anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left');

      setTextEdit({
        dataId,
        target: resolved,
        rect,
        initialValue: textEl.textContent ?? '',
        fontFamily,
        fontSize,
        fontWeight,
        color,
        textAlign,
      });
      e.stopPropagation();
    },
    [visual],
  );

  const commitTextEdit = useCallback(
    (next: string) => {
      if (!textEdit || !visual || !editingVisualId) return;
      const nextData = applyTextEdit(visual.data, textEdit.target, next);
      if (nextData !== visual.data) {
        onUpdateVisual(editingVisualId, { data: nextData });
      }
      setTextEdit(null);
    },
    [textEdit, visual, editingVisualId, onUpdateVisual],
  );

  const cancelTextEdit = useCallback(() => setTextEdit(null), []);

  // ── Selection bbox for resize handles (screen coords) ─────────────────────
  const selectionBBox = useMemo(() => {
    if (selectedIds.size === 0) return null;
    return getSelectionBBox(selectedIds, liveBBoxes);
  }, [selectedIds, liveBBoxes]);

  const selectionBBoxForHandles = useMemo(() => {
    if (!selectionBBox) return null;
    if (dragKind !== 'move') return selectionBBox;
    const first = Object.values(liveOffsets)[0];
    if (!first) return selectionBBox;
    return {
      x: selectionBBox.x + first.dx,
      y: selectionBBox.y + first.dy,
      w: selectionBBox.w,
      h: selectionBBox.h,
    };
  }, [selectionBBox, liveOffsets, dragKind]);

  const handlesScreenRect = useMemo(() => {
    if (!selectionBBoxForHandles) return null;
    return bboxToScreenRect(selectionBBoxForHandles);
    // viewport is a read dependency inside bboxToScreenRect via its ref —
    // but we still need to re-run when viewport changes, so:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionBBoxForHandles, bboxToScreenRect, viewport]);

  if (!editingVisualId) return null;
  const preset = visual ? getPresetById(visual.presetId) : undefined;

  return (
    <div
      className="fixed left-0 right-0 bottom-0 top-16 z-[100] bg-white flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Canvas editor"
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-2 px-3 border-b border-gray-200 bg-white"
        style={{ height: TOP_BAR_HEIGHT }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
            aria-label="Close canvas editor"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 min-w-0">
            <span className="font-semibold text-gray-900 truncate">
              {visual?.title || 'Untitled visual'}
            </span>
            {preset ? <span className="text-gray-400">· {preset.name}</span> : null}
            {selectedIds.size > 0 ? (
              <span className="text-xs text-[#1B5B50] bg-[#E6F0EE] px-1.5 py-0.5 rounded">
                {selectedIds.size} selected
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={handleUndo}
            disabled={!historyRef.current?.canUndo()}
            label="Undo (Ctrl+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={handleRedo}
            disabled={!historyRef.current?.canRedo()}
            label="Redo (Ctrl+Shift+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 15-6.7L21 13" />
            </svg>
          </ToolbarButton>
          <div className="mx-1 h-5 border-l border-gray-200" />
          <ToolbarButton
            onClick={() => canvasApiRef.current?.fitToContent()}
            label="Reset view — fit to window (Ctrl+0)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9V5a2 2 0 0 1 2-2h4" />
              <path d="M15 3h4a2 2 0 0 1 2 2v4" />
              <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
              <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => canvasApiRef.current?.resetTo100()} label="100 % (Ctrl+1)">
            <span className="text-xs font-medium">100%</span>
          </ToolbarButton>
          {/* Zoom slider — drag for precise zoom control. Reads the live viewport
              scale so it tracks wheel-zoom changes in real time, and writes back
              via setScaleCentred which snaps the content to the viewport centre. */}
          <input
            type="range"
            min={10}
            max={400}
            step={5}
            value={Math.round(viewport.scale * 100)}
            onChange={(e) => {
              const pct = parseInt(e.target.value, 10);
              if (!Number.isFinite(pct)) return;
              canvasApiRef.current?.setScaleCentred(pct / 100);
            }}
            aria-label="Zoom level"
            title={`Zoom: ${Math.round(viewport.scale * 100)}%`}
            className="mx-2 w-24 accent-[#1B5B50] cursor-pointer"
          />
          <span className="px-2 text-xs font-mono text-gray-500 tabular-nums w-12 text-center">
            {Math.round(viewport.scale * 100)}%
          </span>
          <div className="mx-1 h-5 border-l border-gray-200" />
          {/* ── Batch 1b — Regenerate + Export ─────────────────────────────── */}
          {/* Both disabled while the parent is mid-generate to avoid double-
              submits and to surface progress clearly. The Regenerate button
              opens the same confirmation modal VisualCard uses, so the user
              always sees the quota cost before committing. */}
          <ToolbarButton
            onClick={() => setRegenerateOpen(true)}
            disabled={isGenerating || !visual}
            label="Regenerate this visual with AI (1 use)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </ToolbarButton>
          {/* Batch 3a — template lock toggle. When active (visual.templateLocked
              true), the icon shows a closed padlock; otherwise open. Clicking
              toggles. The server respects the flag on any subsequent regenerate. */}
          <ToolbarButton
            onClick={handleToggleTemplateLock}
            disabled={isGenerating || !visual}
            active={Boolean(visual?.templateLocked)}
            label={
              visual?.templateLocked
                ? 'Template is locked — click to unlock (Regenerate will keep this preset)'
                : 'Lock this template — future regenerates will keep this exact preset'
            }
          >
            {visual?.templateLocked ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0" />
              </svg>
            )}
          </ToolbarButton>
          <ToolbarButton
            onClick={onOpenExport}
            disabled={isGenerating || !visual}
            label="Export (PNG / SVG / PDF)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </ToolbarButton>
          <div className="mx-1 h-5 border-l border-gray-200" />
          <ToolbarButton
            onClick={() => setLeftOpen((v) => !v)}
            label="Toggle preset gallery"
            active={leftOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setRightOpen((v) => !v)}
            label="Toggle settings panel"
            active={rightOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </ToolbarButton>
        </div>
      </div>

      {/* ── Mobile lockout (< lg:) ───────────────────────────────────────── */}
      <div className="lg:hidden flex-1 flex flex-col items-center justify-center p-6 bg-amber-50">
        <div className="max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-amber-900 mb-1">
            Canvas editing is available on desktop only
          </h2>
          <p className="text-sm text-amber-800">
            Switch to a screen 1024 px or wider to edit this visual. You can still
            cycle presets and regenerate from the document view on any device.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-3 py-1.5 text-sm font-medium text-[#1B5B50] hover:underline"
          >
            Back to document
          </button>
        </div>
      </div>

      {/* ── Editor body (lg and up) ───────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 min-h-0">
        {leftOpen ? (
          <aside
            className="border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0"
            style={{ width: LEFT_SIDEBAR_WIDTH }}
          >
            {visual ? (
              <PresetGallery
                currentPresetId={visual.presetId}
                currentData={visual.data}
                aiOriginalPresetId={visual.aiOriginalPresetId}
                onSwap={handlePresetSwap}
                onApplyIntent={handleApplyIntent}
              />
            ) : null}
          </aside>
        ) : null}

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {!visual ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
              Visual not found. Close this editor and try again.
            </div>
          ) : (
            <>
              {swapWarning ? (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-start justify-between gap-3">
                  <p className="text-xs text-amber-800 flex-1">{swapWarning}</p>
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {/* Batch 1b — primary action: regenerate from here instead
                        of sending the user back to the document view. Routes
                        through the same modal as the toolbar Regenerate so the
                        quota cost is visible before the AI call. Disabled
                        while a generation is already in flight. */}
                    <button
                      type="button"
                      onClick={() => setRegenerateOpen(true)}
                      disabled={isGenerating}
                      className="text-xs font-semibold text-amber-900 underline decoration-amber-700 underline-offset-2 hover:text-amber-950 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Regenerate with AI
                    </button>
                    <button
                      type="button"
                      onClick={() => setSwapWarning(null)}
                      className="text-xs font-semibold text-amber-800 hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null}

              <div
                className="flex-1 grid min-h-0"
                style={{
                  gridTemplateColumns: `${RULER_THICKNESS}px 1fr`,
                  gridTemplateRows: `${RULER_THICKNESS}px 1fr`,
                }}
              >
                <div style={{ background: '#FAFAFA', borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }} />
                <div style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <Ruler
                    orientation="horizontal"
                    length={Math.max(0, mainSize.w - RULER_THICKNESS)}
                    scale={viewport.scale}
                    pan={viewport.panX}
                  />
                </div>
                <div style={{ borderRight: '1px solid #E5E7EB' }}>
                  <Ruler
                    orientation="vertical"
                    length={Math.max(0, mainSize.h - RULER_THICKNESS)}
                    scale={viewport.scale}
                    pan={viewport.panY}
                  />
                </div>
                <div
                  ref={mainRef}
                  className="relative"
                  onContextMenu={handleContextMenu}
                  onDoubleClick={handleDoubleClick}
                >
                  <SvgCanvas
                    contentWidth={CONTENT_W}
                    contentHeight={CONTENT_H}
                    onViewportChange={setViewport}
                    apiRef={canvasApiRef}
                    onContentMouseDown={handleContentMouseDown}
                    wrapperRef={svgWrapperRef}
                    contentRef={svgContentRef}
                  >
                    {preset ? renderPreset(preset, visual) : null}
                    {visual ? (
                      <SelectionLayer
                        contentWidth={CONTENT_W}
                        contentHeight={CONTENT_H}
                        nodeBBoxes={liveBBoxes}
                        liveOffsets={liveOffsets}
                        selectedIds={selectedIds}
                        marquee={marquee}
                        guides={guides}
                      />
                    ) : null}
                  </SvgCanvas>

                  {/* Resize handles — screen space, outside the transform.
                      Hidden during a marquee drag to keep the overlay clean. */}
                  {dragKind !== 'marquee' && selectedIds.size > 0 ? (
                    <NodeHandles rect={handlesScreenRect} onResizeStart={handleResizeStart} />
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>

        {rightOpen ? (
          <aside
            className="border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0"
            style={{ width: RIGHT_SIDEBAR_WIDTH }}
          >
            {visual ? (
              <SettingsPanel visual={visual} onUpdate={handleVisualPatch} />
            ) : null}
          </aside>
        ) : null}
      </div>

      {/* ── Context menu overlay ─────────────────────────────────────────── */}
      {menu ? (
        <ContextMenu
          left={menu.left}
          top={menu.top}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      ) : null}

      {/* ── Inline text editor overlay ───────────────────────────────────── */}
      {textEdit ? (
        <InlineTextEditor
          initialValue={textEdit.initialValue}
          rect={textEdit.rect}
          fontFamily={textEdit.fontFamily}
          fontSize={textEdit.fontSize}
          fontWeight={textEdit.fontWeight}
          color={textEdit.color}
          textAlign={textEdit.textAlign}
          onCommit={commitTextEdit}
          onCancel={cancelTextEdit}
        />
      ) : null}

      {/* ── Batch 1b — Apply Template confirmation ───────────────────────── */}
      <ApplyTemplateModal
        open={applyTemplateTarget !== null}
        targetPresetName={applyTemplateTargetName}
        isGenerating={isGenerating}
        onClose={() => setApplyTemplateTarget(null)}
        onConfirm={handleConfirmApplyTemplate}
      />

      {/* ── Batch 1b — Regenerate confirmation (reused from VisualCard) ──── */}
      <RegenerateWarningModal
        open={regenerateOpen}
        templateLocked={Boolean(visual?.templateLocked)}
        onClose={() => setRegenerateOpen(false)}
        onConfirm={handleConfirmRegenerate}
      />

      <span className="sr-only" aria-hidden="true">
        {historyVersion}
      </span>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function ToolbarButton({
  children,
  onClick,
  label,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-md transition-colors ${
        active ? 'bg-[#E6F0EE] text-[#1B5B50]' : 'text-gray-700 hover:bg-gray-100'
      } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
    >
      {children}
    </button>
  );
}

function renderPreset(
  preset: NonNullable<ReturnType<typeof getPresetById>>,
  visual: VisualInstance,
) {
  const Render = preset.render as React.ComponentType<{
    data: unknown;
    settings: typeof visual.settings;
    width: number;
    height: number;
  }>;
  return <Render data={visual.data} settings={visual.settings} width={CONTENT_W} height={CONTENT_H} />;
}

function hashEntry(entry: HistoryEntry): string {
  try {
    return JSON.stringify(entry);
  } catch {
    return String(Math.random());
  }
}
