// src/components/navigation/ToolsDropdown.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { TOOL_CATEGORIES, getToolName } from "@/data/tool-catalogue";

interface ToolsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

// Materialise the catalogue into the dropdown's format once at module load.
// No hand-maintained list -- any new tool added to tool-catalogue.ts shows
// up here automatically.
const CATEGORIES = Object.entries(TOOL_CATEGORIES).map(([name, spec]) => ({
  name,
  icon: spec.icon,
  tools: spec.slugs.map((slug) => ({ slug, name: getToolName(slug) })),
}));

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
