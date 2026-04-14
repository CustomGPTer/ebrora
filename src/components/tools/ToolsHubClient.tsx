// src/components/tools/ToolsHubClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Category definitions ────────────────────────────────────
const TOOL_CATEGORIES = {
  "Health & Safety": {
    icon: "🛡️",
    accent: "#DC2626",
    accentLight: "rgba(220,38,38,0.08)",
    slugs: new Set([
      "manual-handling-calculator",
      "fire-risk-score-calculator",
      "wbgt-heat-stress-calculator",
      "hav-calculator",
      "confined-space-calculator",
      "welfare-facilities-calculator",
      "dust-silica-calculator",
      "noise-exposure-calculator",
      "slip-risk-calculator",
      "uv-index-exposure-checker",
      "cold-stress-wind-chill-calculator",
      "lone-worker-risk-calculator",
      "fatigue-risk-calculator",
      "first-aid-needs-calculator",
      "working-at-height-calculator",
      "riddor-reporting-decision-tool",
      "asbestos-notification-decision-tool",
      "site-induction-duration-calculator",
    ]),
  },
  "Temporary Works": {
    icon: "🏗️",
    accent: "#64748B",
    accentLight: "rgba(100,116,139,0.08)",
    slugs: new Set([
      "scaffold-load-calculator",
      "formwork-pressure-calculator",
    ]),
  },
  "Concrete": {
    icon: "🧱",
    accent: "#78716C",
    accentLight: "rgba(120,113,108,0.08)",
    slugs: new Set([
      "concrete-volume-calculator",
      "concrete-pour-planner",
      "concrete-curing-estimator",
      "formwork-pressure-calculator",
      "historical-weather",
    ]),
  },
  "Materials & Quantities": {
    icon: "🧱",
    accent: "#B45309",
    accentLight: "rgba(180,83,9,0.08)",
    slugs: new Set([
      "materials-converter",
      "concrete-volume-calculator",
      "aggregate-calculator",
      "excavation-spoil-calculator",
      "trench-backfill-calculator",
      "brick-block-calculator",
      "concrete-pour-planner",
      "topsoil-calculator",
      "concrete-curing-estimator",
    ]),
  },
  "Plant & Equipment": {
    icon: "🚜",
    accent: "#EA580C",
    accentLight: "rgba(234,88,12,0.08)",
    slugs: new Set([
      "fuel-usage-calculator",
      "plant-pre-use-checksheet",
      "access-equipment-selector",
      "sling-swl-calculator",
      "plant-hire-comparator",
    ]),
  },
  "Earthworks & Ground": {
    icon: "⛏️",
    accent: "#0891B2",
    accentLight: "rgba(8,145,178,0.08)",
    slugs: new Set([
      "cbr-modulus-converter",
      "drainage-pipe-flow-calculator",
      "soil-compaction-calculator",
      "plate-bearing-test-interpreter",
      "excavation-spoil-calculator",
      "trench-backfill-calculator",
      "topsoil-calculator",
    ]),
  },
  "Programme & Commercial": {
    icon: "📊",
    accent: "#7C3AED",
    accentLight: "rgba(124,58,237,0.08)",
    slugs: new Set([
      "construction-productivity-calculator",
      "sunrise-sunset-times",
      "working-days-calculator",
      "daywork-rate-calculator",
      "overtime-cost-calculator",
      "historical-weather",
      "plant-hire-comparator",
      "org-chart-generator",
    ]),
  },
  "Environmental & Ecology": {
    icon: "🌿",
    accent: "#16A34A",
    accentLight: "rgba(22,163,74,0.08)",
    slugs: new Set<string>(["ecological-exclusion-zone-checker", "asbestos-notification-decision-tool"]),
  },
  "Utilities & Services": {
    icon: "⚡",
    accent: "#0284C7",
    accentLight: "rgba(2,132,199,0.08)",
    slugs: new Set<string>([
      "cable-trench-depth-checker",
      "trench-backfill-calculator",
      "drainage-pipe-flow-calculator",
    ]),
  },
  "Surveying & Setting Out": {
    icon: "📐",
    accent: "#6D28D9",
    accentLight: "rgba(109,40,217,0.08)",
    slugs: new Set<string>(["coordinate-converter"]),
  },
  "Quality & Testing": {
    icon: "🔬",
    accent: "#0F766E",
    accentLight: "rgba(15,118,110,0.08)",
    slugs: new Set<string>([
      "plate-bearing-test-interpreter",
      "soil-compaction-calculator",
      "cbr-modulus-converter",
      "concrete-curing-estimator",
      "concrete-pour-planner",
    ]),
  },
  "Training & Competence": {
    icon: "🎓",
    accent: "#BE185D",
    accentLight: "rgba(190,24,93,0.08)",
    slugs: new Set<string>([
      "first-aid-needs-calculator",
      "plant-pre-use-checksheet",
      "confined-space-calculator",
      "site-induction-duration-calculator",
    ]),
  },
  "Water & Wastewater": {
    icon: "💧",
    accent: "#1D4ED8",
    accentLight: "rgba(29,78,216,0.08)",
    slugs: new Set<string>([
      "drainage-pipe-flow-calculator",
      "confined-space-calculator",
      "welfare-facilities-calculator",
    ]),
  },
  "MEICA": {
    icon: "🔧",
    accent: "#475569",
    accentLight: "rgba(71,85,105,0.08)",
    slugs: new Set<string>([
      "noise-exposure-calculator",
      "hav-calculator",
      "sling-swl-calculator",
      "plant-pre-use-checksheet",
      "confined-space-calculator",
    ]),
  },
} as const;

