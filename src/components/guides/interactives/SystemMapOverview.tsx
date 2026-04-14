// src/components/guides/interactives/SystemMapOverview.tsx
"use client";

import { useState } from "react";

/* ─── Stage definitions ─── */
interface SubsystemInfo {
  name: string;
  desc: string;
}

interface Stage {
  id: string;
  label: string;
  short: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
  subsystems: SubsystemInfo[];
}

const STAGES: Stage[] = [
  {
    id: "pre-treatment",
    label: "Pre-Treatment",
    short: "PRE",
    color: "#059669",
    bgColor: "#ECFDF5",
    icon: "🔧",
    description: "Remove screenings, grit and FOG. Manage storm flows. Protect downstream assets.",
    subsystems: [
      { name: "Coarse & Fine Screens", desc: "6mm perforated/wedge-wire screens with enclosed screenings wash-compaction" },
      { name: "Grit Removal", desc: "Aerated or free-vortex chambers with classified grit washing" },
      { name: "FOG Removal", desc: "Dedicated fat, oil and grease capture systems" },
      { name: "Inlet Pumps & Wet Well", desc: "Submersible or dry-well pumps sized for storm flows" },
      { name: "Storm Overflow & Tanks", desc: "Overflow weirs, storm tanks with controlled returns" },
    ],
  },
  {
    id: "primary",
    label: "Primary Treatment",
    short: "PRI",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    icon: "🏗️",
    description: "Settle suspended solids and remove scum. Produce primary sludge and clarified effluent.",
    subsystems: [
      { name: "Primary Settlement Tanks", desc: "Radial or rectangular PSTs with scraper bridges" },
      { name: "Lamella Clarifiers", desc: "Plate-pack settlers for reduced footprint" },
      { name: "Scum Removal", desc: "Surface skimmers, scum troughs and launder covers" },
      { name: "Primary Sludge Pumping", desc: "Sludge withdrawal pumps with density and level control" },
    ],
  },
  {
    id: "secondary",
    label: "Secondary Treatment",
    short: "SEC",
    color: "#EA580C",
    bgColor: "#FFF7ED",
    icon: "⚡",
    description: "Biological oxidation of organics and nutrients. Meet ammonia, BOD and phosphorus limits.",
    subsystems: [
      { name: "Activated Sludge (ASP)", desc: "Conventional or extended aeration with selector zones" },
      { name: "MBR", desc: "Membrane bioreactor with submerged or sidestream membranes" },
      { name: "IFAS / MBBR", desc: "Carrier media processes for enhanced biomass" },
      { name: "Percolating Filters", desc: "Trickling filters with humus settlement" },
      { name: "Aeration Systems", desc: "Fine-bubble diffusers, blowers and DO control" },
      { name: "RAS / SAS", desc: "Return and surplus activated sludge pumping" },
      { name: "Secondary Clarifiers", desc: "Final settlement with RAS collection and SAS wasting" },
    ],
  },
  {
    id: "sludge",
    label: "Sludge Treatment",
    short: "SLG",
    color: "#B45309",
    bgColor: "#FFFBEB",
    icon: "♻️",
    description: "Thicken, stabilise and dewater sludge. Recover energy. Manage liquors return.",
    subsystems: [
      { name: "Thickening", desc: "DAF, drum or gravity belt thickeners" },
      { name: "Anaerobic Digestion", desc: "Mesophilic or thermophilic with CHP and gas handling" },
      { name: "Dewatering", desc: "Centrifuges or plate-screw presses to stackable cake" },
      { name: "Cake Storage & Loading", desc: "Enclosed conveyors, storage and weather-resilient bays" },
      { name: "Liquors Return", desc: "Equalisation, paced returns and side-stream treatment" },
    ],
  },
  {
    id: "sitewide",
    label: "Sitewide Systems",
    short: "SWS",
    color: "#6366F1",
    bgColor: "#EEF2FF",
    icon: "⚙️",
    description: "Cross-cutting systems: MCERTS, electrical, ICA, chemical, drainage, CDM, quality.",
    subsystems: [
      { name: "MCERTS & Monitoring", desc: "Flow measurement and final effluent quality monitoring" },
      { name: "Electrical & Standby", desc: "Power distribution, generators, UPS and earthing" },
      { name: "ICA / SCADA", desc: "Instrumentation, control, telemetry and cybersecurity" },
      { name: "Chemical Systems", desc: "Storage, bunding, dosing and delivery" },
      { name: "Site Drainage", desc: "Dirty vs clean segregation, containment and spill control" },
      { name: "Quality & Handover", desc: "ITPs, hold points, documentation and close-out" },
    ],
  },
];

