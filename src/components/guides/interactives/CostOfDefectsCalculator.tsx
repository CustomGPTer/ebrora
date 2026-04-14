// src/components/guides/interactives/CostOfDefectsCalculator.tsx
"use client";

import { useState, useMemo } from "react";

/* ─── Defect type data from the guide ─── */
const DEFECT_TYPES = [
  { id: "design", label: "Design Correction (pre-IFC)", minK: 0.5, maxK: 5, icon: "✏️", stage: "design" },
  { id: "civils", label: "Minor Civils Rework", minK: 10, maxK: 50, icon: "🧱", stage: "construction" },
  { id: "meica", label: "MEICA Installation Rework", minK: 15, maxK: 80, icon: "⚙️", stage: "construction" },
  { id: "mcerts", label: "Instrumentation / MCERTS Non-compliance", minK: 10, maxK: 60, icon: "📡", stage: "construction" },
  { id: "process", label: "Process / Controls Changes", minK: 5, maxK: 40, icon: "💻", stage: "commissioning" },
  { id: "delay", label: "Commissioning Delay + Vendor Returns", minK: 25, maxK: 150, icon: "🔄", stage: "commissioning" },
  { id: "consent", label: "Consent Breach Incident", minK: 100, maxK: 500, icon: "⚠️", stage: "operation" },
] as const;

const STAGE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  design: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "#059669" },
  construction: { bg: "bg-orange-50", text: "text-orange-700", bar: "#EA580C" },
  commissioning: { bg: "bg-purple-50", text: "text-purple-700", bar: "#7C3AED" },
  operation: { bg: "bg-red-50", text: "text-red-700", bar: "#DC2626" },
};

const MULTIPLIER_LABELS = [
  { mult: 1, label: "Design", desc: "Fix at desktop", color: "#059669" },
  { mult: 10, label: "Construction", desc: "Fix during build", color: "#EA580C" },
  { mult: 100, label: "Commissioning", desc: "Fix in commissioning / ops", color: "#DC2626" },
];

