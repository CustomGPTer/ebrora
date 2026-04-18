'use client';

// =============================================================================
// SettingsPanel — right-sidebar controls for the currently-edited visual.
// Sections: title, palette, font, layout (if preset supports it), show title.
//
// Each control calls `onUpdate` with a partial VisualInstance. The CanvasEditor
// merges that patch + pushes it through to VisualiseClient via its onUpdateVisual
// callback, so changes flow all the way back to the document state.
//
// 6a ships a compact layout-toggle radio even though no current preset
// renders differently per layout. Future presets (e.g. hierarchy-org-simple
// horizontal vs vertical) will read the setting and branch.
// =============================================================================

import type { PaletteId, VisualInstance, VisualSettings } from '@/lib/visualise/types';
import PaletteChooser from './PaletteChooser';

interface Props {
  visual: VisualInstance;
  onUpdate: (patch: Partial<VisualInstance>) => void;
}

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Inter, sans-serif', label: 'Inter (default)' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
  { value: 'ui-monospace, SFMono-Regular, Menlo, monospace', label: 'Monospace' },
];

const LAYOUT_OPTIONS: Array<NonNullable<VisualSettings['layout']>> = [
  'horizontal',
  'vertical',
  'radial',
];

export default function SettingsPanel({ visual, onUpdate }: Props) {
  const { settings } = visual;

  const patchSettings = (patch: Partial<VisualSettings>) => {
    onUpdate({ settings: { ...settings, ...patch } });
  };

  return (
    <div className="flex flex-col gap-5 p-3 text-sm">
      {/* Title */}
      <section>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={visual.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Visual title"
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B5B50]/30 focus:border-[#1B5B50]"
        />
        <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showTitle}
            onChange={(e) => patchSettings({ showTitle: e.target.checked })}
            className="rounded border-gray-300 text-[#1B5B50] focus:ring-[#1B5B50]"
          />
          Show title in output
        </label>
      </section>

      {/* Palette */}
      <section>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
          Palette
        </label>
        <PaletteChooser
          value={settings.paletteId}
          onChange={(id: PaletteId) => patchSettings({ paletteId: id })}
        />
      </section>

      {/* Font */}
      <section>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
          Font
        </label>
        <select
          value={settings.font}
          onChange={(e) => patchSettings({ font: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5B50]/30 focus:border-[#1B5B50]"
        >
          {FONT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </section>

      {/* Layout */}
      <section>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
          Layout
        </label>
        <div className="flex gap-1" role="radiogroup" aria-label="Layout">
          {LAYOUT_OPTIONS.map((opt) => {
            const active = settings.layout === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => patchSettings({ layout: opt })}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md border transition-colors capitalize ${
                  active
                    ? 'border-[#1B5B50] bg-[#E6F0EE] text-[#1B5B50]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-gray-500">
          Not all presets respond to layout — some have a fixed orientation.
        </p>
      </section>

      {/* Custom colour overrides indicator */}
      {Object.keys(settings.customColors).length > 0 ? (
        <section>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Custom colours
            </span>
            <button
              type="button"
              onClick={() => patchSettings({ customColors: {} })}
              className="text-xs font-medium text-[#1B5B50] hover:underline"
            >
              Clear all
            </button>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            {Object.keys(settings.customColors).length} node
            {Object.keys(settings.customColors).length === 1 ? '' : 's'} overridden
          </p>
        </section>
      ) : null}
    </div>
  );
}
