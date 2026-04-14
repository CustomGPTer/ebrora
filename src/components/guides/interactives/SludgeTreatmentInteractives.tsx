// src/components/guides/interactives/SludgeTreatmentInteractives.tsx
"use client";

import { useState, useMemo } from "react";

/* ─── Shared components ─── */
function SliderInput({
  label, value, onChange, min, max, step, unit, color = "#B45309",
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string; color?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
        <span className="text-sm font-bold text-gray-900">{value}{unit !== "×" ? ` ${unit}` : unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: color }} />
    </div>
  );
}

function ResultCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value} <span className="text-xs font-medium text-gray-400">{unit}</span></div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   1. SLUDGE THICKENING CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

const THICKENER_TYPES = [
  { id: "daf", label: "DAF", typicalOutput: 5, typicalCapture: 95 },
  { id: "gbt", label: "Gravity Belt", typicalOutput: 5, typicalCapture: 95 },
  { id: "drum", label: "Drum Thickener", typicalOutput: 6, typicalCapture: 95 },
  { id: "centrifuge", label: "Centrifuge", typicalOutput: 7, typicalCapture: 98 },
];

export function SludgeThickeningCalculator() {
  const [feedFlow, setFeedFlow] = useState(15); // m³/h
  const [feedDS, setFeedDS] = useState(0.8); // %
  const [thickenerIdx, setThickenerIdx] = useState(0);
  const [outputDS, setOutputDS] = useState(5); // %
  const [captureRate, setCaptureRate] = useState(95); // %
  const [polymerDose, setPolymerDose] = useState(6); // kg active/tDS
  const [numUnits, setNumUnits] = useState(2); // 1D+1S
  const [operatingHrs, setOperatingHrs] = useState(16); // hrs/day

  const thickenerType = THICKENER_TYPES[thickenerIdx];

  const results = useMemo(() => {
    // Feed solids
    const feedDSkg_h = feedFlow * 1000 * (feedDS / 100); // kg/h
    const feedDStDay = feedDSkg_h * operatingHrs / 1000; // tDS/day

    // Thickened sludge
    const capturedDS = feedDSkg_h * (captureRate / 100); // kg/h
    const thickenedFlow = capturedDS / (outputDS / 100 * 1000); // m³/h
    const volumeReduction = ((feedFlow - thickenedFlow) / feedFlow) * 100;

    // Filtrate/centrate
    const filtrateFlow = feedFlow - thickenedFlow; // m³/h
    const filtrateSS = feedDSkg_h * (1 - captureRate / 100) / filtrateFlow; // kg/m³ = g/l

    // Polymer consumption
    const polymerKgH = (feedDSkg_h / 1000) * polymerDose; // kg active/h
    const polymerKgDay = polymerKgH * operatingHrs;

    // Operating cost estimate (polymer at ~£3/kg active)
    const polymerCostDay = polymerKgDay * 3;

    // Per unit (duty only)
    const dutyUnits = numUnits - 1;
    const feedPerUnit = feedFlow / Math.max(dutyUnits, 1);

    return {
      feedDSkg_h, feedDStDay, capturedDS, thickenedFlow,
      volumeReduction, filtrateFlow, filtrateSS,
      polymerKgH, polymerKgDay, polymerCostDay,
      dutyUnits, feedPerUnit,
    };
  }, [feedFlow, feedDS, outputDS, captureRate, polymerDose, numUnits, operatingHrs]);

  return (
    <div className="my-6 bg-white border border-amber-200 rounded-2xl overflow-hidden">
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg">♻️</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Sludge Thickening Calculator</h4>
            <p className="text-xs text-gray-500">Mass balance, volume reduction, polymer and filtrate quality</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          {/* Thickener type */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Thickener Type</label>
            <div className="grid grid-cols-2 gap-2">
              {THICKENER_TYPES.map((t, i) => (
                <button key={t.id} onClick={() => { setThickenerIdx(i); setOutputDS(t.typicalOutput); setCaptureRate(t.typicalCapture); }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    i === thickenerIdx ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>

          <SliderInput label="Feed Flow" value={feedFlow} onChange={setFeedFlow} min={2} max={60} step={1} unit="m³/h" />
          <SliderInput label="Feed DS" value={feedDS} onChange={setFeedDS} min={0.3} max={3} step={0.1} unit="%" />
          <SliderInput label="Output DS" value={outputDS} onChange={setOutputDS} min={3} max={10} step={0.5} unit="%" />
          <SliderInput label="Capture Rate" value={captureRate} onChange={setCaptureRate} min={85} max={99} step={1} unit="%" />
          <SliderInput label="Polymer Dose" value={polymerDose} onChange={setPolymerDose} min={2} max={15} step={0.5} unit="kg/tDS" />
          <SliderInput label="Operating Hours" value={operatingHrs} onChange={setOperatingHrs} min={8} max={24} step={1} unit="hrs/day" />

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Units (D+S)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumUnits(Math.max(2, numUnits - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numUnits}</span>
              <button onClick={() => setNumUnits(Math.min(4, numUnits + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Mass balance visual */}
          <div className="rounded-xl p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Mass Balance</h5>
            <div className="flex items-center gap-3">
              {/* Feed */}
              <div className="flex-1 bg-white rounded-lg border border-amber-200 p-3 text-center">
                <div className="text-[10px] text-gray-500 uppercase">Feed</div>
                <div className="text-lg font-bold text-gray-900">{feedFlow} m³/h</div>
                <div className="text-xs text-gray-500">{feedDS}% DS</div>
                <div className="text-xs font-semibold text-amber-700">{results.feedDSkg_h.toFixed(0)} kg/h</div>
              </div>
              <svg className="w-6 h-6 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {/* Outputs */}
              <div className="flex-1 space-y-2">
                <div className="bg-white rounded-lg border border-emerald-200 p-3 text-center">
                  <div className="text-[10px] text-emerald-600 uppercase font-semibold">Thickened</div>
                  <div className="text-lg font-bold text-gray-900">{results.thickenedFlow.toFixed(1)} m³/h</div>
                  <div className="text-xs text-gray-500">{outputDS}% DS</div>
                </div>
                <div className="bg-white rounded-lg border border-blue-200 p-3 text-center">
                  <div className="text-[10px] text-blue-600 uppercase font-semibold">Filtrate</div>
                  <div className="text-lg font-bold text-gray-900">{results.filtrateFlow.toFixed(1)} m³/h</div>
                  <div className="text-xs text-gray-500">{(results.filtrateSS * 1000).toFixed(0)} mg/l SS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Volume reduction */}
          <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Volume Reduction</span>
            </div>
            <div className="text-3xl font-bold text-emerald-700">{results.volumeReduction.toFixed(0)}%</div>
            <div className="mt-2 h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${results.volumeReduction}%` }} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Operating Data</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="DS Throughput" value={results.feedDStDay.toFixed(1)} unit="tDS/day" />
              <ResultCard label="Feed per Unit" value={results.feedPerUnit.toFixed(1)} unit="m³/h" />
              <ResultCard label="Polymer Use" value={results.polymerKgDay.toFixed(1)} unit="kg/day" />
              <ResultCard label="Est. Polymer Cost" value={`£${results.polymerCostDay.toFixed(0)}`} unit="/day" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   2. LIQUORS RETURN IMPACT CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

export function LiquorsReturnCalculator() {
  const [mainFlowDWF, setMainFlowDWF] = useState(200); // l/s
  const [mainNH4, setMainNH4] = useState(40); // mg/l influent NH4
  const [liquorsFlow, setLiquorsFlow] = useState(10); // l/s
  const [liquorsNH4, setLiquorsNH4] = useState(800); // mg/l
  const [returnHrs, setReturnHrs] = useState(8); // hours/day return window
  const [maxReturnPct, setMaxReturnPct] = useState(10); // % of DWF
  const [aerationHeadroom, setAerationHeadroom] = useState(20); // % spare capacity

  const results = useMemo(() => {
    // Ammonia loads
    const mainNH4Load = (mainFlowDWF / 1000) * mainNH4 * 3.6; // kg/h
    const liquorsNH4Load = (liquorsFlow / 1000) * liquorsNH4 * 3.6; // kg/h
    const totalNH4Load = mainNH4Load + liquorsNH4Load;
    const liquorsContribution = (liquorsNH4Load / totalNH4Load) * 100;

    // Blended concentration
    const blendedNH4 = totalNH4Load / ((mainFlowDWF + liquorsFlow) / 1000 * 3.6);

    // Flow contribution
    const flowContribution = (liquorsFlow / mainFlowDWF) * 100;

    // Maximum recommended return flow
    const maxReturnFlow = mainFlowDWF * (maxReturnPct / 100);
    const returnOK = liquorsFlow <= maxReturnFlow;

    // Additional oxygen demand from liquors
    const additionalOD = liquorsNH4Load * 4.57; // kg O₂/h for nitrification
    const mainOD = mainNH4Load * 4.57;
    const totalOD = additionalOD + mainOD;

    // Check aeration headroom
    const odIncrease = (additionalOD / mainOD) * 100;
    const aerationOK = odIncrease <= aerationHeadroom;

    // Daily volume
    const dailyLiquorsVol = (liquorsFlow / 1000) * 3600 * returnHrs; // m³

    return {
      mainNH4Load, liquorsNH4Load, totalNH4Load, liquorsContribution,
      blendedNH4, flowContribution, maxReturnFlow, returnOK,
      additionalOD, mainOD, totalOD, odIncrease, aerationOK,
      dailyLiquorsVol,
    };
  }, [mainFlowDWF, mainNH4, liquorsFlow, liquorsNH4, returnHrs, maxReturnPct, aerationHeadroom]);

  return (
    <div className="my-6 bg-white border border-amber-200 rounded-2xl overflow-hidden">
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg">🔁</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Liquors Return Impact</h4>
            <p className="text-xs text-gray-500">Ammonia load pacing and aeration headroom check</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Main Works DWF" value={mainFlowDWF} onChange={setMainFlowDWF} min={50} max={2000} step={10} unit="l/s" />
          <SliderInput label="Influent NH₄-N" value={mainNH4} onChange={setMainNH4} min={10} max={80} step={5} unit="mg/l" />
          <SliderInput label="Liquors Flow" value={liquorsFlow} onChange={setLiquorsFlow} min={1} max={50} step={1} unit="l/s" />
          <SliderInput label="Liquors NH₄-N" value={liquorsNH4} onChange={setLiquorsNH4} min={200} max={2000} step={50} unit="mg/l" />
          <SliderInput label="Return Window" value={returnHrs} onChange={setReturnHrs} min={4} max={24} step={1} unit="hrs/day" />
          <SliderInput label="Max Return (% DWF)" value={maxReturnPct} onChange={setMaxReturnPct} min={5} max={20} step={1} unit="%" />
          <SliderInput label="Aeration Headroom" value={aerationHeadroom} onChange={setAerationHeadroom} min={5} max={50} step={5} unit="%" />
        </div>

        <div className="space-y-4">
          {/* Impact summary */}
          <div className={`rounded-xl p-4 border-2 ${results.returnOK && results.aerationOK ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-900">Impact Assessment</span>
              <span className={`text-sm font-bold ${results.returnOK && results.aerationOK ? "text-emerald-600" : "text-red-600"}`}>
                {results.returnOK && results.aerationOK ? "✓ Manageable" : "✗ Risk — review pacing"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Flow contribution</span>
                <div className={`font-bold ${results.flowContribution > 10 ? "text-red-600" : "text-gray-900"}`}>
                  {results.flowContribution.toFixed(1)}% of DWF
                </div>
              </div>
              <div>
                <span className="text-gray-500">NH₄ load contribution</span>
                <div className={`font-bold ${results.liquorsContribution > 30 ? "text-red-600" : "text-gray-900"}`}>
                  {results.liquorsContribution.toFixed(0)}% of total
                </div>
              </div>
            </div>
          </div>

          {/* NH4 load breakdown */}
          <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Ammonia Load</h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Main works</span>
                <span className="font-bold">{results.mainNH4Load.toFixed(1)} kg NH₄-N/h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Liquors return</span>
                <span className="font-bold">{results.liquorsNH4Load.toFixed(1)} kg NH₄-N/h</span>
              </div>
              <div className="border-t border-blue-200 pt-2 flex justify-between text-sm">
                <span className="font-semibold text-gray-700">Blended concentration</span>
                <span className="text-lg font-bold text-gray-900">{results.blendedNH4.toFixed(1)} mg/l</span>
              </div>
              {/* Load split bar */}
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex mt-1">
                <div className="bg-blue-400 transition-all duration-300" style={{ width: `${100 - results.liquorsContribution}%` }} />
                <div className="bg-amber-500 transition-all duration-300" style={{ width: `${results.liquorsContribution}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>Main works ({(100 - results.liquorsContribution).toFixed(0)}%)</span>
                <span>Liquors ({results.liquorsContribution.toFixed(0)}%)</span>
              </div>
            </div>
          </div>

          {/* Aeration headroom check */}
          <div className={`rounded-xl p-4 border ${results.aerationOK ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">O₂ Demand Increase</span>
              <span className={`text-xs font-semibold ${results.aerationOK ? "text-emerald-600" : "text-red-600"}`}>
                {results.aerationOK ? `✓ Within ${aerationHeadroom}% headroom` : `✗ Exceeds ${aerationHeadroom}% headroom`}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">+{results.odIncrease.toFixed(0)}%</div>
            <div className="text-xs text-gray-500 mt-1">Additional {results.additionalOD.toFixed(0)} kg O₂/h from liquors nitrification</div>
          </div>

          <ResultCard label="Daily Liquors Volume" value={results.dailyLiquorsVol.toFixed(0)} unit="m³/day" />
        </div>
      </div>
    </div>
  );
}