/* ─── Key interfaces ─── */
const INTERFACES = [
  { from: "pre-treatment", to: "primary", label: "Hydraulic levels & headloss" },
  { from: "primary", to: "secondary", label: "Clarified effluent quality" },
  { from: "secondary", to: "sludge", label: "SAS & RAS flows" },
  { from: "sludge", to: "pre-treatment", label: "Liquors return" },
];

export function SystemMapOverview() {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [showInterfaces, setShowInterfaces] = useState(true);
  const [flowSpeed, setFlowSpeed] = useState(2);

  return (
    <div className="my-8 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Flow animation:</label>
          <div className="flex gap-1">
            {[1, 2, 3].map((speed) => (
              <button
                key={speed}
                onClick={() => setFlowSpeed(speed)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                  flowSpeed === speed
                    ? "bg-[#1B5B50] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {speed}×
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowInterfaces(!showInterfaces)}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            showInterfaces
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {showInterfaces ? "Interfaces shown" : "Show interfaces"}
        </button>
        <button
          onClick={() => setExpandedStage(null)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          Collapse all
        </button>
      </div>

      {/* Main flow diagram */}
      <div className="relative bg-white border border-gray-200 rounded-2xl p-6 overflow-hidden">
        {/* Animated flow line background */}
        <div className="absolute inset-x-0 top-[72px] h-1 bg-gray-100 mx-6">
          <div
            className="h-full bg-gradient-to-r from-[#059669] via-[#EA580C] to-[#6366F1] rounded-full opacity-30"
            style={{
              animation: `flowPulse ${4 / flowSpeed}s ease-in-out infinite`,
            }}
          />
        </div>

        {/* Stage cards */}
        <div className="relative grid grid-cols-1 sm:grid-cols-5 gap-3">
          {STAGES.map((stage, idx) => {
            const isExpanded = expandedStage === stage.id;
            return (
              <div key={stage.id} className="relative">
                {/* Flow arrow between stages */}
                {idx > 0 && (
                  <div className="hidden sm:block absolute -left-2 top-9 z-10">
                    <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}

                <button
                  onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                    isExpanded
                      ? `border-current shadow-lg`
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                  style={isExpanded ? { borderColor: stage.color, backgroundColor: stage.bgColor } : {}}
                >
                  {/* Stage icon + label */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{stage.icon}</span>
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${stage.color}15`,
                        color: stage.color,
                      }}
                    >
                      {stage.short}
                    </div>
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm leading-snug mb-1">
                    {stage.label}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                    {stage.description}
                  </p>

                  {/* Subsystem count */}
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium" style={{ color: stage.color }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    {stage.subsystems.length} subsystems
                  </div>
                </button>

                {/* Expanded subsystem list */}
                {isExpanded && (
                  <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {stage.subsystems.map((sub, si) => (
                      <div
                        key={si}
                        className="bg-white rounded-lg border border-gray-200 px-3 py-2.5 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="text-xs font-semibold text-gray-900">{sub.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 ml-3.5 leading-relaxed">
                          {sub.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Liquors return arrow */}
        {showInterfaces && (
          <div className="mt-4 flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-amber-600 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-xs font-medium text-amber-700">
              Liquors return from sludge treatment → head of works (paced to protect nitrification)
            </span>
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        )}
      </div>

      {/* Interface cards */}
      {showInterfaces && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INTERFACES.map((iface) => {
            const fromStage = STAGES.find((s) => s.id === iface.from);
            const toStage = STAGES.find((s) => s.id === iface.to);
            if (!fromStage || !toStage) return null;

            return (
              <div
                key={`${iface.from}-${iface.to}`}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: fromStage.color }}
                  >
                    {fromStage.short}
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: toStage.color }}
                  >
                    {toStage.short}
                  </div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{iface.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* CSS animation */}
      <style jsx>{`
        @keyframes flowPulse {
          0%, 100% { opacity: 0.15; transform: scaleX(0.3); transform-origin: left; }
          50% { opacity: 0.5; transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </div>
  );
}
