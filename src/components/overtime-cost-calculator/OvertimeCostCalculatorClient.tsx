// src/components/overtime-cost-calculator/OvertimeCostCalculatorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  calculateOvertime,
  fmtGBP, fmtGBPFull, fmtPercent, generateId,
  OVERTIME_PRESETS, TIER_COLOURS, REGULATIONS,
  type OvertimeInputs, type OperativeGroup, type OvertimeTier, type EmployerOnCosts, type CalculationResult,
} from "@/data/overtime-cost-calculator";

// ─── Helpers ─────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }
const MAX_TIERS = 5;
const MAX_GROUPS = 5;

// ─── Tier Row (extracted to avoid focus loss) ────────────────
function TierRow({ tier, index, baseRate, onChange, onRemove, canRemove }: {
  tier: OvertimeTier; index: number; baseRate: number;
  onChange: (id: string, field: keyof OvertimeTier, value: string | number) => void;
  onRemove: (id: string) => void; canRemove: boolean;
}) {
  const weeklyCost = tier.hoursPerWeek * baseRate * tier.multiplier;
  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      <div className="col-span-4 sm:col-span-3">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Label</label>
        <input type="text" value={tier.label} onChange={e => onChange(tier.id, "label", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:border-ebrora outline-none" />
      </div>
      <div className="col-span-2 sm:col-span-2">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Multiplier</label>
        <input type="number" value={tier.multiplier} min={1} max={4} step={0.25}
          onChange={e => onChange(tier.id, "multiplier", parseFloat(e.target.value) || 1)}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:border-ebrora outline-none" />
      </div>
      <div className="col-span-2 sm:col-span-2">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Hrs/wk</label>
        <input type="number" value={tier.hoursPerWeek} min={0} max={80} step={0.5}
          onChange={e => onChange(tier.id, "hoursPerWeek", parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:border-ebrora outline-none" />
      </div>
      <div className="col-span-2 sm:col-span-3 text-right">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Weekly Cost</label>
        <div className="text-sm font-bold text-gray-800 py-1.5">{fmtGBP(weeklyCost)}</div>
      </div>
      <div className="col-span-2 sm:col-span-2 flex justify-end">
        {canRemove && (
          <button onClick={() => onRemove(tier.id)}
            className="px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Remove</button>
        )}
      </div>
    </div>
  );
}

// ─── Group Panel (extracted) ─────────────────────────────────
function GroupPanel({ group, groupIndex, onUpdate, onRemove, canRemove }: {
  group: OperativeGroup; groupIndex: number;
  onUpdate: (id: string, updated: OperativeGroup) => void;
  onRemove: (id: string) => void; canRemove: boolean;
}) {
  const handleTierChange = useCallback((tierId: string, field: keyof OvertimeTier, value: string | number) => {
    const newTiers = group.tiers.map(t => t.id === tierId ? { ...t, [field]: value } : t);
    onUpdate(group.id, { ...group, tiers: newTiers });
  }, [group, onUpdate]);

  const handleTierRemove = useCallback((tierId: string) => {
    onUpdate(group.id, { ...group, tiers: group.tiers.filter(t => t.id !== tierId) });
  }, [group, onUpdate]);

  const addTier = useCallback(() => {
    if (group.tiers.length >= MAX_TIERS) return;
    onUpdate(group.id, {
      ...group, tiers: [...group.tiers, { id: generateId(), label: `Tier ${group.tiers.length + 1}`, multiplier: 1.5, hoursPerWeek: 0 }],
    });
  }, [group, onUpdate]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = OVERTIME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    onUpdate(group.id, {
      ...group,
      standardHoursPerWeek: preset.standardHours,
      tiers: preset.tiers.map(t => ({ ...t, id: generateId() })),
    });
  }, [group, onUpdate]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-6 h-6 rounded-full bg-ebrora text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{groupIndex + 1}</span>
          <input type="text" value={group.label} onChange={e => onUpdate(group.id, { ...group, label: e.target.value })}
            className="text-sm font-bold text-gray-800 bg-transparent border-none outline-none flex-1 min-w-0" />
        </div>
        {canRemove && (
          <button onClick={() => onRemove(group.id)} className="text-xs text-red-500 hover:text-red-700">Remove Group</button>
        )}
      </div>
      <div className="p-4 space-y-4">
        {/* Core inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Base Rate (£/hr)</label>
            <input type="number" value={group.baseRate} min={1} max={200} step={0.01}
              onChange={e => onUpdate(group.id, { ...group, baseRate: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Standard Hrs/Wk</label>
            <input type="number" value={group.standardHoursPerWeek} min={1} max={60} step={0.5}
              onChange={e => onUpdate(group.id, { ...group, standardHoursPerWeek: parseFloat(e.target.value) || 39 })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">No. of Operatives</label>
            <input type="number" value={group.operativeCount} min={1} max={500} step={1}
              onChange={e => onUpdate(group.id, { ...group, operativeCount: parseInt(e.target.value) || 1 })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Preset Pattern</label>
            <select onChange={e => applyPreset(e.target.value)} value="" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none">
              <option value="">Select preset...</option>
              {OVERTIME_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Tiers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Overtime Tiers</h4>
            {group.tiers.length < MAX_TIERS && (
              <button onClick={addTier} className="text-xs font-medium text-ebrora hover:text-ebrora-dark transition-colors">+ Add Tier</button>
            )}
          </div>
          {group.tiers.map((t, ti) => (
            <TierRow key={t.id} tier={t} index={ti} baseRate={group.baseRate}
              onChange={handleTierChange} onRemove={handleTierRemove} canRemove={group.tiers.length > 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SVG Stacked Bar Chart ───────────────────────────────────
function StackedBarChart({ data, keys, colours }: {
  data: Record<string, unknown>[]; keys: string[]; colours: Record<string, string>;
}) {
  const W = 700, H = 280, PAD = { top: 20, right: 20, bottom: 40, left: 60 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;
  const n = data.length;
  if (n === 0) return null;
  const barW = Math.min(40, (cw / n) * 0.7);
  const gap = (cw - barW * n) / (n + 1);

  // Max stacked value
  let maxVal = 0;
  data.forEach(d => {
    let sum = 0;
    keys.forEach(k => { sum += (d[k] as number) || 0; });
    if (sum > maxVal) maxVal = sum;
  });
  if (maxVal === 0) maxVal = 1;

  const yScale = (v: number) => PAD.top + ch - (v / maxVal) * ch;

  // Y grid
  const yTicks: number[] = [];
  const step = Math.pow(10, Math.floor(Math.log10(maxVal))) || 1;
  const niceStep = maxVal / 4 > step ? Math.ceil(maxVal / 4 / step) * step : step;
  for (let v = 0; v <= maxVal; v += niceStep) yTicks.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 300 }}>
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={PAD.left - 6} y={yScale(v) + 3} textAnchor="end" fontSize={8} fill="#9CA3AF">{fmtGBP(v)}</text>
        </g>
      ))}
      {data.map((d, di) => {
        const x = PAD.left + gap + di * (barW + gap);
        let y0 = yScale(0);
        return (
          <g key={di}>
            {keys.map(k => {
              const val = (d[k] as number) || 0;
              const barH = (val / maxVal) * ch;
              const yTop = y0 - barH;
              const el = <rect key={k} x={x} y={yTop} width={barW} height={barH} fill={colours[k] || "#9CA3AF"} rx={1} />;
              y0 = yTop;
              return el;
            })}
            {n <= 24 && <text x={x + barW / 2} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">{d.week as string}</text>}
          </g>
        );
      })}
      {/* Legend */}
      {keys.map((k, i) => (
        <g key={k} transform={`translate(${PAD.left + i * 120}, ${H - 10})`}>
          <rect width={8} height={8} fill={colours[k] || "#9CA3AF"} rx={1} />
          <text x={11} y={7} fontSize={8} fill="#6B7280">{k}</text>
        </g>
      ))}
      <text x={W / 2} y={H - PAD.bottom + 28} textAnchor="middle" fontSize={10} fill="#6B7280">Week</text>
    </svg>
  );
}

// ─── SVG Cumulative Line Chart ───────────────────────────────
function CumulativeLineChart({ data }: { data: { week: string; actual: number; baseOnly: number }[] }) {
  const W = 700, H = 260, PAD = { top: 20, right: 20, bottom: 40, left: 60 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;
  const n = data.length;
  if (n < 2) return null;

  const maxVal = Math.max(...data.map(d => Math.max(d.actual, d.baseOnly)));
  const xScale = (i: number) => PAD.left + (i / (n - 1)) * cw;
  const yScale = (v: number) => PAD.top + ch - (v / (maxVal || 1)) * ch;

  const actualPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(d.actual).toFixed(1)}`).join(" ");
  const basePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(d.baseOnly).toFixed(1)}`).join(" ");

  // Y grid
  const yTicks: number[] = [];
  const step = Math.pow(10, Math.floor(Math.log10(maxVal || 1)));
  const niceStep = maxVal / 4 > step ? Math.ceil(maxVal / 4 / step) * step : step || 1;
  for (let v = 0; v <= maxVal; v += niceStep) yTicks.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 280 }}>
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#E5E7EB" strokeWidth={0.5} />
          <text x={PAD.left - 6} y={yScale(v) + 3} textAnchor="end" fontSize={8} fill="#9CA3AF">{fmtGBP(v)}</text>
        </g>
      ))}
      {/* X labels */}
      {data.filter((_, i) => n <= 20 || i % Math.ceil(n / 10) === 0 || i === n - 1).map((d, _, arr) => {
        const idx = data.indexOf(d);
        return <text key={idx} x={xScale(idx)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">{d.week}</text>;
      })}
      {/* Shaded premium area */}
      <path d={`${actualPath} L${xScale(n - 1).toFixed(1)},${yScale(data[n - 1].baseOnly).toFixed(1)} ${data.slice().reverse().map((d, i) => `L${xScale(n - 1 - i).toFixed(1)},${yScale(d.baseOnly).toFixed(1)}`).join(" ")} Z`}
        fill="rgba(27,87,69,0.08)" />
      {/* Lines */}
      <path d={actualPath} fill="none" stroke="#1B5745" strokeWidth={2.5} strokeLinejoin="round" />
      <path d={basePath} fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="5,3" strokeLinejoin="round" />
      {/* End point */}
      <circle cx={xScale(n - 1)} cy={yScale(data[n - 1].actual)} r={4} fill="#1B5745" stroke="white" strokeWidth={2} />
      <text x={xScale(n - 1) - 8} y={yScale(data[n - 1].actual) - 8} textAnchor="end" fontSize={9} fontWeight={700} fill="#1B5745">{fmtGBP(data[n - 1].actual)}</text>
      {/* Legend */}
      <line x1={PAD.left} y1={H - 8} x2={PAD.left + 18} y2={H - 8} stroke="#1B5745" strokeWidth={2.5} />
      <text x={PAD.left + 22} y={H - 5} fontSize={8} fill="#6B7280">Actual (with OT)</text>
      <line x1={PAD.left + 130} y1={H - 8} x2={PAD.left + 148} y2={H - 8} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="5,3" />
      <text x={PAD.left + 152} y={H - 5} fontSize={8} fill="#6B7280">Base Rate Only</text>
      <text x={W / 2} y={H - PAD.bottom + 28} textAnchor="middle" fontSize={10} fill="#6B7280">Week</text>
    </svg>
  );
}

