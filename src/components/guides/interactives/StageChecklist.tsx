// src/components/guides/interactives/StageChecklist.tsx
"use client";

import { useState, useMemo } from "react";
import type { GuideSubsystem } from "@/data/guides/types";

/* ─── Category colours and icons ─── */
const CATEGORY_STYLES: Record<string, { color: string; bg: string; icon: string }> = {
  "hold": { color: "#DC2626", bg: "bg-red-50", icon: "🔴" },
  "design": { color: "#059669", bg: "bg-emerald-50", icon: "📐" },
  "civils": { color: "#EA580C", bg: "bg-orange-50", icon: "🧱" },
  "meica": { color: "#2563EB", bg: "bg-blue-50", icon: "⚙️" },
  "commissioning": { color: "#7C3AED", bg: "bg-purple-50", icon: "🔧" },
  "handover": { color: "#1B5B50", bg: "bg-teal-50", icon: "📋" },
  "evidence": { color: "#059669", bg: "bg-emerald-50", icon: "📁" },
  "performance": { color: "#7C3AED", bg: "bg-purple-50", icon: "📊" },
  "safety": { color: "#DC2626", bg: "bg-red-50", icon: "🛡️" },
  "drainage": { color: "#EA580C", bg: "bg-orange-50", icon: "🏗️" },
};

function getCategoryStyle(title: string): { color: string; bg: string; icon: string } {
  const t = title.toLowerCase();
  if (t.includes("hold point") || t.includes("clear before")) return CATEGORY_STYLES.hold;
  if (t.includes("design") || t.includes("technical")) return CATEGORY_STYLES.design;
  if (t.includes("civils") || t.includes("drainage") || t.includes("infrastructure")) return CATEGORY_STYLES.drainage;
  if (t.includes("meica") || t.includes("ica")) return CATEGORY_STYLES.meica;
  if (t.includes("commissioning") || t.includes("prerequisite")) return CATEGORY_STYLES.commissioning;
  if (t.includes("handover") || t.includes("acceptance") || t.includes("readiness")) return CATEGORY_STYLES.handover;
  if (t.includes("evidence") || t.includes("documentation")) return CATEGORY_STYLES.evidence;
  if (t.includes("performance") || t.includes("operability")) return CATEGORY_STYLES.performance;
  if (t.includes("safety") || t.includes("environmental") || t.includes("legal")) return CATEGORY_STYLES.safety;
  return { color: "#64748B", bg: "bg-gray-50", icon: "📝" };
}

/* ─── Parse bullet items from markdown content ─── */
function parseItems(content: string): string[] {
  return content
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^[-•]\s+/, "").replace(/\*\*(.+?)\*\*/g, "$1").trim())
    .filter((l) => l.length > 10);
}

/* ─── Main component ─── */
interface StageChecklistProps {
  subsystem: GuideSubsystem;
  stageColor: string;
}

export function StageChecklist({ subsystem, stageColor }: StageChecklistProps) {
  const [checked, setChecked] = useState<Record<string, Set<number>>>({});
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // Parse categories from subsections
  const categories = useMemo(() => {
    return subsystem.subsections.map((ss) => ({
      id: ss.id,
      title: ss.title.replace(/---/g, "—").trim(),
      items: parseItems(ss.content),
      style: getCategoryStyle(ss.title),
    }));
  }, [subsystem]);

  const toggleCheck = (catId: string, idx: number) => {
    setChecked((prev) => {
      const next = { ...prev };
      const set = new Set(next[catId] || []);
      if (set.has(idx)) set.delete(idx);
      else set.add(idx);
      next[catId] = set;
      return next;
    });
  };

  const toggleCat = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Totals
  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const totalChecked = Object.values(checked).reduce((acc, s) => acc + s.size, 0);
  const progressPct = totalItems > 0 ? (totalChecked / totalItems) * 100 : 0;

  const expandAll = () => {
    if (expandedCats.size === categories.length) {
      setExpandedCats(new Set());
    } else {
      setExpandedCats(new Set(categories.map((c) => c.id)));
    }
  };

  const clearAll = () => setChecked({});

  return (
    <div className="my-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header with overall progress */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor: `${stageColor}15` }}>
              ✅
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Interactive Checklist</h4>
              <p className="text-xs text-gray-500">{categories.length} categories · {totalItems} items</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="text-xs font-medium text-[#1B5B50] hover:underline">
              {expandedCats.size === categories.length ? "Collapse all" : "Expand all"}
            </button>
            {totalChecked > 0 && (
              <button onClick={clearAll} className="text-xs font-medium text-gray-400 hover:text-red-500 ml-2">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct === 100 ? "#059669" : stageColor,
              }}
            />
          </div>
          <span className={`text-sm font-bold min-w-[48px] text-right ${progressPct === 100 ? "text-emerald-600" : "text-gray-700"}`}>
            {totalChecked}/{totalItems}
          </span>
        </div>

        {progressPct === 100 && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span className="text-sm text-emerald-700 font-medium">All items complete — ready for stage sign-off</span>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="divide-y divide-gray-100">
        {categories.map((cat) => {
          const catChecked = checked[cat.id] || new Set();
          const catProgress = cat.items.length > 0 ? (catChecked.size / cat.items.length) * 100 : 0;
          const isExpanded = expandedCats.has(cat.id);
          const isComplete = catChecked.size === cat.items.length && cat.items.length > 0;

          return (
            <div key={cat.id}>
              {/* Category header */}
              <button
                onClick={() => toggleCat(cat.id)}
                className={`w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50/50 transition-colors ${isComplete ? "bg-emerald-50/30" : ""}`}
              >
                <span className="text-lg shrink-0">{cat.style.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{cat.title}</span>
                    {isComplete && <span className="text-emerald-500 text-xs font-bold">✓ Complete</span>}
                  </div>
                  {/* Mini progress */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${catProgress}%`, backgroundColor: isComplete ? "#059669" : cat.style.color }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{catChecked.size}/{cat.items.length}</span>
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Items */}
              {isExpanded && (
                <div className={`px-6 pb-4 pt-1 ${cat.style.bg} border-l-4`} style={{ borderLeftColor: cat.style.color }}>
                  <div className="space-y-2">
                    {cat.items.map((item, idx) => {
                      const isChecked = catChecked.has(idx);
                      return (
                        <label key={idx} className="flex items-start gap-3 cursor-pointer group py-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheck(cat.id, idx)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 cursor-pointer shrink-0"
                            style={{ accentColor: cat.style.color }}
                          />
                          <span className={`text-sm leading-relaxed transition-all ${
                            isChecked ? "text-gray-400 line-through" : "text-gray-700 group-hover:text-gray-900"
                          }`}>
                            {item}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