export function CostOfDefectsCalculator() {
  const [selectedDefect, setSelectedDefect] = useState(0);
  const [baseCostK, setBaseCostK] = useState(2);
  const [showAllTypes, setShowAllTypes] = useState(false);

  const defect = DEFECT_TYPES[selectedDefect];
  const stageColor = STAGE_COLORS[defect.stage];

  // 1-10-100 escalation values
  const escalation = useMemo(() => {
    return MULTIPLIER_LABELS.map((m) => ({
      ...m,
      cost: baseCostK * m.mult,
    }));
  }, [baseCostK]);

  const maxCost = baseCostK * 100;

  return (
    <div className="my-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Cost Escalation Explorer</h4>
            <p className="text-sm text-gray-500">See how defect costs multiply through project stages</p>
          </div>
        </div>

        {/* 1-10-100 Visual */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {escalation.map((e, i) => (
            <div
              key={e.label}
              className="relative bg-white rounded-xl p-4 border border-gray-100 overflow-hidden"
            >
              {/* Background multiplier */}
              <div className="absolute top-2 right-3 text-5xl font-black opacity-[0.06]" style={{ color: e.color }}>
                ×{e.mult}
              </div>
              <div className="relative">
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: e.color }}>
                  {e.label}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  £{e.cost >= 1000 ? `${(e.cost / 1000).toFixed(e.cost >= 10000 ? 0 : 1)}m` : `${e.cost}k`}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">{e.desc}</div>
              </div>
              {/* Bar indicator */}
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(e.cost / maxCost) * 100}%`,
                    backgroundColor: e.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Base cost slider */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Base design-stage cost
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBaseCostK(Math.max(0.5, baseCostK - 0.5))}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
              >
                −
              </button>
              <span className="text-lg font-bold text-gray-900 min-w-[60px] text-center">
                £{baseCostK}k
              </span>
              <button
                onClick={() => setBaseCostK(Math.min(50, baseCostK + 0.5))}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <input
            type="range"
            min={0.5}
            max={50}
            step={0.5}
            value={baseCostK}
            onChange={(e) => setBaseCostK(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1B5B50]"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>£0.5k</span>
            <span>£25k</span>
            <span>£50k</span>
          </div>
        </div>
      </div>

      {/* Defect types comparison chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="font-bold text-gray-900">UK Cost Bands by Defect Type</h4>
          <button
            onClick={() => setShowAllTypes(!showAllTypes)}
            className="text-xs font-medium text-[#1B5B50] hover:text-[#144840] transition-colors"
          >
            {showAllTypes ? "Show compact" : "Show details"}
          </button>
        </div>

        <div className="space-y-3">
          {DEFECT_TYPES.map((d, i) => {
            const sc = STAGE_COLORS[d.stage];
            const maxBarWidth = 500; // max £k for scale
            const isSelected = i === selectedDefect;

            return (
              <button
                key={d.id}
                onClick={() => setSelectedDefect(i)}
                className={`w-full text-left rounded-xl p-3 border transition-all ${
                  isSelected
                    ? `${sc.bg} border-current ring-1 ring-current/20 ${sc.text}`
                    : "bg-gray-50 border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{d.icon}</span>
                  <span className={`text-sm font-medium ${isSelected ? sc.text : "text-gray-700"}`}>
                    {d.label}
                  </span>
                  <span className={`ml-auto text-xs font-semibold ${isSelected ? sc.text : "text-gray-400"}`}>
                    £{d.minK}k – £{d.maxK}k
                  </span>
                </div>

                {/* Range bar */}
                <div className="h-3 bg-gray-200/50 rounded-full overflow-hidden relative">
                  {/* Min-max range */}
                  <div
                    className="absolute top-0 h-full rounded-full transition-all duration-500"
                    style={{
                      left: `${(d.minK / maxBarWidth) * 100}%`,
                      width: `${((d.maxK - d.minK) / maxBarWidth) * 100}%`,
                      backgroundColor: sc.bar,
                      opacity: isSelected ? 1 : 0.5,
                    }}
                  />
                </div>

                {showAllTypes && (
                  <div className="mt-2 text-xs text-gray-500 leading-relaxed">
                    {d.stage === "design" && "Calculations, redrawing, coordination. Cheapest stage to resolve."}
                    {d.stage === "construction" && d.id === "civils" && "Break-out, re-form, re-pour, waterproofing, structural tests."}
                    {d.id === "meica" && "Re-mount, re-pipe, re-cable, terminations, inspections."}
                    {d.id === "mcerts" && "Re-site primary device, new verification, recalibration."}
                    {d.id === "process" && "Code changes, FAT/SAT re-runs, alarm reconfiguration."}
                    {d.id === "delay" && "Vendor re-mobilisation, hire, temporary treatment measures."}
                    {d.id === "consent" && "Mitigation, sampling, reporting, potential penalties, reputational cost."}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Scale legend */}
        <div className="mt-4 flex items-center gap-6 text-[10px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Design
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-orange-500" /> Construction
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-purple-500" /> Commissioning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500" /> Operation
          </span>
        </div>
      </div>

      {/* Key takeaway */}
      <div className="bg-[#1B5B50]/5 border border-[#1B5B50]/15 rounded-xl px-5 py-4">
        <p className="text-sm text-[#1B5B50] leading-relaxed">
          <strong>Key insight:</strong> A £{baseCostK}k design correction becomes £{baseCostK * 10}k during construction
          and £{baseCostK * 100 >= 1000 ? `${(baseCostK * 100 / 1000).toFixed(1)}m` : `${baseCostK * 100}k`} at
          commissioning. Investing in design reviews, ITPs with hold points, and early TQs is the most cost-effective quality control.
        </p>
      </div>
    </div>
  );
}
