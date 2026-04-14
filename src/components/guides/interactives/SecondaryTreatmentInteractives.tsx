// src/components/guides/interactives/SecondaryTreatmentInteractives.tsx
"use client";

import { useState, useMemo } from "react";

/* ─── Shared components ─── */
function SliderInput({
  label, value, onChange, min, max, step, unit, color = "#EA580C",
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
   1. ASP PROCESS CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

export function ASPProcessCalculator() {
  const [flow, setFlow] = useState(200); // l/s DWF
  const [influentBOD, setInfluentBOD] = useState(250); // mg/l
  const [influentNH4, setInfluentNH4] = useState(40); // mg/l
  const [mlss, setMlss] = useState(3500); // mg/l
  const [tankVol, setTankVol] = useState(5000); // m³ total aeration volume
  const [targetBOD, setTargetBOD] = useState(10); // mg/l consent
  const [temperature, setTemperature] = useState(12); // °C winter design

  const results = useMemo(() => {
    const flowM3d = (flow / 1000) * 86400; // m³/day

    // HRT
    const hrt = tankVol / (flowM3d / 24); // hours

    // F:M ratio
    const massMLSS = (mlss / 1000) * tankVol; // kg MLSS
    const loadBOD = (influentBOD / 1000) * flowM3d; // kg BOD/day
    const fm = loadBOD / massMLSS;

    // SRT (simplified)
    const yieldCoeff = 0.6; // kg VSS / kg BOD removed
    const bodRemoved = ((influentBOD - targetBOD) / 1000) * flowM3d; // kg/day
    const sludgeYield = yieldCoeff * bodRemoved; // kg VSS/day
    const vssRatio = 0.75;
    const srt = (massMLSS * vssRatio) / sludgeYield; // days

    // SAS production
    const sasFlow = sludgeYield / (mlss / 1000 * vssRatio); // m³/day
    const sasFlowLs = sasFlow / 86.4; // l/s

    // Nitrification check (Monod kinetics simplified)
    const muMax = 0.47 * Math.exp(0.098 * (temperature - 15)); // temp adjusted
    const minSRT = 1 / muMax * 1.5; // safety factor
    const nitrificationOK = srt >= minSRT;

    // Oxygen demand
    const carbonOD = bodRemoved * 1.5; // kg O₂/day (approx)
    const nitrogenOD = ((influentNH4 / 1000) * flowM3d) * 4.57; // kg O₂/day
    const totalOD = carbonOD + nitrogenOD;

    return {
      flowM3d, hrt, fm, srt, massMLSS, loadBOD, bodRemoved,
      sludgeYield, sasFlow, sasFlowLs,
      minSRT, nitrificationOK, muMax,
      carbonOD, nitrogenOD, totalOD,
    };
  }, [flow, influentBOD, influentNH4, mlss, tankVol, targetBOD, temperature]);

  const fmStatus = results.fm < 0.05 ? { label: "Very low — extended aeration", color: "text-blue-600" } :
    results.fm <= 0.15 ? { label: "Conventional range", color: "text-emerald-600" } :
    results.fm <= 0.3 ? { label: "High rate", color: "text-amber-600" } :
    { label: "Very high — poor treatment risk", color: "text-red-600" };

  return (
    <div className="my-6 bg-white border border-orange-200 rounded-2xl overflow-hidden">
      <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg">⚡</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">ASP Process Calculator</h4>
            <p className="text-xs text-gray-500">MLSS, SRT, F:M ratio, oxygen demand and SAS production</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="DWF" value={flow} onChange={setFlow} min={50} max={2000} step={10} unit="l/s" />
          <SliderInput label="Influent BOD" value={influentBOD} onChange={setInfluentBOD} min={100} max={500} step={10} unit="mg/l" />
          <SliderInput label="Influent NH₄-N" value={influentNH4} onChange={setInfluentNH4} min={10} max={80} step={5} unit="mg/l" />
          <SliderInput label="MLSS" value={mlss} onChange={setMlss} min={1500} max={8000} step={100} unit="mg/l" />
          <SliderInput label="Aeration Volume" value={tankVol} onChange={setTankVol} min={1000} max={30000} step={500} unit="m³" />
          <SliderInput label="BOD Consent" value={targetBOD} onChange={setTargetBOD} min={5} max={25} step={1} unit="mg/l" />
          <SliderInput label="Design Temperature" value={temperature} onChange={setTemperature} min={5} max={25} step={1} unit="°C" />
        </div>

        <div className="space-y-4">
          {/* F:M and SRT key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-4 border ${results.fm <= 0.15 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">F:M Ratio</span>
              <div className="text-3xl font-bold text-gray-900">{results.fm.toFixed(3)}</div>
              <div className={`text-[10px] font-semibold mt-1 ${fmStatus.color}`}>{fmStatus.label}</div>
            </div>
            <div className={`rounded-xl p-4 border ${results.nitrificationOK ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">SRT</span>
              <div className="text-3xl font-bold text-gray-900">{results.srt.toFixed(1)} <span className="text-sm text-gray-400">days</span></div>
              <div className={`text-[10px] font-semibold mt-1 ${results.nitrificationOK ? "text-emerald-600" : "text-red-600"}`}>
                {results.nitrificationOK ? `✓ Above min ${results.minSRT.toFixed(1)}d for nitrification` : `✗ Below min ${results.minSRT.toFixed(1)}d — nitrification at risk`}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Process Parameters</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="HRT" value={results.hrt.toFixed(1)} unit="hours" />
              <ResultCard label="BOD Load" value={results.loadBOD.toFixed(0)} unit="kg/day" />
              <ResultCard label="MLSS Mass" value={(results.massMLSS / 1000).toFixed(1)} unit="tonnes" />
              <ResultCard label="BOD Removed" value={results.bodRemoved.toFixed(0)} unit="kg/day" />
            </div>
          </div>

          {/* Oxygen demand breakdown */}
          <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Oxygen Demand</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Carbon oxidation</span>
                <span className="text-sm font-bold text-gray-900">{results.carbonOD.toFixed(0)} kg O₂/day</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nitrification</span>
                <span className="text-sm font-bold text-gray-900">{results.nitrogenOD.toFixed(0)} kg O₂/day</span>
              </div>
              <div className="border-t border-blue-200 pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Total AOR</span>
                <span className="text-lg font-bold text-gray-900">{results.totalOD.toFixed(0)} kg O₂/day</span>
              </div>
              {/* Visual split */}
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex mt-2">
                <div className="bg-blue-500 transition-all duration-300" style={{ width: `${(results.carbonOD / results.totalOD) * 100}%` }} />
                <div className="bg-cyan-400 transition-all duration-300" style={{ width: `${(results.nitrogenOD / results.totalOD) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>Carbon ({((results.carbonOD / results.totalOD) * 100).toFixed(0)}%)</span>
                <span>Nitrification ({((results.nitrogenOD / results.totalOD) * 100).toFixed(0)}%)</span>
              </div>
            </div>
          </div>

          {/* SAS production */}
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="SAS Yield" value={results.sludgeYield.toFixed(0)} unit="kg VSS/day" />
            <ResultCard label="SAS Flow" value={results.sasFlowLs.toFixed(2)} unit="l/s" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   2. MBR FLUX CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

export function MBRFluxCalculator() {
  const [flow, setFlow] = useState(100); // l/s
  const [peakFactor, setPeakFactor] = useState(1.5);
  const [designFlux, setDesignFlux] = useState(20); // LMH
  const [peakFlux, setPeakFlux] = useState(30); // LMH
  const [membraneArea, setMembraneArea] = useState(25000); // m²
  const [mlss, setMlss] = useState(8000); // mg/l
  const [temperature, setTemperature] = useState(12); // °C
  const [numTrains, setNumTrains] = useState(4);

  const results = useMemo(() => {
    const avgFlowM3h = (flow / 1000) * 3600;
    const peakFlowM3h = avgFlowM3h * peakFactor;
    const dutyTrains = numTrains - 1;
    const areaPerTrain = membraneArea / numTrains;
    const dutyArea = areaPerTrain * dutyTrains;

    // Actual flux at average flow
    const actualFlux = avgFlowM3h / dutyArea * 1000; // LMH

    // Actual flux at peak flow
    const actualPeakFlux = peakFlowM3h / dutyArea * 1000;

    // Required area for design flux
    const requiredArea = avgFlowM3h * 1000 / designFlux;
    const requiredPeakArea = peakFlowM3h * 1000 / peakFlux;

    // Permeability estimate (temperature adjusted)
    const tempFactor = Math.exp(0.0239 * (temperature - 20));
    const permeability = 200 * tempFactor; // L/m²/h/bar typical

    // TMP estimate
    const tmp = actualFlux / permeability; // bar

    // Spare capacity
    const spareCapacity = ((dutyArea - requiredArea / 1000) / (requiredArea / 1000)) * 100;

    return {
      avgFlowM3h, peakFlowM3h, dutyTrains, areaPerTrain, dutyArea,
      actualFlux, actualPeakFlux, requiredArea, requiredPeakArea,
      permeability, tmp, spareCapacity,
    };
  }, [flow, peakFactor, designFlux, peakFlux, membraneArea, mlss, temperature, numTrains]);

  const fluxOK = results.actualFlux <= designFlux;
  const peakFluxOK = results.actualPeakFlux <= peakFlux;

  return (
    <div className="my-6 bg-white border border-orange-200 rounded-2xl overflow-hidden">
      <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg">🔬</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">MBR Flux Calculator</h4>
            <p className="text-xs text-gray-500">Membrane area, flux rates, TMP and train configuration</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Average Flow" value={flow} onChange={setFlow} min={20} max={1000} step={10} unit="l/s" />
          <SliderInput label="Peak Factor" value={peakFactor} onChange={setPeakFactor} min={1} max={3} step={0.1} unit="×" />
          <SliderInput label="Design Flux" value={designFlux} onChange={setDesignFlux} min={10} max={35} step={1} unit="LMH" />
          <SliderInput label="Peak Flux" value={peakFlux} onChange={setPeakFlux} min={15} max={50} step={1} unit="LMH" />
          <SliderInput label="Total Membrane Area" value={membraneArea} onChange={setMembraneArea} min={5000} max={100000} step={1000} unit="m²" />
          <SliderInput label="MLSS" value={mlss} onChange={setMlss} min={5000} max={15000} step={500} unit="mg/l" />
          <SliderInput label="Design Temperature" value={temperature} onChange={setTemperature} min={5} max={25} step={1} unit="°C" />

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Membrane Trains</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumTrains(Math.max(2, numTrains - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numTrains}</span>
              <button onClick={() => setNumTrains(Math.min(10, numTrains + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Flux gauges */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-4 border ${fluxOK ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Avg Flux</span>
              <div className="text-3xl font-bold text-gray-900">{results.actualFlux.toFixed(1)}</div>
              <div className="text-xs text-gray-400">LMH (target ≤ {designFlux})</div>
              <div className={`text-[10px] font-semibold mt-1 ${fluxOK ? "text-emerald-600" : "text-red-600"}`}>
                {fluxOK ? "✓ Within design" : "✗ Exceeds design flux"}
              </div>
            </div>
            <div className={`rounded-xl p-4 border ${peakFluxOK ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Peak Flux</span>
              <div className="text-3xl font-bold text-gray-900">{results.actualPeakFlux.toFixed(1)}</div>
              <div className="text-xs text-gray-400">LMH (target ≤ {peakFlux})</div>
              <div className={`text-[10px] font-semibold mt-1 ${peakFluxOK ? "text-emerald-600" : "text-red-600"}`}>
                {peakFluxOK ? "✓ Within peak design" : "✗ Exceeds peak flux"}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Configuration</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Duty Trains" value={`${results.dutyTrains}`} unit={`of ${numTrains}`} />
              <ResultCard label="Area per Train" value={results.areaPerTrain.toFixed(0)} unit="m²" />
              <ResultCard label="TMP Estimate" value={(results.tmp * 1000).toFixed(0)} unit="mbar" />
              <ResultCard label="Permeability" value={results.permeability.toFixed(0)} unit="LMH/bar" />
            </div>
          </div>

          {/* Train status visual */}
          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">Train Status</span>
            <div className="flex gap-2">
              {Array.from({ length: numTrains }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-10 rounded-lg flex items-center justify-center text-xs font-bold border transition-all ${
                    i < results.dutyTrains
                      ? "bg-orange-100 border-orange-300 text-orange-700"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {i < results.dutyTrains ? `D${i + 1}` : "S"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   3. AERATION DEMAND CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

export function AerationDemandCalculator() {
  const [totalAOR, setTotalAOR] = useState(2000); // kg O₂/day
  const [alpha, setAlpha] = useState(0.5); // alpha factor
  const [beta, setBeta] = useState(0.95);
  const [diffuserDepth, setDiffuserDepth] = useState(5); // m
  const [sote, setSote] = useState(30); // % per m depth
  const [temperature, setTemperature] = useState(12); // °C
  const [targetDO, setTargetDO] = useState(2.0); // mg/l
  const [numBlowers, setNumBlowers] = useState(3); // 2D+1S
  const [safetyFactor, setSafetyFactor] = useState(1.3);

  const results = useMemo(() => {
    // Saturation DO at temperature
    const csT = 14.62 - 0.3898 * temperature + 0.006969 * temperature ** 2 - 0.00005896 * temperature ** 3;
    const cs20 = 9.09; // mg/l at 20°C

    // SOTR from AOR
    const thetaT = 1.024 ** (temperature - 20);
    const sotr = totalAOR / (alpha * thetaT * (beta * csT - targetDO) / cs20) * safetyFactor;

    // Air flow required
    const oxygenInAir = 0.2318; // kg O₂ per m³ air at STP
    const totalSOTE = (sote / 100) * diffuserDepth; // fractional
    const airFlowM3h = sotr / (24 * oxygenInAir * totalSOTE);

    // Per blower (duty)
    const dutyBlowers = numBlowers - 1;
    const airPerBlower = airFlowM3h / dutyBlowers;

    // Approx blower power (isothermal compression, very simplified)
    const pressureBar = 1 + (diffuserDepth * 9.81 * 1000) / 100000 + 0.1; // hydrostatic + losses
    const blowerPower = (airPerBlower / 3600) * 100000 * Math.log(pressureBar) / (0.75 * 1000); // kW

    // Number of diffusers (typical 6 Nm³/h per disc)
    const diffuserRate = 6; // Nm³/h per diffuser
    const numDiffusers = Math.ceil(airFlowM3h / diffuserRate);

    return {
      csT, sotr, airFlowM3h, dutyBlowers, airPerBlower, blowerPower,
      numDiffusers, totalSOTE: totalSOTE * 100, pressureBar,
    };
  }, [totalAOR, alpha, beta, diffuserDepth, sote, temperature, targetDO, numBlowers, safetyFactor]);

  return (
    <div className="my-6 bg-white border border-orange-200 rounded-2xl overflow-hidden">
      <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg">💨</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Aeration Demand Calculator</h4>
            <p className="text-xs text-gray-500">SOTR, air flow, blower sizing and diffuser count</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Total AOR" value={totalAOR} onChange={setTotalAOR} min={200} max={20000} step={100} unit="kg O₂/day" />
          <SliderInput label="Alpha Factor (α)" value={alpha} onChange={setAlpha} min={0.3} max={0.9} step={0.05} unit="" />
          <SliderInput label="Beta Factor (β)" value={beta} onChange={setBeta} min={0.8} max={1.0} step={0.01} unit="" />
          <SliderInput label="Diffuser Depth" value={diffuserDepth} onChange={setDiffuserDepth} min={2} max={8} step={0.5} unit="m" />
          <SliderInput label="SOTE" value={sote} onChange={setSote} min={15} max={45} step={1} unit="% per m" />
          <SliderInput label="Temperature" value={temperature} onChange={setTemperature} min={5} max={25} step={1} unit="°C" />
          <SliderInput label="Target DO" value={targetDO} onChange={setTargetDO} min={0.5} max={4} step={0.5} unit="mg/l" />
          <SliderInput label="Safety Factor" value={safetyFactor} onChange={setSafetyFactor} min={1.0} max={2.0} step={0.1} unit="×" />

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Blowers (D+S)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumBlowers(Math.max(2, numBlowers - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numBlowers}</span>
              <button onClick={() => setNumBlowers(Math.min(6, numBlowers + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Key outputs */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Oxygen Transfer</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">SOTR Required</div>
                <div className="text-2xl font-bold text-gray-900">{results.sotr.toFixed(0)} <span className="text-xs text-gray-400">kg O₂/day</span></div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Total SOTE</div>
                <div className="text-2xl font-bold text-gray-900">{results.totalSOTE.toFixed(0)} <span className="text-xs text-gray-400">%</span></div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">DO Saturation</div>
                <div className="text-2xl font-bold text-gray-900">{results.csT.toFixed(1)} <span className="text-xs text-gray-400">mg/l</span></div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Discharge Press.</div>
                <div className="text-2xl font-bold text-gray-900">{results.pressureBar.toFixed(2)} <span className="text-xs text-gray-400">bar(a)</span></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Blower Sizing</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Total Air Flow" value={results.airFlowM3h.toFixed(0)} unit="Nm³/h" />
              <ResultCard label="Per Blower" value={results.airPerBlower.toFixed(0)} unit="Nm³/h" />
              <ResultCard label="Blower Power" value={results.blowerPower.toFixed(0)} unit="kW each" />
              <ResultCard label="Duty Blowers" value={results.dutyBlowers.toString()} unit={`of ${numBlowers}`} />
            </div>
          </div>

          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Diffuser Count</span>
              <span className="text-xs text-gray-400">At 6 Nm³/h per disc</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{results.numDiffusers.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400 mt-1">Fine-bubble disc diffusers — verify with supplier for specific membrane and layout</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Values are indicative. Always confirm SOTR/SOTE with diffuser manufacturer clean-water test data
              and apply site-specific α, β, and fouling factors per WIMES requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
