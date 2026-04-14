// src/components/guides/interactives/SitewideInteractives.tsx
"use client";

import { useState, useMemo } from "react";

/* ─── Shared ─── */
function SliderInput({
  label, value, onChange, min, max, step, unit, color = "#6366F1",
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
   1. ELECTRICAL LOAD ESTIMATOR
   ════════════════════════════════════════════════════════════════════ */

const LOAD_ITEMS = [
  { id: "screens", label: "Screens & Screenings", defaultKW: 30, count: 1 },
  { id: "grit", label: "Grit Equipment", defaultKW: 15, count: 1 },
  { id: "inletPumps", label: "Inlet Pumps", defaultKW: 75, count: 3 },
  { id: "scrapers", label: "PST Scrapers", defaultKW: 5, count: 3 },
  { id: "blowers", label: "Aeration Blowers", defaultKW: 90, count: 3 },
  { id: "mixers", label: "Mixers & Stirrers", defaultKW: 10, count: 4 },
  { id: "rasPumps", label: "RAS Pumps", defaultKW: 30, count: 2 },
  { id: "sasPumps", label: "SAS Pumps", defaultKW: 15, count: 2 },
  { id: "sludgePumps", label: "Sludge Pumps", defaultKW: 20, count: 2 },
  { id: "chemical", label: "Chemical Dosing", defaultKW: 5, count: 3 },
  { id: "odour", label: "Odour Control Fans", defaultKW: 20, count: 2 },
  { id: "lighting", label: "Lighting & Small Power", defaultKW: 25, count: 1 },
  { id: "hvac", label: "HVAC & Building Services", defaultKW: 15, count: 1 },
];

export function ElectricalLoadEstimator() {
  const [loads, setLoads] = useState<Record<string, { kw: number; count: number; diversity: number }>>(
    () => Object.fromEntries(LOAD_ITEMS.map(i => [i.id, { kw: i.defaultKW, count: i.count, diversity: 0.7 }]))
  );
  const [generatorMargin, setGeneratorMargin] = useState(20); // %
  const [powerFactor, setPowerFactor] = useState(0.85);

  const updateLoad = (id: string, field: string, val: number) => {
    setLoads(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  };

  const results = useMemo(() => {
    let totalConnected = 0;
    let totalDiversified = 0;

    Object.values(loads).forEach(l => {
      const connected = l.kw * l.count;
      totalConnected += connected;
      totalDiversified += connected * l.diversity;
    });

    const totalKVA = totalDiversified / powerFactor;
    const generatorKVA = totalKVA * (1 + generatorMargin / 100);

    // Standard generator sizes
    const genSizes = [100, 200, 250, 350, 500, 750, 1000, 1250, 1500, 2000];
    const recommendedGen = genSizes.find(s => s >= generatorKVA) || genSizes[genSizes.length - 1];

    // Annual energy estimate (rough)
    const annualMWh = totalDiversified * 8760 / 1000;
    const annualCost = annualMWh * 150; // £150/MWh indicative

    return { totalConnected, totalDiversified, totalKVA, generatorKVA, recommendedGen, annualMWh, annualCost };
  }, [loads, generatorMargin, powerFactor]);

  return (
    <div className="my-6 bg-white border border-indigo-200 rounded-2xl overflow-hidden">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">⚡</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Electrical Load Estimator</h4>
            <p className="text-xs text-gray-500">Connected load, diversified demand and standby generation sizing</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Load table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                <th className="text-left pb-2 font-semibold">Equipment</th>
                <th className="text-center pb-2 font-semibold w-20">kW each</th>
                <th className="text-center pb-2 font-semibold w-16">Qty</th>
                <th className="text-center pb-2 font-semibold w-20">Diversity</th>
                <th className="text-right pb-2 font-semibold w-24">Diversified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {LOAD_ITEMS.map(item => {
                const l = loads[item.id];
                const diversified = l.kw * l.count * l.diversity;
                return (
                  <tr key={item.id} className="group">
                    <td className="py-2 text-gray-700 font-medium text-xs">{item.label}</td>
                    <td className="py-2">
                      <input type="number" value={l.kw} min={0} max={500} step={5}
                        onChange={(e) => updateLoad(item.id, "kw", Number(e.target.value))}
                        className="w-full text-center text-xs border border-gray-200 rounded-md py-1 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none" />
                    </td>
                    <td className="py-2">
                      <input type="number" value={l.count} min={1} max={10} step={1}
                        onChange={(e) => updateLoad(item.id, "count", Number(e.target.value))}
                        className="w-full text-center text-xs border border-gray-200 rounded-md py-1 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none" />
                    </td>
                    <td className="py-2">
                      <input type="number" value={l.diversity} min={0.1} max={1.0} step={0.05}
                        onChange={(e) => updateLoad(item.id, "diversity", Number(e.target.value))}
                        className="w-full text-center text-xs border border-gray-200 rounded-md py-1 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none" />
                    </td>
                    <td className="py-2 text-right font-semibold text-gray-900 text-xs">{diversified.toFixed(0)} kW</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <SliderInput label="Generator Margin" value={generatorMargin} onChange={setGeneratorMargin} min={10} max={40} step={5} unit="%" />
            <SliderInput label="Power Factor" value={powerFactor} onChange={setPowerFactor} min={0.7} max={0.95} step={0.05} unit="" />
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Connected Load" value={results.totalConnected.toFixed(0)} unit="kW" />
                <ResultCard label="Diversified Load" value={results.totalDiversified.toFixed(0)} unit="kW" />
                <ResultCard label="Total Demand" value={results.totalKVA.toFixed(0)} unit="kVA" />
                <ResultCard label="Generator Need" value={results.generatorKVA.toFixed(0)} unit="kVA" />
              </div>
            </div>

            <div className="rounded-xl p-4 bg-indigo-50 border border-indigo-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Recommended Standby Generator</span>
              <div className="text-3xl font-bold text-indigo-700">{results.recommendedGen} <span className="text-sm text-gray-400">kVA</span></div>
              <div className="text-[10px] text-gray-500 mt-1">Next standard frame size above {results.generatorKVA.toFixed(0)} kVA</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Est. Annual Energy" value={results.annualMWh.toFixed(0)} unit="MWh" />
              <ResultCard label="Est. Annual Cost" value={`£${(results.annualCost / 1000).toFixed(0)}k`} unit="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   2. CHEMICAL DOSING CALCULATOR
   ════════════════════════════════════════════════════════════════════ */

const CHEMICALS = [
  { id: "ferric", label: "Ferric Chloride (40%)", sg: 1.42, strength: 40, unit: "mg Fe/l", typicalDose: 8 },
  { id: "aluminium", label: "Aluminium Sulphate (8%)", sg: 1.32, strength: 8, unit: "mg Al/l", typicalDose: 5 },
  { id: "polymer", label: "Polyelectrolyte (0.5%)", sg: 1.0, strength: 0.5, unit: "mg/l", typicalDose: 0.5 },
  { id: "naoh", label: "Caustic Soda (30%)", sg: 1.33, strength: 30, unit: "mg/l", typicalDose: 20 },
  { id: "sodium_hypo", label: "Sodium Hypochlorite (14%)", sg: 1.21, strength: 14, unit: "mg Cl₂/l", typicalDose: 5 },
];

export function ChemicalDosingCalculator() {
  const [chemIdx, setChemIdx] = useState(0);
  const [flow, setFlow] = useState(200); // l/s
  const [doseRate, setDoseRate] = useState(CHEMICALS[0].typicalDose); // mg/l (as active)
  const [tankSize, setTankSize] = useState(20); // m³
  const [deliverySize, setDeliverySize] = useState(15); // m³ per delivery

  const chem = CHEMICALS[chemIdx];

  const results = useMemo(() => {
    const flowM3h = (flow / 1000) * 3600;
    const flowM3d = flowM3h * 24;

    // Active dose in kg/h
    const activeKgH = (doseRate / 1000) * flowM3h; // kg/h as active ingredient
    const activeKgD = activeKgH * 24;

    // Bulk product consumption
    const bulkKgH = activeKgH / (chem.strength / 100); // kg/h of product
    const bulkLH = bulkKgH / chem.sg; // l/h
    const bulkM3D = (bulkLH * 24) / 1000; // m³/day

    // Pump sizing
    const dosingPumpLH = bulkLH * 1.2; // 20% margin

    // Storage days
    const storageDays = tankSize / Math.max(bulkM3D, 0.001);

    // Deliveries per month
    const deliveriesPerMonth = (bulkM3D * 30) / Math.max(deliverySize, 1);

    // Bund volume (110% of tank)
    const bundVol = tankSize * 1.1;

    return {
      flowM3h, activeKgH, activeKgD, bulkKgH, bulkLH, bulkM3D,
      dosingPumpLH, storageDays, deliveriesPerMonth, bundVol,
    };
  }, [flow, doseRate, tankSize, deliverySize, chem]);

  return (
    <div className="my-6 bg-white border border-indigo-200 rounded-2xl overflow-hidden">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">🧪</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Chemical Dosing Calculator</h4>
            <p className="text-xs text-gray-500">Consumption rates, pump sizing, storage days and delivery frequency</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          {/* Chemical selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Chemical</label>
            <div className="space-y-1.5">
              {CHEMICALS.map((c, i) => (
                <button key={c.id}
                  onClick={() => { setChemIdx(i); setDoseRate(c.typicalDose); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    i === chemIdx ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>{c.label}</button>
              ))}
            </div>
          </div>

          <SliderInput label="Treated Flow" value={flow} onChange={setFlow} min={10} max={2000} step={10} unit="l/s" />
          <SliderInput label={`Dose Rate (${chem.unit})`} value={doseRate} onChange={setDoseRate} min={0.1} max={50} step={0.5} unit={chem.unit} />
          <SliderInput label="Storage Tank" value={tankSize} onChange={setTankSize} min={5} max={50} step={1} unit="m³" />
          <SliderInput label="Delivery Size" value={deliverySize} onChange={setDeliverySize} min={5} max={30} step={1} unit="m³" />
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Consumption</h5>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Active Ingredient" value={results.activeKgD.toFixed(1)} unit="kg/day" />
              <ResultCard label="Bulk Product" value={results.bulkM3D.toFixed(2)} unit="m³/day" />
              <ResultCard label="Dosing Pump" value={results.dosingPumpLH.toFixed(1)} unit="l/h" />
              <ResultCard label="Bulk Flow" value={results.bulkLH.toFixed(1)} unit="l/h" />
            </div>
          </div>

          {/* Storage indicator */}
          <div className={`rounded-xl p-4 border ${results.storageDays >= 7 ? "bg-emerald-50 border-emerald-200" : results.storageDays >= 3 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Storage Days</span>
              <span className={`text-xs font-semibold ${results.storageDays >= 7 ? "text-emerald-600" : results.storageDays >= 3 ? "text-amber-600" : "text-red-600"}`}>
                {results.storageDays >= 7 ? "Good" : results.storageDays >= 3 ? "Tight — increase tank or delivery frequency" : "Insufficient"}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{results.storageDays.toFixed(1)} <span className="text-sm text-gray-400">days</span></div>
            <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(results.storageDays / 14, 1) * 100}%`,
                  backgroundColor: results.storageDays >= 7 ? "#059669" : results.storageDays >= 3 ? "#EA580C" : "#DC2626",
                }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Deliveries" value={results.deliveriesPerMonth.toFixed(1)} unit="/month" />
            <ResultCard label="Bund Volume" value={results.bundVol.toFixed(1)} unit="m³ (110%)" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-800">
              <strong>COSHH:</strong> Ensure bunding meets 110% of largest tank. Verify delivery access, offloading connections,
              spill containment and emergency shower/eyewash per CESWI 8 and site COSHH assessment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
