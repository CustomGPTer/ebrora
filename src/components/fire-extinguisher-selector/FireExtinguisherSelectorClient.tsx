// src/components/fire-extinguisher-selector/FireExtinguisherSelectorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  FIRE_RISKS, PREMISES_TYPES, EXTINGUISHER_TYPES, FIRE_CLASS_DETAILS,
  SITING_RULES, SIGNAGE_REQUIREMENTS, INSPECTION_SCHEDULE, REGULATORY_REFS,
  calculateFullResult,
  type AssessmentArea, type RiskLevel, type FireClass, type Suitability, type SelectorResult,
} from "@/data/fire-extinguisher-selector";

// ─── Helpers ─────────────────────────────────────────────────────
function cn(...c: (string | false | undefined | null)[]) { return c.filter(Boolean).join(" "); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function uid() { return Math.random().toString(36).slice(2, 8); }

const SUITABILITY_DISPLAY: Record<Suitability, { label: string; bg: string; text: string; border: string }> = {
  suitable: { label: "YES", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  limited: { label: "LIMITED", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  danger: { label: "DANGER", bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  "not-suitable": { label: "NO", bg: "bg-gray-50", text: "text-gray-400", border: "border-gray-200" },
};

const FIRE_CLASSES: FireClass[] = ["A", "B", "C", "D", "F", "ELECTRICAL"];

// ─── SVG: Extinguisher Band Diagram ──────────────────────────────
function ExtinguisherBandDiagram() {
  const types = EXTINGUISHER_TYPES.filter(t => t.id !== "class-d"); // 6 main types
  const W = 700, H = 280, padL = 120, padT = 50, padR = 10, padB = 20;
  const colW = (W - padL - padR) / FIRE_CLASSES.length;
  const rowH = (H - padT - padB) / types.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 320 }}>
      {/* Title */}
      <text x={W / 2} y={16} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1F2937">Fire Extinguisher Suitability Matrix</text>
      <text x={W / 2} y={30} textAnchor="middle" fontSize={8} fill="#6B7280">Per BS 5306-8:2023 and BS EN 3 series</text>

      {/* Column headers (fire classes) */}
      {FIRE_CLASSES.map((fc, ci) => {
        const d = FIRE_CLASS_DETAILS[fc];
        const x = padL + ci * colW + colW / 2;
        return (
          <g key={fc}>
            <rect x={padL + ci * colW + 2} y={padT - 16} width={colW - 4} height={14} rx={3} fill={d.color} opacity={0.15} />
            <text x={x} y={padT - 6} textAnchor="middle" fontSize={9} fontWeight={700} fill={d.color}>{d.label}</text>
          </g>
        );
      })}

      {/* Row headers (extinguisher types) + cells */}
      {types.map((ext, ri) => {
        const y = padT + ri * rowH;
        return (
          <g key={ext.id}>
            {/* Band colour swatch */}
            <rect x={4} y={y + 4} width={12} height={rowH - 8} rx={2} fill={ext.bandHex} stroke="#D1D5DB" strokeWidth={0.5} />
            {/* Type name */}
            <text x={22} y={y + rowH / 2 + 3} fontSize={9} fontWeight={600} fill="#374151">{ext.type}</text>

            {/* Suitability cells */}
            {FIRE_CLASSES.map((fc, ci) => {
              const suit = ext.suitability[fc];
              const cx = padL + ci * colW;
              const cellPad = 3;
              const bg = suit === "suitable" ? "#DCFCE7" : suit === "limited" ? "#FEF9C3" : suit === "danger" ? "#FEE2E2" : "#F9FAFB";
              const fg = suit === "suitable" ? "#16A34A" : suit === "limited" ? "#CA8A04" : suit === "danger" ? "#DC2626" : "#D1D5DB";
              const label = suit === "suitable" ? "YES" : suit === "limited" ? "LTD" : suit === "danger" ? "!!!" : "--";
              return (
                <g key={`${ext.id}-${fc}`}>
                  <rect x={cx + cellPad} y={y + 2} width={colW - cellPad * 2} height={rowH - 4} rx={4} fill={bg} stroke={fg} strokeWidth={0.8} opacity={0.9} />
                  <text x={cx + colW / 2} y={y + rowH / 2 + 3} textAnchor="middle" fontSize={9} fontWeight={700} fill={fg}>{label}</text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Legend */}
      {[
        { label: "YES = Suitable", color: "#16A34A", bg: "#DCFCE7" },
        { label: "LTD = Limited use", color: "#CA8A04", bg: "#FEF9C3" },
        { label: "!!! = DANGER", color: "#DC2626", bg: "#FEE2E2" },
        { label: "-- = Not suitable", color: "#D1D5DB", bg: "#F9FAFB" },
      ].map((item, i) => (
        <g key={i}>
          <rect x={padL + i * 140} y={H - 14} width={10} height={10} rx={2} fill={item.bg} stroke={item.color} strokeWidth={0.8} />
          <text x={padL + i * 140 + 14} y={H - 5} fontSize={8} fill="#6B7280">{item.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── SVG: Siting Coverage Diagram ────────────────────────────────
// Class A agents drive the fire point count (BS 5306-8:2023 clause 5);
// CO2 and ABC powder co-locate at those same points; Class D gets its own
// dedicated station sited adjacent to the metal-working hazard.
const CLASS_A_TYPE_IDS = new Set(["water", "foam", "water-mist", "wet-chemical"]);

// BS EN 3-7 colour coding per agent — used for stacked icons on the plan
const AGENT_COLOURS: Record<string, { body: string; head: string; label: string }> = {
  water:          { body: "#EF4444", head: "#991B1B", label: "W" },
  foam:           { body: "#F59E0B", head: "#92400E", label: "F" },
  "water-mist":   { body: "#F8FAFC", head: "#94A3B8", label: "WM" },
  "wet-chemical": { body: "#EAB308", head: "#854D0E", label: "WC" },
  co2:            { body: "#374151", head: "#0F172A", label: "CO2" },
  "powder-abc":   { body: "#3B82F6", head: "#1E3A8A", label: "P" },
  "class-d":      { body: "#6366F1", head: "#3730A3", label: "D" },
};

interface FirePointComposition {
  label: string;
  agents: { typeId: string; label: string; body: string; head: string }[];
  compositionTag: string;
  isSpecialist: boolean;
}

function buildFirePointComposition(
  requiredTypes: { typeId: string; quantity: number }[],
  floorArea: number
): FirePointComposition[] {
  const classAUnits: string[] = [];
  const co2Units: string[] = [];
  const powderUnits: string[] = [];
  let classDPresent = false;

  for (const t of requiredTypes) {
    if (t.typeId === "class-d") { classDPresent = true; continue; }
    if (CLASS_A_TYPE_IDS.has(t.typeId)) {
      for (let i = 0; i < t.quantity; i++) classAUnits.push(t.typeId);
    } else if (t.typeId === "co2") {
      for (let i = 0; i < t.quantity; i++) co2Units.push(t.typeId);
    } else if (t.typeId === "powder-abc") {
      for (let i = 0; i < t.quantity; i++) powderUnits.push(t.typeId);
    }
  }

  const totalUnits = classAUnits.length + co2Units.length + powderUnits.length + (classDPresent ? 1 : 0);
  if (totalUnits === 0) return [];

  // Primary fire point count = one per Class A unit. If there's no Class A
  // requirement, fall back to the count of CO2/powder stations.
  let primaryCount = classAUnits.length || (co2Units.length + powderUnits.length);
  // BS 5306-8:2023 min 2 extinguishers per storey, except small premises (≤100m²).
  const minFP = floorArea > 100 ? 2 : 1;
  primaryCount = Math.max(minFP, primaryCount);

  const points: FirePointComposition[] = [];
  for (let i = 0; i < primaryCount; i++) {
    const agents: FirePointComposition["agents"] = [];
    const pickAgent = (typeId: string | undefined) => {
      if (!typeId) return;
      const col = AGENT_COLOURS[typeId];
      if (col) agents.push({ typeId, ...col });
    };
    pickAgent(classAUnits[i]);
    pickAgent(co2Units[i]);
    pickAgent(powderUnits[i]);
    const compositionTag = agents.length > 0 ? agents.map(a => a.label).join("+") : "--";
    points.push({ label: `FP${i + 1}`, agents, compositionTag, isSpecialist: false });
  }

  if (classDPresent) {
    const col = AGENT_COLOURS["class-d"];
    points.push({
      label: `FP${points.length + 1}`,
      agents: col ? [{ typeId: "class-d", ...col }] : [],
      compositionTag: "D (Metal)",
      isSpecialist: true,
    });
  }

  return points;
}

function SitingCoverageDiagram({
  floorArea,
  requiredTypes,
  travelDistance,
}: {
  floorArea: number;
  requiredTypes: { typeId: string; quantity: number }[];
  travelDistance: number;
}) {
  const W = 700, H = 440;
  const PAD = { top: 55, right: 50, bottom: 65, left: 60 };
  const planW = W - PAD.left - PAD.right;
  const planH = H - PAD.top - PAD.bottom;

  // Floor dimensions — sensible aspect ratio
  const rawAspect = Math.min(2.2, Math.max(1.2, 1 + floorArea / 800));
  const realW = Math.round(Math.sqrt(floorArea * rawAspect));
  const realH = Math.max(4, Math.round(floorArea / realW));

  // Scale to fit plan area with margin
  const scaleX = planW / realW;
  const scaleY = planH / realH;
  const scale = Math.min(scaleX, scaleY) * 0.92;
  const drawW = realW * scale;
  const drawH = realH * scale;
  const ox = PAD.left + (planW - drawW) / 2;
  const oy = PAD.top + (planH - drawH) / 2;

  // Metres to pixels
  const m2px = (m: number) => m * scale;

  // Grid spacing — adaptive: 2m for small, 5m for medium, 10m for large
  const gridM = realW <= 15 ? 2 : realW <= 40 ? 5 : 10;
  const gridPx = m2px(gridM);

  // Build fire point compositions (BS 5306-8:2023 grouping rule)
  const firePoints = buildFirePointComposition(requiredTypes, floorArea);
  const n = firePoints.length;

  // Empty state — no extinguishers yet specified
  if (n === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 500 }}>
        <rect x={0} y={0} width={W} height={H} fill="#FAFBFC" rx={4} />
        <text x={W / 2} y={H / 2 - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1F2937">FIRE EXTINGUISHER SITING PLAN</text>
        <text x={W / 2} y={H / 2 + 14} textAnchor="middle" fontSize={10} fill="#6B7280">Add fire risks to generate a siting plan</text>
      </svg>
    );
  }

  // Place fire points — spacing driven by the governing BS 5306-8:2023 metric
  // (max travel distance to the nearest extinguisher), not arbitrary insets.
  // Each point sits at the centre of an equal-area grid cell so coverage
  // circles naturally blanket the floor with honest overlap. Short rows are
  // spread across the full width (staggered vs the row above), which reduces
  // corner reach distances compared with centre-aligned short rows.
  const positions: { x: number; y: number; row: number; col: number; realX: number; realY: number; fp: FirePointComposition }[] = [];

  // Choose cols/rows to match the floor aspect ratio
  const layoutCols = n === 1 ? 1 : Math.min(n, Math.max(1, Math.round(Math.sqrt(n * realW / realH))));
  const layoutRows = Math.ceil(n / layoutCols);
  const cellHpx = drawH / layoutRows;
  const cellHm = realH / layoutRows;

  {
    let idx = 0;
    for (let r = 0; r < layoutRows && idx < n; r++) {
      const colsInRow = Math.min(layoutCols, n - idx);
      const rowCellWpx = drawW / colsInRow;
      const rowCellWm = realW / colsInRow;
      for (let c = 0; c < colsInRow && idx < n; c++) {
        const px = ox + rowCellWpx * (c + 0.5);
        const py = layoutRows === 1 ? oy + drawH / 2 : oy + cellHpx * (r + 0.5);
        const rx = rowCellWm * (c + 0.5);
        const ry = layoutRows === 1 ? realH / 2 : cellHm * (r + 0.5);
        positions.push({ x: px, y: py, row: r, col: c, realX: rx, realY: ry, fp: firePoints[idx] });
        idx++;
      }
    }
  }

  // Actual max reach — distance from the worst-case floor point to its nearest
  // fire point. Sampled on a 20×20 grid; this is the compliance metric that
  // must stay ≤ travelDistance per BS 5306-8:2023.
  let maxReachM = 0;
  const SAMPLES = 20;
  for (let i = 0; i <= SAMPLES; i++) {
    for (let j = 0; j <= SAMPLES; j++) {
      const sx = (realW * i) / SAMPLES;
      const sy = (realH * j) / SAMPLES;
      let minDist = Infinity;
      for (const p of positions) {
        const d = Math.hypot(sx - p.realX, sy - p.realY);
        if (d < minDist) minDist = d;
      }
      if (minDist > maxReachM) maxReachM = minDist;
    }
  }
  const isCompliant = maxReachM <= travelDistance;

  // Coverage radius — let circles extend naturally; overlap demonstrates compliance
  const coverR = m2px(Math.min(travelDistance, 30));

  // Exits integrated into walls
  const exitW = m2px(Math.max(1.2, realW * 0.06));
  const exits = [
    { x: ox, y: oy + drawH * 0.7, side: "left" as const },
    { x: ox + drawW, y: oy + drawH * 0.15, side: "right" as const },
  ];

  // Badge sizing — width grows with the number of agents at each point
  const iconW = 7;
  const iconH = 10;
  const iconGap = 2;
  const badgePadX = 5;
  const badgePadY = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 500 }}>
      {/* Background */}
      <rect x={0} y={0} width={W} height={H} fill="#FAFBFC" rx={4} />

      {/* Title block */}
      <text x={W / 2} y={20} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1F2937">FIRE EXTINGUISHER SITING PLAN</text>
      <text x={W / 2} y={35} textAnchor="middle" fontSize={9} fill="#6B7280">
        {Math.round(floorArea)}m2 floor area | {firePoints.length} fire point{firePoints.length !== 1 ? "s" : ""} | Max {travelDistance}m travel distance | BS 5306-8:2023
      </text>
      <line x1={PAD.left} y1={44} x2={W - PAD.right} y2={44} stroke="#D1D5DB" strokeWidth={0.5} />

      {/* Shared defs — clip region and tick marker */}
      <defs>
        <clipPath id="floorClip"><rect x={ox} y={oy} width={drawW} height={drawH} /></clipPath>
        <marker id="dimTick" markerWidth="1" markerHeight="6" refX="0.5" refY="3" orient="auto"><line x1="0.5" y1="0" x2="0.5" y2="6" stroke="#64748B" strokeWidth="1" /></marker>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: Math.floor(realW / gridM) + 1 }).map((_, i) => {
        const gx = ox + i * gridPx;
        if (gx > ox + drawW + 0.5) return null;
        return <line key={`gx-${i}`} x1={gx} y1={oy} x2={gx} y2={oy + drawH} stroke="#CBD5E1" strokeWidth={0.5} />;
      })}
      {Array.from({ length: Math.floor(realH / gridM) + 1 }).map((_, i) => {
        const gy = oy + i * gridPx;
        if (gy > oy + drawH + 0.5) return null;
        return <line key={`gy-${i}`} x1={ox} y1={gy} x2={ox + drawW} y2={gy} stroke="#CBD5E1" strokeWidth={0.5} />;
      })}

      {/* Floor outline — thick wall */}
      <rect x={ox} y={oy} width={drawW} height={drawH} rx={1} fill="#F8FAFC" stroke="#374151" strokeWidth={3} />
      {/* Inner wall line */}
      <rect x={ox + 3.5} y={oy + 3.5} width={drawW - 7} height={drawH - 7} rx={0} fill="none" stroke="#94A3B8" strokeWidth={0.5} />

      {/* Coverage circles — clipped to floor; overlap demonstrates BS 5306-8 compliance */}
      <g clipPath="url(#floorClip)">
        {positions.map((p, i) => (
          <circle key={`cov-${i}`} cx={p.x} cy={p.y} r={coverR} fill="#1B5745" opacity={0.12} stroke="#1B5745" strokeWidth={1} strokeDasharray="6,4" />
        ))}
      </g>

      {/* Distance annotations — only between consecutive points within the same row */}
      {positions.map((p, i) => {
        const next = positions[i + 1];
        if (!next || next.row !== p.row) return null;
        const distM = Math.round(Math.sqrt(Math.pow(p.realX - next.realX, 2) + Math.pow(p.realY - next.realY, 2)));
        const mx = (p.x + next.x) / 2;
        const my = (p.y + next.y) / 2 - 26;
        return (
          <g key={`dist-${i}`}>
            <line x1={p.x} y1={p.y - 22} x2={next.x} y2={next.y - 22} stroke="#64748B" strokeWidth={0.8} strokeDasharray="4,3" markerStart="url(#dimTick)" markerEnd="url(#dimTick)" />
            <rect x={mx - 18} y={my - 5} width={36} height={12} rx={3} fill="white" stroke="#94A3B8" strokeWidth={0.6} />
            <text x={mx} y={my + 4} textAnchor="middle" fontSize={8} fontWeight={700} fill="#374151">{distM}m</text>
          </g>
        );
      })}

      {/* Fire point markers — stacked EN 3-7 icons; badge width grows with agent count */}
      {positions.map((p) => {
        const agents = p.fp.agents;
        const nAgents = Math.max(1, agents.length);
        const badgeW = nAgents * iconW + (nAgents - 1) * iconGap + badgePadX * 2;
        const badgeH = iconH + badgePadY * 2 + 3;
        const badgeX = p.x - badgeW / 2;
        const badgeY = p.y - badgeH / 2;
        const borderCol = p.fp.isSpecialist ? "#6366F1" : "#DC2626";
        const fillCol = p.fp.isSpecialist ? "#EEF2FF" : "#FEF2F2";
        return (
          <g key={p.fp.label}>
            {/* Shadow */}
            <rect x={badgeX + 1} y={badgeY + 1} width={badgeW} height={badgeH} rx={6} fill="#00000012" />
            {/* Outer badge */}
            <rect x={badgeX} y={badgeY} width={badgeW} height={badgeH} rx={6} fill="white" stroke={borderCol} strokeWidth={2.2} />
            {/* Inner fill */}
            <rect x={badgeX + 2} y={badgeY + 2} width={badgeW - 4} height={badgeH - 4} rx={5} fill={fillCol} />
            {/* Extinguisher icons — side by side, one per agent */}
            {agents.map((a, ai) => {
              const iconX = badgeX + badgePadX + ai * (iconW + iconGap);
              const iconY = badgeY + badgePadY + 3;
              const needsStroke = a.body === "#F8FAFC";
              return (
                <g key={`${p.fp.label}-${a.typeId}-${ai}`}>
                  <rect x={iconX + 1} y={iconY - 3} width={iconW - 2} height={3} rx={0.8} fill={a.head} />
                  <rect x={iconX} y={iconY} width={iconW} height={iconH} rx={1.5} fill={a.body} stroke={needsStroke ? "#CBD5E1" : "none"} strokeWidth={needsStroke ? 0.8 : 0} />
                </g>
              );
            })}
            {/* Label — FP id + composition tag */}
            <rect x={p.x - 26} y={badgeY + badgeH + 3} width={52} height={13} rx={3} fill="#1E293B" />
            <text x={p.x} y={badgeY + badgeH + 12} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white">{p.fp.label} · {p.fp.compositionTag}</text>
          </g>
        );
      })}

      {/* Exit markers — integrated into walls */}
      {exits.map((ex, i) => {
        const isLeft = ex.side === "left";
        const doorX = isLeft ? ox - 1.5 : ox + drawW - 1.5;
        return (
          <g key={`exit-${i}`}>
            <rect x={doorX} y={ex.y - exitW / 2} width={6} height={exitW} fill="#FAFBFC" stroke="none" />
            <path d={isLeft
              ? `M ${ox} ${ex.y - exitW / 2} A ${exitW} ${exitW} 0 0 0 ${ox - exitW * 0.7} ${ex.y}`
              : `M ${ox + drawW} ${ex.y - exitW / 2} A ${exitW} ${exitW} 0 0 1 ${ox + drawW + exitW * 0.7} ${ex.y}`
            } fill="none" stroke="#16A34A" strokeWidth={1} strokeDasharray="3,2" />
            <line x1={isLeft ? ox : ox + drawW} y1={ex.y - exitW / 2} x2={isLeft ? ox - exitW * 0.65 : ox + drawW + exitW * 0.65} y2={ex.y - 1} stroke="#16A34A" strokeWidth={1.5} />
            <rect x={isLeft ? ox - 38 : ox + drawW + 8} y={ex.y - 7} width={28} height={14} rx={2} fill="#16A34A" />
            <text x={isLeft ? ox - 24 : ox + drawW + 22} y={ex.y + 3} textAnchor="middle" fontSize={7} fontWeight={700} fill="white">EXIT</text>
          </g>
        );
      })}

      {/* Dimension lines — bottom */}
      <line x1={ox} y1={oy + drawH + 16} x2={ox + drawW} y2={oy + drawH + 16} stroke="#374151" strokeWidth={1} markerStart="url(#dimTick)" markerEnd="url(#dimTick)" />
      <text x={ox + drawW / 2} y={oy + drawH + 30} textAnchor="middle" fontSize={10} fontWeight={600} fill="#374151">{realW}m</text>

      {/* Dimension lines — left */}
      <line x1={ox - 16} y1={oy} x2={ox - 16} y2={oy + drawH} stroke="#374151" strokeWidth={1} markerStart="url(#dimTick)" markerEnd="url(#dimTick)" />
      <text x={ox - 28} y={oy + drawH / 2} textAnchor="middle" fontSize={10} fontWeight={600} fill="#374151" transform={`rotate(-90, ${ox - 28}, ${oy + drawH / 2})`}>{realH}m</text>

      {/* Legend bar — BS EN 3-7 agent colour key + coverage note */}
      <rect x={PAD.left - 5} y={H - 50} width={W - PAD.left - PAD.right + 10} height={40} rx={5} fill="#F1F5F9" stroke="#E2E8F0" strokeWidth={0.5} />
      {[
        { label: "Water", body: "#EF4444" },
        { label: "Foam", body: "#F59E0B" },
        { label: "CO2", body: "#374151" },
        { label: "Powder", body: "#3B82F6" },
        { label: "Wet Chem", body: "#EAB308" },
        { label: "Class D", body: "#6366F1" },
      ].map((item, i) => {
        const lx = PAD.left + 5 + i * 95;
        return (
          <g key={item.label}>
            <rect x={lx} y={H - 41} width={6} height={10} rx={1} fill={item.body} stroke="#94A3B8" strokeWidth={0.4} />
            <text x={lx + 12} y={H - 33} fontSize={8.5} fill="#374151" fontWeight={600}>{item.label}</text>
          </g>
        );
      })}
      <text x={PAD.left + 5} y={H - 18} fontSize={8} fill="#64748B">Green dashed circles show {travelDistance}m travel distance. Fire points may host multiple agents (e.g. W+CO2) per BS 5306-8:2023 clause 5.</text>
      <text x={PAD.left + 5} y={H - 8} fontSize={8} fontWeight={700} fill={isCompliant ? "#16A34A" : "#DC2626"}>
        Max reach to nearest FP: {maxReachM.toFixed(1)}m {isCompliant ? "≤" : ">"} {travelDistance}m limit {isCompliant ? "✓ COMPLIANT" : "✗ NON-COMPLIANT — add fire points"}
      </text>
      <text x={W - PAD.right + 5} y={H - 8} textAnchor="end" fontSize={8} fill="#9CA3AF">NTS -- indicative layout only | Grid: {gridM}m</text>
    </svg>
  );
}

// ─── SVG: Extinguisher Type Distribution Donut ───────────────────
function TypeDistributionChart({ result }: { result: SelectorResult }) {
  const counts: { type: string; qty: number; hex: string }[] = [];
  for (const area of result.areas) {
    for (const rec of area.requiredTypes) {
      const existing = counts.find(c => c.type === rec.typeName);
      if (existing) existing.qty += rec.quantity;
      else counts.push({ type: rec.typeName, qty: rec.quantity, hex: rec.bandHex });
    }
  }
  if (counts.length === 0) return null;

  const total = counts.reduce((s, c) => s + c.qty, 0);
  const W = 700, H = 320;
  const cx = 170, cy = 160, r = 120, ir = 68;
  let startAngle = -Math.PI / 2;

  const COLORS = ["#EF4444", "#374151", "#3B82F6", "#EAB308", "#6366F1", "#F1F5F9", "#F97316"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 380 }}>
      {/* Donut segments */}
      {counts.map((c, i) => {
        const angle = (c.qty / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        const largeArc = angle > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + ir * Math.cos(startAngle), iy1 = cy + ir * Math.sin(startAngle);
        const ix2 = cx + ir * Math.cos(endAngle), iy2 = cy + ir * Math.sin(endAngle);
        const color = COLORS[i % COLORS.length];
        const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
        startAngle = endAngle;
        return <path key={i} d={path} fill={color} stroke="#fff" strokeWidth={3} opacity={0.9} />;
      })}

      {/* Centre label */}
      <circle cx={cx} cy={cy} r={ir - 6} fill="#F9FAFB" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={32} fontWeight={800} fill="#1F2937">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fontWeight={500} fill="#6B7280">Total Units</text>

      {/* Right-side legend */}
      <line x1={340} y1={30} x2={340} y2={H - 30} stroke="#E5E7EB" strokeWidth={1} />
      <text x={370} y={40} fontSize={11} fontWeight={700} fill="#374151" letterSpacing={1}>EXTINGUISHER TYPES</text>

      {counts.map((c, i) => {
        const ly = 70 + i * 50;
        const pct = Math.round(c.qty / total * 100);
        const color = COLORS[i % COLORS.length];
        return (
          <g key={i}>
            {/* Colour swatch */}
            <rect x={370} y={ly - 2} width={18} height={18} rx={4} fill={color} opacity={0.9} />
            {/* Type name + qty */}
            <text x={398} y={ly + 5} fontSize={13} fontWeight={700} fill="#1F2937">{c.type}</text>
            <text x={398} y={ly + 18} fontSize={10} fill="#6B7280">{c.qty} unit{c.qty > 1 ? "s" : ""}</text>
            {/* Percentage bar */}
            <rect x={540} y={ly} width={120} height={14} rx={3} fill="#F3F4F6" />
            <rect x={540} y={ly} width={Math.max(4, 120 * pct / 100)} height={14} rx={3} fill={color} opacity={0.7} />
            <text x={545 + Math.max(4, 120 * pct / 100) + 4} y={ly + 10} fontSize={10} fontWeight={600} fill="#6B7280">{pct}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── PDF Export ──────────────────────────────────────────────────
async function exportPDF(
  header: { company: string; site: string; manager: string; assessedBy: string; date: string },
  premisesType: string,
  areas: AssessmentArea[],
  result: SelectorResult
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 12, CW = W - M * 2;
  let y = 0;

  const docRef = `FES-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const premises = PREMISES_TYPES.find(p => p.id === premisesType);

  // checkPage helper
  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("FIRE EXTINGUISHER SELECTOR (continued)", M, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // drawFld helper
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };

  // ── Dark Header Bar ──
  doc.setFillColor(30, 30, 30); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("Fire Extinguisher Selector", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`Premises: ${premises?.label || "Custom"} | Areas: ${areas.length} | Total: ${result.totalExtinguishers} extinguisher${result.totalExtinguishers !== 1 ? "s" : ""}`, M, 18);
  doc.setFontSize(7);
  doc.text(`BS 5306-8:2023 | RRFSO 2005 | BS EN 3 | Ref: ${docRef}`, M, 23);
  doc.setTextColor(0, 0, 0); y = 34;

  // ── Site Info Panel ──
  const halfW = CW / 2;
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 20, 1, 1, "FD");
  doc.setFontSize(8);
  drawFld("Company:", header.company, M + 3, y + 1, 50);
  drawFld("Site:", header.site, M + halfW, y + 1, 50);
  y += 5;
  drawFld("Site Manager:", header.manager, M + 3, y + 1, 40);
  drawFld("Assessed By:", header.assessedBy, M + halfW, y + 1, 40);
  y += 5;
  drawFld("Date:", header.date || todayISO(), M + 3, y + 1, 30);
  drawFld("Fire Classes:", result.overallFireClasses.join(", "), M + halfW, y + 1, 0);
  y += 10;

  // ── Scope ──
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Fire extinguisher selection and siting assessment for ${header.site || "the above site"}. Premises type: ${premises?.label || "Custom"}. ${areas.length} area(s) assessed covering ${areas.reduce((s, a) => s + a.floorArea, 0)}m2 total floor area. Fire classes identified: ${result.overallFireClasses.join(", ")}. Assessment per BS 5306-8:2023 and RRFSO 2005.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  // ── Result Banner ──
  checkPage(22);
  const totalQty = result.totalExtinguishers;
  doc.setFillColor(27, 87, 69);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`${totalQty} Extinguisher${totalQty !== 1 ? "s" : ""} Required`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`${result.uniqueTypes.join(", ")} | ${areas.length} area${areas.length !== 1 ? "s" : ""} | ${premises?.riskLevel?.toUpperCase() || "NORMAL"} risk`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // ── Per-Area Schedule ──
  for (const areaResult of result.areas) {
    checkPage(35);
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(27, 87, 69);
    doc.text(areaResult.areaName, M, y); y += 2;
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(`${areaResult.floorArea}m2 | Fire classes: ${areaResult.fireClasses.join(", ")} | ${areaResult.totalExtinguishers} extinguisher${areaResult.totalExtinguishers !== 1 ? "s" : ""}`, M, y + 3);
    doc.setTextColor(0, 0, 0); y += 7;

    // Table header
    const cols = [50, 22, 30, 16, CW - 50 - 22 - 30 - 16];
    let cx = M;
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    ["Type", "Size", "Fire Rating", "Qty", "Reason"].forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.text(h, cx + 2, y + 4);
      cx += cols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);

    // Data rows
    areaResult.requiredTypes.forEach((rec, ri) => {
      checkPage(6);
      cx = M;
      const cells = [rec.typeName, rec.size, rec.fireRating, String(rec.quantity), rec.reason];
      cells.forEach((t, i) => {
        if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
        else { doc.rect(cx, y, cols[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(6);
        const maxW = cols[i] - 4;
        const lines = doc.splitTextToSize(t, maxW);
        doc.text(lines[0] || "", cx + 2, y + 3.5);
        cx += cols[i];
      });
      y += 5.5;
    });

    // Siting notes
    if (areaResult.sitingNotes.length > 0) {
      checkPage(10);
      doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
      for (const note of areaResult.sitingNotes) {
        const lines = doc.splitTextToSize(`- ${note}`, CW);
        doc.text(lines, M + 2, y + 2); y += lines.length * 2.5;
      }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
    }
    y += 4;
  }

  // ── Suitability Matrix Table ──
  checkPage(50);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Extinguisher Suitability Matrix", M, y); y += 5;

  const matCols = [40, ...FIRE_CLASSES.map(() => (CW - 40) / FIRE_CLASSES.length)];
  let mcx = M;
  doc.setFontSize(6); doc.setFont("helvetica", "bold");
  ["Type", ...FIRE_CLASSES.map(fc => FIRE_CLASS_DETAILS[fc].label)].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(mcx, y, matCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.text(h, mcx + 2, y + 4);
    mcx += matCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  EXTINGUISHER_TYPES.forEach((ext, ri) => {
    checkPage(6);
    mcx = M;
    // Type name cell
    if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(mcx, y, matCols[0], 5.5, "FD"); }
    else { doc.rect(mcx, y, matCols[0], 5.5, "D"); }
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
    doc.text(ext.type, mcx + 2, y + 3.5);
    mcx += matCols[0];

    // Suitability cells
    FIRE_CLASSES.forEach((fc, ci) => {
      const suit = ext.suitability[fc];
      if (suit === "suitable") doc.setFillColor(220, 252, 231);
      else if (suit === "limited") doc.setFillColor(254, 249, 195);
      else if (suit === "danger") doc.setFillColor(254, 226, 226);
      else doc.setFillColor(249, 250, 251);
      doc.rect(mcx, y, matCols[ci + 1], 5.5, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
      const label = suit === "suitable" ? "[YES]" : suit === "limited" ? "[LTD]" : suit === "danger" ? "[!!!]" : "[NO]";
      doc.text(label, mcx + matCols[ci + 1] / 2, y + 3.5, { align: "center" });
      mcx += matCols[ci + 1];
    });
    y += 5.5;
  });
  y += 4;

  // ── Siting Rules ──
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Siting Requirements (BS 5306-8)", M, y); y += 5;
  doc.setFontSize(6); doc.setFont("helvetica", "normal");
  for (const rule of SITING_RULES.slice(0, 8)) {
    checkPage(8);
    doc.setFont("helvetica", "bold"); doc.text(`- ${rule.rule}`, M + 2, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    const detLines = doc.splitTextToSize(rule.details, CW - 6);
    doc.text(detLines, M + 4, y + 3);
    doc.setTextColor(0, 0, 0);
    y += 3 + detLines.length * 2.5 + 1;
  }
  y += 2;

  // ── Signage Requirements ──
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Signage Requirements (BS 5499-1 / BS 5306-8)", M, y); y += 5;

  const sigCols = [45, 35, CW - 45 - 35 - 35, 35];
  mcx = M;
  ["Sign Type", "Standard", "Description", "Min Size"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(mcx, y, sigCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold");
    doc.text(h, mcx + 2, y + 4);
    mcx += sigCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  SIGNAGE_REQUIREMENTS.forEach((sig, ri) => {
    checkPage(8);
    mcx = M;
    const cells = [sig.type, sig.standard, sig.description, sig.minSize];
    const rowH = 7;
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(mcx, y, sigCols[i], rowH, "FD"); }
      else { doc.rect(mcx, y, sigCols[i], rowH, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5.5);
      const lines = doc.splitTextToSize(t, sigCols[i] - 3);
      doc.text(lines[0] || "", mcx + 1.5, y + 3);
      if (lines[1]) doc.text(lines[1], mcx + 1.5, y + 5.5);
      mcx += sigCols[i];
    });
    y += rowH;
  });
  y += 4;

  // ── Inspection Schedule ──
  checkPage(40);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Inspection & Maintenance Schedule (BS 5306-3)", M, y); y += 5;

  const insCols = [28, 55, 28, CW - 28 - 55 - 28];
  mcx = M;
  ["Frequency", "Task", "By Whom", "Details"].forEach((h, i) => {
    doc.setFillColor(30, 30, 30); doc.rect(mcx, y, insCols[i], 6, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold");
    doc.text(h, mcx + 2, y + 4);
    mcx += insCols[i];
  });
  doc.setTextColor(0, 0, 0); y += 6;
  doc.setDrawColor(200, 200, 200);

  INSPECTION_SCHEDULE.forEach((ins, ri) => {
    checkPage(10);
    mcx = M;
    const cells = [ins.frequency, ins.task, ins.who, ins.details];
    const rowH = 9;
    cells.forEach((t, i) => {
      if (ri % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(mcx, y, insCols[i], rowH, "FD"); }
      else { doc.rect(mcx, y, insCols[i], rowH, "D"); }
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(5);
      const lines = doc.splitTextToSize(t, insCols[i] - 3);
      lines.slice(0, 3).forEach((line: string, li: number) => {
        doc.text(line, mcx + 1.5, y + 3 + li * 2.2);
      });
      mcx += insCols[i];
    });
    y += rowH;
  });
  y += 4;

  // ── Regulatory References ──
  checkPage(25);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Regulatory References", M, y); y += 5;
  doc.setFontSize(6);
  for (const reg of REGULATORY_REFS) {
    checkPage(7);
    doc.setFont("helvetica", "bold"); doc.text(reg.ref, M + 2, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(`${reg.title} -- ${reg.relevance}`, CW - 6);
    doc.text(lines, M + 4, y + 3);
    doc.setTextColor(0, 0, 0);
    y += 3 + lines.length * 2.5 + 1;
  }
  y += 4;

  // ── Cross References ──
  checkPage(12);
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(27, 87, 69);
  doc.text("Related Ebrora Tools:", M, y);
  doc.setFont("helvetica", "normal");
  doc.text("- Fire Risk Score Calculator -- use alongside this tool to assess overall fire risk for site areas", M + 2, y + 4);
  doc.setTextColor(0, 0, 0);
  y += 10;

  // ── Sign-Off Section ──
  checkPage(50);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Sign-Off", M, y); y += 5;

  const soW = CW / 2 - 2; const soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Assessed By", M + 3, y + 5.5); doc.text("Site Manager", M + soW + 7, y + 5.5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130); doc.setFont("helvetica", "normal");
    doc.text("This assessment is decision-support guidance per BS 5306-8:2023. It does not replace a site-specific fire risk assessment by a competent person.", M, 290);
    doc.text(`Ref: ${docRef} | Rev 0 | ${header.date || todayISO()}`, M, 293);
    doc.text(`Page ${i} of ${totalPages}`, W - M, 293, { align: "right" });
  }

  doc.save(`Fire-Extinguisher-Selector-${docRef}.pdf`);
}

// ─── Main Component ─────────────────────────────────────────────
export default function FireExtinguisherSelectorClient() {
  // Settings state (paid layout: 5 cols)
  const [showSettings, setShowSettings] = useState(false);
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [assessedBy, setAssessedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [exporting, setExporting] = useState(false);

  // Premises
  const [premisesType, setPremisesType] = useState("construction");
  const premises = PREMISES_TYPES.find(p => p.id === premisesType)!;

  // Areas/floors
  const [areas, setAreas] = useState<AssessmentArea[]>([
    { id: uid(), name: "Ground Floor", floorArea: 200, risks: [...(PREMISES_TYPES.find(p => p.id === "construction")?.defaultRisks || [])], travelDistance: 30 },
  ]);

  // Expanded sections
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({ [areas[0]?.id]: true });
  const [showComparison, setShowComparison] = useState(true);
  const [showSiting, setShowSiting] = useState(true);
  const [showSignage, setShowSignage] = useState(false);
  const [showInspection, setShowInspection] = useState(false);
  const [showRegs, setShowRegs] = useState(false);

  // Calculate result
  const result = useMemo(() => {
    const validAreas = areas.filter(a => a.floorArea > 0 && a.risks.length > 0);
    if (validAreas.length === 0) return null;
    return calculateFullResult(validAreas, premises.riskLevel);
  }, [areas, premises.riskLevel]);

  // Handle premises change
  const handlePremisesChange = useCallback((newType: string) => {
    setPremisesType(newType);
    const newPremises = PREMISES_TYPES.find(p => p.id === newType);
    if (newPremises) {
      setAreas(prev => prev.map(a => ({ ...a, risks: [...newPremises.defaultRisks] })));
    }
  }, []);

  // Area management
  const addArea = useCallback(() => {
    const newId = uid();
    const num = areas.length + 1;
    const defaultName = num === 1 ? "Ground Floor" : num === 2 ? "First Floor" : num === 3 ? "Second Floor" : `Floor ${num - 1}`;
    setAreas(prev => [...prev, { id: newId, name: defaultName, floorArea: 100, risks: [...premises.defaultRisks], travelDistance: 30 }]);
    setExpandedAreas(prev => ({ ...prev, [newId]: true }));
  }, [areas.length, premises.defaultRisks]);

  const removeArea = useCallback((id: string) => {
    setAreas(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateArea = useCallback((id: string, field: keyof AssessmentArea, value: unknown) => {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  }, []);

  const toggleRisk = useCallback((areaId: string, riskId: string) => {
    setAreas(prev => prev.map(a => {
      if (a.id !== areaId) return a;
      const risks = a.risks.includes(riskId) ? a.risks.filter(r => r !== riskId) : [...a.risks, riskId];
      return { ...a, risks };
    }));
  }, []);

  const handleExport = useCallback(async () => {
    if (!result) return;
    setExporting(true);
    try { await exportPDF({ company, site, manager, assessedBy, date: assessDate }, premisesType, areas, result); }
    finally { setExporting(false); }
  }, [company, site, manager, assessedBy, assessDate, premisesType, areas, result]);

  const clearAll = useCallback(() => {
    setPremisesType("construction");
    const defaults = PREMISES_TYPES.find(p => p.id === "construction")!;
    const newId = uid();
    setAreas([{ id: newId, name: "Ground Floor", floorArea: 200, risks: [...defaults.defaultRisks], travelDistance: 30 }]);
    setExpandedAreas({ [newId]: true });
    setCompany(""); setSite(""); setManager(""); setAssessedBy(""); setAssessDate(todayISO());
  }, []);

  const totalArea = areas.reduce((s, a) => s + a.floorArea, 0);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Extinguishers", value: result ? String(result.totalExtinguishers) : "0", sub: result ? `${result.uniqueTypes.length} type${result.uniqueTypes.length !== 1 ? "s" : ""}` : "Configure areas below", bgClass: "bg-red-50", textClass: "text-red-800", borderClass: "border-red-200", dotClass: "bg-red-500" },
          { label: "Fire Classes", value: result ? result.overallFireClasses.join(", ") : "--", sub: result ? `${result.overallFireClasses.length} class${result.overallFireClasses.length !== 1 ? "es" : ""} identified` : "No risks selected", bgClass: "bg-orange-50", textClass: "text-orange-800", borderClass: "border-orange-200", dotClass: "bg-orange-500" },
          { label: "Areas Assessed", value: String(areas.length), sub: `${totalArea}m2 total floor area`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "Risk Level", value: premises.riskLevel.toUpperCase(), sub: premises.label, bgClass: premises.riskLevel === "high" ? "bg-red-50" : premises.riskLevel === "normal" ? "bg-amber-50" : "bg-emerald-50", textClass: premises.riskLevel === "high" ? "text-red-800" : premises.riskLevel === "normal" ? "text-amber-800" : "text-emerald-800", borderClass: premises.riskLevel === "high" ? "border-red-200" : premises.riskLevel === "normal" ? "border-amber-200" : "border-emerald-200", dotClass: premises.riskLevel === "high" ? "bg-red-500" : premises.riskLevel === "normal" ? "bg-amber-500" : "bg-emerald-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} /><span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span></div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Settings
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={!result || exporting} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", result ? "text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid" : "text-gray-400 bg-gray-100 cursor-not-allowed")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating..." : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* ── Settings Panel (5-col paid layout) ────────────────── */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[{ l: "Company", v: company, s: setCompany }, { l: "Site", v: site, s: setSite }, { l: "Site Manager", v: manager, s: setManager }, { l: "Assessed By", v: assessedBy, s: setAssessedBy }].map(f => (
            <div key={f.l}><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
          ))}
          <div><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" /></div>
        </div>
      )}

      {/* ── Premises Type ─────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-xl p-4">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Premises Type</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {PREMISES_TYPES.map(p => (
            <button key={p.id} onClick={() => handlePremisesChange(p.id)}
              className={cn(
                "text-left px-3 py-2.5 rounded-lg text-sm border transition-all",
                premisesType === p.id
                  ? "border-ebrora/30 bg-ebrora-light/40 text-ebrora font-medium"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              )}>
              <div className="font-medium text-xs">{p.label}</div>
              <div className={cn("text-[10px] mt-0.5", premisesType === p.id ? "text-ebrora/70" : "text-gray-400")}>
                {p.riskLevel.charAt(0).toUpperCase() + p.riskLevel.slice(1)} risk
              </div>
            </button>
          ))}
        </div>
        {premises.notes && (
          <div className="mt-3 text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {premises.notes}
          </div>
        )}
      </div>

      {/* ── Areas / Floors ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Areas / Floors</div>
          <button onClick={addArea} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-ebrora bg-ebrora-light/60 rounded-lg hover:bg-ebrora-light transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Area
          </button>
        </div>

        {areas.map((area, ai) => {
          const expanded = !!expandedAreas[area.id];
          return (
            <div key={area.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Area header */}
              <button onClick={() => setExpandedAreas(prev => ({ ...prev, [area.id]: !prev[area.id] }))}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <svg className={cn("w-4 h-4 text-gray-400 transition-transform", expanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                <span className="text-sm font-medium text-gray-800 flex-1">{area.name}</span>
                <span className="text-[10px] text-gray-400">{area.floorArea}m2 | {area.risks.length} risk{area.risks.length !== 1 ? "s" : ""}</span>
                {areas.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); removeArea(area.id); }}
                    className="text-red-400 hover:text-red-600 transition-colors p-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </button>

              {expanded && (
                <div className="p-4 space-y-4">
                  {/* Area details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Area Name</label>
                      <input type="text" value={area.name} onChange={e => updateArea(area.id, "name", e.target.value)}
                        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Floor Area (m2)</label>
                      <input type="number" min={1} value={area.floorArea} onChange={e => updateArea(area.id, "floorArea", Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Max Travel Distance (m)</label>
                      <input type="number" min={5} max={60} value={area.travelDistance} onChange={e => updateArea(area.id, "travelDistance", Math.max(5, Math.min(60, parseInt(e.target.value) || 30)))}
                        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
                      {area.travelDistance > 30 && (
                        <p className="text-[10px] text-red-500 mt-0.5">Exceeds BS 5306-8:2023 Class A/C max 30m</p>
                      )}
                      {area.travelDistance > 10 && area.travelDistance <= 30 && area.risks.some(r => {
                        const risk = FIRE_RISKS.find(fr => fr.id === r);
                        return risk?.fireClasses.some(fc => fc === "B" || fc === "F" || fc === "ELECTRICAL");
                      }) && (
                        <p className="text-[10px] text-amber-600 mt-0.5">Exceeds BS 5306-8:2023 max 10m for Class B/F/electrical fires present in this area</p>
                      )}
                    </div>
                  </div>

                  {/* Fire risks */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Fire Risks Present</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {FIRE_RISKS.map(risk => {
                        const active = area.risks.includes(risk.id);
                        return (
                          <button key={risk.id} onClick={() => toggleRisk(area.id, risk.id)}
                            className={cn(
                              "flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-all border",
                              active
                                ? "border-ebrora/30 bg-ebrora-light/30"
                                : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                            )}>
                            <div className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors",
                              active ? "border-ebrora bg-ebrora" : "border-gray-300 bg-white"
                            )}>
                              {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn("text-xs font-medium", active ? "text-ebrora-dark" : "text-gray-700")}>{risk.label}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{risk.description}</div>
                              <div className="flex gap-1 mt-1">
                                {risk.fireClasses.map(fc => (
                                  <span key={fc} className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: FIRE_CLASS_DETAILS[fc].bgColor, color: FIRE_CLASS_DETAILS[fc].color }}>
                                    {FIRE_CLASS_DETAILS[fc].label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Results ───────────────────────────────────────────── */}
      {!result && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
          <p className="text-sm text-gray-400">Select fire risks above to see extinguisher recommendations.</p>
        </div>
      )}

      {result && (
        <>
          {/* Per-area recommendations */}
          <div className="space-y-4">
            {result.areas.map(areaResult => (
              <div key={areaResult.areaId} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-800">{areaResult.areaName}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{areaResult.floorArea}m2 | Classes: {areaResult.fireClasses.join(", ")} | {areaResult.totalExtinguishers} extinguisher{areaResult.totalExtinguishers !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="text-2xl font-bold text-red-700">{areaResult.totalExtinguishers}</div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {areaResult.requiredTypes.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      {/* Colour band */}
                      <div className="w-8 h-12 rounded flex-shrink-0 border border-gray-200 overflow-hidden">
                        <div className="w-full h-3 bg-red-600" />
                        <div className="w-full flex-1" style={{ backgroundColor: rec.bandHex, height: 24 }} />
                        <div className="w-full h-3 bg-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-gray-800">{rec.typeName}</span>
                          <span className="text-xs text-gray-500">{rec.size}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">x{rec.quantity}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Fire rating: {rec.fireRating}</div>
                        <div className="text-xs text-gray-600 mt-1">{rec.reason}</div>
                      </div>
                    </div>
                  ))}

                  {/* Siting notes */}
                  {areaResult.sitingNotes.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-1">Siting Notes</div>
                      {areaResult.sitingNotes.map((note, i) => (
                        <div key={i} className="text-xs text-amber-700 mt-1">- {note}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Distribution Chart */}
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-4">Type Distribution</div>
            <TypeDistributionChart result={result} />
          </div>

          {/* Siting Plan */}
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-4">Siting Coverage Plan</div>
            <SitingCoverageDiagram
              floorArea={totalArea}
              requiredTypes={result.areas.flatMap(a => a.requiredTypes.map(r => ({ typeId: r.typeId, quantity: r.quantity })))}
              travelDistance={areas[0]?.travelDistance || 30}
            />
          </div>

          {/* Suitability Matrix SVG */}
          <div className="border border-gray-200 rounded-xl p-4">
            <button onClick={() => setShowComparison(!showComparison)} className="w-full flex items-center gap-2 text-left">
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showComparison && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Suitability Comparison Matrix</span>
            </button>
            {showComparison && (
              <div className="mt-3">
                <ExtinguisherBandDiagram />
                {/* Detailed table below SVG */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="px-2 py-2 text-left font-bold rounded-tl-lg">Type</th>
                        {FIRE_CLASSES.map(fc => (
                          <th key={fc} className="px-2 py-2 text-center font-bold" style={{ color: FIRE_CLASS_DETAILS[fc].color === "#16A34A" ? "#A7F3D0" : FIRE_CLASS_DETAILS[fc].color === "#DC2626" ? "#FCA5A5" : "#E0E7FF" }}>
                            {FIRE_CLASS_DETAILS[fc].label}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-left font-bold rounded-tr-lg">Sizes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EXTINGUISHER_TYPES.map((ext, i) => (
                        <tr key={ext.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-2 py-2 font-bold text-gray-800">
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: ext.bandHex }} />
                              {ext.type}
                            </div>
                          </td>
                          {FIRE_CLASSES.map(fc => {
                            const s = SUITABILITY_DISPLAY[ext.suitability[fc]];
                            return (
                              <td key={fc} className="px-1 py-2 text-center">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
                                  {s.label}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-gray-500">{ext.sizes.map(s => s.capacity).join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Siting Rules */}
          <div className="border border-gray-200 rounded-xl p-4">
            <button onClick={() => setShowSiting(!showSiting)} className="w-full flex items-center gap-2 text-left">
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showSiting && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Siting Requirements (BS 5306-8)</span>
            </button>
            {showSiting && (
              <div className="mt-3 space-y-2">
                {SITING_RULES.map(rule => (
                  <div key={rule.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-ebrora mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <div>
                        <div className="text-xs font-bold text-gray-800">{rule.rule}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{rule.details}</div>
                        <div className="text-[9px] text-ebrora/70 mt-1">{rule.standard}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signage Requirements */}
          <div className="border border-gray-200 rounded-xl p-4">
            <button onClick={() => setShowSignage(!showSignage)} className="w-full flex items-center gap-2 text-left">
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showSignage && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Signage Requirements (BS 5499-1 / BS 5306-8)</span>
            </button>
            {showSignage && (
              <div className="mt-3 space-y-2">
                {SIGNAGE_REQUIREMENTS.map(sig => (
                  <div key={sig.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-xs font-bold text-gray-800">{sig.type}</div>
                    <div className="text-[10px] text-gray-600 mt-1">{sig.description}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      <div><span className="text-[9px] font-bold text-gray-400 uppercase">Standard</span><div className="text-[10px] text-gray-600">{sig.standard}</div></div>
                      <div><span className="text-[9px] font-bold text-gray-400 uppercase">Placement</span><div className="text-[10px] text-gray-600">{sig.placement}</div></div>
                      <div><span className="text-[9px] font-bold text-gray-400 uppercase">Min Size</span><div className="text-[10px] text-gray-600">{sig.minSize}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspection Schedule */}
          <div className="border border-gray-200 rounded-xl p-4">
            <button onClick={() => setShowInspection(!showInspection)} className="w-full flex items-center gap-2 text-left">
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showInspection && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Inspection & Maintenance Schedule (BS 5306-3)</span>
            </button>
            {showInspection && (
              <div className="mt-3 space-y-2">
                {INSPECTION_SCHEDULE.map(ins => (
                  <div key={ins.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0 mt-0.5",
                        ins.frequency === "Weekly" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        ins.frequency === "Monthly" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        ins.frequency === "Annual" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-purple-50 text-purple-700 border border-purple-200"
                      )}>{ins.frequency}</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gray-800">{ins.task}</div>
                        <div className="text-[10px] text-gray-600 mt-1">{ins.details}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] text-gray-400"><span className="font-bold">Who:</span> {ins.who}</span>
                          <span className="text-[9px] text-ebrora/70">{ins.standard}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regulatory References */}
          <div className="border border-gray-200 rounded-xl p-4">
            <button onClick={() => setShowRegs(!showRegs)} className="w-full flex items-center gap-2 text-left">
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showRegs && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Regulatory References</span>
            </button>
            {showRegs && (
              <div className="mt-3 space-y-2">
                {REGULATORY_REFS.map(reg => (
                  <div key={reg.ref} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-xs font-bold text-ebrora whitespace-nowrap">{reg.ref}</div>
                    <div>
                      <div className="text-xs font-medium text-gray-800">{reg.title}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{reg.relevance}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cross-reference */}
          <div className="bg-ebrora-light/30 border border-ebrora/20 rounded-xl p-4">
            <div className="text-[11px] font-bold text-ebrora uppercase tracking-wide mb-1">Related Ebrora Tools</div>
            <div className="text-xs text-ebrora-dark">
              Use the <span className="font-bold">Fire Risk Score Calculator</span> alongside this tool to assess the overall fire risk level for each site area and determine the adequacy of your fire precautions under RRFSO 2005.
            </div>
          </div>
        </>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          This tool provides decision-support guidance per BS 5306-8:2023, RRFSO 2005, and BS EN 3. It does not replace a site-specific fire risk assessment by a competent fire safety professional. Always verify recommendations with your Responsible Person or fire safety advisor.
        </p>
      </div>
    </div>
  );
}
