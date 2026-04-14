// src/components/guides/interactives/Batch9Interactives.tsx
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
   1. TRICKLING FILTER SIZING
   ════════════════════════════════════════════════════════════════════ */

export function TricklingFilterCalculator() {
  const [flow, setFlow] = useState(150); // l/s
  const [influentBOD, setInfluentBOD] = useState(200); // mg/l (after primary)
  const [numFilters, setNumFilters] = useState(4);
  const [diameter, setDiameter] = useState(18); // m
  const [mediaDepth, setMediaDepth] = useState(2.0); // m
  const [recircRatio, setRecircRatio] = useState(1.0); // recirculation ratio

  const results = useMemo(() => {
    const flowM3d = (flow / 1000) * 86400;
    const totalFlow = flowM3d * (1 + recircRatio); // with recirculation

    const filterArea = Math.PI * (diameter / 2) ** 2;
    const filterVol = filterArea * mediaDepth;
    const totalArea = filterArea * numFilters;
    const totalVol = filterVol * numFilters;

    // Volumetric loading (kg BOD/m³/day)
    const bodLoad = (influentBOD / 1000) * flowM3d; // kg/day (original flow only)
    const volLoading = bodLoad / totalVol;

    // Hydraulic loading (m³/m²/day)
    const hydLoading = totalFlow / totalArea;

    // BOD removal estimate (NRC equation simplified)
    const efficiency = 100 / (1 + 0.4432 * Math.sqrt(volLoading / recircRatio));
    const effluentBOD = influentBOD * (1 - efficiency / 100);

    // Classification
    const filterType = volLoading < 0.3 ? "Low-rate" : volLoading < 0.8 ? "Standard-rate" : volLoading < 2.0 ? "High-rate" : "Super high-rate";
    const typeColor = volLoading < 0.3 ? "text-blue-600" : volLoading < 0.8 ? "text-emerald-600" : volLoading < 2.0 ? "text-amber-600" : "text-red-600";

    return {
      flowM3d, totalFlow, filterArea, filterVol, totalArea, totalVol,
      bodLoad, volLoading, hydLoading, efficiency, effluentBOD,
      filterType, typeColor,
    };
  }, [flow, influentBOD, numFilters, diameter, mediaDepth, recircRatio]);

  return (
    <div className="my-6 bg-white border border-orange-200 rounded-2xl overflow-hidden">
      <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg">🪨</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Trickling Filter Sizing</h4>
            <p className="text-xs text-gray-500">Volumetric loading, hydraulic loading and BOD removal estimate</p>
          </div>
        </div>
      </div>
      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Flow (after primary)" value={flow} onChange={setFlow} min={20} max={1000} step={10} unit="l/s" color="#EA580C" />
          <SliderInput label="Settled BOD" value={influentBOD} onChange={setInfluentBOD} min={50} max={400} step={10} unit="mg/l" color="#EA580C" />
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">No. of Filters</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumFilters(Math.max(1, numFilters - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numFilters}</span>
              <button onClick={() => setNumFilters(Math.min(12, numFilters + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>
          <SliderInput label="Filter Diameter" value={diameter} onChange={setDiameter} min={6} max={40} step={1} unit="m" color="#EA580C" />
          <SliderInput label="Media Depth" value={mediaDepth} onChange={setMediaDepth} min={1} max={4} step={0.5} unit="m" color="#EA580C" />
          <SliderInput label="Recirculation Ratio" value={recircRatio} onChange={setRecircRatio} min={0} max={3} step={0.5} unit="×" color="#EA580C" />
        </div>
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border bg-gray-50 border-gray-200`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Volumetric Loading</span>
              <span className={`text-xs font-semibold ${results.typeColor}`}>{results.filterType}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{results.volLoading.toFixed(2)} <span className="text-sm text-gray-400">kg BOD/m³/d</span></div>
            <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 flex">
                <div className="w-[15%] bg-blue-300/40" />
                <div className="w-[25%] bg-emerald-300/40" />
                <div className="w-[35%] bg-amber-300/40" />
                <div className="w-[25%] bg-red-300/40" />
              </div>
              <div className="absolute top-0 h-full w-1 bg-gray-900 rounded-full transition-all duration-300"
                style={{ left: `${Math.min(results.volLoading / 3, 1) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
              <span>Low</span><span>0.3</span><span>0.8</span><span>2.0</span><span>3.0</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Filter Area (each)" value={results.filterArea.toFixed(0)} unit="m²" />
              <ResultCard label="Total Media Vol" value={results.totalVol.toFixed(0)} unit="m³" />
              <ResultCard label="BOD Load" value={results.bodLoad.toFixed(0)} unit="kg/day" />
              <ResultCard label="Hydraulic Loading" value={results.hydLoading.toFixed(1)} unit="m³/m²/d" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Est. Removal</span>
              <div className="text-2xl font-bold text-emerald-700">{results.efficiency.toFixed(0)}%</div>
            </div>
            <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Effluent BOD</span>
              <div className="text-2xl font-bold text-gray-900">{results.effluentBOD.toFixed(0)} <span className="text-sm text-gray-400">mg/l</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   2. HST SIZING (variant of PST for humus tanks)
   ════════════════════════════════════════════════════════════════════ */

export function HSTSizingCalculator() {
  const [flow, setFlow] = useState(150);
  const [numTanks, setNumTanks] = useState(4);
  const [diameter, setDiameter] = useState(15);
  const [swd, setSwd] = useState(2.5);
  const [influentSS, setInfluentSS] = useState(80);

  const results = useMemo(() => {
    const flowM3h = (flow / 1000) * 3600;
    const dutyTanks = numTanks - 1;
    const tankArea = Math.PI * (diameter / 2) ** 2;
    const totalArea = tankArea * dutyTanks;
    const tankVol = tankArea * swd;
    const totalVol = tankVol * dutyTanks;
    const sor = flowM3h / totalArea;
    const hrt = totalVol / (flow / 1000) / 3600;
    const weirLength = Math.PI * diameter * dutyTanks;
    const weirLoading = flowM3h / weirLength;
    const sorOK = sor <= 1.2;
    return { flowM3h, dutyTanks, tankArea, totalArea, tankVol, totalVol, sor, hrt, weirLength, weirLoading, sorOK };
  }, [flow, numTanks, diameter, swd, influentSS]);

  return (
    <div className="my-6 bg-white border border-orange-200 rounded-2xl overflow-hidden">
      <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg">🔵</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Humus Tank (HST) Sizing</h4>
            <p className="text-xs text-gray-500">Surface overflow rate, HRT and weir loading for humus settlement</p>
          </div>
        </div>
      </div>
      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Flow" value={flow} onChange={setFlow} min={20} max={1000} step={10} unit="l/s" color="#EA580C" />
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">No. of Tanks</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setNumTanks(Math.max(2, numTanks - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">−</button>
              <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{numTanks}</span>
              <button onClick={() => setNumTanks(Math.min(8, numTanks + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">+</button>
            </div>
          </div>
          <SliderInput label="Tank Diameter" value={diameter} onChange={setDiameter} min={6} max={30} step={1} unit="m" color="#EA580C" />
          <SliderInput label="Side Water Depth" value={swd} onChange={setSwd} min={1.5} max={4} step={0.5} unit="m" color="#EA580C" />
          <SliderInput label="Feed SS" value={influentSS} onChange={setInfluentSS} min={20} max={200} step={5} unit="mg/l" color="#EA580C" />
        </div>
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border ${results.sorOK ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SOR</span>
              <span className={`text-xs font-semibold ${results.sorOK ? "text-emerald-600" : "text-red-600"}`}>
                {results.sorOK ? "Within target (≤1.2)" : "Exceeds target"}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{results.sor.toFixed(2)} <span className="text-sm text-gray-400">m³/m²/h</span></div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Tank Area" value={results.tankArea.toFixed(0)} unit="m²" />
              <ResultCard label="Duty Tanks" value={results.dutyTanks.toString()} unit={`of ${numTanks}`} />
              <ResultCard label="HRT" value={(results.hrt * 60).toFixed(0)} unit="min" />
              <ResultCard label="Weir Loading" value={results.weirLoading.toFixed(1)} unit="m³/m/h" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   3. ICA / SCADA I/O COUNT ESTIMATOR
   ════════════════════════════════════════════════════════════════════ */

const IO_AREAS = [
  { id: "inlet", label: "Inlet / Pre-Treatment", ai: 15, di: 25, ao: 5, do_: 20 },
  { id: "primary", label: "Primary Treatment", ai: 10, di: 15, ao: 3, do_: 12 },
  { id: "secondary", label: "Secondary Treatment", ai: 25, di: 30, ao: 10, do_: 25 },
  { id: "tertiary", label: "Tertiary / UV", ai: 8, di: 10, ao: 3, do_: 8 },
  { id: "sludge", label: "Sludge Treatment", ai: 15, di: 20, ao: 5, do_: 15 },
  { id: "chemical", label: "Chemical Dosing", ai: 8, di: 10, ao: 5, do_: 8 },
  { id: "odour", label: "Odour Control", ai: 5, di: 8, ao: 2, do_: 6 },
  { id: "power", label: "Power / Standby Gen", ai: 10, di: 15, ao: 2, do_: 10 },
  { id: "site", label: "Site Services / HVAC", ai: 5, di: 10, ao: 2, do_: 8 },
];

export function ICAIOCountEstimator() {
  const [areas, setAreas] = useState<Record<string, boolean>>(
    () => Object.fromEntries(IO_AREAS.map(a => [a.id, true]))
  );
  const [sparePercent, setSparePercent] = useState(20);

  const toggleArea = (id: string) => {
    setAreas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const results = useMemo(() => {
    let ai = 0, di = 0, ao = 0, do_ = 0;
    IO_AREAS.forEach(a => {
      if (areas[a.id]) { ai += a.ai; di += a.di; ao += a.ao; do_ += a.do_; }
    });
    const total = ai + di + ao + do_;
    const spareFactor = 1 + sparePercent / 100;
    const withSpare = Math.ceil(total * spareFactor);
    const aiSpare = Math.ceil(ai * spareFactor);
    const diSpare = Math.ceil(di * spareFactor);
    const aoSpare = Math.ceil(ao * spareFactor);
    const doSpare = Math.ceil(do_ * spareFactor);

    // PLC rack estimate (typical 16 channels per card)
    const cards = Math.ceil(aiSpare / 16) + Math.ceil(diSpare / 32) + Math.ceil(aoSpare / 8) + Math.ceil(doSpare / 32);

    return { ai, di, ao, do_, total, withSpare, aiSpare, diSpare, aoSpare, doSpare, cards };
  }, [areas, sparePercent]);

  return (
    <div className="my-6 bg-white border border-indigo-200 rounded-2xl overflow-hidden">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">📟</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">ICA / SCADA I/O Count Estimator</h4>
            <p className="text-xs text-gray-500">Signal count by area, spare capacity and PLC card estimate</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Area toggles */}
        <div className="grid sm:grid-cols-3 gap-2 mb-6">
          {IO_AREAS.map(a => (
            <button key={a.id} onClick={() => toggleArea(a.id)}
              className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                areas[a.id] ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-400 bg-gray-50"
              }`}>
              <div className="flex items-center justify-between">
                <span>{a.label}</span>
                <span className="text-[10px]">{a.ai + a.di + a.ao + a.do_} I/O</span>
              </div>
            </button>
          ))}
        </div>

        <SliderInput label="Spare Capacity" value={sparePercent} onChange={setSparePercent} min={10} max={40} step={5} unit="%" color="#6366F1" />

        <div className="mt-6 grid sm:grid-cols-2 gap-6">
          {/* I/O breakdown */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Signal Breakdown (inc. spare)</h5>
            <div className="space-y-3">
              {[
                { label: "Analogue Inputs (AI)", count: results.aiSpare, base: results.ai, color: "#2563EB" },
                { label: "Digital Inputs (DI)", count: results.diSpare, base: results.di, color: "#059669" },
                { label: "Analogue Outputs (AO)", count: results.aoSpare, base: results.ao, color: "#EA580C" },
                { label: "Digital Outputs (DO)", count: results.doSpare, base: results.do_, color: "#7C3AED" },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-bold text-gray-900">{s.count} <span className="text-gray-400 font-normal">({s.base} + spare)</span></span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(s.count / results.withSpare) * 100}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Total I/O (with spare)</span>
              <div className="text-3xl font-bold text-indigo-700">{results.withSpare}</div>
              <div className="text-xs text-gray-500 mt-1">Base: {results.total} + {sparePercent}% spare</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Est. PLC I/O Cards</span>
              <div className="text-2xl font-bold text-gray-900">{results.cards}</div>
              <div className="text-[10px] text-gray-400 mt-1">AI@16ch, DI@32ch, AO@8ch, DO@32ch</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   4. CDM 2015 DUTY HOLDER CHECKER
   ════════════════════════════════════════════════════════════════════ */

const CDM_ROLES = [
  { id: "client", role: "Client", duties: [
    "Appoint Principal Designer and Principal Contractor in writing",
    "Ensure sufficient time and resources for the project",
    "Provide pre-construction information to designers and contractors",
    "Ensure a construction phase plan is prepared before work starts",
    "Ensure a health and safety file is prepared, reviewed and revised",
    "Ensure welfare facilities are provided from day one",
  ]},
  { id: "pd", role: "Principal Designer", duties: [
    "Plan, manage and monitor the pre-construction phase",
    "Coordinate health and safety matters during design",
    "Identify and eliminate or reduce foreseeable risks",
    "Ensure designers comply with their duties under CDM 2015",
    "Prepare and update the health and safety file",
    "Liaise with the Principal Contractor on design risk",
  ]},
  { id: "designer", role: "Designer", duties: [
    "Eliminate hazards through design where reasonably practicable",
    "Reduce risks that cannot be eliminated",
    "Provide information about remaining (residual) risks",
    "Annotate drawings with residual risk notes",
    "Consider buildability, maintainability and demolition",
    "Cooperate with other designers and the Principal Designer",
  ]},
  { id: "pc", role: "Principal Contractor", duties: [
    "Prepare the construction phase plan before work starts",
    "Organise cooperation between contractors",
    "Coordinate implementation of relevant statutory provisions",
    "Ensure suitable site induction and training",
    "Consult and engage with workers on health and safety",
    "Ensure welfare facilities are maintained throughout",
  ]},
  { id: "contractor", role: "Contractor", duties: [
    "Plan, manage and monitor own work and that of workers",
    "Prepare RAMS for all activities",
    "Ensure workers have appropriate skills, knowledge and training",
    "Provide appropriate supervision",
    "Not begin work unless reasonable steps have been taken",
    "Report to the Principal Contractor anything likely to affect safety",
  ]},
  { id: "worker", role: "Worker", duties: [
    "Cooperate with employer and others on health and safety",
    "Report anything that is likely to endanger health and safety",
    "Not interfere with or misuse health and safety provisions",
    "Follow instructions and attend inductions and toolbox talks",
  ]},
];

export function CDMDutyHolderChecker() {
  const [checkedDuties, setCheckedDuties] = useState<Record<string, Set<number>>>({});
  const [expandedRole, setExpandedRole] = useState<string | null>("client");

  const toggleDuty = (roleId: string, idx: number) => {
    setCheckedDuties(prev => {
      const next = { ...prev };
      const set = new Set(next[roleId] || []);
      if (set.has(idx)) set.delete(idx); else set.add(idx);
      next[roleId] = set;
      return next;
    });
  };

  const totalDuties = CDM_ROLES.reduce((a, r) => a + r.duties.length, 0);
  const totalChecked = Object.values(checkedDuties).reduce((a, s) => a + s.size, 0);

  return (
    <div className="my-6 bg-white border border-indigo-200 rounded-2xl overflow-hidden">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">🛡️</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">CDM 2015 Duty Holder Checker</h4>
            <p className="text-xs text-gray-500">Verify appointments and duty compliance across all roles</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Overall progress */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 bg-[#1B5B50]"
              style={{ width: `${(totalChecked / totalDuties) * 100}%` }} />
          </div>
          <span className="text-sm font-bold text-gray-700">{totalChecked}/{totalDuties}</span>
        </div>

        <div className="space-y-2">
          {CDM_ROLES.map(role => {
            const checked = checkedDuties[role.id] || new Set();
            const isExpanded = expandedRole === role.id;
            const complete = checked.size === role.duties.length;
            return (
              <div key={role.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${complete ? "bg-emerald-50/50" : ""}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${complete ? "bg-emerald-500" : "bg-[#1B5B50]"}`}>
                    {complete ? "✓" : role.role.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{role.role}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#1B5B50] transition-all" style={{ width: `${(checked.size / role.duties.length) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400">{checked.size}/{role.duties.length}</span>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                    <div className="space-y-2 ml-11">
                      {role.duties.map((duty, i) => (
                        <label key={i} className="flex items-start gap-2.5 cursor-pointer group py-0.5">
                          <input type="checkbox" checked={checked.has(i)} onChange={() => toggleDuty(role.id, i)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#1B5B50] cursor-pointer shrink-0" />
                          <span className={`text-sm leading-relaxed ${checked.has(i) ? "text-gray-400 line-through" : "text-gray-700"}`}>{duty}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   5. SCREENINGS VOLUME ESTIMATOR
   ════════════════════════════════════════════════════════════════════ */

export function ScreeningsVolumeEstimator() {
  const [pe, setPe] = useState(100000); // population equivalent
  const [screeningRate, setScreeningRate] = useState(8); // litres per 1000 PE per day
  const [skipSize, setSkipSize] = useState(6); // m³
  const [collectionsPerWeek, setCollectionsPerWeek] = useState(3);
  const [compactionRatio, setCompactionRatio] = useState(3); // 3:1

  const results = useMemo(() => {
    const rawVolDay = (pe / 1000) * screeningRate / 1000; // m³/day
    const compactedVolDay = rawVolDay / compactionRatio;
    const compactedVolWeek = compactedVolDay * 7;
    const skipsPerWeek = compactedVolWeek / skipSize;
    const storageDays = skipSize / Math.max(compactedVolDay, 0.001);
    const collectionOK = collectionsPerWeek >= skipsPerWeek;
    const annualTonnes = compactedVolDay * 365 * 0.8; // ~800 kg/m³ compacted density

    return { rawVolDay, compactedVolDay, compactedVolWeek, skipsPerWeek, storageDays, collectionOK, annualTonnes };
  }, [pe, screeningRate, skipSize, collectionsPerWeek, compactionRatio]);

  return (
    <div className="my-6 bg-white border border-emerald-200 rounded-2xl overflow-hidden">
      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">🗑️</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Screenings Volume Estimator</h4>
            <p className="text-xs text-gray-500">Skip sizing, collection frequency and storage capacity</p>
          </div>
        </div>
      </div>
      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Population Equivalent" value={pe} onChange={setPe} min={5000} max={500000} step={5000} unit="PE" color="#059669" />
          <SliderInput label="Screenings Rate" value={screeningRate} onChange={setScreeningRate} min={3} max={20} step={1} unit="l/1000PE/d" color="#059669" />
          <SliderInput label="Compaction Ratio" value={compactionRatio} onChange={setCompactionRatio} min={1} max={5} step={0.5} unit=":1" color="#059669" />
          <SliderInput label="Skip Size" value={skipSize} onChange={setSkipSize} min={2} max={12} step={1} unit="m³" color="#059669" />
          <SliderInput label="Collections per Week" value={collectionsPerWeek} onChange={setCollectionsPerWeek} min={1} max={7} step={1} unit="/week" color="#059669" />
        </div>
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border-2 ${results.collectionOK ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">Collection Capacity</span>
              <span className={`text-sm font-bold ${results.collectionOK ? "text-emerald-600" : "text-red-600"}`}>
                {results.collectionOK ? "✓ Sufficient" : "✗ More collections needed"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mt-3">
              <div><span className="text-gray-500">Required:</span> <strong>{results.skipsPerWeek.toFixed(1)} skips/wk</strong></div>
              <div><span className="text-gray-500">Planned:</span> <strong>{collectionsPerWeek} collections/wk</strong></div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Raw Volume" value={results.rawVolDay.toFixed(2)} unit="m³/day" />
              <ResultCard label="Compacted Vol" value={results.compactedVolDay.toFixed(2)} unit="m³/day" />
              <ResultCard label="Skip Fill Time" value={results.storageDays.toFixed(1)} unit="days" />
              <ResultCard label="Annual Tonnage" value={results.annualTonnes.toFixed(0)} unit="tonnes" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   6. CAKE STORAGE & HAULAGE CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

export function CakeStorageCalculator() {
  const [cakeProduction, setCakeProduction] = useState(30); // m³/day
  const [dsCake, setDsCake] = useState(22); // %
  const [storageCapacity, setStorageCapacity] = useState(200); // m³
  const [truckCapacity, setTruckCapacity] = useState(16); // m³
  const [loadsPerDay, setLoadsPerDay] = useState(2);
  const [maxStackHeight, setMaxStackHeight] = useState(3); // m

  const results = useMemo(() => {
    const dsTonnesDay = cakeProduction * (dsCake / 100) * 1.05; // tonnes/day (cake density ~1.05)
    const storageDays = storageCapacity / Math.max(cakeProduction, 0.1);
    const haulageCapacity = truckCapacity * loadsPerDay; // m³/day
    const haulageOK = haulageCapacity >= cakeProduction;
    const annualTonnes = dsTonnesDay * 365;
    const annualLoads = (cakeProduction * 365) / truckCapacity;
    const weeklyLoads = annualLoads / 52;
    const storageArea = storageCapacity / maxStackHeight; // m²

    return { dsTonnesDay, storageDays, haulageCapacity, haulageOK, annualTonnes, annualLoads, weeklyLoads, storageArea };
  }, [cakeProduction, dsCake, storageCapacity, truckCapacity, loadsPerDay, maxStackHeight]);

  return (
    <div className="my-6 bg-white border border-amber-200 rounded-2xl overflow-hidden">
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg">🚛</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Cake Storage &amp; Haulage</h4>
            <p className="text-xs text-gray-500">Storage capacity, haulage frequency and logistics</p>
          </div>
        </div>
      </div>
      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <SliderInput label="Cake Production" value={cakeProduction} onChange={setCakeProduction} min={5} max={100} step={1} unit="m³/day" color="#B45309" />
          <SliderInput label="Cake DS" value={dsCake} onChange={setDsCake} min={15} max={35} step={1} unit="%" color="#B45309" />
          <SliderInput label="Storage Capacity" value={storageCapacity} onChange={setStorageCapacity} min={50} max={500} step={10} unit="m³" color="#B45309" />
          <SliderInput label="Max Stack Height" value={maxStackHeight} onChange={setMaxStackHeight} min={2} max={5} step={0.5} unit="m" color="#B45309" />
          <SliderInput label="Truck Capacity" value={truckCapacity} onChange={setTruckCapacity} min={8} max={28} step={2} unit="m³" color="#B45309" />
          <SliderInput label="Loads per Day" value={loadsPerDay} onChange={setLoadsPerDay} min={1} max={6} step={1} unit="/day" color="#B45309" />
        </div>
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border-2 ${results.haulageOK ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">Haulage Capacity</span>
              <span className={`text-sm font-bold ${results.haulageOK ? "text-emerald-600" : "text-red-600"}`}>
                {results.haulageOK ? "✓ Sufficient" : "✗ Increase loads or truck size"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mt-3">
              <div><span className="text-gray-500">Produced:</span> <strong>{cakeProduction} m³/day</strong></div>
              <div><span className="text-gray-500">Hauled:</span> <strong>{results.haulageCapacity} m³/day</strong></div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Storage Days" value={results.storageDays.toFixed(1)} unit="days" />
              <ResultCard label="Storage Footprint" value={results.storageArea.toFixed(0)} unit="m²" />
              <ResultCard label="DS Output" value={results.dsTonnesDay.toFixed(1)} unit="tDS/day" />
              <ResultCard label="Weekly Loads" value={results.weeklyLoads.toFixed(0)} unit="trucks" />
            </div>
          </div>
          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Annual Totals</span>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-[10px] text-gray-500">Dry Solids</div><div className="text-lg font-bold">{(results.annualTonnes / 1000).toFixed(1)}k t</div></div>
              <div><div className="text-[10px] text-gray-500">Truck Loads</div><div className="text-lg font-bold">{results.annualLoads.toFixed(0)}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
