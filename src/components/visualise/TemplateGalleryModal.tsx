'use client';

// =============================================================================
// TemplateGalleryModal — category-tabbed grid of preset thumbnails.
//
// Batch 10 Phase 2 rewrite: Phase 1's plain list becomes a proper gallery.
//
// Layout:
//   ┌──────────────────────────────────────────────────────────────┐
//   │  Browse all templates                                    ×   │
//   │  [search box]                                                │
//   │                                                               │
//   │  [All] [Flow] [Process] [Timeline] [Hierarchy] [...]         │
//   │  ──────────────────────────────────────────────────────────  │
//   │                                                               │
//   │   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                    │
//   │   │ thumb│  │ thumb│  │ thumb│  │ thumb│                    │
//   │   │ name │  │ name │  │ name │  │ name │                    │
//   │   └──────┘  └──────┘  └──────┘  └──────┘                    │
//   │   ... (responsive grid, 2-4 cols)                            │
//   │                                                               │
//   │  [Cancel]                                                     │
//   └──────────────────────────────────────────────────────────────┘
//
// Behaviour:
//   - Category tabs filter the grid. "All" shows everything.
//   - Search is a free-text filter across name + id + aiDescription.
//   - Active preset and presets already in `excludePresetIds` are hidden —
//     they're already instantly available via the VariantPicker.
//   - Clicking a tile fires `onPick(presetId)` and closes. The parent runs
//     a silent auto-remap (POST /api/visualise/generate with silent:true).
// =============================================================================

import { useMemo, useState } from 'react';
import { getAllPresets } from '@/lib/visualise/presets';
import type { PresetCategory } from '@/lib/visualise/presets/types';
import {
  getCategoryTileBg,
  getCategoryTileBgHover,
  getCategoryDot,
} from '@/lib/visualise/categoryColors';

interface Props {
  open: boolean;
  activePresetId: string;
  excludePresetIds: string[];
  onClose: () => void;
  onPick: (presetId: string) => void;
}

type TabId = 'all' | PresetCategory;

// Tab order and labels — shown in the order listed.
const TAB_DEFS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'flow', label: 'Flow' },
  { id: 'process', label: 'Process' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'hierarchy', label: 'Hierarchy' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'cycle', label: 'Cycle' },
  { id: 'comparison', label: 'Compare' },
  { id: 'positioning', label: 'Matrix' },
  { id: 'funnel-pyramid', label: 'Funnel' },
  { id: 'charts', label: 'Charts' },
  { id: 'construction', label: 'Construction' },
];

export default function TemplateGalleryModal({
  open,
  activePresetId,
  excludePresetIds,
  onClose,
  onPick,
}: Props) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');

  // Compute availability once per modal open. excludeSet is the active preset
  // plus any variants already shown in the picker — no point showing them here.
  const { filtered, countsByTab } = useMemo(() => {
    const all = getAllPresets();
    const excludeSet = new Set([activePresetId, ...excludePresetIds]);
    const needle = query.trim().toLowerCase();

    // Pool: everything not excluded, matching the search term.
    const pool = all.filter((p) => {
      if (excludeSet.has(p.id)) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle) ||
        p.aiDescription.toLowerCase().includes(needle)
      );
    });

    // Tab filter on top of pool.
    const filtered = activeTab === 'all' ? pool : pool.filter((p) => p.category === activeTab);

    // Counts per tab for the badges (computed on the search-filtered pool
    // so badges reflect "how many match your search in this tab").
    const countsByTab: Record<TabId, number> = {
      all: pool.length,
      flow: 0,
      process: 0,
      timeline: 0,
      hierarchy: 0,
      relationships: 0,
      cycle: 0,
      comparison: 0,
      positioning: 0,
      'funnel-pyramid': 0,
      charts: 0,
      construction: 0,
    };
    for (const p of pool) {
      countsByTab[p.category as TabId] = (countsByTab[p.category as TabId] ?? 0) + 1;
    }
    return { filtered, countsByTab };
  }, [activePresetId, excludePresetIds, query, activeTab]);

  if (!open) return null;

  const visibleTabs = TAB_DEFS.filter((t) => t.id === 'all' || countsByTab[t.id] > 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#1B5B50]">Browse all templates</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Pick a template and Visualise will re-map your text to fit it. Costs 1 use.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 inline-flex items-center justify-center rounded text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates by name or description…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B5B50]"
          />
        </div>

        {/* Category tabs */}
        <div className="px-3 pt-2 border-b border-gray-100 overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-2">
            {visibleTabs.map((tab) => {
              const count = countsByTab[tab.id];
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#1B5B50] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] tabular-nums ${
                      isActive ? 'text-white/80' : 'text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="max-h-[60vh] overflow-y-auto px-4 py-4 bg-gray-50">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">
              {query
                ? `No templates match “${query}” in this category.`
                : 'All templates in this category are already available in the variant picker.'}
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((p) => {
                const tileBg = getCategoryTileBg(p.category);
                const tileBgHover = getCategoryTileBgHover(p.category);
                const tileDot = getCategoryDot(p.category);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(p.id);
                        onClose();
                      }}
                      className="w-full h-full flex flex-col gap-2 p-3 rounded-lg border border-gray-200 bg-white hover:border-[#1B5B50] hover:shadow-sm transition-all text-left group"
                      title={p.description}
                    >
                      {/* Thumbnail with category-tinted background */}
                      <div
                        className={`w-full h-16 rounded border border-gray-100 flex items-center justify-center overflow-hidden transition-colors ${tileBg} ${tileBgHover}`}
                        dangerouslySetInnerHTML={{ __html: p.thumbnailSvg }}
                        aria-hidden="true"
                      />
                      {/* Name + category dot */}
                      <div className="flex-1 min-h-0">
                        <div className="flex items-start gap-1.5">
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${tileDot}`}
                            aria-hidden="true"
                          />
                          <p className="text-xs font-semibold text-[#1B5B50] leading-tight line-clamp-2 flex-1">
                            {p.name}
                          </p>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-snug mt-1 line-clamp-2 pl-3">
                          {p.description}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500">
            Showing {filtered.length} of {countsByTab.all} available templates
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
