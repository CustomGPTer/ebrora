// src/components/guides/interactives/Batch7Interactives.tsx
"use client";

import { useState, useMemo } from "react";

/* ─── Shared ─── */
function SliderInput({ label, value, onChange, min, max, step, unit, color = "#1B5B50" }: {
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
   1. RAS / SAS CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

export function RASSASCalculator() {
  const [influentFlow, setInfluentFlow] = useState(200); // l/s
  const [rasRatio, setRasRatio] = useState(1.0); // RAS:Q ratio
  const [mlss, setMlss] = useState(3500); // mg/l
  const [rasConc, setRasConc] = useState(8000); // mg/l RAS concentration
  const [targetSRT, setTargetSRT] = useState(12); // days
  const [aerationVol, setAerationVol] = useState(5000); // m³
  const [numRasPumps, setNumRasPumps] = useState(3); // 2D+1S
  const [numSasPumps, setNumSasPumps] = useState(2); // 1D+1S

  const results = useMemo(() => {
    const qInfluent = influentFlow / 1000 * 3600; // m³/h
    const rasFlow = qInfluent * rasRatio; // m³/h
    const rasFlowLs = rasFlow / 3.6; // l/s

    // Clarifier underflow check: RAS conc should be > MLSS
    const theoreticalRASConc = mlss * (1 + rasRatio) / rasRatio;

    // SAS wasting rate for target SRT
    const totalMLSS_kg = (mlss / 1000) * aerationVol; // kg
    const sasRate_kgD = totalMLSS_kg / targetSRT; // kg MLSS/day
    const sasFlow_m3d = sasRate_kgD / (rasConc / 1000); // m³/day (wasting from RAS line)
    const sasFlow_ls = sasFlow_m3d / 86.4; // l/s

    // Actual SRT check
    const actualSRT = totalMLSS_kg / sasRate_kgD;

    // Per pump flows
    const dutyRAS = numRasPumps - 1;
    const dutySAS = numSasPumps - 1;
    const rasPerPump = rasFlowLs / Math.max(dutyRAS, 1);
    const sasPerPump = (sasFlow_ls) / Math.max(dutySAS, 1);

    // Sludge settleability indicator (SSVI-like)
    const svRatio = rasConc / mlss;
    const settleability = svRatio > 2.5 ? "Good" : svRatio > 1.8 ? "Fair" : "Poor — check for bulking";
    const settleColor = svRatio > 2.5 ? "text-emerald-600" : svRatio > 1.8 ? "text-amber-600" : "text-red-600";

    return {
      rasFlow, rasFlowLs, theoreticalRASConc,
      sasRate_kgD, sasFlow_m3d, sasFlow_ls, actualSRT,
      totalMLSS_kg, dutyRAS, dutySAS, rasPerPump, sasPerPump,
      svRatio, settleability, settleColor,
    };
  }, [influentFlow, rasRatio, mlss, rasConc, targetSRT, aerationVol, numRasPumps, numSasPumps]);

  return (
    <div className="my-6 bg-white border border-orange-200 rounded-2xl overflow-hidden">
      <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg">🔄</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">RAS / SAS Calculator</h4>
            <p className="text-xs text-gray-500">Return ratio, SAS wasting rate and sludge age control</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Influent Flow (DWF)" value={influentFlow} onChange={setInfluentFlow} min={50} max={2000} step={10} unit="l/s" color="#EA580C" />
          <SliderInput label="RAS Ratio (RAS:Q)" value={rasRatio} onChange={setRasRatio} min={0.3} max={2.0} step={0.1} unit="×" color="#EA580C" />
          <SliderInput label="MLSS" value={mlss} onChange={setMlss} min={1500} max={8000} step={100} unit="mg/l" color="#EA580C" />
          <SliderInput label="RAS Concentration" value={rasConc} onChange={setRasConc} min={4000} max={15000} step={500} unit="mg/l" color="#EA580C" />
          <SliderInput label="Target SRT" value={targetSRT} onChange={setTargetSRT} min={3} max={30} step={1} unit="days" color="#EA580C" />
          <SliderInput label="Aeration Volume" value={aerationVol} onChange={setAerationVol} min={1000} max={30000} step={500} unit="m³" color="#EA580C" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">RAS Pumps</label>
              <div className="flex items-center gap-1">
                <button onClick={() => setNumRasPumps(Math.max(2, numRasPumps - 1))} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">−</button>
                <span className="text-sm font-bold text-gray-900 w-6 text-center">{numRasPumps}</span>
                <button onClick={() => setNumRasPumps(Math.min(6, numRasPumps + 1))} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SAS Pumps</label>
              <div className="flex items-center gap-1">
                <button onClick={() => setNumSasPumps(Math.max(2, numSasPumps - 1))} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">−</button>
                <span className="text-sm font-bold text-gray-900 w-6 text-center">{numSasPumps}</span>
                <button onClick={() => setNumSasPumps(Math.min(4, numSasPumps + 1))} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* RAS / SAS flow visual */}
          <div className="rounded-xl p-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-orange-200 p-3 text-center">
                <div className="text-[10px] text-orange-600 uppercase font-semibold">RAS Flow</div>
                <div className="text-2xl font-bold text-gray-900">{results.rasFlowLs.toFixed(0)}</div>
                <div className="text-xs text-gray-400">l/s</div>
                <div className="text-[10px] text-gray-500 mt-1">{results.rasPerPump.toFixed(0)} l/s per pump</div>
              </div>
              <div className="bg-white rounded-lg border border-amber-200 p-3 text-center">
                <div className="text-[10px] text-amber-600 uppercase font-semibold">SAS Flow</div>
                <div className="text-2xl font-bold text-gray-900">{results.sasFlow_ls.toFixed(2)}</div>
                <div className="text-xs text-gray-400">l/s</div>
                <div className="text-[10px] text-gray-500 mt-1">{results.sasFlow_m3d.toFixed(1)} m³/day</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Total MLSS Mass" value={(results.totalMLSS_kg / 1000).toFixed(1)} unit="tonnes" />
              <ResultCard label="SAS Wasting" value={results.sasRate_kgD.toFixed(0)} unit="kg/day" />
              <ResultCard label="SRT" value={results.actualSRT.toFixed(1)} unit="days" />
              <ResultCard label="RAS Conc (theoretical)" value={results.theoreticalRASConc.toFixed(0)} unit="mg/l" />
            </div>
          </div>

          <div className={`rounded-xl p-4 border bg-gray-50 border-gray-200`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settleability Indicator</span>
              <span className={`text-xs font-semibold ${results.settleColor}`}>{results.settleability}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{results.svRatio.toFixed(1)}:1 <span className="text-sm text-gray-400">RAS:MLSS ratio</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   2. MCERTS FLOW MEASUREMENT CHECKER
   ════════════════════════════════════════════════════════════════════ */

const FLUME_TYPES = [
  { id: "venturi", label: "Venturi Flume", minStraight: 10, accuracy: "±2%" },
  { id: "parshall", label: "Parshall Flume", minStraight: 10, accuracy: "±3%" },
  { id: "rectangular", label: "Rectangular Thin-plate Weir", minStraight: 15, accuracy: "±1.5%" },
  { id: "vnotch", label: "V-notch Weir", minStraight: 15, accuracy: "±1%" },
  { id: "ultrasonic", label: "Ultrasonic (area-velocity)", minStraight: 5, accuracy: "±2–5%" },
  { id: "mag", label: "Electromagnetic", minStraight: 5, accuracy: "±0.5%" },
];

export function MCERTSFlowChecker() {
  const [flumeIdx, setFlumeIdx] = useState(0);
  const [pipeOrChannelDia, setPipeOrChannelDia] = useState(600); // mm
  const [upstreamStraight, setUpstreamStraight] = useState(10); // pipe diameters
  const [downstreamStraight, setDownstreamStraight] = useState(5);
  const [maxFlow, setMaxFlow] = useState(500); // l/s
  const [minFlow, setMinFlow] = useState(20); // l/s

  const flume = FLUME_TYPES[flumeIdx];

  const results = useMemo(() => {
    const upstreamM = (upstreamStraight * pipeOrChannelDia) / 1000;
    const downstreamM = (downstreamStraight * pipeOrChannelDia) / 1000;
    const upstreamOK = upstreamStraight >= flume.minStraight;
    const downstreamOK = downstreamStraight >= 3; // typical minimum

    const turndownRatio = maxFlow / Math.max(minFlow, 1);
    const turndownOK = turndownRatio <= 20; // typical max for MCERTS

    // Velocity at max flow (pipe full)
    const pipeArea = Math.PI * (pipeOrChannelDia / 2000) ** 2;
    const maxVelocity = (maxFlow / 1000) / pipeArea;
    const minVelocity = (minFlow / 1000) / pipeArea;

    return {
      upstreamM, downstreamM, upstreamOK, downstreamOK,
      turndownRatio, turndownOK, maxVelocity, minVelocity,
    };
  }, [flumeIdx, pipeOrChannelDia, upstreamStraight, downstreamStraight, maxFlow, minFlow, flume]);

  const allChecks = [
    { label: "Upstream straight length", ok: results.upstreamOK, detail: `${upstreamStraight}D (${results.upstreamM.toFixed(1)}m) — min ${flume.minStraight}D` },
    { label: "Downstream straight length", ok: results.downstreamOK, detail: `${downstreamStraight}D (${results.downstreamM.toFixed(1)}m) — min 3D` },
    { label: "Turndown ratio", ok: results.turndownOK, detail: `${results.turndownRatio.toFixed(0)}:1 — max 20:1 for MCERTS` },
    { label: "Min velocity > 0.15 m/s", ok: results.minVelocity >= 0.15, detail: `${results.minVelocity.toFixed(2)} m/s at min flow` },
    { label: "Max velocity < 3.0 m/s", ok: results.maxVelocity <= 3.0, detail: `${results.maxVelocity.toFixed(2)} m/s at max flow` },
  ];

  const passCount = allChecks.filter(c => c.ok).length;

  return (
    <div className="my-6 bg-white border border-indigo-200 rounded-2xl overflow-hidden">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">📡</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">MCERTS Flow Measurement Checker</h4>
            <p className="text-xs text-gray-500">Installation compliance, straight lengths and turndown ratio</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Device Type</label>
            <div className="space-y-1.5">
              {FLUME_TYPES.map((f, i) => (
                <button key={f.id} onClick={() => setFlumeIdx(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all flex justify-between ${
                    i === flumeIdx ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  <span>{f.label}</span>
                  <span className="text-gray-400">{f.accuracy}</span>
                </button>
              ))}
            </div>
          </div>

          <SliderInput label="Pipe / Channel Size" value={pipeOrChannelDia} onChange={setPipeOrChannelDia} min={100} max={2000} step={50} unit="mm" color="#6366F1" />
          <SliderInput label="Upstream Straight (× diameter)" value={upstreamStraight} onChange={setUpstreamStraight} min={0} max={30} step={1} unit="D" color="#6366F1" />
          <SliderInput label="Downstream Straight (× diameter)" value={downstreamStraight} onChange={setDownstreamStraight} min={0} max={15} step={1} unit="D" color="#6366F1" />
          <SliderInput label="Maximum Flow" value={maxFlow} onChange={setMaxFlow} min={10} max={5000} step={10} unit="l/s" color="#6366F1" />
          <SliderInput label="Minimum Flow" value={minFlow} onChange={setMinFlow} min={1} max={200} step={1} unit="l/s" color="#6366F1" />
        </div>

        <div className="space-y-4">
          {/* Compliance summary */}
          <div className={`rounded-xl p-4 border-2 ${passCount === allChecks.length ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-900">Installation Compliance</span>
              <span className={`text-sm font-bold ${passCount === allChecks.length ? "text-emerald-600" : "text-amber-600"}`}>
                {passCount}/{allChecks.length} checks pass
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(passCount / allChecks.length) * 100}%`, backgroundColor: passCount === allChecks.length ? "#059669" : "#EA580C" }} />
            </div>

            <div className="space-y-2">
              {allChecks.map((check, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`shrink-0 mt-0.5 text-sm ${check.ok ? "text-emerald-500" : "text-red-500"}`}>
                    {check.ok ? "✓" : "✗"}
                  </span>
                  <div>
                    <div className={`text-xs font-semibold ${check.ok ? "text-gray-700" : "text-red-700"}`}>{check.label}</div>
                    <div className="text-[10px] text-gray-500">{check.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Device Accuracy" value={flume.accuracy} unit="" />
              <ResultCard label="Turndown" value={`${results.turndownRatio.toFixed(0)}:1`} unit="" />
              <ResultCard label="Max Velocity" value={results.maxVelocity.toFixed(2)} unit="m/s" />
              <ResultCard label="Min Velocity" value={results.minVelocity.toFixed(2)} unit="m/s" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
            <p className="text-xs text-purple-800">
              <strong>MCERTS:</strong> Verify all installation requirements against EA MCERTS guidance.
              Calibration certificates, verification reports and maintenance plans must be in place before commissioning sign-off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   3. ODOUR VENTILATION CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

export function OdourVentilationCalculator() {
  const [coveredArea, setCoveredArea] = useState(200); // m²
  const [headspace, setHeadspace] = useState(1.5); // m
  const [airChanges, setAirChanges] = useState(6); // per hour
  const [numScrubbers, setNumScrubbers] = useState(2); // 1D+1S
  const [ductLength, setDuctLength] = useState(80); // m
  const [ductDia, setDuctDia] = useState(400); // mm
  const [h2sInlet, setH2sInlet] = useState(50); // ppm

  const results = useMemo(() => {
    const enclosedVol = coveredArea * headspace; // m³
    const extractRate = enclosedVol * airChanges; // m³/h
    const extractRateM3s = extractRate / 3600;

    // Duct velocity
    const ductArea = Math.PI * (ductDia / 2000) ** 2;
    const ductVelocity = extractRateM3s / ductArea;

    // Friction loss (simplified)
    const frictionPer100m = 0.5 * (ductVelocity ** 2) * 1.2; // Pa/100m approx
    const totalFriction = (frictionPer100m / 100) * ductLength;

    // Scrubber sizing
    const dutyScrubbers = numScrubbers - 1;
    const ratePerScrubber = extractRate / Math.max(dutyScrubbers, 1);

    // Contact time estimate
    const scrubberVol = ratePerScrubber / 3600 * 2.5; // 2.5s contact time
    const scrubberDia = Math.sqrt((scrubberVol / 3) * 4 / Math.PI); // 3m packed height

    // Removal efficiency estimate
    const removalEff = h2sInlet <= 25 ? 99 : h2sInlet <= 100 ? 95 : 90;
    const h2sOutlet = h2sInlet * (1 - removalEff / 100);

    return {
      enclosedVol, extractRate, extractRateM3s,
      ductVelocity, totalFriction, dutyScrubbers, ratePerScrubber,
      scrubberVol, scrubberDia, removalEff, h2sOutlet,
    };
  }, [coveredArea, headspace, airChanges, numScrubbers, ductLength, ductDia, h2sInlet]);

  const velOK = results.ductVelocity >= 8 && results.ductVelocity <= 18;

  return (
    <div className="my-6 bg-white border border-indigo-200 rounded-2xl overflow-hidden">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">💨</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Odour Ventilation Calculator</h4>
            <p className="text-xs text-gray-500">Extract rate, duct sizing and scrubber capacity</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Covered Area" value={coveredArea} onChange={setCoveredArea} min={20} max={2000} step={10} unit="m²" color="#6366F1" />
          <SliderInput label="Headspace Height" value={headspace} onChange={setHeadspace} min={0.5} max={4} step={0.5} unit="m" color="#6366F1" />
          <SliderInput label="Air Changes" value={airChanges} onChange={setAirChanges} min={2} max={15} step={1} unit="/hr" color="#6366F1" />
          <SliderInput label="Duct Run Length" value={ductLength} onChange={setDuctLength} min={10} max={300} step={10} unit="m" color="#6366F1" />
          <SliderInput label="Duct Diameter" value={ductDia} onChange={setDuctDia} min={200} max={1000} step={50} unit="mm" color="#6366F1" />
          <SliderInput label="Inlet H₂S" value={h2sInlet} onChange={setH2sInlet} min={5} max={200} step={5} unit="ppm" color="#6366F1" />
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Scrubbers (D+S)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumScrubbers(Math.max(2, numScrubbers - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numScrubbers}</span>
              <button onClick={() => setNumScrubbers(Math.min(4, numScrubbers + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Extract System</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Enclosed Volume" value={results.enclosedVol.toFixed(0)} unit="m³" />
              <ResultCard label="Total Extract Rate" value={results.extractRate.toFixed(0)} unit="m³/h" />
              <ResultCard label="Per Scrubber" value={results.ratePerScrubber.toFixed(0)} unit="m³/h" />
              <ResultCard label="System Friction" value={results.totalFriction.toFixed(0)} unit="Pa" />
            </div>
          </div>

          <div className={`rounded-xl p-4 border ${velOK ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duct Velocity</span>
              <span className={`text-xs font-semibold ${velOK ? "text-emerald-600" : "text-amber-600"}`}>
                {velOK ? "Good range (8–18 m/s)" : "Outside recommended range"}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{results.ductVelocity.toFixed(1)} <span className="text-sm text-gray-400">m/s</span></div>
          </div>

          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Scrubber Sizing</h5>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Packed Vol</div>
                <div className="text-lg font-bold text-gray-900">{results.scrubberVol.toFixed(1)} <span className="text-xs text-gray-400">m³</span></div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Est. Diameter</div>
                <div className="text-lg font-bold text-gray-900">{results.scrubberDia.toFixed(1)} <span className="text-xs text-gray-400">m</span></div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">H₂S Outlet</div>
                <div className="text-lg font-bold text-gray-900">{results.h2sOutlet.toFixed(1)} <span className="text-xs text-gray-400">ppm</span></div>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mt-2">Based on {results.removalEff}% removal at 2.5s contact, 3m packed height</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   4. PROGRAMME / CARBON ESTIMATOR
   ════════════════════════════════════════════════════════════════════ */

const CARBON_ITEMS = [
  { id: "concrete", label: "Concrete (C40)", kgCO2PerUnit: 300, unit: "m³", defaultQty: 2500, icon: "🧱" },
  { id: "rebar", label: "Reinforcement", kgCO2PerUnit: 1850, unit: "tonnes", defaultQty: 300, icon: "🔩" },
  { id: "structural_steel", label: "Structural Steel", kgCO2PerUnit: 2500, unit: "tonnes", defaultQty: 50, icon: "🏗️" },
  { id: "pipework", label: "Pipework (ductile iron)", kgCO2PerUnit: 2000, unit: "tonnes", defaultQty: 40, icon: "🔧" },
  { id: "grp", label: "GRP Covers & Structures", kgCO2PerUnit: 5000, unit: "tonnes", defaultQty: 15, icon: "🛡️" },
  { id: "earthworks", label: "Earthworks (excavate/fill)", kgCO2PerUnit: 5, unit: "m³", defaultQty: 15000, icon: "⛏️" },
  { id: "transport", label: "Material Transport", kgCO2PerUnit: 100, unit: "loads", defaultQty: 500, icon: "🚛" },
  { id: "site_energy", label: "Site Energy (temp power)", kgCO2PerUnit: 0.233, unit: "kWh", defaultQty: 500000, icon: "⚡" },
];

export function CarbonEstimator() {
  const [items, setItems] = useState<Record<string, number>>(
    () => Object.fromEntries(CARBON_ITEMS.map(i => [i.id, i.defaultQty]))
  );

  const updateQty = (id: string, qty: number) => {
    setItems(prev => ({ ...prev, [id]: qty }));
  };

  const results = useMemo(() => {
    let total = 0;
    const breakdown = CARBON_ITEMS.map(item => {
      const qty = items[item.id] || 0;
      const tCO2 = (qty * item.kgCO2PerUnit) / 1000;
      total += tCO2;
      return { ...item, qty, tCO2 };
    });
    return { breakdown, total };
  }, [items]);

  const maxItem = results.breakdown.reduce((a, b) => a.tCO2 > b.tCO2 ? a : b);

  return (
    <div className="my-6 bg-white border border-indigo-200 rounded-2xl overflow-hidden">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">🌍</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Embodied Carbon Estimator</h4>
            <p className="text-xs text-gray-500">Indicative tCO₂e for new-build WWTW elements</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Items table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                <th className="text-left pb-2 font-semibold">Element</th>
                <th className="text-center pb-2 font-semibold w-24">Quantity</th>
                <th className="text-center pb-2 font-semibold w-16">Unit</th>
                <th className="text-center pb-2 font-semibold w-24">kgCO₂e/unit</th>
                <th className="text-right pb-2 font-semibold w-24">tCO₂e</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.breakdown.map(item => (
                <tr key={item.id}>
                  <td className="py-2 text-gray-700 font-medium text-xs">
                    <span className="mr-1.5">{item.icon}</span>{item.label}
                  </td>
                  <td className="py-2">
                    <input type="number" value={item.qty} min={0} step={item.unit === "kWh" ? 10000 : item.unit === "m³" ? 100 : 10}
                      onChange={(e) => updateQty(item.id, Number(e.target.value))}
                      className="w-full text-center text-xs border border-gray-200 rounded-md py-1 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none" />
                  </td>
                  <td className="py-2 text-center text-xs text-gray-400">{item.unit}</td>
                  <td className="py-2 text-center text-xs text-gray-400">{item.kgCO2PerUnit.toLocaleString()}</td>
                  <td className="py-2 text-right font-semibold text-gray-900 text-xs">{item.tCO2.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td colSpan={4} className="py-3 text-sm font-bold text-gray-900">Total Embodied Carbon</td>
                <td className="py-3 text-right text-lg font-bold text-[#1B5B50]">{results.total.toFixed(0)} tCO₂e</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Breakdown chart */}
        <div className="space-y-2">
          {results.breakdown
            .filter(i => i.tCO2 > 0)
            .sort((a, b) => b.tCO2 - a.tCO2)
            .map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-36 shrink-0 truncate">{item.icon} {item.label}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1B5B50] rounded-full transition-all duration-500"
                    style={{ width: `${(item.tCO2 / maxItem.tCO2) * 100}%`, opacity: 0.3 + (item.tCO2 / maxItem.tCO2) * 0.7 }} />
                </div>
                <span className="text-xs font-bold text-gray-700 w-16 text-right">{item.tCO2.toFixed(0)}</span>
              </div>
            ))}
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Values are indicative using PAS 2080 / ICE Database factors.
            Actual figures depend on supply chain, transport distances, energy mix and design efficiency.
            Use for early-stage comparison only — full LCA is needed for formal reporting.
          </p>
        </div>
      </div>
    </div>
  );
}
