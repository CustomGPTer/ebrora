// src/components/navigation/ToolsDropdown.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface ToolsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToolEntry {
  name: string;
  slug: string;
}

interface Category {
  name: string;
  icon: string;
  tools: ToolEntry[];
}

const CATEGORIES: Category[] = [
  {
    name: "Health & Safety",
    icon: "🛡️",
    tools: [
      { name: "Manual Handling Calculator", slug: "manual-handling-calculator" },
      { name: "Working at Height Calculator", slug: "working-at-height-calculator" },
      { name: "WBGT Heat Stress Calculator", slug: "wbgt-heat-stress-calculator" },
      { name: "Fire Risk Score Calculator", slug: "fire-risk-score-calculator" },
      { name: "HAV Calculator", slug: "hav-calculator" },
      { name: "Confined Space Calculator", slug: "confined-space-calculator" },
      { name: "Welfare Facilities Calculator", slug: "welfare-facilities-calculator" },
      { name: "Dust & Silica Calculator", slug: "dust-silica-calculator" },
      { name: "Noise Exposure Calculator", slug: "noise-exposure-calculator" },
      { name: "Slip Risk Calculator", slug: "slip-risk-calculator" },
      { name: "UV Index Exposure Checker", slug: "uv-index-exposure-checker" },
      { name: "Cold Stress Wind Chill Calculator", slug: "cold-stress-wind-chill-calculator" },
      { name: "Lone Worker Risk Calculator", slug: "lone-worker-risk-calculator" },
      { name: "Fatigue Risk Calculator", slug: "fatigue-risk-calculator" },
      { name: "First Aid Needs Calculator", slug: "first-aid-needs-calculator" },
      { name: "RIDDOR Reporting Decision Tool", slug: "riddor-reporting-decision-tool" },
      { name: "Asbestos Notification Decision Tool", slug: "asbestos-notification-decision-tool" },
    ],
  },
  {
    name: "Temporary Works",
    icon: "🏗️",
    tools: [
      { name: "Scaffold Load Calculator", slug: "scaffold-load-calculator" },
      { name: "Formwork Pressure Calculator", slug: "formwork-pressure-calculator" },
    ],
  },
  {
    name: "Concrete",
    icon: "🧱",
    tools: [
      { name: "Concrete Volume Calculator", slug: "concrete-volume-calculator" },
      { name: "Concrete Pour Planner", slug: "concrete-pour-planner" },
      { name: "Concrete Curing Estimator", slug: "concrete-curing-estimator" },
    ],
  },
  {
    name: "Materials & Quantities",
    icon: "🧱",
    tools: [
      { name: "Materials Converter", slug: "materials-converter" },
      { name: "Aggregate Calculator", slug: "aggregate-calculator" },
      { name: "Brick & Block Calculator", slug: "brick-block-calculator" },
      { name: "Sling SWL Calculator", slug: "sling-swl-calculator" },
    ],
  },
  {
    name: "Plant & Equipment",
    icon: "🚜",
    tools: [
      { name: "Access Equipment Selector", slug: "access-equipment-selector" },
      { name: "Fuel Usage Calculator", slug: "fuel-usage-calculator" },
      { name: "Plant Pre-Use Checksheet", slug: "plant-pre-use-checksheet" },
      { name: "Plant Hire Comparator", slug: "plant-hire-comparator" },
    ],
  },
  {
    name: "Earthworks & Ground",
    icon: "⛏️",
    tools: [
      { name: "Excavation Spoil Calculator", slug: "excavation-spoil-calculator" },
      { name: "Trench Backfill Calculator", slug: "trench-backfill-calculator" },
      { name: "CBR Modulus Converter", slug: "cbr-modulus-converter" },
      { name: "Topsoil Calculator", slug: "topsoil-calculator" },
      { name: "Soil Compaction Calculator", slug: "soil-compaction-calculator" },
      { name: "Plate Bearing Test Interpreter", slug: "plate-bearing-test-interpreter" },
    ],
  },
  {
    name: "Programme & Commercial",
    icon: "📊",
    tools: [
      { name: "Construction Productivity Calculator", slug: "construction-productivity-calculator" },
      { name: "Working Days Calculator", slug: "working-days-calculator" },
      { name: "Daywork Rate Calculator", slug: "daywork-rate-calculator" },
      { name: "Overtime Cost Calculator", slug: "overtime-cost-calculator" },
    ],
  },
  {
    name: "Environmental & Ecology",
    icon: "🌿",
    tools: [
      { name: "Ecological Exclusion Zone Checker", slug: "ecological-exclusion-zone-checker" },
      { name: "Asbestos Notification Decision Tool", slug: "asbestos-notification-decision-tool" },
    ],
  },
  {
    name: "Utilities & Services",
    icon: "⚡",
    tools: [
      { name: "Cable Trench Depth Checker", slug: "cable-trench-depth-checker" },
      { name: "Trench Backfill Calculator", slug: "trench-backfill-calculator" },
      { name: "Drainage Pipe Flow Calculator", slug: "drainage-pipe-flow-calculator" },
    ],
  },
  {
    name: "Surveying & Setting Out",
    icon: "📐",
    tools: [
      { name: "Coordinate Converter", slug: "coordinate-converter" },
      { name: "Sunrise & Sunset Times", slug: "sunrise-sunset-times" },
    ],
  },
  {
    name: "Quality & Testing",
    icon: "🔬",
    tools: [
      { name: "Plate Bearing Test Interpreter", slug: "plate-bearing-test-interpreter" },
      { name: "Concrete Curing Estimator", slug: "concrete-curing-estimator" },
    ],
  },
  {
    name: "Training & Competence",
    icon: "🎓",
    tools: [],
  },
  {
    name: "Water & Wastewater",
    icon: "💧",
    tools: [
      { name: "Drainage Pipe Flow Calculator", slug: "drainage-pipe-flow-calculator" },
    ],
  },
  {
    name: "MEICA",
    icon: "🔧",
    tools: [],
  },
];

export function ToolsDropdown({ isOpen, onClose }: ToolsDropdownProps) {
  const [hoveredCat, setHoveredCat] = useState<number>(0);

  if (!isOpen) return null;

  const activeCat = CATEGORIES[hoveredCat];

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 w-[640px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]"
      role="menu"
    >
      <div className="flex" style={{ minHeight: 380 }}>
        {/* Left: Categories */}
        <div className="w-[220px] border-r border-gray-100 py-2 overflow-y-auto" style={{ maxHeight: 420 }}>
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onMouseEnter={() => setHoveredCat(i)}
              onClick={() => setHoveredCat(i)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-colors ${
                hoveredCat === i
                  ? "bg-[#1B5745]/5 text-[#1B5745] font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-base shrink-0">{cat.icon}</span>
              <span className="truncate">{cat.name}</span>
              {cat.tools.length > 0 && (
                <svg className={`w-3.5 h-3.5 ml-auto shrink-0 transition-colors ${hoveredCat === i ? "text-[#1B5745]" : "text-gray-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Right: Tools for hovered category */}
        <div className="flex-1 py-3 px-4 overflow-y-auto" style={{ maxHeight: 420 }}>
          <div className="mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{activeCat.name}</h3>
          </div>
          {activeCat.tools.length > 0 ? (
            <div className="space-y-0.5">
              {activeCat.tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  onClick={onClose}
                  className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-[#1B5745]/5 hover:text-[#1B5745] transition-colors"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic px-3 py-2">Coming soon</p>
          )}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              href="/tools"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#1B5745] hover:bg-[#1B5745]/5 transition-colors"
            >
              View all tools
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
