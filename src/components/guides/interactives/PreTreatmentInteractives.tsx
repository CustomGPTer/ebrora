// src/components/guides/interactives/PreTreatmentInteractives.tsx
"use client";

import { useState, useMemo } from "react";

/* ════════════════════════════════════════════════════════════════════
   1. SCREEN SIZING CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

const SCREEN_TYPES = [
  { id: "perforated", label: "Perforated Plate", defaultAperture: 6, kFactor: 1.0 },
  { id: "wedgewire", label: "Wedge-wire", defaultAperture: 3, kFactor: 0.85 },
  { id: "stepped", label: "Stepped Screen", defaultAperture: 6, kFactor: 0.95 },
  { id: "drum", label: "Drum / Rotary", defaultAperture: 3, kFactor: 0.90 },
];

export function ScreenSizingCalculator() {
  const [dwf, setDwf] = useState(200); // l/s
  const [peakFactor, setPeakFactor] = useState(3); // FFT = DWF × factor
  const [aperture, setAperture] = useState(6); // mm
  const [screenTypeIdx, setScreenTypeIdx] = useState(0);
  const [numChannels, setNumChannels] = useState(3); // duty + standby
  const [channelWidth, setChannelWidth] = useState(1.2); // m
  const [blindingPct, setBlindingPct] = useState(50); // % blockage

  const screenType = SCREEN_TYPES[screenTypeIdx];
  const fft = dwf * peakFactor; // l/s

  const results = useMemo(() => {
    const dutyChannels = numChannels - 1; // 1 standby
    const flowPerChannel = fft / Math.max(dutyChannels, 1); // l/s
    const flowPerChannelM3s = flowPerChannel / 1000; // m³/s

    // Approach velocity (target 0.6–1.2 m/s)
    const waterDepth = 1.0; // assumed 1m depth
    const channelArea = channelWidth * waterDepth; // m²
    const approachVelocity = flowPerChannelM3s / channelArea; // m/s

    // Effective open area considering blinding
    const openFraction = (100 - blindingPct) / 100;
    const effectiveArea = channelArea * openFraction * screenType.kFactor;

    // Through-screen velocity
    const throughVelocity = flowPerChannelM3s / Math.max(effectiveArea, 0.01);

    // Headloss (simplified Kirschmer-type: ΔH = k × (v²/2g))
    const k = 2.4 * (1 / openFraction - 1); // loss coefficient
    const headloss = k * (throughVelocity * throughVelocity) / (2 * 9.81) * 1000; // mm

    // Total required area across all duty channels
    const totalScreenArea = dutyChannels * channelArea;

    return {
      fft,
      dutyChannels,
      flowPerChannel,
      approachVelocity,
      throughVelocity,
      headloss: Math.round(headloss),
      totalScreenArea,
    };
  }, [dwf, peakFactor, numChannels, channelWidth, blindingPct, screenType]);

  const velocityStatus = (v: number) => {
    if (v < 0.3) return { label: "Too low — sedimentation risk", color: "text-red-600", bg: "bg-red-50" };
    if (v < 0.6) return { label: "Low — check for settlement", color: "text-amber-600", bg: "bg-amber-50" };
    if (v <= 1.2) return { label: "Good range", color: "text-emerald-600", bg: "bg-emerald-50" };
    return { label: "High — rag carryover risk", color: "text-red-600", bg: "bg-red-50" };
  };

  const headlossStatus = (h: number) => {
    if (h < 50) return { label: "Clean", color: "text-emerald-600" };
    if (h < 150) return { label: "Normal", color: "text-amber-600" };
    if (h < 300) return { label: "High — cleaning due", color: "text-orange-600" };
    return { label: "Critical — blinding alarm", color: "text-red-600" };
  };

  const velStatus = velocityStatus(results.approachVelocity);
  const hlStatus = headlossStatus(results.headloss);

  return (
    <div className="my-6 bg-white border border-emerald-200 rounded-2xl overflow-hidden">
      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Screen Sizing Explorer</h4>
            <p className="text-xs text-gray-500">Adjust parameters to see velocity, headloss and sizing impacts</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-5">
          {/* Screen type */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Screen Type</label>
            <div className="grid grid-cols-2 gap-2">
              {SCREEN_TYPES.map((st, i) => (
                <button
                  key={st.id}
                  onClick={() => { setScreenTypeIdx(i); setAperture(st.defaultAperture); }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    i === screenTypeIdx
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* DWF */}
          <SliderInput label="Dry Weather Flow (DWF)" value={dwf} onChange={setDwf} min={50} max={2000} step={10} unit="l/s" color="#059669" />

          {/* Peak factor */}
          <SliderInput label="Storm Peaking Factor (× DWF)" value={peakFactor} onChange={setPeakFactor} min={1} max={6} step={0.5} unit="×" color="#059669" />

          {/* Aperture */}
          <SliderInput label="Aperture Size" value={aperture} onChange={setAperture} min={1} max={12} step={1} unit="mm" color="#059669" />

          {/* Channels */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Channels (inc. standby)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumChannels(Math.max(2, numChannels - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numChannels}</span>
              <button onClick={() => setNumChannels(Math.min(8, numChannels + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>

          {/* Channel width */}
          <SliderInput label="Channel Width" value={channelWidth} onChange={setChannelWidth} min={0.6} max={2.5} step={0.1} unit="m" color="#059669" />

          {/* Blinding */}
          <SliderInput label="Blinding Factor" value={blindingPct} onChange={setBlindingPct} min={0} max={80} step={5} unit="%" color="#059669" />
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Flow Summary</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Full Flow to Treatment" value={results.fft.toFixed(0)} unit="l/s" />
              <ResultCard label="Duty Channels" value={results.dutyChannels.toString()} unit={`of ${numChannels}`} />
              <ResultCard label="Flow per Channel" value={results.flowPerChannel.toFixed(0)} unit="l/s" />
              <ResultCard label="Total Screen Area" value={results.totalScreenArea.toFixed(1)} unit="m²" />
            </div>
          </div>

          {/* Velocity gauge */}
          <div className={`rounded-xl p-4 border ${velStatus.bg} border-current/10`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approach Velocity</span>
              <span className={`text-xs font-semibold ${velStatus.color}`}>{velStatus.label}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{results.approachVelocity.toFixed(2)} <span className="text-sm font-medium text-gray-400">m/s</span></div>
            <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 flex">
                <div className="w-[20%] bg-red-300/50" />
                <div className="w-[20%] bg-amber-300/50" />
                <div className="w-[40%] bg-emerald-300/50" />
                <div className="w-[20%] bg-red-300/50" />
              </div>
              <div
                className="absolute top-0 h-full w-1 bg-gray-900 rounded-full transition-all duration-300"
                style={{ left: `${Math.min(Math.max(results.approachVelocity / 2, 0), 1) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
              <span>0</span><span>0.3</span><span>0.6</span><span>1.2</span><span>2.0</span>
            </div>
          </div>

          {/* Headloss */}
          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estimated Headloss</span>
              <span className={`text-xs font-semibold ${hlStatus.color}`}>{hlStatus.label}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{results.headloss} <span className="text-sm font-medium text-gray-400">mm</span></div>
            <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(results.headloss / 400, 1) * 100}%`,
                  backgroundColor: results.headloss < 150 ? "#059669" : results.headloss < 300 ? "#EA580C" : "#DC2626",
                }}
              />
            </div>
          </div>

          {/* Through-screen velocity */}
          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Through-screen Velocity</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {results.throughVelocity.toFixed(2)} <span className="text-sm font-medium text-gray-400">m/s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   2. GRIT CHAMBER SIZING CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

export function GritChamberCalculator() {
  const [dwf, setDwf] = useState(200);
  const [peakFactor, setPeakFactor] = useState(3);
  const [numChambers, setNumChambers] = useState(2);
  const [diameter, setDiameter] = useState(5.0);
  const [sidewaterDepth, setSidewaterDepth] = useState(3.0);
  const [targetCutSize, setTargetCutSize] = useState(200); // microns

  const results = useMemo(() => {
    const fft = dwf * peakFactor; // l/s
    const flowM3s = fft / 1000;
    const dutyChambers = numChambers; // all active for grit
    const flowPerChamber = flowM3s / dutyChambers;

    const chamberArea = Math.PI * (diameter / 2) ** 2; // m²
    const chamberVolume = chamberArea * sidewaterDepth; // m³

    // Surface loading rate (SLR) in m³/m²/h
    const slr = (flowPerChamber * 3600) / chamberArea;

    // Detention time in seconds
    const detentionTime = chamberVolume / flowPerChamber;

    // Horizontal velocity in chamber
    const horizontalVelocity = flowPerChamber / (Math.PI * (diameter / 2) * sidewaterDepth);

    // Target SLR for different cut sizes (typical values)
    const targetSLR = targetCutSize >= 200 ? 25 : targetCutSize >= 150 ? 18 : 12;
    const slrStatus = slr <= targetSLR ? "Within target" : "Exceeds target — risk of carryover";

    return {
      fft,
      flowPerChamber: flowPerChamber * 1000,
      chamberArea,
      chamberVolume,
      slr,
      detentionTime,
      horizontalVelocity,
      targetSLR,
      slrStatus,
    };
  }, [dwf, peakFactor, numChambers, diameter, sidewaterDepth, targetCutSize]);

  return (
    <div className="my-6 bg-white border border-emerald-200 rounded-2xl overflow-hidden">
      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">🌀</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Grit Chamber Sizing</h4>
            <p className="text-xs text-gray-500">Free vortex detritor dimensions and performance</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Dry Weather Flow" value={dwf} onChange={setDwf} min={50} max={2000} step={10} unit="l/s" color="#059669" />
          <SliderInput label="Peak Factor" value={peakFactor} onChange={setPeakFactor} min={1} max={6} step={0.5} unit="×" color="#059669" />

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">No. of Chambers</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumChambers(Math.max(1, numChambers - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numChambers}</span>
              <button onClick={() => setNumChambers(Math.min(6, numChambers + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>

          <SliderInput label="Chamber Diameter" value={diameter} onChange={setDiameter} min={2} max={12} step={0.5} unit="m" color="#059669" />
          <SliderInput label="Side Water Depth" value={sidewaterDepth} onChange={setSidewaterDepth} min={1.5} max={6} step={0.5} unit="m" color="#059669" />

          {/* Cut size selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Target Cut Size</label>
            <div className="flex gap-2">
              {[100, 150, 200, 300].map((size) => (
                <button
                  key={size}
                  onClick={() => setTargetCutSize(size)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    targetCutSize === size
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {size} μm
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Chamber Geometry</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Chamber Area" value={results.chamberArea.toFixed(1)} unit="m²" />
              <ResultCard label="Chamber Volume" value={results.chamberVolume.toFixed(1)} unit="m³" />
              <ResultCard label="Flow per Chamber" value={results.flowPerChamber.toFixed(0)} unit="l/s" />
              <ResultCard label="Total FFT" value={results.fft.toFixed(0)} unit="l/s" />
            </div>
          </div>

          {/* SLR */}
          <div className={`rounded-xl p-4 border ${results.slr <= results.targetSLR ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Surface Loading Rate</span>
              <span className={`text-xs font-semibold ${results.slr <= results.targetSLR ? "text-emerald-600" : "text-red-600"}`}>
                {results.slrStatus}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{results.slr.toFixed(1)} <span className="text-sm text-gray-400">m³/m²/h</span></div>
            <div className="text-xs text-gray-500 mt-1">Target ≤ {results.targetSLR} m³/m²/h for {targetCutSize} μm cut</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Detention Time</span>
              <div className="text-2xl font-bold text-gray-900">{results.detentionTime.toFixed(0)} <span className="text-sm text-gray-400">s</span></div>
              <div className="text-[10px] text-gray-400 mt-0.5">Target: 30–90 s</div>
            </div>
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Horizontal Velocity</span>
              <div className="text-2xl font-bold text-gray-900">{(results.horizontalVelocity * 100).toFixed(1)} <span className="text-sm text-gray-400">cm/s</span></div>
              <div className="text-[10px] text-gray-400 mt-0.5">Target: &lt; 30 cm/s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   3. PUMP DUTY EXPLORER
   ════════════════════════════════════════════════════════════════════ */

export function PumpDutyExplorer() {
  const [dwf, setDwf] = useState(200);
  const [peakFactor, setPeakFactor] = useState(3);
  const [staticHead, setStaticHead] = useState(8);
  const [frictionHead, setFrictionHead] = useState(3);
  const [numPumps, setNumPumps] = useState(3); // 2D+1S
  const [philosophy, setPhilosophy] = useState<"2D1S" | "1D1S" | "3D1S">("2D1S");

  const results = useMemo(() => {
    const fft = dwf * peakFactor;
    const dutyPumps = philosophy === "1D1S" ? 1 : philosophy === "2D1S" ? 2 : 3;
    const totalPumps = dutyPumps + 1;
    const flowPerPump = fft / dutyPumps;

    const totalHead = staticHead + frictionHead;

    // Power estimate (P = ρgQH / η)
    const eta = 0.65; // pump efficiency
    const power = (1000 * 9.81 * (flowPerPump / 1000) * totalHead) / (eta * 1000); // kW

    // Wet well sizing (typical 3–5 min retention at DWF)
    const wetWellVol = (dwf / 1000) * 60 * 4; // 4 min at DWF

    // System curve points (H = Hs + k*Q²)
    const k = frictionHead / ((fft / 1000) ** 2);
    const systemCurve = Array.from({ length: 11 }, (_, i) => {
      const q = (i / 10) * (fft * 1.2 / 1000); // m³/s
      return { q: q * 1000, h: staticHead + k * q * q }; // l/s and m
    });

    return { fft, dutyPumps, totalPumps, flowPerPump, totalHead, power, wetWellVol, systemCurve };
  }, [dwf, peakFactor, staticHead, frictionHead, philosophy]);

  return (
    <div className="my-6 bg-white border border-emerald-200 rounded-2xl overflow-hidden">
      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">💧</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Pump Duty Explorer</h4>
            <p className="text-xs text-gray-500">Inlet pump sizing, duty philosophy and system head</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="DWF" value={dwf} onChange={setDwf} min={50} max={2000} step={10} unit="l/s" color="#059669" />
          <SliderInput label="Peak Factor" value={peakFactor} onChange={setPeakFactor} min={1} max={6} step={0.5} unit="×" color="#059669" />
          <SliderInput label="Static Head" value={staticHead} onChange={setStaticHead} min={2} max={25} step={0.5} unit="m" color="#059669" />
          <SliderInput label="Friction Losses" value={frictionHead} onChange={setFrictionHead} min={0.5} max={15} step={0.5} unit="m" color="#059669" />

          {/* Philosophy */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Duty Philosophy</label>
            <div className="flex gap-2">
              {([["1D1S", "1D + 1S"], ["2D1S", "2D + 1S"], ["3D1S", "3D + 1S"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setPhilosophy(val as typeof philosophy)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                    philosophy === val
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Pump Selection</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Total FFT" value={results.fft.toFixed(0)} unit="l/s" />
              <ResultCard label="Pumps (D+S)" value={`${results.dutyPumps}+1`} unit={`= ${results.totalPumps}`} />
              <ResultCard label="Flow per Pump" value={results.flowPerPump.toFixed(0)} unit="l/s" />
              <ResultCard label="Total Head" value={results.totalHead.toFixed(1)} unit="m" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Approx. Motor Power</span>
              <div className="text-2xl font-bold text-gray-900">{results.power.toFixed(1)} <span className="text-sm text-gray-400">kW</span></div>
              <div className="text-[10px] text-gray-400 mt-0.5">Per pump at 65% efficiency</div>
            </div>
            <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Wet Well Volume</span>
              <div className="text-2xl font-bold text-gray-900">{results.wetWellVol.toFixed(0)} <span className="text-sm text-gray-400">m³</span></div>
              <div className="text-[10px] text-gray-400 mt-0.5">4 min retention at DWF</div>
            </div>
          </div>

          {/* Simple system curve visualisation */}
          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">System Curve</span>
            <div className="h-32 relative">
              <svg viewBox="0 0 300 120" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 30, 60, 90].map((y) => (
                  <line key={y} x1="30" y1={y + 10} x2="290" y2={y + 10} stroke="#e5e7eb" strokeWidth="0.5" />
                ))}
                {/* Axes */}
                <line x1="30" y1="100" x2="290" y2="100" stroke="#9ca3af" strokeWidth="1" />
                <line x1="30" y1="10" x2="30" y2="100" stroke="#9ca3af" strokeWidth="1" />
                {/* System curve */}
                <path
                  d={results.systemCurve.map((p, i) => {
                    const x = 30 + (p.q / (results.fft * 1.2)) * 260;
                    const y = 100 - (p.h / (results.totalHead * 1.5)) * 80;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  }).join(" ")}
                  fill="none" stroke="#059669" strokeWidth="2"
                />
                {/* Duty point */}
                <circle
                  cx={30 + (results.flowPerPump / (results.fft * 1.2)) * 260}
                  cy={100 - (results.totalHead / (results.totalHead * 1.5)) * 80}
                  r="4" fill="#DC2626"
                />
                <text x="35" y="108" fontSize="8" fill="#9ca3af">0</text>
                <text x="280" y="108" fontSize="8" fill="#9ca3af">{(results.fft * 1.2).toFixed(0)}</text>
                <text x="5" y="15" fontSize="7" fill="#9ca3af">H(m)</text>
                <text x="250" y="118" fontSize="7" fill="#9ca3af">Q (l/s)</text>
              </svg>
              <div className="absolute bottom-0 right-4 flex items-center gap-2 text-[9px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> System</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Duty point</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   4. STORM TANK CAPACITY CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

export function StormTankCalculator() {
  const [dwf, setDwf] = useState(200);
  const [fft, setFft] = useState(600);
  const [stormDuration, setStormDuration] = useState(2); // hours
  const [returnRate, setReturnRate] = useState(100); // l/s
  const [numTanks, setNumTanks] = useState(2);
  const [tankLength, setTankLength] = useState(40); // m
  const [tankWidth, setTankWidth] = useState(10); // m
  const [waterDepth, setWaterDepth] = useState(3); // m

  const results = useMemo(() => {
    const excessFlow = fft - dwf * 3; // flow exceeding 3×DWF (pass-forward)
    const excessM3 = Math.max(excessFlow, 0) / 1000 * stormDuration * 3600; // m³
    const tankVol = tankLength * tankWidth * waterDepth * numTanks; // m³
    const drainTime = tankVol / (returnRate / 1000) / 3600; // hours
    const surfaceArea = tankLength * tankWidth * numTanks; // m²
    const upflowRate = (returnRate / 1000 * numTanks) / surfaceArea * 3600; // m³/m²/h

    const capacityPct = excessM3 > 0 ? (tankVol / excessM3) * 100 : 100;

    return {
      excessFlow: Math.max(excessFlow, 0),
      excessVol: excessM3,
      tankVol,
      drainTime,
      surfaceArea,
      upflowRate,
      capacityPct: Math.min(capacityPct, 100),
      sufficient: tankVol >= excessM3,
    };
  }, [dwf, fft, stormDuration, returnRate, numTanks, tankLength, tankWidth, waterDepth]);

  return (
    <div className="my-6 bg-white border border-emerald-200 rounded-2xl overflow-hidden">
      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">🌧️</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Storm Tank Capacity</h4>
            <p className="text-xs text-gray-500">Storage volume, drain-down time and return rate sizing</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="DWF" value={dwf} onChange={setDwf} min={50} max={2000} step={10} unit="l/s" color="#059669" />
          <SliderInput label="Storm Peak Flow" value={fft} onChange={setFft} min={100} max={5000} step={50} unit="l/s" color="#059669" />
          <SliderInput label="Storm Duration" value={stormDuration} onChange={setStormDuration} min={0.5} max={8} step={0.5} unit="hrs" color="#059669" />
          <SliderInput label="Return Rate" value={returnRate} onChange={setReturnRate} min={10} max={500} step={10} unit="l/s" color="#059669" />

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">No. of Tanks</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumTanks(Math.max(1, numTanks - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numTanks}</span>
              <button onClick={() => setNumTanks(Math.min(6, numTanks + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>

          <SliderInput label="Tank Length" value={tankLength} onChange={setTankLength} min={10} max={80} step={5} unit="m" color="#059669" />
          <SliderInput label="Tank Width" value={tankWidth} onChange={setTankWidth} min={3} max={20} step={1} unit="m" color="#059669" />
          <SliderInput label="Water Depth" value={waterDepth} onChange={setWaterDepth} min={1.5} max={6} step={0.5} unit="m" color="#059669" />
        </div>

        <div className="space-y-4">
          {/* Capacity indicator */}
          <div className={`rounded-xl p-5 border-2 ${results.sufficient ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-900">Storage Capacity</span>
              <span className={`text-sm font-bold ${results.sufficient ? "text-emerald-600" : "text-red-600"}`}>
                {results.sufficient ? "✓ Sufficient" : "✗ Insufficient"}
              </span>
            </div>

            {/* Tank fill visual */}
            <div className="h-24 bg-white rounded-lg border border-gray-200 overflow-hidden relative mb-3">
              <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                style={{
                  height: `${Math.min(results.capacityPct, 100)}%`,
                  backgroundColor: results.sufficient ? "#059669" : "#DC2626",
                  opacity: 0.2,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{results.capacityPct.toFixed(0)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">Required:</span> <strong>{results.excessVol.toFixed(0)} m³</strong></div>
              <div><span className="text-gray-500">Available:</span> <strong>{results.tankVol.toFixed(0)} m³</strong></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Performance</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Excess Flow" value={results.excessFlow.toFixed(0)} unit="l/s" />
              <ResultCard label="Total Volume" value={results.tankVol.toFixed(0)} unit="m³" />
              <ResultCard label="Drain-down Time" value={results.drainTime.toFixed(1)} unit="hrs" />
              <ResultCard label="Surface Area" value={results.surfaceArea.toFixed(0)} unit="m²" />
            </div>
          </div>

          {/* Return rate advisory */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-800">
              <strong>Return rate:</strong> {returnRate} l/s should be paced to protect downstream biology.
              Ensure return does not exceed available aeration headroom during recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ════════════════════════════════════════════════════════════════════ */

function SliderInput({
  label, value, onChange, min, max, step, unit, color,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string; color: string;
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
