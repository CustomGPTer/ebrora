'use client';

// =============================================================================
// VariantPicker — Phase 3 rewrite: live-data thumbnails, keyboard navigation,
// drag-reorder, and per-category colour tinting.
//
// Key differences from Phase 2:
//   - Tiles now render the preset's actual render function with the variant's
//     populated data (small size), so you see the REAL content shape — not
//     the hand-authored static preview. The user picks by what their content
//     looks like in each layout.
//   - Keyboard navigation: ← / → cycle focus between tiles, Enter/Space
//     activates (swaps to) the focused variant, Home/End jump to first/last.
//   - Drag-reorder: the off-variant tiles are draggable. Dragging one over
//     another swaps their positions in the `variants` array. This is a pure
//     visual reshuffle — no undo snapshot, no AI call.
//   - Category colour tinting: each tile's thumbnail container gets a soft
//     tint matching its preset's category. Active state still uses Ebrora
//     primary; category colours layer underneath.
//
// Behaviour preserved from Phase 2:
//   - Active tile is first, non-clickable, green ring.
//   - Non-active tiles click → onSelect(i) (instant client-side swap).
//   - "Browse all" tile → onOpenGallery (server-side remap via gallery modal).
//
// Performance note: rendering 3 small SVGs per card is negligible — the
// preset render functions are pure, and we only render the ones currently
// in the variants list (typically 2). Even across a 10-visual document
// that's 30 tiny SVGs total, well within React's capability.
// =============================================================================

import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type DragEvent,
  type RefObject,
} from 'react';
import type { VariantOption, VisualSettings } from '@/lib/visualise/types';
import { getPresetById } from '@/lib/visualise/presets';
import {
  getCategoryTileBg,
  getCategoryTileBgHover,
  getCategoryDot,
  getCategoryShortLabel,
} from '@/lib/visualise/categoryColors';

// ── Thumbnail dimensions ────────────────────────────────────────────────────
// The SVG is rendered at these dimensions in user units; CSS scales it to fit
// the 112px-wide container. Going much smaller than 160×72 makes text labels
// collapse to illegible dots on presets that rely on node captions — 160×72
// keeps the overall shape readable while staying compact.
const THUMB_W = 160;
const THUMB_H = 72;

interface Props {
  activePresetId: string;
  activeTitle: string;
  activeData: unknown;
  settings: VisualSettings;
  variants: VariantOption[];
  disabled?: boolean;
  onSelect: (index: number) => void;
  onReorder: (variants: VariantOption[]) => void;
  onOpenGallery: () => void;
}

interface TileProps {
  presetId: string;
  data: unknown;
  settings: VisualSettings;
  fallbackLabel: string;
  isActive: boolean;
  disabled?: boolean;
  tileRef?: RefObject<HTMLElement | null>;
  onClick?: () => void;
  onKeyNav?: (direction: 'prev' | 'next' | 'first' | 'last') => void;
  // Drag-reorder — only wired for non-active tiles
  draggable?: boolean;
  isDragTarget?: boolean;
  isBeingDragged?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: DragEvent<HTMLButtonElement>) => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

