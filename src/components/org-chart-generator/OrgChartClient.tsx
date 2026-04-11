// src/components/org-chart-generator/OrgChartClient.tsx
"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { useSession } from "next-auth/react";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Person {
  id: string;
  name: string;
  title: string;
  jobFamily: string;
  phone: string;
  photo: string;
  customField: string;
  customFieldLabel: string;
  parentId: string | null;
  order: number;
}

interface ChartSettings {
  layout: "top-down" | "left-right" | "bottom-up" | "radial";
  stylePreset: string;
  shapeType: "rectangle" | "rounded-rectangle" | "square" | "circle" | "hexagon" | "diamond";
  shapeMode: "global" | "per-job-family";
  arrowStyle: "elbow" | "straight" | "curved";
  arrowColor: string;
  arrowWidth: number;
  borderWidth: number;
  borderColor: string;
  colorMode: "job-family" | "management-level" | "manual";
  palette: number;
  colorOverrides: Record<string, string>; // personId or jobFamily → hex colour
  chartTitle: string;
  font: string;
  fontBold: boolean;
  fontItalic: boolean;
  titleBold: boolean;
  visibleFields: {
    name: boolean;
    photo: boolean;
    phone: boolean;
    title: boolean;
    jobFamily: boolean;
    customField: boolean;
  };
}

interface ChartData {
  people: Person[];
  settings: ChartSettings;
}

type HistoryEntry = ChartData;

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const MAX_PEOPLE = 60;
const MAX_DEPTH = 7;

const JOB_FAMILIES = [
  "Project Director", "Project Manager", "Construction Manager",
  "Site Manager", "Senior Site Manager", "General Foreman",
  "Senior General Foreman", "Site Engineer", "Setting Out Engineer",
  "Quantity Surveyor", "Commercial Manager", "Design Manager",
  "HSQE Manager", "Health & Safety Advisor", "Environmental Manager",
  "Quality Manager", "MEICA Manager", "Electrical Engineer",
  "Mechanical Engineer", "Commissioning Manager", "Planning Engineer",
  "Document Controller", "Site Supervisor", "Foreman",
  "Subcontractor Manager", "Procurement Manager", "Contracts Manager",
  "Plant Manager", "Logistics Manager", "Operative",
];

const PALETTES = [
  { name: "Corporate Blue", colors: ["#1e3a5f","#2d5f8a","#4a90d9","#7ab3ef","#a8d1f0","#c5e1f5","#dbedf9","#f0f7fd"] },
  { name: "High-Vis Construction", colors: ["#ff6600","#ffaa00","#ffcc00","#00aa44","#0066cc","#cc0033","#8833cc","#444444"] },
  { name: "Earth & Clay", colors: ["#8b4513","#a0522d","#cd853f","#deb887","#556b2f","#6b8e23","#808000","#bc8f8f"] },
  { name: "Monochrome", colors: ["#1a1a1a","#333333","#4d4d4d","#666666","#808080","#999999","#b3b3b3","#cccccc"] },
  { name: "Ocean Depth", colors: ["#003366","#004488","#0066aa","#0088cc","#00aaee","#33bbff","#66ccff","#99ddff"] },
  { name: "Vibrant Pop", colors: ["#e6194b","#3cb44b","#ffe119","#4363d8","#f58231","#911eb4","#42d4f4","#f032e6"] },
  { name: "Pastel Soft", colors: ["#ffb3ba","#ffdfba","#ffffba","#baffc9","#bae1ff","#e8baff","#ffd6e0","#d4f0f0"] },
  { name: "Slate Professional", colors: ["#2c3e50","#34495e","#7f8c8d","#95a5a6","#1abc9c","#2ecc71","#3498db","#9b59b6"] },
];

const FONTS = [
  "Arial", "Helvetica", "Georgia", "Verdana", "Trebuchet MS",
  "Tahoma", "Palatino Linotype", "Garamond", "Courier New", "Lucida Sans",
];

const DEFAULT_SETTINGS: ChartSettings = {
  layout: "top-down",
  stylePreset: "corporate",
  shapeType: "rounded-rectangle",
  shapeMode: "global",
  arrowStyle: "elbow",
  arrowColor: "#666666",
  arrowWidth: 2,
  borderWidth: 2,
  borderColor: "#333333",
  colorMode: "job-family",
  palette: 0,
  colorOverrides: {},
  chartTitle: "",
  font: "Arial",
  fontBold: false,
  fontItalic: false,
  titleBold: true,
  visibleFields: {
    name: true,
    photo: true,
    phone: true,
    title: true,
    jobFamily: true,
    customField: false,
  },
};

function uid() {
  return "p_" + Math.random().toString(36).slice(2, 10);
}

function getDepth(personId: string, people: Person[]): number {
  let depth = 0;
  let current = people.find((p) => p.id === personId);
  while (current?.parentId) {
    depth++;
    current = people.find((p) => p.id === current!.parentId);
    if (depth > MAX_DEPTH + 1) break;
  }
  return depth;
}

