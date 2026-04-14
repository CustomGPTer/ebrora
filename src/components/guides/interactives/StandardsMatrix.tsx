// src/components/guides/interactives/StandardsMatrix.tsx
"use client";

import { useState } from "react";

/* ─── Standards data ─── */
const STANDARDS = [
  {
    id: "ceswi8",
    name: "CESWI 8",
    full: "Civil Engineering Specification for the Water Industry",
    scope: "Civil/structural works, materials, workmanship, testing, durability, finishes",
    color: "#059669",
    triggers: [
      "Concrete mix design and curing",
      "Cover to reinforcement",
      "Waterstops and joints",
      "Backfill and compaction",
      "Coatings and linings",
      "Watertightness tests",
    ],
    evidence: [
      "ITPs with hold points (formwork/rebar inspections, pour releases)",
      "Pressure and watertightness tests",
      "Concrete cube results",
      "Coating DFT and holiday tests",
    ],
  },
  {
    id: "wimes",
    name: "WIMES",
    full: "Water Industry Mechanical and Electrical Specifications",
    scope: "MEICA equipment — pumps, blowers, MCCs, instruments, chemical systems",
    color: "#2563EB",
    triggers: [
      "Vendor selection and datasheet sign-off",
      "Duty/standby philosophy",
      "Materials and ingress protection",
      "FAT/SAT scope definition",
      "O&M content requirements",
      "Asset tagging standards",
    ],
    evidence: [
      "Compliance matrix",
      "Certified datasheets",
      "FAT/SAT plans and results",
      "Wiring and loop checks",
      "Earthing tests",
      "Nameplate and asset data",
    ],
  },
  {
    id: "mcerts",
    name: "MCERTS",
    full: "Monitoring Certification (Environment Agency)",
    scope: "Flow measurement and final effluent monitoring",
    color: "#7C3AED",
    triggers: [
      "Inlet/outfall flumes",
      "Ultrasonic and DP meters",
      "Auto-samplers",
      "Final effluent monitors",
      "Data acquisition systems",
    ],
    evidence: [
      "Design review against MCERTS guidance",
      "Installation survey",
      "Calibration certificate",
      "Verification report",
      "Maintenance plan",
      "Data integrity checks",
    ],
  },
  {
    id: "cdm2015",
    name: "CDM 2015",
    full: "Construction (Design and Management) Regulations",
    scope: "H&S roles, responsibilities and coordination through design, build and handover",
    color: "#DC2626",
    triggers: [
      "Appointment of duty holders",
      "Pre-construction information",
      "Design risk management",
      "Construction phase plan",
    ],
    evidence: [
      "Design risk register",
      "Residual risk notes on drawings",
      "Construction phase plan",
      "RAMS and competency records",
      "H&S file close-out and handover",
    ],
  },
  {
    id: "eapermit",
    name: "EA Permit",
    full: "Environmental Permit (and variations)",
    scope: "Consent limits, monitoring, operating techniques, reporting",
    color: "#0891B2",
    triggers: [
      "Any change affecting consent compliance",
      "Sampling point changes",
      "Bypass behaviour modifications",
    ],
    evidence: [
      "Permit and variations",
      "Dispersion and hydraulic assessments",
      "Monitoring positions",
      "Alarm and reporting configuration",
      "Compliance demonstration",
    ],
  },
];

/* ─── Responsibility data ─── */
const ROLES = [
  { id: "client", label: "Client / Employer", short: "CLI" },
  { id: "pd", label: "Principal Designer", short: "PD" },
  { id: "designer", label: "Designers (Civils / MEICA / ICA)", short: "DES" },
  { id: "pc", label: "Principal Contractor", short: "PC" },
  { id: "vendor", label: "MEICA Vendors / OEMs", short: "VEN" },
  { id: "commlead", label: "Commissioning Lead", short: "COM" },
  { id: "qm", label: "Quality Manager", short: "QM" },
];

const RESPONSIBILITIES: Record<string, string[]> = {
  client: ["Sets outcomes", "Accepts risks / variations", "Owns permit"],
  pd: ["Coordinates pre-construction information", "Manages design risk"],
  designer: ["Delivers compliant designs", "Identifies residual risks", "Defines ITP hold points"],
  pc: ["Plans and controls construction", "Implements ITPs / RAMS", "Maintains records"],
  vendor: ["Proves WIMES compliance", "Executes FAT / SAT", "Supplies O&M / asset data"],
  commlead: ["Integrates plans", "Proves performance", "Protects consent during transition"],
  qm: ["Assures evidence", "Manages non-conformances", "Close-out"],
};