type CategoryName = keyof typeof TOOL_CATEGORIES;
const CATEGORY_NAMES = Object.keys(TOOL_CATEGORIES) as CategoryName[];
const DEFAULT_CATEGORY: CategoryName = "Health & Safety";

// ─── Tool meta (icons, accents) ──────────────────────────────
const TOOL_META: Record<string, { icon: string; accent: string; accentLight: string }> = {
  "manual-handling-calculator": { icon: "🏋️", accent: "#2563EB", accentLight: "rgba(37,99,235,0.08)" },
  "fire-risk-score-calculator": { icon: "🔥", accent: "#DC2626", accentLight: "rgba(220,38,38,0.08)" },
  "materials-converter": { icon: "⚖️", accent: "#1B5745", accentLight: "rgba(27,87,69,0.08)" },
  "confined-space-calculator": { icon: "🕳️", accent: "#7C3AED", accentLight: "rgba(124,58,237,0.08)" },
  "hav-calculator": { icon: "📳", accent: "#DC2626", accentLight: "rgba(220,38,38,0.08)" },
  "access-equipment-selector": { icon: "🪜", accent: "#0369A1", accentLight: "rgba(3,105,161,0.08)" },
  "fuel-usage-calculator": { icon: "⛽", accent: "#EA580C", accentLight: "rgba(234,88,12,0.08)" },
  "wbgt-heat-stress-calculator": { icon: "🌡️", accent: "#DC2626", accentLight: "rgba(220,38,38,0.08)" },
  "plant-pre-use-checksheet": { icon: "📋", accent: "#0D9488", accentLight: "rgba(13,148,136,0.08)" },
  "construction-productivity-calculator": { icon: "📊", accent: "#7C3AED", accentLight: "rgba(124,58,237,0.08)" },
  "concrete-volume-calculator": { icon: "🧱", accent: "#64748B", accentLight: "rgba(100,116,139,0.08)" },
  "aggregate-calculator": { icon: "🪨", accent: "#B45309", accentLight: "rgba(180,83,9,0.08)" },
  "excavation-spoil-calculator": { icon: "⛏️", accent: "#92400E", accentLight: "rgba(146,64,14,0.08)" },
  "trench-backfill-calculator": { icon: "🔧", accent: "#0E7490", accentLight: "rgba(14,116,144,0.08)" },
  "brick-block-calculator": { icon: "🧱", accent: "#DC2626", accentLight: "rgba(220,38,38,0.08)" },
  "concrete-pour-planner": { icon: "🏗️", accent: "#4F46E5", accentLight: "rgba(79,70,229,0.08)" },
  "welfare-facilities-calculator": { icon: "🏠", accent: "#7C3AED", accentLight: "rgba(124,58,237,0.08)" },
  "dust-silica-calculator": { icon: "🌫️", accent: "#EA580C", accentLight: "rgba(234,88,12,0.08)" },
  "noise-exposure-calculator": { icon: "🔊", accent: "#7C3AED", accentLight: "rgba(124,58,237,0.08)" },
  "slip-risk-calculator": { icon: "⚠️", accent: "#CA8A04", accentLight: "rgba(202,138,4,0.08)" },
  "cbr-modulus-converter": { icon: "🧪", accent: "#0891B2", accentLight: "rgba(8,145,178,0.08)" },
  "topsoil-calculator": { icon: "🌱", accent: "#65A30D", accentLight: "rgba(101,163,13,0.08)" },
  "drainage-pipe-flow-calculator": { icon: "🚿", accent: "#0284C7", accentLight: "rgba(2,132,199,0.08)" },
  "uv-index-exposure-checker": { icon: "☀️", accent: "#F59E0B", accentLight: "rgba(245,158,11,0.08)" },
  "cold-stress-wind-chill-calculator": { icon: "🥶", accent: "#0EA5E9", accentLight: "rgba(14,165,233,0.08)" },
  "lone-worker-risk-calculator": { icon: "🚶", accent: "#7C3AED", accentLight: "rgba(124,58,237,0.08)" },
  "fatigue-risk-calculator": { icon: "😴", accent: "#6366F1", accentLight: "rgba(99,102,241,0.08)" },
  "first-aid-needs-calculator": { icon: "🏥", accent: "#DC2626", accentLight: "rgba(220,38,38,0.08)" },
  "scaffold-load-calculator": { icon: "🏗️", accent: "#64748B", accentLight: "rgba(100,116,139,0.08)" },
  "formwork-pressure-calculator": { icon: "🧱", accent: "#92400E", accentLight: "rgba(146,64,14,0.08)" },
  "sling-swl-calculator": { icon: "🏗️", accent: "#EA580C", accentLight: "rgba(234,88,12,0.08)" },
  "soil-compaction-calculator": { icon: "⛏️", accent: "#0891B2", accentLight: "rgba(8,145,178,0.08)" },
  "sunrise-sunset-times": { icon: "🌅", accent: "#F59E0B", accentLight: "rgba(245,158,11,0.08)" },
  "plate-bearing-test-interpreter": { icon: "🔬", accent: "#0891B2", accentLight: "rgba(8,145,178,0.08)" },
  "cable-trench-depth-checker": { icon: "⚡", accent: "#0284C7", accentLight: "rgba(2,132,199,0.08)" },
  "concrete-curing-estimator": { icon: "⏱️", accent: "#64748B", accentLight: "rgba(100,116,139,0.08)" },
  "working-days-calculator": { icon: "📅", accent: "#7C3AED", accentLight: "rgba(124,58,237,0.08)" },
  "daywork-rate-calculator": { icon: "💷", accent: "#7C3AED", accentLight: "rgba(124,58,237,0.08)" },
  "plant-hire-comparator": { icon: "🚜", accent: "#EA580C", accentLight: "rgba(234,88,12,0.08)" },
  "overtime-cost-calculator": { icon: "💰", accent: "#7C3AED", accentLight: "rgba(124,58,237,0.08)" },
  "ecological-exclusion-zone-checker": { icon: "🦎", accent: "#16A34A", accentLight: "rgba(22,163,74,0.08)" },
  "coordinate-converter": { icon: "📍", accent: "#0284C7", accentLight: "rgba(2,132,199,0.08)" },
  "historical-weather": { icon: "🌦️", accent: "#7C3AED", accentLight: "rgba(124,58,237,0.08)" },
  "working-at-height-calculator": { icon: "🪜", accent: "#DC2626", accentLight: "rgba(220,38,38,0.08)" },
  "riddor-reporting-decision-tool": { icon: "🚨", accent: "#DC2626", accentLight: "rgba(220,38,38,0.08)" },
  "asbestos-notification-decision-tool": { icon: "⚠️", accent: "#DC2626", accentLight: "rgba(220,38,38,0.08)" },
  "org-chart-generator": { icon: "📋", accent: "#7C3AED", accentLight: "rgba(124,58,237,0.08)" },
  "site-induction-duration-calculator": { icon: "🎓", accent: "#BE185D", accentLight: "rgba(190,24,93,0.08)" },
};