function getChildren(parentId: string | null, people: Person[]) {
  return people
    .filter((p) => p.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

// ─── COLOR HELPERS ──────────────────────────────────────────────────────────
function getColorForPerson(
  person: Person,
  people: Person[],
  settings: ChartSettings
): string {
  // Check person-level override first, then job-family override
  if (settings.colorOverrides[person.id]) return settings.colorOverrides[person.id];
  if (person.jobFamily && settings.colorOverrides[`jf:${person.jobFamily}`]) {
    return settings.colorOverrides[`jf:${person.jobFamily}`];
  }

  const pal = PALETTES[settings.palette]?.colors || PALETTES[0].colors;

  if (settings.colorMode === "job-family") {
    const families = [...new Set(people.map((p) => p.jobFamily).filter(Boolean))];
    const idx = families.indexOf(person.jobFamily);
    return idx >= 0 ? pal[idx % pal.length] : pal[0];
  }

  if (settings.colorMode === "management-level") {
    const depth = getDepth(person.id, people);
    return pal[Math.min(depth, pal.length - 1)];
  }

  return pal[0];
}

// ─── LAYOUT ENGINE ──────────────────────────────────────────────────────────
interface LayoutNode {
  person: Person;
  x: number;
  y: number;
  w: number;
  h: number;
  children: LayoutNode[];
}

const BASE_W = 180;
const H_GAP = 30;
const V_GAP = 50;
const PHOTO_SIZE = 36;

// A3 landscape proportions (mm) — used for WYSIWYG canvas
function fieldCount(s: ChartSettings): number {
  let c = 0;
  if (s.visibleFields.name) c++;
  if (s.visibleFields.title) c++;
  if (s.visibleFields.jobFamily) c++;
  if (s.visibleFields.phone) c++;
  if (s.visibleFields.customField) c++;
  return c;
}

function nodeSize(s: ChartSettings, totalPeople: number): [number, number] {
  // Shrink as people increase
  const scale = totalPeople > 30 ? Math.max(0.55, 30 / totalPeople) : totalPeople > 15 ? Math.max(0.7, 15 / totalPeople * 0.7 + 0.3) : 1;
  const fields = fieldCount(s);
  const h = (40 + fields * 16 + (s.visibleFields.photo ? PHOTO_SIZE + 4 : 0)) * scale;
  const w = BASE_W * scale;
  return [Math.max(w, 80), Math.max(h, 40)];
}

function buildTree(
  parentId: string | null,
  people: Person[],
  settings: ChartSettings,
  totalPeople: number
): LayoutNode[] {
  const children = getChildren(parentId, people);
  return children.map((p) => ({
    person: p,
    x: 0,
    y: 0,
    w: nodeSize(settings, totalPeople)[0],
    h: nodeSize(settings, totalPeople)[1],
    children: buildTree(p.id, people, settings, totalPeople),
  }));
}

function layoutTopDown(
  nodes: LayoutNode[],
  startX: number,
  startY: number,
  settings: ChartSettings,
  totalPeople: number
): { width: number; height: number } {
  const [nw, nh] = nodeSize(settings, totalPeople);
  const gap = H_GAP * (totalPeople > 30 ? 0.6 : 1);
  const vGap = V_GAP * (totalPeople > 30 ? 0.6 : 1);

  function measure(node: LayoutNode): number {
    if (node.children.length === 0) return nw;
    let total = 0;
    node.children.forEach((c, i) => {
      if (i > 0) total += gap;
      total += measure(c);
    });
    return Math.max(nw, total);
  }

  function position(node: LayoutNode, x: number, y: number) {
    const subtreeW = measure(node);
    node.x = x + subtreeW / 2 - nw / 2;
    node.y = y;
    node.w = nw;
    node.h = nh;
    let cx = x;
    node.children.forEach((child) => {
      const cw = measure(child);
      position(child, cx, y + nh + vGap);
      cx += cw + gap;
    });
  }

  let totalW = 0;
  let maxH = 0;
  nodes.forEach((n, i) => {
    const sw = measure(n);
    position(n, startX + totalW + (i > 0 ? gap : 0), startY);
    totalW += sw + (i > 0 ? gap : 0);
    // calc max depth
    function maxDepth(nd: LayoutNode): number {
      if (nd.children.length === 0) return nd.y + nd.h;
      return Math.max(...nd.children.map(maxDepth));
    }
    maxH = Math.max(maxH, maxDepth(n));
  });

  return { width: totalW, height: maxH - startY };
}

function layoutLeftRight(
  nodes: LayoutNode[],
  startX: number,
  startY: number,
  settings: ChartSettings,
  totalPeople: number
): { width: number; height: number } {
  const [nw, nh] = nodeSize(settings, totalPeople);
  const gap = H_GAP * (totalPeople > 30 ? 0.6 : 1);
  const hGap = V_GAP * (totalPeople > 30 ? 0.6 : 1);

  function measure(node: LayoutNode): number {
    if (node.children.length === 0) return nh;
    let total = 0;
    node.children.forEach((c, i) => {
      if (i > 0) total += gap;
      total += measure(c);
    });
    return Math.max(nh, total);
  }

  function position(node: LayoutNode, x: number, y: number) {
    const subtreeH = measure(node);
    node.x = x;
    node.y = y + subtreeH / 2 - nh / 2;
    node.w = nw;
    node.h = nh;
    let cy = y;
    node.children.forEach((child) => {
      const ch = measure(child);
      position(child, x + nw + hGap, cy);
      cy += ch + gap;
    });
  }

  let totalH = 0;
  nodes.forEach((n, i) => {
    const sh = measure(n);
    position(n, startX, startY + totalH + (i > 0 ? gap : 0));
    totalH += sh + (i > 0 ? gap : 0);
  });

  function maxRight(nd: LayoutNode): number {
    if (nd.children.length === 0) return nd.x + nd.w;
    return Math.max(nd.x + nd.w, ...nd.children.map(maxRight));
  }
  const maxW = nodes.length > 0 ? Math.max(...nodes.map(maxRight)) - startX : 0;

  return { width: maxW, height: totalH };
}

// ─── SVG DRAWING ────────────────────────────────────────────────────────────
function drawArrow(
  parent: LayoutNode,
  child: LayoutNode,
  settings: ChartSettings,
  layout: string
): string {
  const { arrowStyle, arrowColor, arrowWidth } = settings;
  let x1: number, y1: number, x2: number, y2: number;

  if (layout === "top-down" || layout === "bottom-up") {
    x1 = parent.x + parent.w / 2;
    y1 = layout === "top-down" ? parent.y + parent.h : parent.y;
    x2 = child.x + child.w / 2;
    y2 = layout === "top-down" ? child.y : child.y + child.h;
  } else {
    x1 = parent.x + parent.w;
    y1 = parent.y + parent.h / 2;
    x2 = child.x;
    y2 = child.y + child.h / 2;
  }

  let d: string;
  if (arrowStyle === "straight") {
    d = `M${x1},${y1} L${x2},${y2}`;
  } else if (arrowStyle === "curved") {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    if (layout === "top-down" || layout === "bottom-up") {
      d = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
    } else {
      d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    }
  } else {
    // elbow
    if (layout === "top-down" || layout === "bottom-up") {
      const midY = (y1 + y2) / 2;
      d = `M${x1},${y1} L${x1},${midY} L${x2},${midY} L${x2},${y2}`;
    } else {
      const midX = (x1 + x2) / 2;
      d = `M${x1},${y1} L${midX},${y1} L${midX},${y2} L${x2},${y2}`;
    }
  }

  return `<path d="${d}" fill="none" stroke="${arrowColor}" stroke-width="${arrowWidth}" />`;
}

function shapeClip(
  shape: ChartSettings["shapeType"],
  x: number,
  y: number,
  w: number,
  h: number
): string {
  switch (shape) {
    case "circle":
      return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}"`;
    case "diamond": {
      const cx = x + w / 2, cy = y + h / 2;
      return `<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}"`;
    }
    case "hexagon": {
      const q = w / 4;
      return `<polygon points="${x + q},${y} ${x + w - q},${y} ${x + w},${y + h / 2} ${x + w - q},${y + h} ${x + q},${y + h} ${x},${y + h / 2}"`;
    }
    case "square": {
      const side = Math.min(w, h);
      const sx = x + (w - side) / 2;
      const sy = y + (h - side) / 2;
      return `<rect x="${sx}" y="${sy}" width="${side}" height="${side}" rx="0"`;
    }
    case "rounded-rectangle":
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"`;
    default:
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0"`;
  }
}

const ALL_SHAPES: ChartSettings["shapeType"][] = [
  "rounded-rectangle", "rectangle", "circle", "hexagon", "diamond", "square",
];

function getShapeForPerson(
  person: Person,
  people: Person[],
  settings: ChartSettings
): ChartSettings["shapeType"] {
  if (settings.shapeMode === "global") return settings.shapeType;
  // Per-job-family: cycle through shapes by job family
  const families = [...new Set(people.map((p) => p.jobFamily).filter(Boolean))];
  const idx = families.indexOf(person.jobFamily);
  if (idx < 0) return settings.shapeType;
  return ALL_SHAPES[idx % ALL_SHAPES.length];
}

function renderNode(
  node: LayoutNode,
  settings: ChartSettings,
  people: Person[],
  fontSize: number,
  selectedId: string | null
): string {
  const p = node.person;
  const bg = getColorForPerson(p, people, settings);
  const isLight = isLightColor(bg);
  const textColor = isLight ? "#1a1a1a" : "#ffffff";
  const sel = selectedId === p.id;

  const shapeForPerson = getShapeForPerson(p, people, settings);
  const shapeEl = shapeClip(shapeForPerson, node.x, node.y, node.w, node.h);
  const borderStr = settings.borderWidth > 0
    ? `stroke="${sel ? "#2563eb" : settings.borderColor}" stroke-width="${sel ? 3 : settings.borderWidth}"`
    : `stroke="none"`;

  let svg = `<g data-person-id="${p.id}" style="cursor:pointer">`;
  svg += `${shapeEl} fill="${bg}" ${borderStr} />`;

  // Text content
  const fontStyle = settings.fontItalic ? "italic" : "normal";
  const fontWeight = settings.fontBold ? "bold" : "normal";
  const titleWeight = settings.titleBold ? "bold" : fontWeight;
  const ff = settings.font;

  let ty = node.y + 8;
  const lh = fontSize + 3;
  const cx = node.x + node.w / 2;
  const maxTextW = node.w - 12;

  if (settings.visibleFields.photo && p.photo) {
    const ps = Math.min(PHOTO_SIZE * (node.w / BASE_W), node.h * 0.35);
    const clipId = `photo-clip-${p.id}`;
    svg += `<defs><clipPath id="${clipId}"><circle cx="${cx}" cy="${ty + ps / 2}" r="${ps / 2}" /></clipPath></defs>`;
    svg += `<image href="${escSvg(p.photo)}" x="${cx - ps / 2}" y="${ty}" width="${ps}" height="${ps}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice" />`;
    ty += ps + 4;
  }

  if (settings.visibleFields.name && p.name) {
    svg += `<text x="${cx}" y="${ty + fontSize}" text-anchor="middle" fill="${textColor}" font-family="'${ff}'" font-size="${fontSize + 1}" font-weight="${titleWeight}" font-style="${fontStyle}">${escSvg(truncate(p.name, maxTextW, fontSize))}</text>`;
    ty += lh;
  }

  if (settings.visibleFields.title && p.title) {
    svg += `<text x="${cx}" y="${ty + fontSize}" text-anchor="middle" fill="${textColor}" font-family="'${ff}'" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" opacity="0.85">${escSvg(truncate(p.title, maxTextW, fontSize))}</text>`;
    ty += lh;
  }

  if (settings.visibleFields.jobFamily && p.jobFamily) {
    svg += `<text x="${cx}" y="${ty + fontSize}" text-anchor="middle" fill="${textColor}" font-family="'${ff}'" font-size="${fontSize - 1}" font-weight="${fontWeight}" font-style="${fontStyle}" opacity="0.7">${escSvg(truncate(p.jobFamily, maxTextW, fontSize - 1))}</text>`;
    ty += lh;
  }

  if (settings.visibleFields.phone && p.phone) {
    svg += `<text x="${cx}" y="${ty + fontSize}" text-anchor="middle" fill="${textColor}" font-family="'${ff}'" font-size="${fontSize - 1}" font-weight="${fontWeight}" font-style="${fontStyle}" opacity="0.7">☎ ${escSvg(p.phone)}</text>`;
    ty += lh;
  }

  if (settings.visibleFields.customField && p.customField) {
    svg += `<text x="${cx}" y="${ty + fontSize}" text-anchor="middle" fill="${textColor}" font-family="'${ff}'" font-size="${fontSize - 1}" font-weight="${fontWeight}" font-style="${fontStyle}" opacity="0.7">${escSvg(truncate(p.customFieldLabel ? `${p.customFieldLabel}: ${p.customField}` : p.customField, maxTextW, fontSize - 1))}</text>`;
  }

  svg += `</g>`;
  return svg;
}

function escSvg(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function truncate(s: string, maxW: number, fontSize: number): string {
  const approxChars = Math.floor(maxW / (fontSize * 0.55));
  if (s.length <= approxChars) return s;
  return s.slice(0, approxChars - 1) + "…";
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function OrgChartClient() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // State
  const [people, setPeople] = useState<Person[]>([]);
  const [settings, setSettings] = useState<ChartSettings>({ ...DEFAULT_SETTINGS });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showClearWarn, setShowClearWarn] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<"before" | "child" | "after" | null>(null);
  const [dragTooltip, setDragTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(true);
  const [paidUser, setPaidUser] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const skipHistoryRef = useRef(false);

  // Zoom/pan
  const [zoom, setZoom] = useState(0.6);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // ─── HISTORY MANAGEMENT ──────────────────────────────────────────────────
  const pushHistory = useCallback(
    (p: Person[], s: ChartSettings) => {
      if (skipHistoryRef.current) {
        skipHistoryRef.current = false;
        return;
      }
      setHistory((h) => {
        const newH = h.slice(0, historyIdx + 1);
        newH.push({ people: structuredClone(p), settings: structuredClone(s) });
        if (newH.length > 50) newH.shift();
        return newH;
      });
      setHistoryIdx((i) => Math.min(i + 1, 49));
    },
    [historyIdx]
  );

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    const entry = history[historyIdx - 1];
    skipHistoryRef.current = true;
    setPeople(structuredClone(entry.people));
    setSettings(structuredClone(entry.settings));
    setHistoryIdx((i) => i - 1);
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const entry = history[historyIdx + 1];
    skipHistoryRef.current = true;
    setPeople(structuredClone(entry.people));
    setSettings(structuredClone(entry.settings));
    setHistoryIdx((i) => i + 1);
  }, [history, historyIdx]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // ─── LOAD CHART ON MOUNT ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch("/api/org-chart/load");
        const data = await res.json();
        if (data.chartData) {
          setPeople(data.chartData.people || []);
          const saved = data.chartData.settings || {};
          const merged = {
            ...DEFAULT_SETTINGS,
            ...saved,
            visibleFields: { ...DEFAULT_SETTINGS.visibleFields, ...(saved.visibleFields || {}) },
          };
          setSettings(merged);
          setShareId(data.shareId || null);
          pushHistory(data.chartData.people || [], merged);
        }
      } catch {}
      setLoading(false);
    })();

    // Check if paid
    (async () => {
      try {
        const res = await fetch("/api/ai-tools/check-access?tool=org-chart-generator");
        const data = await res.json();
        setPaidUser(data.tier && data.tier !== "FREE");
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!isLoggedIn || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/org-chart/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartData: { people, settings } }),
      });
      const data = await res.json();
      if (data.shareId) {
        setShareId(data.shareId);
        setShareUrl(`${window.location.origin}/tools/org-chart-generator/share/${data.shareId}`);
      }
    } catch {}
    setSaving(false);
  }, [isLoggedIn, saving, people, settings]);

  // Auto-save on changes (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!isLoggedIn || loading || people.length === 0) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => save(), 2000);
    return () => clearTimeout(saveTimerRef.current);
  }, [people, settings, isLoggedIn, loading, save]);

  // ─── PERSON CRUD ──────────────────────────────────────────────────────────
  const addPerson = useCallback(
    (person: Omit<Person, "id" | "order">) => {
      if (people.length >= MAX_PEOPLE) return;
      if (person.parentId) {
        const depth = getDepth(person.parentId, people) + 1;
        if (depth >= MAX_DEPTH) return;
      }
      const siblings = getChildren(person.parentId, people);
      const newPerson: Person = {
        ...person,
        id: uid(),
        order: siblings.length,
      };
      const next = [...people, newPerson];
      setPeople(next);
      pushHistory(next, settings);
      setShowAddModal(false);
    },
    [people, settings, pushHistory]
  );

  const updatePerson = useCallback(
    (updated: Person) => {
      const next = people.map((p) => (p.id === updated.id ? updated : p));
      setPeople(next);
      pushHistory(next, settings);
      setEditPerson(null);
    },
    [people, settings, pushHistory]
  );

  const deletePerson = useCallback(
    (id: string) => {
      // Also delete all descendants
      const toDelete = new Set<string>();
      const collect = (pid: string) => {
        toDelete.add(pid);
        people.filter((p) => p.parentId === pid).forEach((c) => collect(c.id));
      };
      collect(id);
      const next = people.filter((p) => !toDelete.has(p.id));
      setPeople(next);
      pushHistory(next, settings);
      setEditPerson(null);
      setSelectedId(null);
    },
    [people, settings, pushHistory]
  );

  const clearAll = useCallback(async () => {
    setPeople([]);
    setSettings({ ...DEFAULT_SETTINGS });
    setShareId(null);
    setShareUrl(null);
    setShowClearWarn(false);
    setSelectedId(null);
    if (isLoggedIn) {
      try { await fetch("/api/org-chart/clear", { method: "DELETE" }); } catch {}
    }
  }, [isLoggedIn]);

  // ─── DRAG & DROP ──────────────────────────────────────────────────────────
  const handleDragStart = (id: string) => setDragId(id);

  const handleDrop = useCallback(
    (targetId: string, position: "before" | "after" | "child") => {
      if (!dragId || dragId === targetId) { setDragId(null); return; }

      // Prevent dropping on own descendant
      const isDescendant = (pid: string, checkId: string): boolean => {
        const kids = people.filter((p) => p.parentId === pid);
        return kids.some((k) => k.id === checkId || isDescendant(k.id, checkId));
      };
      if (isDescendant(dragId, targetId)) { setDragId(null); return; }

      const target = people.find((p) => p.id === targetId);
      if (!target) { setDragId(null); return; }

      let next = people.map((p) => ({ ...p }));
      const dragged = next.find((p) => p.id === dragId)!;

      if (position === "child") {
        // Check depth
        const newDepth = getDepth(targetId, people) + 1;
        if (newDepth >= MAX_DEPTH) { setDragId(null); return; }
        dragged.parentId = targetId;
        const siblings = next.filter((p) => p.parentId === targetId && p.id !== dragId);
        dragged.order = siblings.length;
      } else {
        dragged.parentId = target.parentId;
        const siblings = next
          .filter((p) => p.parentId === target.parentId && p.id !== dragId)
          .sort((a, b) => a.order - b.order);
        const targetIdx = siblings.findIndex((p) => p.id === targetId);
        const insertIdx = position === "before" ? targetIdx : targetIdx + 1;
        siblings.splice(insertIdx, 0, dragged);
        siblings.forEach((s, i) => (s.order = i));
      }

      setPeople(next);
      pushHistory(next, settings);
      setDragId(null);
    },
    [dragId, people, settings, pushHistory]
  );

  // ─── PHOTO UPLOAD ────────────────────────────────────────────────────────
  const uploadPhoto = useCallback(
    async (file: File): Promise<string | null> => {
      if (file.size > 0.5 * 1024 * 1024) {
        alert(
          "Photo must be under 0.5 MB. Resize for free at imageresizer.com or tinypng.com"
        );
        return null;
      }
      setUploadingPhoto(true);
      try {
        const fd = new FormData();
        fd.append("photo", file);
        const res = await fetch("/api/org-chart/upload-photo", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (data.url) return data.url;
        if (data.message) alert(data.message);
        return null;
      } catch {
        return null;
      } finally {
        setUploadingPhoto(false);
      }
    },
    []
  );

  // ─── PDF DOWNLOAD ────────────────────────────────────────────────────────
  const downloadPdf = useCallback(async () => {
    if (!paidUser) {
      alert("PDF download is available on paid plans. Upgrade at ebrora.com/pricing");
      return;
    }
    if (!svgRef.current) return;

    try {
      const svgEl = svgRef.current.cloneNode(true) as SVGSVGElement;

    // Convert all external <image> hrefs to data URLs so they render in the canvas
    const images = svgEl.querySelectorAll("image[href]");
    await Promise.all(
      Array.from(images).map(async (imgEl) => {
        const href = imgEl.getAttribute("href");
        if (!href || href.startsWith("data:")) return;
        try {
          const res = await fetch(href);
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          imgEl.setAttribute("href", dataUrl);
        } catch {
          // If fetch fails, remove the image to avoid broken output
          imgEl.remove();
        }
      })
    );

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    // A3 landscape: 420mm x 297mm @ 150dpi
    const dpi = 150;
    const mmToPx = dpi / 25.4;
    canvas.width = Math.round(420 * mmToPx);
    canvas.height = Math.round(297 * mmToPx);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    const blobObj = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blobObj);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        const scale = Math.min(
          (canvas.width - 40) / img.width,
          (canvas.height - 40) / img.height
        );
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        resolve();
      };
      img.onerror = () => reject(new Error("SVG render failed"));
      img.src = url;
    });

    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, 420, 297);
    pdf.save(`org-chart-${new Date().toISOString().slice(0, 10)}.pdf`);
    URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please try again.");
    }
  }, [paidUser]);

  // ─── SHARE ────────────────────────────────────────────────────────────────
  const copyShareLink = useCallback(() => {
    const url = shareUrl || (shareId ? `${window.location.origin}/tools/org-chart-generator/share/${shareId}` : null);
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl, shareId]);

  // ─── ZOOM & PAN ───────────────────────────────────────────────────────────
  // Zoom — must use non-passive listener so preventDefault works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(0.2, Math.min(3, z - e.deltaY * 0.001)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current || !containerRef.current) return;
    containerRef.current.scrollLeft -= e.clientX - lastMouse.current.x;
    containerRef.current.scrollTop -= e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // ─── RENDER CHART SVG (A3 WYSIWYG) ─────────────────────────────────────
  // A3 landscape viewBox: 3px per mm = 1260 x 891
  const A3_VW = 1260;
  const A3_VH = 891;

  const { svgContent, svgWidth, svgHeight } = useMemo(() => {
    const emptyReturn = { svgContent: "", svgWidth: A3_VW, svgHeight: A3_VH };

    if (people.length === 0) return emptyReturn;

    const roots = buildTree(null, people, settings, people.length);
    if (roots.length === 0) return emptyReturn;

    const padding = 40;
    const layoutDir = settings.layout === "bottom-up" ? "top-down" : settings.layout;

    let dims: { width: number; height: number };
    if (layoutDir === "left-right") {
      dims = layoutLeftRight(roots, padding, padding, settings, people.length);
    } else {
      dims = layoutTopDown(roots, padding, padding, settings, people.length);
    }

    const naturalW = dims.width + padding * 2;
    const naturalH = dims.height + padding * 2;

    // Bottom-up: flip Y positions
    if (settings.layout === "bottom-up") {
      function flipNodes(nodes: LayoutNode[]) {
        for (const node of nodes) {
          node.y = naturalH - node.y - node.h;
          flipNodes(node.children);
        }
      }
      flipNodes(roots);
    }

    // Calculate title space
    const titleH = settings.chartTitle ? 40 : 0;

    // Calculate scale to fit A3 with margins
    const margin = 30;
    const availW = A3_VW - margin * 2;
    const availH = A3_VH - margin * 2 - titleH;
    const scale = Math.min(availW / naturalW, availH / naturalH);

    // Centre offset
    const scaledW = naturalW * scale;
    const scaledH = naturalH * scale;
    const offsetX = margin + (availW - scaledW) / 2;
    const offsetY = margin + titleH + (availH - scaledH) / 2;

    let svg = "";

    // A3 border (subtle dashed)
    svg += `<rect x="0" y="0" width="${A3_VW}" height="${A3_VH}" fill="white" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4,4" rx="4" />`;

    // Title
    if (settings.chartTitle) {
      const titleFontSize = Math.min(24, Math.max(14, 24 * (people.length > 20 ? 0.7 : 1)));
      const titleWeight = settings.titleBold ? "bold" : "normal";
      const titleStyle = settings.fontItalic ? "italic" : "normal";
      svg += `<text x="${A3_VW / 2}" y="${margin + titleFontSize + 4}" text-anchor="middle" font-family="'${settings.font}'" font-size="${titleFontSize}" font-weight="${titleWeight}" font-style="${titleStyle}" fill="#1a1a1a">${escSvg(settings.chartTitle)}</text>`;
    }

    // Wrap chart content in a scaled/translated group
    svg += `<g transform="translate(${offsetX},${offsetY}) scale(${scale})">`;

    // Draw arrows
    function drawArrows(nodes: LayoutNode[]) {
      for (const node of nodes) {
        for (const child of node.children) {
          svg += drawArrow(node, child, settings, layoutDir);
        }
        drawArrows(node.children);
      }
    }
    drawArrows(roots);

    // Draw nodes
    const fontSize = Math.max(8, Math.min(12, 12 * (people.length > 30 ? 30 / people.length : 1)));
    function drawNodes(nodes: LayoutNode[]) {
      for (const node of nodes) {
        svg += renderNode(node, settings, people, fontSize, selectedId);
        drawNodes(node.children);
      }
    }
    drawNodes(roots);

    svg += `</g>`;

    return { svgContent: svg, svgWidth: A3_VW, svgHeight: A3_VH };
  }, [people, settings, selectedId]);

  // ─── SETTINGS UPDATE ─────────────────────────────────────────────────────
  const updateSettings = useCallback(
    (patch: Partial<ChartSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      pushHistory(people, next);
    },
    [settings, people, pushHistory]
  );

  const updateVisibleFields = useCallback(
    (field: keyof ChartSettings["visibleFields"], value: boolean) => {
      const next = {
        ...settings,
        visibleFields: { ...settings.visibleFields, [field]: value },
      };
      setSettings(next);
      pushHistory(people, next);
    },
    [settings, people, pushHistory]
  );

  // ─── SVG CLICK HANDLER ──────────────────────────────────────────────────
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const target = (e.target as SVGElement).closest("[data-person-id]");
      if (target) {
        const id = target.getAttribute("data-person-id")!;
        setSelectedId(id);
        const p = people.find((pp) => pp.id === id);
        if (p) setEditPerson({ ...p });
      } else {
        setSelectedId(null);
        setEditPerson(null);
      }
    },
    [people]
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="bg-gray-100 rounded-xl h-[500px]" />
      </div>
    );
  }

  const emptyPerson: Omit<Person, "id" | "order"> = {
    name: "",
    title: "",
    jobFamily: "",
    phone: "",
    photo: "",
    customField: "",
    customFieldLabel: "",
    parentId: null,
  };

  return (
    <div className="space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
        <button
          onClick={() => setShowAddModal(true)}
          disabled={people.length >= MAX_PEOPLE}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          + Add Person
        </button>
        <span className="text-xs text-gray-500">
          {people.length}/{MAX_PEOPLE}
        </span>

        <div className="h-5 w-px bg-gray-300 mx-1" />

        <button onClick={undo} disabled={historyIdx <= 0} className="px-2 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors" title="Undo (Ctrl+Z)">↩</button>
        <button onClick={redo} disabled={historyIdx >= history.length - 1} className="px-2 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors" title="Redo (Ctrl+Y)">↪</button>

        <div className="h-5 w-px bg-gray-300 mx-1" />

        <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} className="px-2 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">+</button>
        <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))} className="px-2 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">−</button>
        <button onClick={() => { setZoom(0.6); if (containerRef.current) { containerRef.current.scrollLeft = 0; containerRef.current.scrollTop = 0; } }} className="px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Reset</button>

        <div className="flex-1" />

        <button onClick={() => setShowSettingsPanel((s) => !s)} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          ⚙ {showSettingsPanel ? "Hide" : "Show"} Settings
        </button>

        {isLoggedIn && shareId && (
          <button onClick={copyShareLink} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            {copied ? "✓ Copied!" : "🔗 Share"}
          </button>
        )}

        <button
          onClick={downloadPdf}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            paidUser
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          title={paidUser ? "Download PDF" : "PDF download requires a paid plan"}
        >
          ↓ PDF{!paidUser && " 🔒"}
        </button>

        <button
          onClick={saving ? undefined : save}
          disabled={!isLoggedIn || people.length === 0}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "💾 Save"}
        </button>

        {people.length > 0 && (
          <button
            onClick={() => setShowClearWarn(true)}
            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            🗑 Clear All
          </button>
        )}
      </div>

      {/* LOGIN NOTICE */}
      {!isLoggedIn && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <a href="/auth/login" className="font-semibold underline">Sign in</a> to save your org chart. Without signing in, your work will be lost when you leave this page.
        </div>
      )}

      {/* MAIN AREA */}
      <div className="flex gap-4">
        {/* SETTINGS PANEL */}
        {showSettingsPanel && (
          <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-xl p-4 space-y-4 text-sm max-h-[700px] overflow-y-auto">
            <h3 className="font-semibold text-gray-900 text-base">Chart Settings</h3>

            {/* Layout */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Layout</label>
              <select value={settings.layout} onChange={(e) => updateSettings({ layout: e.target.value as any })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                <option value="top-down">Top → Down</option>
                <option value="left-right">Left → Right</option>
                <option value="bottom-up">Bottom → Up</option>
              </select>
            </div>

            {/* Shape */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shape</label>
              <select value={settings.shapeType} onChange={(e) => updateSettings({ shapeType: e.target.value as any })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                <option value="rectangle">Rectangle</option>
                <option value="rounded-rectangle">Rounded Rectangle</option>
                <option value="square">Square</option>
                <option value="circle">Circle / Ellipse</option>
                <option value="hexagon">Hexagon</option>
                <option value="diamond">Diamond</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shape Mode</label>
              <select value={settings.shapeMode} onChange={(e) => updateSettings({ shapeMode: e.target.value as any })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                <option value="global">Same for all</option>
                <option value="per-job-family">Per job family</option>
              </select>
            </div>

            {/* Arrows */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Arrow Style</label>
              <select value={settings.arrowStyle} onChange={(e) => updateSettings({ arrowStyle: e.target.value as any })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                <option value="elbow">Elbow (Right-Angle)</option>
                <option value="straight">Straight</option>
                <option value="curved">Curved</option>
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Arrow Colour</label>
                <input type="color" value={settings.arrowColor} onChange={(e) => updateSettings({ arrowColor: e.target.value })} className="w-full h-8 rounded border border-gray-300 cursor-pointer" />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                <input type="number" min={1} max={6} value={settings.arrowWidth} onChange={(e) => updateSettings({ arrowWidth: +e.target.value })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
              </div>
            </div>

            {/* Borders */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Border Colour</label>
                <input type="color" value={settings.borderColor} onChange={(e) => updateSettings({ borderColor: e.target.value })} className="w-full h-8 rounded border border-gray-300 cursor-pointer" />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                <input type="number" min={0} max={6} value={settings.borderWidth} onChange={(e) => updateSettings({ borderWidth: +e.target.value })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
              </div>
            </div>

            {/* Colour */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Colour By</label>
              <select value={settings.colorMode} onChange={(e) => updateSettings({ colorMode: e.target.value as any })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                <option value="job-family">Job Family</option>
                <option value="management-level">Management Level</option>
                <option value="manual">Manual (single colour)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Colour Palette</label>
              <select value={settings.palette} onChange={(e) => updateSettings({ palette: +e.target.value })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                {PALETTES.map((p, i) => (
                  <option key={i} value={i}>{p.name}</option>
                ))}
              </select>
              <div className="flex gap-0.5 mt-1">
                {PALETTES[settings.palette].colors.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 h-6 rounded-sm cursor-pointer hover:scale-110 hover:ring-2 hover:ring-blue-400 transition-transform"
                    style={{ backgroundColor: c }}
                    title={selectedId ? `Assign to selected person` : `Click a person first, then click a swatch`}
                    onClick={() => {
                      if (selectedId) {
                        const person = people.find(p => p.id === selectedId);
                        if (person) {
                          updateSettings({
                            colorOverrides: {
                              ...settings.colorOverrides,
                              [selectedId]: c,
                              ...(person.jobFamily ? { [`jf:${person.jobFamily}`]: c } : {}),
                            },
                          });
                        }
                      }
                    }}
                  />
                ))}
              </div>
              {selectedId && (
                <p className="text-[10px] text-blue-600 mt-1">Click a swatch to assign it to the selected person &amp; their job family</p>
              )}
              {!selectedId && people.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-1">Select a person on the chart, then click a swatch</p>
              )}
              {Object.keys(settings.colorOverrides).length > 0 && (
                <button
                  onClick={() => updateSettings({ colorOverrides: {} })}
                  className="text-[10px] text-red-500 hover:underline mt-1"
                >
                  Reset all colour overrides
                </button>
              )}
            </div>

            {/* Chart Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Title</label>
              <input
                value={settings.chartTitle}
                onChange={(e) => updateSettings({ chartTitle: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                placeholder="e.g. Salford WwTW — Site Organisation"
              />
            </div>

            {/* Font */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Font</label>
              <select value={settings.font} onChange={(e) => updateSettings({ font: e.target.value })} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                {FONTS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={settings.fontBold} onChange={(e) => updateSettings({ fontBold: e.target.checked })} className="rounded" />
                <span className="text-xs font-bold">Bold</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={settings.fontItalic} onChange={(e) => updateSettings({ fontItalic: e.target.checked })} className="rounded" />
                <span className="text-xs italic">Italic</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={settings.titleBold} onChange={(e) => updateSettings({ titleBold: e.target.checked })} className="rounded" />
                <span className="text-xs"><strong>Bold</strong> titles</span>
              </label>
            </div>

            {/* Visible Fields */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Visible Fields</label>
              <div className="space-y-1">
                {(Object.keys(settings.visibleFields) as (keyof ChartSettings["visibleFields"])[]).map((field) => (
                  <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={settings.visibleFields[field]} onChange={(e) => updateVisibleFields(field, e.target.checked)} className="rounded" />
                    <span className="text-xs capitalize">{field === "customField" ? "Custom Field" : field === "jobFamily" ? "Job Family" : field}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHART CANVAS — A3 WYSIWYG */}
        <div
          ref={containerRef}
          className="flex-1 bg-gray-100 border border-gray-200 rounded-xl overflow-auto relative p-2"
          style={{ cursor: isPanning.current ? "grabbing" : "default", maxHeight: `${svgHeight * zoom + 20}px` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div style={{ width: `${svgWidth * zoom}px`, height: `${svgHeight * zoom}px` }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              width={svgWidth * zoom}
              height={svgHeight * zoom}
              xmlns="http://www.w3.org/2000/svg"
              className="block shadow-sm"
              onClick={handleSvgClick}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>

          {people.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
              <div className="text-center space-y-2">
                <p className="text-lg">No people added yet</p>
                <p>Click <strong>+ Add Person</strong> to start building your org chart</p>
              </div>
            </div>
          )}

          {/* Zoom hint */}
          <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded">
            Scroll to zoom · Alt+drag to pan · Click node to edit
          </div>
        </div>
      </div>

      {/* PEOPLE LIST (drag-and-drop) */}
      {people.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">People — drag to reorder or re-parent (top third = before, middle = make child, bottom third = after)</h3>
          <div className="space-y-0.5 max-h-72 overflow-y-auto">
            {renderPeopleList(null, 0)}
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <PersonModal
          person={emptyPerson}
          people={people}
          title="Add Person"
          onSave={(p) => addPerson(p)}
          onClose={() => setShowAddModal(false)}
          onUploadPhoto={uploadPhoto}
          uploadingPhoto={uploadingPhoto}
        />
      )}

      {/* EDIT MODAL */}
      {editPerson && (
        <PersonModal
          person={editPerson}
          people={people}
          title="Edit Person"
          onSave={(p) => updatePerson(p as Person)}
          onClose={() => setEditPerson(null)}
          onDelete={() => deletePerson(editPerson.id)}
          onUploadPhoto={uploadPhoto}
          uploadingPhoto={uploadingPhoto}
        />
      )}

      {/* DRAG TOOLTIP */}
      {dragTooltip && (
        <div
          className="fixed z-50 pointer-events-none px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap"
          style={{ left: dragTooltip.x + 12, top: dragTooltip.y - 10 }}
        >
          {dragTooltip.text}
        </div>
      )}

      {/* CLEAR WARNING */}
      {showClearWarn && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowClearWarn(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">Clear All?</h3>
            <p className="text-sm text-gray-600">
              This will permanently delete your entire org chart including all people and photos.
              This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowClearWarn(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={clearAll} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Yes, Delete Everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── RECURSIVE PEOPLE LIST RENDERER ──────────────────────────────────────
  function renderPeopleList(parentId: string | null, depth: number): React.ReactNode {
    const items = getChildren(parentId, people);
    return items.map((p) => {
      const isDropTarget = dragOverId === p.id;
      return (
        <div key={p.id}>
          {/* Drop zone: before */}
          {isDropTarget && dragOverPos === "before" && (
            <div className="h-0.5 bg-blue-500 rounded-full mx-2" style={{ marginLeft: `${depth * 20 + 8}px` }} />
          )}
          <div
            draggable
            onDragStart={() => handleDragStart(p.id)}
            onDragEnd={() => { setDragId(null); setDragOverId(null); setDragOverPos(null); setDragTooltip(null); }}
            onDragOver={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const third = rect.height / 3;
              setDragOverId(p.id);
              const name = p.name || "Unnamed";
              if (y < third) {
                setDragOverPos("before");
                setDragTooltip({ text: `↑ Move before ${name}`, x: e.clientX, y: e.clientY });
              } else if (y > third * 2) {
                setDragOverPos("after");
                setDragTooltip({ text: `↓ Move after ${name}`, x: e.clientX, y: e.clientY });
              } else {
                setDragOverPos("child");
                setDragTooltip({ text: `→ Make child of ${name}`, x: e.clientX, y: e.clientY });
              }
            }}
            onDragLeave={() => { if (dragOverId === p.id) { setDragOverId(null); setDragOverPos(null); setDragTooltip(null); } }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const third = rect.height / 3;
              if (y < third) handleDrop(p.id, "before");
              else if (y > third * 2) handleDrop(p.id, "after");
              else handleDrop(p.id, "child");
              setDragOverId(null);
              setDragOverPos(null);
              setDragTooltip(null);
            }}
            onClick={() => {
              setSelectedId(p.id);
              setEditPerson({ ...p });
            }}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab transition-all text-sm border ${
              selectedId === p.id
                ? "bg-blue-100 border-blue-300 ring-1 ring-blue-300"
                : isDropTarget && dragOverPos === "child"
                ? "bg-green-50 border-green-400 border-dashed"
                : "bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200"
            } ${dragId === p.id ? "opacity-30 scale-95" : ""}`}
            style={{ paddingLeft: `${depth * 20 + 8}px`, marginBottom: "2px" }}
          >
            {p.photo && (
              <img src={p.photo} alt="" className="w-6 h-6 rounded-full object-cover" />
            )}
            <span className="font-medium text-gray-800">{p.name || "Unnamed"}</span>
            {p.title && <span className="text-gray-500 truncate">— {p.title}</span>}
            {p.jobFamily && <span className="text-gray-400 text-xs truncate">({p.jobFamily})</span>}
            <span className="ml-auto text-gray-300 text-xs flex-shrink-0">⠿ drag</span>
          </div>
          {/* Drop zone: after */}
          {isDropTarget && dragOverPos === "after" && (
            <div className="h-0.5 bg-blue-500 rounded-full mx-2" style={{ marginLeft: `${depth * 20 + 8}px` }} />
          )}
          {renderPeopleList(p.id, depth + 1)}
        </div>
      );
    });
  }
}

// ─── PERSON MODAL ──────────────────────────────────────────────────────────
function PersonModal({
  person,
  people,
  title,
  onSave,
  onClose,
  onDelete,
  onUploadPhoto,
  uploadingPhoto,
}: {
  person: Omit<Person, "id" | "order"> | Person;
  people: Person[];
  title: string;
  onSave: (p: Omit<Person, "id" | "order"> | Person) => void;
  onClose: () => void;
  onDelete?: () => void;
  onUploadPhoto: (f: File) => Promise<string | null>;
  uploadingPhoto: boolean;
}) {
  const [form, setForm] = useState({ ...person });
  const [customJobFamily, setCustomJobFamily] = useState(
    JOB_FAMILIES.includes(person.jobFamily) ? "" : person.jobFamily
  );
  const [useCustomJF, setUseCustomJF] = useState(
    !!person.jobFamily && !JOB_FAMILIES.includes(person.jobFamily)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await onUploadPhoto(file);
    if (url) setForm((f) => ({ ...f, photo: url }));
  };

  const handleSave = () => {
    const jf = useCustomJF ? customJobFamily : form.jobFamily;
    onSave({ ...form, jobFamily: jf });
  };

  // Available parents: all except self and descendants
  const isId = "id" in person;
  const selfId = isId ? (person as Person).id : null;

  const isDescendant = (pid: string, checkId: string): boolean => {
    const kids = people.filter((p) => p.parentId === pid);
    return kids.some((k) => k.id === checkId || isDescendant(k.id, checkId));
  };

  const validParents = people.filter((p) => {
    if (selfId && p.id === selfId) return false;
    if (selfId && isDescendant(selfId, p.id)) return false;
    // Check depth
    const parentDepth = getDepth(p.id, people);
    if (parentDepth >= MAX_DEPTH - 1) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Full name" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Site Manager" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Job Family
            <button onClick={() => setUseCustomJF(!useCustomJF)} className="ml-2 text-blue-600 text-[10px]">
              {useCustomJF ? "Use dropdown" : "Custom"}
            </button>
          </label>
          {useCustomJF ? (
            <input value={customJobFamily} onChange={(e) => setCustomJobFamily(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Type custom job family" />
          ) : (
            <select value={form.jobFamily} onChange={(e) => setForm({ ...form, jobFamily: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select…</option>
              {JOB_FAMILIES.map((jf) => (
                <option key={jf} value={jf}>{jf}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Phone number" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Photo</label>
          <div className="flex items-center gap-2">
            {form.photo && <img src={form.photo} alt="" className="w-10 h-10 rounded-full object-cover border" />}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="px-3 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">
              {uploadingPhoto ? "Uploading…" : form.photo ? "Change" : "Upload"}
            </button>
            {form.photo && (
              <button onClick={() => setForm({ ...form, photo: "" })} className="text-xs text-red-500 hover:underline">Remove</button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Max 0.5 MB. JPG, PNG, WebP.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Custom Field Label</label>
          <input value={form.customFieldLabel} onChange={(e) => setForm({ ...form, customFieldLabel: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Employee ID" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Custom Field Value</label>
          <input value={form.customField} onChange={(e) => setForm({ ...form, customField: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. EMP-001" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Reports To</label>
          <select value={form.parentId || ""} onChange={(e) => setForm({ ...form, parentId: e.target.value || null })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">None (top level)</option>
            {validParents.map((p) => (
              <option key={p.id} value={p.id}>{p.name || "Unnamed"} — {p.title || p.jobFamily || ""}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          {onDelete && (
            <button onClick={onDelete} className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors mr-auto">
              Delete
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!form.name.trim()} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
            {title === "Add Person" ? "Add" : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