// Wrapper tile renderer. We deliberately keep the button (clickable tile)
// and div (active tile) variants very similar so state transitions between
// them don't jump visually.
function VariantTile({
  presetId,
  data,
  settings,
  fallbackLabel,
  isActive,
  disabled,
  tileRef,
  onClick,
  onKeyNav,
  draggable,
  isDragTarget,
  isBeingDragged,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: TileProps) {
  const preset = getPresetById(presetId);
  const label = preset?.name ?? fallbackLabel;
  const category = preset?.category;
  const categoryTileBg = getCategoryTileBg(category);
  const categoryTileBgHover = getCategoryTileBgHover(category);
  const categoryDot = getCategoryDot(category);
  const categoryLabel = getCategoryShortLabel(category);

  // Render the preset's actual render function with the variant data.
  // Missing preset (shouldn't happen — registry is static) falls back to
  // a neutral placeholder box.
  let thumbnailNode = null;
  if (preset) {
    const Render = preset.render as React.ComponentType<{
      data: unknown;
      settings: VisualSettings;
      width: number;
      height: number;
    }>;
    thumbnailNode = (
      <Render data={data} settings={settings} width={THUMB_W} height={THUMB_H} />
    );
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!onKeyNav) return;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        onKeyNav('next');
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        onKeyNav('prev');
        break;
      case 'Home':
        e.preventDefault();
        onKeyNav('first');
        break;
      case 'End':
        e.preventDefault();
        onKeyNav('last');
        break;
      default:
        break;
    }
  };

  const tileBase =
    'flex flex-col items-stretch gap-1.5 px-2 pt-2 pb-1.5 rounded-lg border transition-all text-left w-28 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5B50] focus-visible:ring-offset-1';
  const tileActive = 'border-[#1B5B50] bg-white shadow-sm ring-2 ring-[#1B5B50]/20 cursor-default';
  const tileIdle =
    'border-gray-200 bg-white hover:border-[#1B5B50] hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none';
  const tileDragTarget = 'ring-2 ring-[#1B5B50] ring-offset-1';
  const tileBeingDragged = 'opacity-40';

  const thumbBase = `w-full h-14 rounded border border-gray-200 flex items-center justify-center overflow-hidden ${categoryTileBg} ${isActive ? '' : categoryTileBgHover}`;

  const labelRow = (
    <div className="flex items-center justify-between gap-1 px-0.5 min-w-0">
      <div className="min-w-0 flex-1">
        <span
          className={`block text-[11px] font-semibold leading-tight line-clamp-2 ${isActive ? 'text-[#1B5B50]' : 'text-gray-700'}`}
        >
          {label}
        </span>
        {categoryLabel ? (
          <span className="flex items-center gap-1 mt-0.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${categoryDot}`}
              aria-hidden="true"
            />
            <span className="text-[9px] uppercase tracking-wider text-gray-400">
              {categoryLabel}
            </span>
          </span>
        ) : null}
      </div>
      {isActive ? (
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#1B5B50] flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );

  // Non-clickable active tile (group class enables thumbnail hover tint on siblings only).
  if (isActive) {
    return (
      <div
        ref={tileRef as RefObject<HTMLDivElement>}
        className={`${tileBase} ${tileActive} group`}
        aria-current="true"
        aria-label={`Active variant: ${label}`}
        tabIndex={-1}
      >
        <div className={thumbBase} aria-hidden="true">
          <div className="w-full pointer-events-none">{thumbnailNode}</div>
        </div>
        {labelRow}
      </div>
    );
  }

  return (
    <button
      ref={tileRef as RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      draggable={draggable && !disabled}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
      onDragEnd={onDragEnd}
      className={`${tileBase} ${tileIdle} ${isDragTarget ? tileDragTarget : ''} ${isBeingDragged ? tileBeingDragged : ''} group`}
      aria-label={`Switch to ${label}${categoryLabel ? ` (${categoryLabel})` : ''}`}
      title={preset?.description ?? label}
    >
      <div className={thumbBase} aria-hidden="true">
        <div className="w-full pointer-events-none">{thumbnailNode}</div>
      </div>
      {labelRow}
    </button>
  );
}

export default function VariantPicker({
  activePresetId,
  activeTitle,
  activeData,
  settings,
  variants,
  disabled,
  onSelect,
  onReorder,
  onOpenGallery,
}: Props) {
  // ── Keyboard navigation between tiles ───────────────────────────────────
  // The active tile isn't focusable (it's a div), so keyboard navigation
  // skips past it: Tab lands on variant #0, ← goes back to variant #N-1,
  // → goes forward to variant #0 again. Home/End jump to first/last.
  // The tile order for navigation is [variant 0, variant 1, ..., variant N-1, Browse].
  const variantRefs = useMemo(
    () => variants.map(() => createRef<HTMLButtonElement>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variants.length],
  );
  const browseRef = useRef<HTMLButtonElement>(null);

  const focusTileAt = useCallback(
    (index: number) => {
      const total = variants.length + 1; // +1 for browse
      const wrapped = ((index % total) + total) % total;
      if (wrapped === variants.length) {
        browseRef.current?.focus();
      } else {
        variantRefs[wrapped]?.current?.focus();
      }
    },
    [variantRefs, variants.length],
  );

  const handleTileKeyNav = useCallback(
    (fromIndex: number, direction: 'prev' | 'next' | 'first' | 'last') => {
      const total = variants.length + 1;
      switch (direction) {
        case 'next':
          focusTileAt(fromIndex + 1);
          break;
        case 'prev':
          focusTileAt(fromIndex - 1);
          break;
        case 'first':
          focusTileAt(0);
          break;
        case 'last':
          focusTileAt(total - 1);
          break;
      }
    },
    [focusTileAt, variants.length],
  );

  // ── Drag-reorder state ──────────────────────────────────────────────────
  // We track which variant index is currently being dragged and which one
  // the drag is hovered over. On drop, we swap the two indices in variants.
  // Pure reshuffling — does not affect which variant is active.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const onTileDragStart = (i: number) => () => {
    setDragIndex(i);
  };

  const onTileDragOver = (i: number) => (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault(); // allow drop
    if (dragIndex !== null && dragIndex !== i) {
      setHoverIndex(i);
    }
  };

  const onTileDragLeave = () => {
    setHoverIndex(null);
  };

  const onTileDrop = (i: number) => () => {
    if (dragIndex === null || dragIndex === i) {
      setDragIndex(null);
      setHoverIndex(null);
      return;
    }
    const next = [...variants];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setHoverIndex(null);
  };

  const onTileDragEnd = () => {
    setDragIndex(null);
    setHoverIndex(null);
  };

  // Clear drag state if variants change under our feet (e.g. swap happens
  // mid-drag, though that shouldn't in practice).
  useEffect(() => {
    setDragIndex(null);
    setHoverIndex(null);
  }, [variants.length, activePresetId]);

  return (
    <div className="flex flex-wrap items-start gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
      <div className="flex flex-col justify-center mr-1 flex-shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          AI picks
        </span>
        <span className="text-[10px] text-gray-400 mt-0.5">
          Click to swap · Drag to reorder
        </span>
      </div>

      {/* Active tile */}
      <VariantTile
        presetId={activePresetId}
        data={activeData}
        settings={settings}
        fallbackLabel={activeTitle}
        isActive
      />

      {/* Off-variant tiles — draggable, keyboard-navigable */}
      {variants.map((variant, i) => (
        <VariantTile
          key={`${variant.presetId}-${i}`}
          presetId={variant.presetId}
          data={variant.data}
          settings={settings}
          fallbackLabel={variant.presetId}
          isActive={false}
          disabled={disabled}
          tileRef={variantRefs[i]}
          onClick={() => onSelect(i)}
          onKeyNav={(dir) => handleTileKeyNav(i, dir)}
          draggable
          isDragTarget={hoverIndex === i && dragIndex !== null && dragIndex !== i}
          isBeingDragged={dragIndex === i}
          onDragStart={onTileDragStart(i)}
          onDragOver={onTileDragOver(i)}
          onDragLeave={onTileDragLeave}
          onDrop={onTileDrop(i)}
          onDragEnd={onTileDragEnd}
        />
      ))}

      {/* Browse-all tile — keyboard navigable, not draggable */}
      <button
        ref={browseRef}
        type="button"
        onClick={onOpenGallery}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            handleTileKeyNav(variants.length, 'next');
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            handleTileKeyNav(variants.length, 'prev');
          } else if (e.key === 'Home') {
            e.preventDefault();
            handleTileKeyNav(variants.length, 'first');
          } else if (e.key === 'End') {
            e.preventDefault();
            handleTileKeyNav(variants.length, 'last');
          }
        }}
        disabled={disabled}
        className="flex flex-col items-center justify-center gap-1.5 px-2 pt-2 pb-1.5 rounded-lg border border-dashed border-gray-300 bg-white hover:border-[#1B5B50] hover:bg-[#F5FAF9] disabled:opacity-50 disabled:cursor-not-allowed transition-all w-28 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5B50] focus-visible:ring-offset-1"
        aria-label="Browse all templates"
      >
        <div className="w-full h-14 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
          <span className="text-2xl text-gray-400 leading-none select-none" aria-hidden="true">
            +
          </span>
        </div>
        <span className="text-[11px] font-semibold text-[#1B5B50] leading-tight">
          Browse all
        </span>
      </button>
    </div>
  );
}