const DEFAULT_META = { icon: "🔧", accent: "#1B5745", accentLight: "rgba(27,87,69,0.08)" };

const PAID_TOOL_SLUGS = new Set([
  "concrete-volume-calculator", "aggregate-calculator", "excavation-spoil-calculator",
  "trench-backfill-calculator", "brick-block-calculator", "concrete-pour-planner",
  "hav-calculator", "confined-space-calculator", "welfare-facilities-calculator",
  "dust-silica-calculator", "noise-exposure-calculator", "slip-risk-calculator",
    "lone-worker-risk-calculator",
  "scaffold-load-calculator",
  "formwork-pressure-calculator",
  "drainage-pipe-flow-calculator",
  "soil-compaction-calculator",
  "cable-trench-depth-checker",
  "concrete-curing-estimator",
  "working-days-calculator",
  "daywork-rate-calculator",
  "plant-hire-comparator",
  "historical-weather",
  "working-at-height-calculator",
]);

// ─── Props ───────────────────────────────────────────────────
export interface ToolData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  features: string | null;
  status: string;
  route: string | null;
  order: number;
}

function getCategoryForSlug(slug: string): CategoryName | null {
  for (const [name, cat] of Object.entries(TOOL_CATEGORIES)) {
    if (cat.slugs.has(slug)) return name as CategoryName;
  }
  return null;
}