// ─── SVG Pie/Donut Chart ─────────────────────────────────────
function CostPieChart({ data }: { data: { label: string; value: number; colour: string }[] }) {
  const size = 240, cx = size / 2, cy = size / 2, r = 90, ir = 50;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  let cumAngle = -Math.PI / 2;

  const slices = data.map(d => {
    const angle = (d.value / total) * Math.PI * 2;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const largeArc = angle > Math.PI ? 1 : 0;
    const x1o = cx + r * Math.cos(startAngle), y1o = cy + r * Math.sin(startAngle);
    const x2o = cx + r * Math.cos(endAngle), y2o = cy + r * Math.sin(endAngle);
    const x1i = cx + ir * Math.cos(endAngle), y1i = cy + ir * Math.sin(endAngle);
    const x2i = cx + ir * Math.cos(startAngle), y2i = cy + ir * Math.sin(startAngle);
    const path = `M${x1o},${y1o} A${r},${r} 0 ${largeArc},1 ${x2o},${y2o} L${x1i},${y1i} A${ir},${ir} 0 ${largeArc},0 ${x2i},${y2i} Z`;
    const midAngle = startAngle + angle / 2;
    const pct = ((d.value / total) * 100).toFixed(0);
    return { ...d, path, midAngle, pct };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-48 h-48 flex-shrink-0">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.colour} stroke="white" strokeWidth={1.5} />)}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1B5745">{fmtGBP(total)}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="#9CA3AF">Total</text>
      </svg>
      <div className="space-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.colour }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="font-bold text-gray-800">{fmtGBPFull(s.value)}</span>
            <span className="text-gray-400">({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
async function exportPDF(
  header: { site: string; manager: string; preparedBy: string; date: string },
  result: CalculationResult,
  inputs: OvertimeInputs,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14, CW = W - M * 2;
  let y = 0;
  const docRef = `OTC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // ── Header bar (FREE = green)
  doc.setFillColor(27, 87, 69);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("OVERTIME COST ANALYSIS", M, 12);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("Working Time Regulations 1998 / CIJC / NAECI / HMRC -- ebrora.com/tools/overtime-cost-calculator", M, 19);
  doc.setFontSize(7);
  doc.text(`Ref: ${docRef} | Rev 0 | ${new Date().toLocaleDateString("en-GB")}`, W - M - 75, 19);
  y = 34;
  doc.setTextColor(0, 0, 0);

  // ── Site info panel
  doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y - 3, CW, 14, 1, 1, "FD");
  doc.setFontSize(8);
  const halfW = CW / 2;
  const drawFld = (label: string, value: string, x: number, fy: number, lineW: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, fy);
    const lw = doc.getTextWidth(label) + 2;
    if (value) { doc.setFont("helvetica", "normal"); doc.text(value, x + lw, fy); }
    else { doc.setDrawColor(180, 180, 180); doc.line(x + lw, fy, x + lw + lineW, fy); doc.setDrawColor(220, 220, 220); }
  };
  drawFld("Site:", header.site, M + 3, y, 50);
  drawFld("Site Manager:", header.manager, M + halfW, y, 40);
  y += 5;
  drawFld("Prepared By:", header.preparedBy, M + 3, y, 50);
  drawFld("Date:", header.date, M + halfW, y, 30);
  y += 8;

  // ── Scope
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
  const scopeText = `Overtime cost analysis for ${header.site || "the above site"}. ${result.totalOperatives} operatives across ${result.groups.length} group(s) over ${result.totalWeeks} weeks. On-costs: ${inputs.onCosts.enabled ? "Employer NIC " + inputs.onCosts.nicPercent + "%, Pension " + inputs.onCosts.pensionPercent + "%, CITB " + inputs.onCosts.citbLevyPercent + "%" : "Not applied"}.`;
  const scopeLines = doc.splitTextToSize(scopeText, CW);
  doc.text(scopeLines, M, y); y += scopeLines.length * 3 + 3;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  function checkPage(need: number) {
    if (y + need > 278) {
      doc.addPage();
      doc.setFillColor(27, 87, 69); doc.rect(0, 0, W, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("OVERTIME COST ANALYSIS (continued)", M, 7);
      doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text("ebrora.com", W - M - 18, 7);
      doc.setTextColor(0, 0, 0); y = 14;
    }
  }

  // ── Cost Banner
  const bannerRGB = result.overallOvertimePercent > 40 ? [220, 38, 38] : result.overallOvertimePercent > 25 ? [234, 179, 8] : [22, 163, 74];
  doc.setFillColor(bannerRGB[0], bannerRGB[1], bannerRGB[2]);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text(`TOTAL COST: ${fmtGBPFull(result.grandTotal)}`, M + 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`OT Premium: ${fmtGBPFull(result.totalOvertimePremium)} | OT as % of total: ${fmtPercent(result.overallOvertimePercent)} | Effective rate: ${fmtGBPFull(result.overallEffectiveRate)}/hr`, M + 5, y + 11);
  doc.setTextColor(0, 0, 0); y += 20;

  // ── Stat cards
  {
    const cardW = (CW - 6) / 4, cardH = 14;
    const otPct = result.overallOvertimePercent;
    const cards: { label: string; value: string; sub: string; rgb: number[] }[] = [
      { label: "Total Cost", value: fmtGBP(result.grandTotal), sub: `${result.totalWeeks} wks, ${result.totalOperatives} ops`, rgb: [59, 130, 246] },
      { label: "OT Premium", value: fmtGBP(result.totalOvertimePremium), sub: `${fmtPercent(otPct)} of total`, rgb: otPct > 40 ? [220, 38, 38] : otPct > 25 ? [234, 179, 8] : [22, 163, 74] },
      { label: "Effective Rate", value: `${fmtGBP(result.overallEffectiveRate)}/hr`, sub: "vs base rate blended", rgb: [124, 58, 237] },
      { label: "Annual Projection", value: fmtGBP(result.annualCost), sub: `Premium: ${fmtGBP(result.annualPremium)}/yr`, rgb: [14, 165, 233] },
    ];
    cards.forEach((c, ci) => {
      const cx = M + ci * (cardW + 2);
      doc.setFillColor(c.rgb[0], c.rgb[1], c.rgb[2]);
      doc.roundedRect(cx, y, cardW, cardH, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(4.5); doc.setFont("helvetica", "bold");
      doc.text(c.label.toUpperCase(), cx + 3, y + 4);
      doc.setFontSize(9); doc.text(c.value, cx + 3, y + 9);
      doc.setFontSize(4.5); doc.setFont("helvetica", "normal");
      doc.text(c.sub, cx + 3, y + 12.5);
    });
    doc.setTextColor(0, 0, 0);
    y += cardH + 6;
  }

  // ── Summary panel
  checkPage(55);
  const summaryItems = [
    ["Total Labour Cost (gross)", fmtGBPFull(result.totalLabourCost)],
    ["Total Overtime Premium", fmtGBPFull(result.totalOvertimePremium)],
    ["Employer On-Costs", fmtGBPFull(result.totalOnCost)],
    ["Grand Total", fmtGBPFull(result.grandTotal)],
    ["Overtime as % of Total", fmtPercent(result.overallOvertimePercent)],
    ["Effective Hourly Rate", `${fmtGBPFull(result.overallEffectiveRate)}/hr`],
    ["Total Operatives", `${result.totalOperatives}`],
    ["Duration", `${result.totalWeeks} weeks`],
    ["Annual Projection (52 weeks)", fmtGBPFull(result.annualCost)],
    ["Annual OT Premium", fmtGBPFull(result.annualPremium)],
  ];
  const panelH = 6 + summaryItems.length * 3.8 + 4;
  doc.setFillColor(248, 250, 252); doc.setDrawColor(200, 210, 220);
  doc.roundedRect(M, y - 2, CW, panelH, 1.5, 1.5, "FD");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Cost Summary", M + 4, y + 2); y += 6;
  summaryItems.forEach(([label, value]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(label + ":", M + 4, y);
    doc.setTextColor(17, 24, 39); doc.text(value, M + 65, y);
    doc.setTextColor(0, 0, 0); y += 3.8;
  });
  y += 6;

  // ── Group detail tables
  result.groups.forEach((gr, gi) => {
    checkPage(30);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(`Group ${gi + 1}: ${gr.groupLabel}`, M, y); y += 5;

    // Tier table
    const cols = [55, 25, 25, 30, 30, CW - 165];
    const headers = ["Tier", "Multiplier", "Hrs/Wk", "Weekly Cost", "Premium", "Rate"];
    let cx = M;
    headers.forEach((h, i) => {
      doc.setFillColor(30, 30, 30); doc.rect(cx, y, cols[i], 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
      doc.text(h, cx + 2, y + 4);
      cx += cols[i];
    });
    doc.setTextColor(0, 0, 0); y += 6;
    doc.setDrawColor(200, 200, 200);

    // Standard pay row
    cx = M;
    const stdCells = ["Standard Pay", "x1.0", `${gr.standardHoursPerWeek}`, fmtGBPFull(gr.weeklyStandardPay), "--", `${fmtGBPFull(gr.baseRate)}/hr`];
    stdCells.forEach((t, i) => {
      doc.setFillColor(240, 249, 255); doc.rect(cx, y, cols[i], 5.5, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(6);
      doc.text(t, cx + 2, y + 3.8);
      cx += cols[i];
    });
    y += 5.5;

    // Tier rows
    gr.tiers.forEach((t, ti) => {
      checkPage(6);
      cx = M;
      const cells = [t.label, `x${t.multiplier.toFixed(2)}`, `${t.hours}`, fmtGBPFull(t.grossCost), fmtGBPFull(t.premium), `${fmtGBPFull(gr.baseRate * t.multiplier)}/hr`];
      cells.forEach((ct, i) => {
        if (ti % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(cx, y, cols[i], 5.5, "FD"); }
        else { doc.rect(cx, y, cols[i], 5.5, "D"); }
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", i === 0 ? "bold" : "normal"); doc.setFontSize(6);
        doc.text(ct, cx + 2, y + 3.8);
        cx += cols[i];
      });
      y += 5.5;
    });

    // Total row
    cx = M;
    const totCells = ["TOTAL (per operative)", "", `${gr.totalHoursPerWeek}`, fmtGBPFull(gr.weeklyTotalPay), fmtGBPFull(gr.weeklyOvertimePremium), `${fmtGBPFull(gr.effectiveHourlyRate)}/hr`];
    totCells.forEach((t, i) => {
      doc.setFillColor(245, 245, 245); doc.setDrawColor(200, 200, 200);
      doc.rect(cx, y, cols[i], 6, "FD");
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
      doc.text(t, cx + 2, y + 4);
      cx += cols[i];
    });
    y += 10;
  });

  // ── Hire vs Overtime comparison (structured table)
  checkPage(35);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Hire vs Overtime Comparison", M, y); y += 2;
  doc.setFontSize(5.5); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
  doc.text("What if you hired one additional operative per group at base rate instead of paying overtime?", M, y + 2);
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); y += 7;
  result.groups.forEach((gr) => {
    checkPage(18);
    const scenA = gr.weeklyTotalPay * gr.operativeCount;
    const teamHrs = gr.totalHoursPerWeek * gr.operativeCount;
    const hrsEach = teamHrs / (gr.operativeCount + 1);
    const remOT = Math.max(0, hrsEach - gr.standardHoursPerWeek);
    const avgMult = gr.totalOvertimeHoursPerWeek > 0
      ? gr.weeklyOvertimeCost / (gr.totalOvertimeHoursPerWeek * gr.baseRate)
      : 1.5;
    const scenB = remOT <= 0
      ? hrsEach * gr.baseRate * (gr.operativeCount + 1)
      : (gr.standardHoursPerWeek * gr.baseRate + remOT * gr.baseRate * avgMult) * (gr.operativeCount + 1);
    const saving = scenA - scenB;
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text(gr.groupLabel, M + 2, y); y += 4;
    const hCols = [45, 45, 45, 47];
    const hHeaders = ["Current (with OT)", "Hire +1 (redistributed)", "Weekly Saving", `${inputs.weeks}wk Saving`];
    let hx = M;
    hHeaders.forEach((h, i) => {
      doc.setFillColor(245, 245, 245); doc.setDrawColor(200, 200, 200); doc.rect(hx, y, hCols[i], 5, "FD");
      doc.setFontSize(5); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
      doc.text(h, hx + 1.5, y + 3.5); hx += hCols[i];
    });
    y += 5; hx = M;
    const hVals = [fmtGBPFull(scenA) + "/wk", fmtGBPFull(scenB) + "/wk",
      (saving > 0 ? fmtGBPFull(saving) + " (hire)" : fmtGBPFull(Math.abs(saving)) + " (OT cheaper)"),
      (saving > 0 ? fmtGBPFull(saving * inputs.weeks) : fmtGBPFull(Math.abs(saving) * inputs.weeks))];
    hVals.forEach((v, i) => {
      doc.rect(hx, y, hCols[i], 5, "D");
      doc.setFontSize(5.5); doc.setFont("helvetica", i >= 2 ? "bold" : "normal");
      doc.setTextColor(i >= 2 ? (saving > 0 ? 22 : 220) : 0, i >= 2 ? (saving > 0 ? 163 : 38) : 0, i >= 2 ? (saving > 0 ? 74 : 38) : 0);
      doc.text(v, hx + 1.5, y + 3.5); hx += hCols[i];
    });
    doc.setTextColor(0, 0, 0); y += 7;
    if (remOT > 0) { doc.setFontSize(5); doc.setTextColor(100, 100, 100); doc.text(`Note: +1 hire still leaves ${remOT.toFixed(1)} OT hrs/person/wk`, M + 2, y); y += 3; doc.setTextColor(0, 0, 0); }
  });
  y += 4;

  // ── Cumulative cost chart (drawn in jsPDF)
  checkPage(65);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Cumulative Cost Over Time", M, y); y += 3;
  doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
  doc.text("Green line = actual cost with overtime. Grey dashed line = cost if all hours were at base rate.", M, y + 2);
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); y += 6;

  // Use first group for chart (aggregated if multiple)
  const aggWeekly: { week: number; cumTotal: number; cumBase: number }[] = [];
  const maxWeeks = inputs.weeks;
  for (let w = 1; w <= maxWeeks; w++) {
    let cumT = 0, cumB = 0;
    result.groups.forEach(gr => {
      const row = gr.weeklyBreakdown.find(r => r.week === w);
      if (row) { cumT += row.cumulativeTotal; cumB += row.cumulativeBaseOnly; }
    });
    aggWeekly.push({ week: w, cumTotal: cumT, cumBase: cumB });
  }

  if (aggWeekly.length > 1) {
    const chartX = M + 12, chartW2 = CW - 24, chartH2 = 40;
    const chartY2 = y;
    const maxVal = Math.max(...aggWeekly.map(r => Math.max(r.cumTotal, r.cumBase)));
    doc.setFillColor(248, 250, 252); doc.rect(chartX, chartY2, chartW2, chartH2, "F");
    doc.setDrawColor(220, 220, 220); doc.setFontSize(5); doc.setTextColor(130, 130, 130);

    // Y grid
    for (let i = 0; i <= 4; i++) {
      const val = (maxVal / 4) * i;
      const yp = chartY2 + chartH2 - (val / maxVal) * chartH2;
      doc.line(chartX, yp, chartX + chartW2, yp);
      doc.text(fmtGBP(val), chartX - 10, yp + 1.5);
    }

    // X grid + labels
    const xStep = Math.max(1, Math.round(maxWeeks / 8));
    for (let w = 0; w <= maxWeeks; w += xStep) {
      const xp = chartX + (w / (maxWeeks - 1)) * chartW2;
      doc.setDrawColor(220, 220, 220); doc.line(xp, chartY2, xp, chartY2 + chartH2);
      doc.setFontSize(5); doc.setTextColor(130, 130, 130);
      doc.text(`Wk ${w}`, xp - 3, chartY2 + chartH2 + 4);
    }

    // Actual line (solid dark green, thicker)
    doc.setDrawColor(27, 87, 69); doc.setLineWidth(0.8);
    for (let i = 1; i < aggWeekly.length; i++) {
      const x1 = chartX + ((aggWeekly[i - 1].week - 1) / (maxWeeks - 1)) * chartW2;
      const y1 = chartY2 + chartH2 - (aggWeekly[i - 1].cumTotal / maxVal) * chartH2;
      const x2 = chartX + ((aggWeekly[i].week - 1) / (maxWeeks - 1)) * chartW2;
      const y2v = chartY2 + chartH2 - (aggWeekly[i].cumTotal / maxVal) * chartH2;
      doc.line(x1, y1, x2, y2v);
    }

    // Base-only line (dashed grey, visible)
    doc.setDrawColor(120, 120, 120); doc.setLineWidth(0.5);
    for (let i = 1; i < aggWeekly.length; i++) {
      const x1 = chartX + ((aggWeekly[i - 1].week - 1) / (maxWeeks - 1)) * chartW2;
      const y1 = chartY2 + chartH2 - (aggWeekly[i - 1].cumBase / maxVal) * chartH2;
      const x2 = chartX + ((aggWeekly[i].week - 1) / (maxWeeks - 1)) * chartW2;
      const y2v = chartY2 + chartH2 - (aggWeekly[i].cumBase / maxVal) * chartH2;
      // Draw dashed: only even-index segments
      if (i % 2 === 0) doc.line(x1, y1, x2, y2v);
    }
    // Legend
    doc.setFontSize(5);
    doc.setDrawColor(27, 87, 69); doc.setLineWidth(0.8);
    doc.line(chartX + chartW2 - 55, chartY2 - 3, chartX + chartW2 - 48, chartY2 - 3);
    doc.setTextColor(27, 87, 69);
    doc.text("Actual (with OT)", chartX + chartW2 - 46, chartY2 - 1.5);
    doc.setDrawColor(120, 120, 120); doc.setLineWidth(0.5);
    doc.line(chartX + chartW2 - 25, chartY2 - 3, chartX + chartW2 - 21, chartY2 - 3);
    doc.line(chartX + chartW2 - 19, chartY2 - 3, chartX + chartW2 - 15, chartY2 - 3);
    doc.setTextColor(120, 120, 120);
    doc.text("Base rate only", chartX + chartW2 - 13, chartY2 - 1.5);

    doc.setLineWidth(0.2); doc.setDrawColor(220, 220, 220); doc.setTextColor(0, 0, 0);
    y = chartY2 + chartH2 + 8;
  }

  // ── Cost Breakdown (horizontal stacked bar + legend)
  checkPage(30);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Cost Breakdown", M, y); y += 5;
  const total = result.pieData.reduce((s, d) => s + d.value, 0);
  if (total > 0) {
    // Draw horizontal stacked bar
    const barX = M, barW = CW, barH2 = 6;
    let bx = barX;
    result.pieData.forEach((d) => {
      const segW = (d.value / total) * barW;
      if (segW > 0) {
        const cr = parseInt(d.colour.slice(1, 3), 16);
        const cg = parseInt(d.colour.slice(3, 5), 16);
        const cb = parseInt(d.colour.slice(5, 7), 16);
        doc.setFillColor(cr, cg, cb);
        doc.rect(bx, y, segW, barH2, "F");
        bx += segW;
      }
    });
    y += barH2 + 3;
  }
  // Legend items
  result.pieData.forEach((d) => {
    checkPage(6);
    const pct = total > 0 ? (d.value / total) * 100 : 0;
    const r = parseInt(d.colour.slice(1, 3), 16);
    const g = parseInt(d.colour.slice(3, 5), 16);
    const b = parseInt(d.colour.slice(5, 7), 16);
    doc.setFillColor(r, g, b); doc.rect(M + 2, y - 1.5, 3, 3, "F");
    doc.setTextColor(0, 0, 0); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`${d.label}: ${fmtGBPFull(d.value)} (${fmtPercent(pct)})`, M + 7, y + 0.5);
    y += 4;
  });
  y += 4;

  // ── Regulations
  checkPage(25);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Applicable Regulations", M, y); y += 5;
  REGULATIONS.forEach((reg) => {
    checkPage(10);
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(55, 65, 81);
    doc.text(reg.ref, M + 2, y); y += 3;
    doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(reg.detail, CW - 6);
    doc.text(lines, M + 2, y); y += lines.length * 3 + 2;
    doc.setTextColor(0, 0, 0);
  });
  y += 4;

  // ── Sign-off
  checkPage(50);
  y += 4;
  doc.setDrawColor(27, 87, 69); doc.line(M, y, W - M, y); y += 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("SIGN-OFF", M, y); y += 6;
  const soW = CW / 2 - 2, soH = 8;
  doc.setDrawColor(200, 200, 200); doc.setFontSize(7.5);
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, soW, soH, "FD"); doc.rect(M + soW + 4, y, soW, soH, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Prepared By", M + 3, y + 5.5); doc.text("Site Manager", M + soW + 7, y + 5.5);
  y += soH;
  (["Name:", "Position:", "Signature:", "Date:"] as const).forEach(label => {
    doc.rect(M, y, soW, soH, "D"); doc.rect(M + soW + 4, y, soW, soH, "D");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
    doc.text(label, M + 3, y + 5.5); doc.text(label, M + soW + 7, y + 5.5);
    doc.setFont("helvetica", "normal"); y += soH;
  });

  // ── Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(5.5); doc.setTextColor(130, 130, 130);
    doc.text(
      "Overtime cost analysis. Working Time Regulations 1998 limits apply. This is a planning tool -- verify rates with payroll/HR. Actual on-costs may vary.",
      M, 287
    );
    doc.text(`Ref: ${docRef} | ebrora.com | Page ${p} of ${pageCount}`, W - M - 65, 291);
  }

  doc.save(`overtime-cost-analysis-${todayISO()}.pdf`);
}

// ─── Main Component ──────────────────────────────────────────
export default function OvertimeCostCalculatorClient() {
  const [site, setSite] = useState("");
  const [manager, setManager] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [assessDate, setAssessDate] = useState(todayISO());
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const defaultPreset = OVERTIME_PRESETS[0];
  const [groups, setGroups] = useState<OperativeGroup[]>([{
    id: generateId(), label: "General Operatives", baseRate: 16.50,
    standardHoursPerWeek: defaultPreset.standardHours, operativeCount: 6,
    tiers: defaultPreset.tiers.map(t => ({ ...t, id: generateId() })),
  }]);
  const [weeks, setWeeks] = useState<number>(12);
  const [onCosts, setOnCosts] = useState<EmployerOnCosts>({
    enabled: false, nicPercent: 13.8, pensionPercent: 3, citbLevyPercent: 0.35,
  });

  const inputs: OvertimeInputs = useMemo(() => ({ groups, weeks, onCosts }), [groups, weeks, onCosts]);
  const result = useMemo(() => calculateOvertime(inputs), [inputs]);

  const updateGroup = useCallback((id: string, updated: OperativeGroup) => {
    setGroups(prev => prev.map(g => g.id === id ? updated : g));
  }, []);

  const removeGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  const addGroup = useCallback(() => {
    if (groups.length >= MAX_GROUPS) return;
    setGroups(prev => [...prev, {
      id: generateId(), label: `Group ${prev.length + 1}`, baseRate: 16.50,
      standardHoursPerWeek: 39, operativeCount: 4,
      tiers: [{ id: generateId(), label: "Weekday OT (T+1/2)", multiplier: 1.5, hoursPerWeek: 0 }],
    }]);
  }, [groups.length]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF({ site, manager, preparedBy, date: assessDate }, result, inputs); }
    finally { setExporting(false); }
  }, [site, manager, preparedBy, assessDate, result, inputs]);

  const clearAll = useCallback(() => {
    const p = OVERTIME_PRESETS[0];
    setGroups([{ id: generateId(), label: "General Operatives", baseRate: 16.50, standardHoursPerWeek: p.standardHours, operativeCount: 6, tiers: p.tiers.map(t => ({ ...t, id: generateId() })) }]);
    setWeeks(12);
    setOnCosts({ enabled: false, nicPercent: 13.8, pensionPercent: 3, citbLevyPercent: 0.35 });
    setSite(""); setManager(""); setPreparedBy(""); setAssessDate(todayISO());
  }, []);

  // ── Chart data
  const barData = useMemo(() => {
    const data: Record<string, unknown>[] = [];
    const maxW = weeks;
    for (let w = 1; w <= maxW; w++) {
      const row: Record<string, unknown> = { week: `${w}` };
      let stdTotal = 0;
      result.groups.forEach(gr => {
        const wr = gr.weeklyBreakdown.find(r => r.week === w);
        if (wr) stdTotal += wr.standardCost;
      });
      row["Standard Pay"] = stdTotal;
      // Collect tier costs across groups
      const tierTotals = new Map<string, number>();
      result.groups.forEach(gr => {
        gr.tiers.forEach(t => {
          const key = t.label;
          tierTotals.set(key, (tierTotals.get(key) || 0) + t.grossCost * gr.operativeCount);
        });
      });
      tierTotals.forEach((val, key) => { row[key] = val; });
      data.push(row);
    }
    return data;
  }, [result, weeks]);

  const barKeys = useMemo(() => {
    const keys = new Set<string>();
    result.groups.forEach(gr => gr.tiers.forEach(t => keys.add(t.label)));
    return ["Standard Pay", ...keys];
  }, [result]);

  const barColours = useMemo(() => {
    const m: Record<string, string> = { "Standard Pay": "#3B82F6" };
    let ci = 0;
    result.groups.forEach(gr => gr.tiers.forEach(t => {
      if (!m[t.label]) { m[t.label] = TIER_COLOURS[ci % TIER_COLOURS.length]; ci++; }
    }));
    return m;
  }, [result]);

  const lineData = useMemo(() => {
    const data: { week: string; actual: number; baseOnly: number }[] = [];
    for (let w = 1; w <= weeks; w++) {
      let cumT = 0, cumB = 0;
      result.groups.forEach(gr => {
        const row = gr.weeklyBreakdown.find(r => r.week === w);
        if (row) { cumT += row.cumulativeTotal; cumB += row.cumulativeBaseOnly; }
      });
      data.push({ week: `${w}`, actual: cumT, baseOnly: cumB });
    }
    return data;
  }, [result, weeks]);

  const pieData = result.pieData.filter(d => d.value > 0);

  // ── Hire comparison data
  const hireData = useMemo(() => {
    return result.groups.map(gr => {
      const scenA = gr.weeklyTotalPay * gr.operativeCount;
      // Redistribute hours across N+1 people
      const teamHrs = gr.totalHoursPerWeek * gr.operativeCount;
      const hrsEach = teamHrs / (gr.operativeCount + 1);
      const remOT = Math.max(0, hrsEach - gr.standardHoursPerWeek);
      const avgMult = gr.totalOvertimeHoursPerWeek > 0
        ? gr.weeklyOvertimeCost / (gr.totalOvertimeHoursPerWeek * gr.baseRate)
        : 1.5;
      const scenB = remOT <= 0
        ? hrsEach * gr.baseRate * (gr.operativeCount + 1)
        : (gr.standardHoursPerWeek * gr.baseRate + remOT * gr.baseRate * avgMult) * (gr.operativeCount + 1);
      return {
        label: gr.groupLabel,
        otCost: scenA,
        hireCost: scenB,
        saving: scenA - scenB,
        savingOverPeriod: (scenA - scenB) * weeks,
        remainingOT: remOT,
      };
    });
  }, [result, weeks]);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Cost", value: fmtGBP(result.grandTotal), sub: `${result.totalWeeks} weeks, ${result.totalOperatives} operatives`, bgClass: "bg-blue-50", textClass: "text-blue-800", borderClass: "border-blue-200", dotClass: "bg-blue-500" },
          { label: "OT Premium", value: fmtGBP(result.totalOvertimePremium), sub: `${fmtPercent(result.overallOvertimePercent)} of total cost`, bgClass: result.overallOvertimePercent > 40 ? "bg-red-50" : result.overallOvertimePercent > 25 ? "bg-orange-50" : "bg-emerald-50", textClass: result.overallOvertimePercent > 40 ? "text-red-800" : result.overallOvertimePercent > 25 ? "text-orange-800" : "text-emerald-800", borderClass: result.overallOvertimePercent > 40 ? "border-red-200" : result.overallOvertimePercent > 25 ? "border-orange-200" : "border-emerald-200", dotClass: result.overallOvertimePercent > 40 ? "bg-red-500" : result.overallOvertimePercent > 25 ? "bg-orange-500" : "bg-emerald-500" },
          { label: "Effective Rate", value: `${fmtGBP(result.overallEffectiveRate)}/hr`, sub: `vs base rate blended`, bgClass: "bg-purple-50", textClass: "text-purple-800", borderClass: "border-purple-200", dotClass: "bg-purple-500" },
          { label: "Annual Projection", value: fmtGBP(result.annualCost), sub: `Premium: ${fmtGBP(result.annualPremium)}/yr`, bgClass: "bg-cyan-50", textClass: "text-cyan-800", borderClass: "border-cyan-200", dotClass: "bg-cyan-500" },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bgClass} ${c.borderClass}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} />
              <span className={`text-[11px] font-bold uppercase tracking-wide ${c.textClass}`}>{c.label}</span>
            </div>
            <div className={`text-xl font-bold ${c.textClass}`}>{c.value}</div>
            <div className={`text-xs mt-0.5 opacity-70 ${c.textClass}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── WTR Warning */}
      {result.groups.some(g => g.totalHoursPerWeek > 48) && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg font-bold text-red-600">!</span>
          <div>
            <div className="text-sm font-bold text-red-900">Working Time Regulations Warning</div>
            <div className="text-xs text-red-800 mt-1">
              One or more groups exceed 48 hours/week. Under the Working Time Regulations 1998, employees must not work more than 48 hours per week on average unless they have opted out in writing. Ensure opt-out agreements are in place and fatigue risk is managed per HSE HSG256.
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <div className="flex-1" />
        <button onClick={handleExport} disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-ebrora-dark bg-ebrora-light hover:bg-ebrora-mid">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {exporting ? "Generating..." : "Download PDF"}
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Clear All</button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Site Name", v: site, s: setSite },
            { l: "Site Manager", v: manager, s: setManager },
            { l: "Prepared By", v: preparedBy, s: setPreparedBy },
          ].map(f => (
            <div key={f.l}>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-ebrora outline-none" />
          </div>
        </div>
      )}

      {/* ── Duration & On-Costs */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Project Parameters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Duration (weeks)</label>
            <input type="number" value={weeks} min={1} max={104} step={1}
              onChange={e => setWeeks(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input type="checkbox" checked={onCosts.enabled}
                onChange={e => setOnCosts(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-ebrora focus:ring-ebrora" />
              <span className="text-xs font-medium text-gray-600">Include Employer On-Costs</span>
            </label>
          </div>
          {onCosts.enabled && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Employer NIC %</label>
                <input type="number" value={onCosts.nicPercent} min={0} max={25} step={0.1}
                  onChange={e => setOnCosts(prev => ({ ...prev, nicPercent: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Pension %</label>
                <input type="number" value={onCosts.pensionPercent} min={0} max={15} step={0.1}
                  onChange={e => setOnCosts(prev => ({ ...prev, pensionPercent: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
              </div>
            </>
          )}
        </div>
        {onCosts.enabled && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">CITB Levy %</label>
              <input type="number" value={onCosts.citbLevyPercent} min={0} max={2} step={0.01}
                onChange={e => setOnCosts(prev => ({ ...prev, citbLevyPercent: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-ebrora outline-none" />
            </div>
            <div className="col-span-3 flex items-end pb-2">
              <span className="text-xs text-gray-400">
                Total on-cost rate: {fmtPercent(onCosts.nicPercent + onCosts.pensionPercent + onCosts.citbLevyPercent)} on gross wages
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Operative Groups */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Operative Groups</h3>
          {groups.length < MAX_GROUPS && (
            <button onClick={addGroup} className="text-xs font-medium text-ebrora hover:text-ebrora-dark transition-colors">+ Add Group</button>
          )}
        </div>
        {groups.map((g, gi) => (
          <GroupPanel key={g.id} group={g} groupIndex={gi} onUpdate={updateGroup} onRemove={removeGroup} canRemove={groups.length > 1} />
        ))}
      </div>

      {/* ── Weekly Stacked Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Weekly Cost Breakdown</h3>
        <p className="text-[11px] text-gray-400">Stacked bar showing base pay vs each overtime tier per week across all groups.</p>
        <StackedBarChart data={barData} keys={barKeys} colours={barColours} />
      </div>

      {/* ── Cumulative Line Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Cumulative Cost Over Time</h3>
        <p className="text-[11px] text-gray-400">Solid line = actual cost with overtime premiums. Dashed line = what the same hours would cost at base rate. The shaded area is your total overtime premium.</p>
        <CumulativeLineChart data={lineData} />
      </div>

      {/* ── Pie Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-700">Cost Split</h3>
        <p className="text-[11px] text-gray-400">Proportion of total cost between standard time, each overtime category, and employer on-costs.</p>
        <CostPieChart data={pieData} />
      </div>

      {/* ── Hire vs Overtime Comparison */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Hire vs Overtime Comparison</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">What if you hired one additional operative per group at base rate instead of paying overtime?</p>
        </div>
        <div className="divide-y divide-gray-100">
          {hireData.map((h, i) => (
            <div key={i} className="px-4 py-3">
              <div className="text-sm font-medium text-gray-800 mb-1">{h.label}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div><span className="text-gray-400">Current (with OT):</span> <span className="font-bold">{fmtGBPFull(h.otCost)}/wk</span></div>
                <div><span className="text-gray-400">Hire +1 (redistributed):</span> <span className="font-bold">{fmtGBPFull(h.hireCost)}/wk</span></div>
                <div>
                  <span className="text-gray-400">Weekly saving:</span>{" "}
                  <span className={`font-bold ${h.saving > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {h.saving > 0 ? `${fmtGBPFull(h.saving)} (hire)` : `${fmtGBPFull(Math.abs(h.saving))} (OT cheaper)`}
                  </span>
                  {h.remainingOT > 0 && <span className="text-[10px] text-gray-400 ml-1">({h.remainingOT.toFixed(1)}h OT remains)</span>}
                </div>
                <div>
                  <span className="text-gray-400">{weeks}wk saving:</span>{" "}
                  <span className={`font-bold ${h.savingOverPeriod > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {h.savingOverPeriod > 0 ? fmtGBPFull(h.savingOverPeriod) : `${fmtGBPFull(Math.abs(h.savingOverPeriod))} (OT cheaper)`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Group Detail Tables */}
      {result.groups.map((gr, gi) => (
        <div key={gr.groupId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Group {gi + 1}: {gr.groupLabel} - Per Operative Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="px-3 py-2 text-left font-bold">Component</th>
                  <th className="px-3 py-2 text-right font-bold">Rate</th>
                  <th className="px-3 py-2 text-right font-bold">Hrs/Wk</th>
                  <th className="px-3 py-2 text-right font-bold">Weekly Cost</th>
                  <th className="px-3 py-2 text-right font-bold">Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-blue-50">
                  <td className="px-3 py-2 font-medium">Standard Pay</td>
                  <td className="px-3 py-2 text-right">{fmtGBPFull(gr.baseRate)}/hr</td>
                  <td className="px-3 py-2 text-right">{gr.standardHoursPerWeek}</td>
                  <td className="px-3 py-2 text-right font-bold">{fmtGBPFull(gr.weeklyStandardPay)}</td>
                  <td className="px-3 py-2 text-right text-gray-400">--</td>
                </tr>
                {gr.tiers.map((t, ti) => (
                  <tr key={ti} className={ti % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="px-3 py-2 font-medium">{t.label}</td>
                    <td className="px-3 py-2 text-right">{fmtGBPFull(gr.baseRate * t.multiplier)}/hr (x{t.multiplier.toFixed(2)})</td>
                    <td className="px-3 py-2 text-right">{t.hours}</td>
                    <td className="px-3 py-2 text-right">{fmtGBPFull(t.grossCost)}</td>
                    <td className="px-3 py-2 text-right text-orange-600 font-medium">{fmtGBPFull(t.premium)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                  <td className="px-3 py-2">TOTAL (per operative)</td>
                  <td className="px-3 py-2 text-right">{fmtGBPFull(gr.effectiveHourlyRate)}/hr eff.</td>
                  <td className="px-3 py-2 text-right">{gr.totalHoursPerWeek}</td>
                  <td className="px-3 py-2 text-right">{fmtGBPFull(gr.weeklyTotalPay)}</td>
                  <td className="px-3 py-2 text-right text-orange-600">{fmtGBPFull(gr.weeklyOvertimePremium)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            {gr.operativeCount} operatives x {weeks} weeks = <strong>{fmtGBPFull(gr.totalLabourCost)}</strong> total labour
            {gr.totalOnCost > 0 && <> + <strong>{fmtGBPFull(gr.totalOnCost)}</strong> on-costs</>}
            {" "}= <strong className="text-gray-800">{fmtGBPFull(gr.grandTotal)}</strong> grand total
          </div>
        </div>
      ))}

      {/* ── Regulations */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Applicable Regulations</h3>
        </div>
        <div className="px-4 py-3 space-y-3">
          {REGULATIONS.map((reg, i) => (
            <div key={i}>
              <div className="text-xs font-bold text-gray-700">{reg.ref}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{reg.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
          Overtime cost analysis based on user-entered rates and patterns. Working Time Regulations 1998 limits apply. Employer on-costs are estimates -- verify with payroll/HR. CIJC and NAECI presets are based on published agreements -- check current rates apply. This is a planning tool and does not replace formal payroll calculations.
        </p>
        <a href="https://ebrora.gumroad.com/" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-ebrora hover:text-ebrora-dark transition-colors">
          Browse all Ebrora tools
        </a>
      </div>
    </div>
  );
}
