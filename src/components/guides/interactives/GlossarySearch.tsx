// src/components/guides/interactives/GlossarySearch.tsx
"use client";

import { useState, useMemo } from "react";

/* ─── Category tagging by keyword matching ─── */
const CATEGORIES: { id: string; label: string; color: string; keywords: string[] }[] = [
  { id: "process", label: "Process", color: "#059669", keywords: ["sludge","activated","biological","oxygen","flow","settlement","suspended","volatile","retention","loading","membrane","reactor","filter","aerob","anaerob","nitrif","carbon","phosphor","nutrient","BOD","COD","dissolved oxygen","DWF","FFT","MLSS","SRT","HRT","SOR","SLR","ASP","MBR","MBBR","IFAS","Nereda","MOB","PST","FST","HST","DAF","RAS","SAS ","VSS","TSS","EBPR","ORP","WWTW","granular","clarif","thicken","aeration","diffus"] },
  { id: "meica", label: "MEICA / ICA", color: "#2563EB", keywords: ["motor","electrical","PLC","SCADA","control","instrument","pump","blower","valve","drive","MCC","DCS","HMI","RTU","VFD","VSD","I/O","ICA","MEICA","telemetry","UPS","HVAC","circuit","breaker","earth","cable","actuator","alternating"] },
  { id: "safety", label: "Health & Safety", color: "#DC2626", keywords: ["safety","hazard","CDM","COSHH","DSEAR","explosive","ATEX","risk","LOLER","LOTO","lifting","PUWER","RAMS","emergency","shutdown","ventilation","LEV","design risk","H&S","welfare","PPE","POWRA","fire"] },
  { id: "quality", label: "Quality & Testing", color: "#7C3AED", keywords: ["test","inspect","acceptance","FAT","SAT","ITP","MCERTS","calibrat","certif","quality","CQA","monitor","compliance","verification","Technical Query","RFI"] },
  { id: "commercial", label: "Commercial", color: "#EA580C", keywords: ["cost","contract","NEC","EPC","DBO","CAPEX","OPEX","damage","LAD","asset management","AMP","programme","commercial","bill","BOM","DfMA","whole life","WLC","procure","change control","MoC"] },
  { id: "materials", label: "Materials", color: "#64748B", keywords: ["steel","concrete","pipe","plastic","rubber","EPDM","GRP","galvan","stainless","coat","lining","BSP","WRAS","NRV","cathodic","corrosion","GAC","carbon fibre"] },
  { id: "monitoring", label: "Monitoring", color: "#0891B2", keywords: ["monitor","measure","meter","sensor","analyser","sample","detector","FID","GPR","level","pressure","UV","transmit","alarm","data","EEMUA","EDM","LMH","TMP","TDS","UVT","VOC","dispersion"] },
];

function categorise(term: string, definition: string): { label: string; color: string } | null {
  const combined = `${term} ${definition}`;
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (combined.toLowerCase().includes(kw.toLowerCase())) {
        return { label: cat.label, color: cat.color };
      }
    }
  }
  return null;
}

/* ─── Parse entries from markdown content ─── */
function parseGlossaryEntries(content: string): { term: string; definition: string }[] {
  const entries: { term: string; definition: string }[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(/^[-•]\s+(.+?):\s+(.+)$/);
    if (match) {
      const term = match[1].replace(/\*\*(.+?)\*\*/g, "$1").trim();
      const defn = match[2].replace(/\*\*(.+?)\*\*/g, "$1").trim();
      if (term.length > 0 && defn.length > 5) {
        entries.push({ term, definition: defn });
      }
    }
  }
  return entries;
}

/* ─── Component ─── */
interface GlossarySearchProps {
  glossaryContent?: string;
}

export function GlossarySearch({ glossaryContent }: GlossarySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allEntries = useMemo(() => {
    return glossaryContent ? parseGlossaryEntries(glossaryContent) : [];
  }, [glossaryContent]);

  const letters = useMemo(() => {
    const set = new Set(allEntries.map((e) => e.term[0].toUpperCase()));
    return Array.from(set).sort();
  }, [allEntries]);

  const filtered = useMemo(() => {
    let results = allEntries;
    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      results = results.filter((e) => e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q));
    }
    if (activeLetter) {
      results = results.filter((e) => e.term[0].toUpperCase() === activeLetter);
    }
    if (activeCategory) {
      const cat = CATEGORIES.find((c) => c.id === activeCategory);
      if (cat) results = results.filter((e) => { const c = categorise(e.term, e.definition); return c && c.label === cat.label; });
    }
    return results;
  }, [searchQuery, activeLetter, activeCategory, allEntries]);

  if (allEntries.length === 0) return null;

  return (
    <div className="my-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <div className="relative mb-4">
          <input type="text" placeholder="Search terms or definitions..."
            value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setActiveLetter(null); }}
            className="w-full h-11 pl-10 pr-4 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#1B5B50] focus:ring-1 focus:ring-[#1B5B50]/20 transition-all outline-none" />
          <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 p-0.5 rounded-md hover:bg-gray-100 text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          <button onClick={() => setActiveLetter(null)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${!activeLetter ? "bg-[#1B5B50] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>All</button>
          {letters.map((letter) => (
            <button key={letter} onClick={() => { setActiveLetter(activeLetter === letter ? null : letter); setSearchQuery(""); }}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${activeLetter === letter ? "bg-[#1B5B50] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{letter}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${activeCategory === cat.id ? "text-white border-transparent" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
              style={activeCategory === cat.id ? { backgroundColor: cat.color } : {}}>{cat.label}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs text-gray-400 font-medium">{filtered.length} of {allEntries.length} terms</span>
        {(searchQuery || activeLetter || activeCategory) && (
          <button onClick={() => { setSearchQuery(""); setActiveLetter(null); setActiveCategory(null); }} className="text-xs text-[#1B5B50] font-medium hover:underline">Clear filters</button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((entry) => {
          const cat = categorise(entry.term, entry.definition);
          return (
            <div key={entry.term} className="bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors">
              <div className="flex items-start gap-2">
                <span className="font-bold text-gray-900 text-sm shrink-0">{entry.term}</span>
                {cat && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>{cat.label}</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{entry.definition}</p>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400"><p className="text-sm">No terms found matching your search.</p></div>
      )}
    </div>
  );
}