// ─── Component ───────────────────────────────────────────────
export default function ToolsHubClient({ tools }: { tools: ToolData[] }) {
  const [activeTab, setActiveTab] = useState<"all" | CategoryName>(DEFAULT_CATEGORY);

  const filteredTools = activeTab === "all"
    ? tools
    : tools.filter(t => TOOL_CATEGORIES[activeTab].slugs.has(t.slug));

  const activeCatAccent = activeTab !== "all" ? TOOL_CATEGORIES[activeTab].accent : "#1B5745";

  return (
    <>
      {/* Category tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {/* All button */}
        <button
          onClick={() => setActiveTab("all")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-[1.5px] text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ${
            activeTab === "all"
              ? "border-ebrora text-ebrora bg-white shadow-sm font-bold"
              : "border-gray-200 text-gray-400 bg-white hover:border-gray-300 hover:text-gray-600"
          }`}
        >
          <span>All</span>
          <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold ${
            activeTab === "all" ? "bg-ebrora text-white" : "bg-gray-100 text-gray-400"
          }`}>{tools.length}</span>
        </button>

        {CATEGORY_NAMES.map(cat => {
          const catDef = TOOL_CATEGORIES[cat];
          const count = tools.filter(t => catDef.slugs.has(t.slug)).length;
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-[1.5px] text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-white shadow-sm font-bold"
                  : "border-gray-200 text-gray-400 bg-white hover:border-gray-300 hover:text-gray-600"
              }`}
              style={isActive ? { borderColor: catDef.accent, color: catDef.accent } : undefined}
            >
              <span>{catDef.icon}</span>
              <span>{cat}</span>
              <span
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold"
                style={isActive ? { background: catDef.accent, color: "#fff" } : { background: "#f3f4f6", color: "#9ca3af" }}
              >{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tool cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
        {filteredTools.map((tool) => {
          const meta = TOOL_META[tool.slug] || DEFAULT_META;
          const isLive = tool.status === "LIVE";
          const features = tool.features
            ? tool.features.split(",").map((f: string) => f.trim())
            : [];
          const toolCat = getCategoryForSlug(tool.slug);
          const catAccent = toolCat && activeTab === "all" ? TOOL_CATEGORIES[toolCat].accent : activeCatAccent;

          return (
            <Link
              key={tool.id}
              href={tool.route || `/tools/${tool.slug}`}
              className="group relative flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden text-gray-900 no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)] hover:border-transparent"
              style={{ "--tool-accent": meta.accent, "--tool-light": meta.accentLight } as React.CSSProperties}
            >
              {/* Gradient overlay */}
              <div
                className="absolute top-0 left-0 right-0 h-[60px] rounded-t-xl transition-[height] duration-300 pointer-events-none group-hover:h-[80px]"
                style={{ background: `linear-gradient(180deg, ${meta.accentLight} 0%, transparent 100%)` }}
              />

              {/* Card body */}
              <div className="relative z-[1] p-4 flex-1 flex flex-col">
                {/* Top row: icon + badges */}
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center text-base bg-white border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:scale-105">
                    {meta.icon}
                  </div>
                  <div className="flex gap-1 flex-wrap pt-0.5">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Coming Soon</span>
                    )}
                    {PAID_TOOL_SLUGS.has(tool.slug) ? (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paid</span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Free</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5 group-hover:text-[var(--tool-accent)] transition-colors duration-200">
                  {tool.name}
                </h2>

                {/* Description */}
                <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-3 mb-4">
                  {tool.description}
                </p>

                {/* Feature tags */}
                {features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-auto mb-0">
                    {features.slice(0, 4).map((feature: string, i: number) => (
                      <span key={i} className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        {feature}
                      </span>
                    ))}
                    {features.length > 4 && (
                      <span className="text-[10px] font-medium text-gray-400 px-1 py-0.5">+{features.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="relative z-[1] px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: catAccent }} />
                  <span className="text-[11px] font-semibold text-gray-400">
                    {toolCat || "Interactive calculator"}
                  </span>
                </div>
                <span className="text-sm font-bold transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: meta.accent }}>
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