/* ─── Gate deliverables ─── */
const GATES = [
  {
    stage: "Design",
    color: "#059669",
    items: [
      "Basis of design and calculations",
      "Drawings and specifications",
      "WIMES / MCERTS compliance matrix",
      "Design risk register",
      "ITP / hold points defined",
    ],
  },
  {
    stage: "Construction",
    color: "#EA580C",
    items: [
      "RAMS and temporary works",
      "Materials approvals",
      "Inspection and test results",
      "Calibration certificates",
      "Updated redlines",
    ],
  },
  {
    stage: "Commissioning",
    color: "#7C3AED",
    items: [
      "FAT / SAT results",
      "Commissioning plan",
      "Temporary operating envelope",
      "Evidence against permit limits",
      "Handover pack (O&M, asset data, training)",
    ],
  },
];

/* ─── Contract precedence ─── */
const PRECEDENCE = [
  { level: 1, label: "Employer's Requirements / Works Information", color: "#1B5B50" },
  { level: 2, label: "Contract", color: "#2A7A6C" },
  { level: 3, label: "Statute / Permit", color: "#059669" },
  { level: 4, label: "National Standards (CESWI 8, WIMES)", color: "#0891B2" },
  { level: 5, label: "Manufacturer's Instructions", color: "#64748B" },
];

type View = "standards" | "responsibilities" | "gates" | "precedence";

export function StandardsMatrix() {
  const [view, setView] = useState<View>("standards");
  const [activeStandard, setActiveStandard] = useState<string | null>(null);
  const [gateChecks, setGateChecks] = useState<Record<string, Set<number>>>({});

  const toggleGateCheck = (stage: string, idx: number) => {
    setGateChecks((prev) => {
      const next = { ...prev };
      const set = new Set(next[stage] || []);
      if (set.has(idx)) set.delete(idx);
      else set.add(idx);
      next[stage] = set;
      return next;
    });
  };

  const views: { id: View; label: string }[] = [
    { id: "standards", label: "Standards" },
    { id: "responsibilities", label: "Responsibilities" },
    { id: "gates", label: "Gate Deliverables" },
    { id: "precedence", label: "Precedence" },
  ];

  return (
    <div className="my-8 bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              view === v.id
                ? "text-[#1B5B50] border-b-2 border-[#1B5B50] bg-white"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Standards view */}
        {view === "standards" && (
          <div className="space-y-3">
            {STANDARDS.map((s) => {
              const isActive = activeStandard === s.id;
              return (
                <div key={s.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveStandard(isActive ? null : s.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.name.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
                      <div className="text-xs text-gray-500 truncate">{s.full}</div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isActive ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isActive && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                      <div className="text-sm text-gray-600">
                        <strong className="text-gray-900">Scope:</strong> {s.scope}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Triggers */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                            Triggers
                          </h5>
                          <div className="space-y-2">
                            {s.triggers.map((t, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                {t}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Evidence */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                            Evidence Required
                          </h5>
                          <div className="space-y-2">
                            {s.evidence.map((e, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: s.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {e}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Responsibilities view */}
        {view === "responsibilities" && (
          <div className="space-y-3">
            {ROLES.map((role) => (
              <div key={role.id} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-[#1B5B50] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {role.short}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 mb-1.5">{role.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {RESPONSIBILITIES[role.id]?.map((r, i) => (
                      <span key={i} className="text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-600">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gate deliverables view */}
        {view === "gates" && (
          <div className="grid sm:grid-cols-3 gap-4">
            {GATES.map((gate) => {
              const checked = gateChecks[gate.stage] || new Set();
              const progress = gate.items.length > 0 ? (checked.size / gate.items.length) * 100 : 0;

              return (
                <div key={gate.stage} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gate.color }} />
                    <h5 className="font-bold text-gray-900 text-sm">{gate.stage}</h5>
                    <span className="ml-auto text-xs font-medium" style={{ color: gate.color }}>
                      {checked.size}/{gate.items.length}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%`, backgroundColor: gate.color }}
                    />
                  </div>

                  <div className="space-y-2">
                    {gate.items.map((item, i) => (
                      <label
                        key={i}
                        className="flex items-start gap-2.5 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={checked.has(i)}
                          onChange={() => toggleGateCheck(gate.stage, i)}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#1B5B50] cursor-pointer"
                        />
                        <span className={`text-sm transition-colors ${
                          checked.has(i) ? "text-gray-400 line-through" : "text-gray-700"
                        }`}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Precedence view */}
        {view === "precedence" && (
          <div className="max-w-md mx-auto space-y-0">
            {PRECEDENCE.map((p, i) => (
              <div key={p.level} className="relative">
                {/* Connector */}
                {i < PRECEDENCE.length - 1 && (
                  <div className="absolute left-5 top-12 w-0.5 h-6 bg-gray-200" />
                )}
                <div className="flex items-center gap-4 py-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.level}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">{p.label}</div>
                </div>
                {i < PRECEDENCE.length - 1 && (
                  <div className="ml-[18px] mb-1">
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-xs text-amber-800">
                Where a manufacturer&apos;s requirement exceeds the baseline spec, adopt the higher standard unless the client approves otherwise.
                Resolve gaps or conflicts via early TQ/RFI and documented change control.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
