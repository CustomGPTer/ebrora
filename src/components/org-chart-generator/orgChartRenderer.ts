// src/components/org-chart-generator/orgChartRenderer.ts
// Shared SVG rendering logic for org chart editor and public viewer

// ─── TYPES ──────────────────────────────────────────────────────────────────
export interface Person {
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

export interface ChartSettings {
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

export interface ChartData {
  people: Person[];
  settings: ChartSettings;
}

interface LayoutNode {
  person: Person;
  x: number;
  y: number;
  w: number;
  h: number;
  children: LayoutNode[];
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
export const MAX_PEOPLE = 60;
export const MAX_DEPTH = 7;

export const JOB_FAMILIES = [
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

export const PALETTES = [
  { name: "Corporate Blue", colors: ["#1e3a5f","#2d5f8a","#4a90d9","#7ab3ef","#a8d1f0","#c5e1f5","#dbedf9","#f0f7fd"] },
  { name: "High-Vis Construction", colors: ["#ff6600","#ffaa00","#ffcc00","#00aa44","#0066cc","#cc0033","#8833cc","#444444"] },
  { name: "Earth & Clay", colors: ["#8b4513","#a0522d","#cd853f","#deb887","#556b2f","#6b8e23","#808000","#bc8f8f"] },
  { name: "Monochrome", colors: ["#1a1a1a","#333333","#4d4d4d","#666666","#808080","#999999","#b3b3b3","#cccccc"] },
  { name: "Ocean Depth", colors: ["#003366","#004488","#0066aa","#0088cc","#00aaee","#33bbff","#66ccff","#99ddff"] },
  { name: "Vibrant Pop", colors: ["#e6194b","#3cb44b","#ffe119","#4363d8","#f58231","#911eb4","#42d4f4","#f032e6"] },
  { name: "Pastel Soft", colors: ["#ffb3ba","#ffdfba","#ffffba","#baffc9","#bae1ff","#e8baff","#ffd6e0","#d4f0f0"] },
  { name: "Slate Professional", colors: ["#2c3e50","#34495e","#7f8c8d","#95a5a6","#1abc9c","#2ecc71","#3498db","#9b59b6"] },
];

export const FONTS = [
  "Arial", "Helvetica", "Georgia", "Verdana", "Trebuchet MS",
  "Tahoma", "Palatino Linotype", "Garamond", "Courier New", "Lucida Sans",
];

export const DEFAULT_SETTINGS: ChartSettings = {
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

// ─── HELPERS ────────────────────────────────────────────────────────────────
export function uid() {
  return "p_" + Math.random().toString(36).slice(2, 10);
}

export function getDepth(personId: string, people: Person[]): number {
  let depth = 0;
  let current = people.find((p) => p.id === personId);
  while (current?.parentId) {
    depth++;
    current = people.find((p) => p.id === current!.parentId);
    if (depth > MAX_DEPTH + 1) break;
  }
  return depth;
}

export function getChildren(parentId: string | null, people: Person[]) {
  return people
    .filter((p) => p.parentId === parentId)
    .sort((a, b) => a.order - b.order);
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

// ─── COLOUR ─────────────────────────────────────────────────────────────────
function getColorForPerson(
  person: Person,
  people: Person[],
  settings: ChartSettings
): string {
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

// ─── LAYOUT ─────────────────────────────────────────────────────────────────
const BASE_W = 180;
const PHOTO_SIZE = 36;
const H_GAP = 30;
const V_GAP = 50;

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
    function maxDepthCalc(nd: LayoutNode): number {
      if (nd.children.length === 0) return nd.y + nd.h;
      return Math.max(...nd.children.map(maxDepthCalc));
    }
    maxH = Math.max(maxH, maxDepthCalc(n));
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
    position(n, startX, startY + totalH + (i > 0 ? gap : 0));
    totalH += measure(n) + (i > 0 ? gap : 0);
  });

  function maxRight(nd: LayoutNode): number {
    if (nd.children.length === 0) return nd.x + nd.w;
    return Math.max(nd.x + nd.w, ...nd.children.map(maxRight));
  }
  const maxW = nodes.length > 0 ? Math.max(...nodes.map(maxRight)) - startX : 0;

  return { width: maxW, height: totalH };
}

// ─── DRAWING ────────────────────────────────────────────────────────────────
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
  const textColor = isLightColor(bg) ? "#1a1a1a" : "#ffffff";
  const sel = selectedId === p.id;

  const shapeForPerson = getShapeForPerson(p, people, settings);
  const shapeEl = shapeClip(shapeForPerson, node.x, node.y, node.w, node.h);
  const borderStr = settings.borderWidth > 0
    ? `stroke="${sel ? "#2563eb" : settings.borderColor}" stroke-width="${sel ? 3 : settings.borderWidth}"`
    : `stroke="none"`;

  let svg = `<g data-person-id="${p.id}" style="cursor:pointer">`;
  svg += `${shapeEl} fill="${bg}" ${borderStr} />`;

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

// ─── PUBLIC RENDER FUNCTION ─────────────────────────────────────────────────
export function renderOrgChartSvg(
  people: Person[],
  settings: ChartSettings,
  selectedId: string | null = null
): { svgContent: string; svgWidth: number; svgHeight: number } {
  if (people.length === 0) {
    return { svgContent: "", svgWidth: 400, svgHeight: 200 };
  }

  const roots = buildTree(null, people, settings, people.length);
  if (roots.length === 0) {
    return { svgContent: "", svgWidth: 400, svgHeight: 200 };
  }
  const padding = 40;
  const layout = settings.layout === "bottom-up" ? "top-down" : settings.layout;

  let dims: { width: number; height: number };
  if (layout === "left-right") {
    dims = layoutLeftRight(roots, padding, padding, settings, people.length);
  } else {
    dims = layoutTopDown(roots, padding, padding, settings, people.length);
  }

  const totalW = dims.width + padding * 2;
  const totalH = dims.height + padding * 2;

  // If bottom-up, flip Y positions of all nodes so root is at bottom
  if (settings.layout === "bottom-up") {
    function flipNodes(nodes: LayoutNode[]) {
      for (const node of nodes) {
        node.y = totalH - node.y - node.h;
        flipNodes(node.children);
      }
    }
    flipNodes(roots);
  }

  let svg = "";

  function drawArrows(nodes: LayoutNode[]) {
    for (const node of nodes) {
      for (const child of node.children) {
        svg += drawArrow(node, child, settings, layout);
      }
      drawArrows(node.children);
    }
  }
  drawArrows(roots);

  const fontSize = Math.max(8, Math.min(12, 12 * (people.length > 30 ? 30 / people.length : 1)));
  function drawNodes(nodes: LayoutNode[]) {
    for (const node of nodes) {
      svg += renderNode(node, settings, people, fontSize, selectedId);
      drawNodes(node.children);
    }
  }
  drawNodes(roots);

  return { svgContent: svg, svgWidth: totalW, svgHeight: totalH };
}
