// src/components/guides/interactives/PrimaryTreatmentInteractives.tsx
"use client";

import { useState, useMemo } from "react";

/* ─── Shared slider (same as PreTreatment) ─── */
function SliderInput({
  label, value, onChange, min, max, step, unit, color = "#7C3AED",
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
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  );
}

function ResultCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-lg font-bold text-gray-900">
        {value} <span className="text-xs font-medium text-gray-400">{unit}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   1. PST SIZING CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

const PST_TYPES = [
  { id: "radial", label: "Radial (circular)", typicalSOR: 1.5 },
  { id: "rectangular", label: "Rectangular", typicalSOR: 1.2 },
  { id: "lamella", label: "Lamella Clarifier", typicalSOR: 3.0 },
];

export function PSTSizingCalculator() {
  const [flowDWF, setFlowDWF] = useState(200); // l/s
  const [peakFactor, setPeakFactor] = useState(2); // primary typically 2× DWF
  const [numTanks, setNumTanks] = useState(3);
  const [tankTypeIdx, setTankTypeIdx] = useState(0);
  const [diameter, setDiameter] = useState(25); // m (for radial)
  const [sidewaterDepth, setSidewaterDepth] = useState(3.5); // m
  const [targetSS, setTargetSS] = useState(60); // target % SS removal
  const [influentSS, setInfluentSS] = useState(350); // mg/l

  const tankType = PST_TYPES[tankTypeIdx];

  const results = useMemo(() => {
    const fft = flowDWF * peakFactor;
    const flowM3h = (fft / 1000) * 3600;
    const dutyTanks = numTanks - 1; // 1 offline for desludging

    // Tank geometry
    const tankArea = Math.PI * (diameter / 2) ** 2;
    const tankVol = tankArea * sidewaterDepth;
    const totalArea = tankArea * dutyTanks;
    const totalVol = tankVol * dutyTanks;

    // Surface Overflow Rate (SOR) m³/m²/h
    const sor = flowM3h / totalArea;

    // Hydraulic Retention Time (HRT) hours
    const hrt = totalVol / (fft / 1000) / 3600;

    // Weir loading rate (assuming peripheral weir)
    const weirLength = Math.PI * diameter * dutyTanks; // m
    const weirLoading = flowM3h / weirLength; // m³/m/h

    // Upflow velocity m/h
    const upflowVelocity = flowM3h / totalArea;

    // Estimated SS removal
    const estimatedRemoval = Math.min(95, Math.max(30, 100 - (100 * Math.exp(-sor * 0.8))));

    // Sludge production estimate
    const effluentSS = influentSS * (1 - targetSS / 100);
    const sludgeProduction = (influentSS - effluentSS) * fft / 1000 * 3.6; // kg/h (dry)
    const sludgeLiquid = sludgeProduction / 40; // m³/h at ~4% DS

    // SOR status
    const sorOK = sor <= (tankType.typicalSOR * 1.1);

    return {
      fft, flowM3h, dutyTanks, tankArea, tankVol, totalArea, totalVol,
      sor, hrt, weirLength, weirLoading, upflowVelocity,
      effluentSS, sludgeProduction, sludgeLiquid, sorOK,
    };
  }, [flowDWF, peakFactor, numTanks, diameter, sidewaterDepth, targetSS, influentSS, tankType]);

  return (
    <div className="my-6 bg-white border border-purple-200 rounded-2xl overflow-hidden">
      <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">🏗️</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">PST Sizing Explorer</h4>
            <p className="text-xs text-gray-500">Surface overflow rate, retention time and sludge production</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-5">
          {/* Tank type */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Tank Type</label>
            <div className="flex gap-2">
              {PST_TYPES.map((t, i) => (
                <button key={t.id} onClick={() => setTankTypeIdx(i)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    i === tankTypeIdx ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>

          <SliderInput label="DWF" value={flowDWF} onChange={setFlowDWF} min={50} max={2000} step={10} unit="l/s" />
          <SliderInput label="Peak Factor" value={peakFactor} onChange={setPeakFactor} min={1} max={4} step={0.5} unit="×" />
          <SliderInput label="Influent SS" value={influentSS} onChange={setInfluentSS} min={100} max={800} step={10} unit="mg/l" />
          <SliderInput label="Target SS Removal" value={targetSS} onChange={setTargetSS} min={30} max={80} step={5} unit="%" />

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">No. of Tanks</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumTanks(Math.max(2, numTanks - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numTanks}</span>
              <button onClick={() => setNumTanks(Math.min(8, numTanks + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>

          <SliderInput label="Tank Diameter" value={diameter} onChange={setDiameter} min={10} max={50} step={1} unit="m" />
          <SliderInput label="Side Water Depth" value={sidewaterDepth} onChange={setSidewaterDepth} min={2} max={6} step={0.5} unit="m" />
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tank Geometry</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Tank Area (each)" value={results.tankArea.toFixed(0)} unit="m²" />
              <ResultCard label="Tank Volume (each)" value={results.tankVol.toFixed(0)} unit="m³" />
              <ResultCard label="Duty Tanks" value={results.dutyTanks.toString()} unit={`of ${numTanks}`} />
              <ResultCard label="Total Area (duty)" value={results.totalArea.toFixed(0)} unit="m²" />
            </div>
          </div>

          {/* SOR gauge */}
          <div className={`rounded-xl p-4 border ${results.sorOK ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Surface Overflow Rate</span>
              <span className={`text-xs font-semibold ${results.sorOK ? "text-emerald-600" : "text-red-600"}`}>
                {results.sorOK ? "Within target" : "Exceeds typical range"}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{results.sor.toFixed(2)} <span className="text-sm text-gray-400">m³/m²/h</span></div>
            <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-emerald-300/40" />
                <div className="w-[15%] bg-amber-300/40" />
                <div className="w-[15%] bg-red-300/40" />
              </div>
              <div className="absolute top-0 h-full w-1 bg-gray-900 rounded-full transition-all duration-300"
                style={{ left: `${Math.min(results.sor / 4, 1) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
              <span>0</span><span>Typical: ≤{tankType.typicalSOR}</span><span>4.0</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">HRT</span>
              <div className="text-2xl font-bold text-gray-900">{(results.hrt * 60).toFixed(0)} <span className="text-sm text-gray-400">min</span></div>
              <div className="text-[10px] text-gray-400 mt-0.5">Target: 90–180 min</div>
            </div>
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Weir Loading</span>
              <div className="text-2xl font-bold text-gray-900">{results.weirLoading.toFixed(1)} <span className="text-sm text-gray-400">m³/m/h</span></div>
              <div className="text-[10px] text-gray-400 mt-0.5">Target: &lt; 10 m³/m/h</div>
            </div>
          </div>

          {/* Sludge production */}
          <div className="rounded-xl p-4 bg-amber-50 border border-amber-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Sludge Production</h5>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Effluent SS</div>
                <div className="text-lg font-bold text-gray-900">{results.effluentSS.toFixed(0)} <span className="text-xs text-gray-400">mg/l</span></div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Dry Solids</div>
                <div className="text-lg font-bold text-gray-900">{results.sludgeProduction.toFixed(0)} <span className="text-xs text-gray-400">kg/h</span></div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Liquid Sludge</div>
                <div className="text-lg font-bold text-gray-900">{results.sludgeLiquid.toFixed(1)} <span className="text-xs text-gray-400">m³/h</span></div>
              </div>
            </div>
            <div className="text-[10px] text-amber-700 mt-2">At assumed 4% DS. Size withdrawal pumps and pipeline accordingly.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   2. PRIMARY SLUDGE PUMPING CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

export function SludgePumpingCalculator() {
  const [sludgeFlow, setSludgeFlow] = useState(5); // m³/h
  const [dsPercent, setDsPercent] = useState(4); // %
  const [pipeLength, setPipeLength] = useState(100); // m
  const [pipeDia, setPipeDia] = useState(150); // mm
  const [staticLift, setStaticLift] = useState(6); // m
  const [numPumps, setNumPumps] = useState(2); // 1D+1S

  const results = useMemo(() => {
    const flowPerPump = sludgeFlow; // m³/h (assuming single duty)
    const flowLs = flowPerPump / 3.6; // l/s

    // Pipe velocity
    const pipeAreaM2 = Math.PI * (pipeDia / 2000) ** 2;
    const velocity = (flowPerPump / 3600) / pipeAreaM2; // m/s

    // Friction head (Hazen-Williams, C=100 for sludge)
    const C = 100;
    const dM = pipeDia / 1000;
    const frictionPerM = (10.67 * (flowPerPump / 3600) ** 1.852) / (C ** 1.852 * dM ** 4.87);
    const frictionHead = frictionPerM * pipeLength;

    const totalHead = staticLift + frictionHead;

    // Dry solids throughput
    const dsTonnesDay = sludgeFlow * (dsPercent / 100) * 24 / 1000; // tonnes/day

    // Power
    const eta = 0.45; // progressive cavity pump efficiency
    const power = (1000 * 9.81 * (flowPerPump / 3600) * totalHead) / (eta * 1000);

    return { flowLs, velocity, frictionHead, totalHead, dsTonnesDay, power };
  }, [sludgeFlow, dsPercent, pipeLength, pipeDia, staticLift, numPumps]);

  const velStatus = results.velocity < 0.5 ? "Low — settlement risk" :
    results.velocity <= 1.5 ? "Good range" : "High — pipe wear risk";
  const velColor = results.velocity < 0.5 ? "text-amber-600" :
    results.velocity <= 1.5 ? "text-emerald-600" : "text-red-600";

  return (
    <div className="my-6 bg-white border border-purple-200 rounded-2xl overflow-hidden">
      <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">🔄</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Sludge Pumping Calculator</h4>
            <p className="text-xs text-gray-500">Withdrawal rate, pipe velocity and head calculation</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Sludge Flow" value={sludgeFlow} onChange={setSludgeFlow} min={1} max={30} step={0.5} unit="m³/h" />
          <SliderInput label="Dry Solids" value={dsPercent} onChange={setDsPercent} min={1} max={8} step={0.5} unit="%" />
          <SliderInput label="Pipeline Length" value={pipeLength} onChange={setPipeLength} min={20} max={500} step={10} unit="m" />
          <SliderInput label="Pipe Diameter" value={pipeDia} onChange={setPipeDia} min={80} max={300} step={10} unit="mm" />
          <SliderInput label="Static Lift" value={staticLift} onChange={setStaticLift} min={1} max={20} step={0.5} unit="m" />

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pumps (D+S)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumPumps(Math.max(2, numPumps - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numPumps}</span>
              <button onClick={() => setNumPumps(Math.min(4, numPumps + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Total Head" value={results.totalHead.toFixed(1)} unit="m" />
              <ResultCard label="Friction Head" value={results.frictionHead.toFixed(1)} unit="m" />
              <ResultCard label="Motor Power" value={results.power.toFixed(1)} unit="kW" />
              <ResultCard label="DS Throughput" value={results.dsTonnesDay.toFixed(1)} unit="tDS/day" />
            </div>
          </div>

          <div className={`rounded-xl p-4 bg-gray-50 border border-gray-200`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pipe Velocity</span>
              <span className={`text-xs font-semibold ${velColor}`}>{velStatus}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{results.velocity.toFixed(2)} <span className="text-sm text-gray-400">m/s</span></div>
            <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 flex">
                <div className="w-[25%] bg-amber-300/40" />
                <div className="w-[50%] bg-emerald-300/40" />
                <div className="w-[25%] bg-red-300/40" />
              </div>
              <div className="absolute top-0 h-full w-1 bg-gray-900 rounded-full transition-all duration-300"
                style={{ left: `${Math.min(results.velocity / 2, 1) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
              <span>0</span><span>0.5</span><span>1.5</span><span>2.0</span>
            </div>
          </div>

          <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/15 rounded-xl px-4 py-3">
            <p className="text-xs text-[#7C3AED] leading-relaxed">
              <strong>Note:</strong> Progressive cavity pumps are typical for primary sludge.
              Ensure anti-run-dry protection, pressure relief, and flushing connections are specified per WIMES.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
