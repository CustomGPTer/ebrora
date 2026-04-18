'use client';

// =============================================================================
// SvgCanvas — pan/zoom container for a single rendered preset.
//
// Hosts an 8 px (world-space) grid background and the preset's natural
// <svg viewBox>. Zoom is wheel-driven, snap-to-centre, clamped 0.1× to 4×.
// Pan is Space+drag (held-space cursor becomes grab/grabbing).
//
// The outer wrapper is fixed-size (fills the CanvasEditor main area). A
// single transformed <div> contains the grid SVG and the preset SVG. Both
// live inside `transform: translate(panX, panY) scale(scale)` so they move
// together and scale together.
//
// Wheel listener is attached via addEventListener with `passive: false`
// because `preventDefault()` in a React `onWheel` is a no-op in modern
// browsers (React 17+ binds wheel listeners as passive by default).
//
// 6a scope: renders the preset read-only. Click/drag to select nodes,
// resize handles, inline text edit — all land in 6b/6c. The element that
// hosts the preset has id `canvas-svg-root` so later batches can attach
// event delegation.
// =============================================================================

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export interface Viewport {
  scale: number;
  panX: number;
  panY: number;
}

export interface SvgCanvasApi {
  getViewport: () => Viewport;
  setViewport: (v: Viewport) => void;
  fitToContent: () => void;
  resetTo100: () => void;
  /**
   * Set an exact scale, snapping the content to the centre of the viewport.
   * Used by the zoom slider in the top toolbar.
   */
  setScaleCentred: (scale: number) => void;
}

interface Props {
  /** Natural content width in SVG user units (matches the preset's viewBox w). */
  contentWidth: number;
  /** Natural content height in SVG user units (matches the preset's viewBox h). */
  contentHeight: number;
  /** Preset render output — normally a single <svg> element at natural size. */
  children: ReactNode;
  /** Rulers rendered by parent need to know the live viewport — this pushes updates. */
  onViewportChange?: (v: Viewport) => void;
  /** Imperative handle for parent buttons (Fit, 100%). */
  apiRef?: React.MutableRefObject<SvgCanvasApi | null>;
  /**
   * Called on mousedown when Space is NOT held — i.e. the user intends to
   * select or drag content rather than pan. Space+drag is handled internally
   * and will NOT invoke this callback.
   */
  onContentMouseDown?: (e: React.MouseEvent) => void;
  /** Forwarded ref to the outer wrapper div. Used by overlay components that
   *  need to compute viewport-relative coords. */
  wrapperRef?: React.MutableRefObject<HTMLDivElement | null>;
  /** Forwarded ref to the inner transformed div (id="canvas-svg-root"). */
  contentRef?: React.MutableRefObject<HTMLDivElement | null>;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 4;
const GRID_STEP = 8;
const PAD_FOR_FIT = 40;

export default function SvgCanvas({
  contentWidth,
  contentHeight,
  children,
  onViewportChange,
  apiRef,
  onContentMouseDown,
  wrapperRef,
  contentRef,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewportState] = useState<Viewport>({ scale: 1, panX: 0, panY: 0 });

  // Track container size so Fit works correctly.
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setContainerSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pan state: space-held flag + drag origin.
  const spaceHeldRef = useRef(false);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const [spaceCursor, setSpaceCursor] = useState(false);

  const pushViewport = useCallback(
    (next: Viewport | ((prev: Viewport) => Viewport)) => {
      setViewportState((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        const clamped: Viewport = {
          scale: clamp(resolved.scale, MIN_SCALE, MAX_SCALE),
          panX: resolved.panX,
          panY: resolved.panY,
        };
        onViewportChange?.(clamped);
        return clamped;
      });
    },
    [onViewportChange],
  );

  const fitToContent = useCallback(() => {
    if (containerSize.w <= 0 || containerSize.h <= 0) return;
    const scaleX = (containerSize.w - PAD_FOR_FIT * 2) / contentWidth;
    const scaleY = (containerSize.h - PAD_FOR_FIT * 2) / contentHeight;
    const fitScale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, MAX_SCALE);
    const panX = (containerSize.w - contentWidth * fitScale) / 2;
    const panY = (containerSize.h - contentHeight * fitScale) / 2;
    pushViewport({ scale: fitScale, panX, panY });
  }, [containerSize, contentWidth, contentHeight, pushViewport]);

  const resetTo100 = useCallback(() => {
    const panX = (containerSize.w - contentWidth) / 2;
    const panY = (containerSize.h - contentHeight) / 2;
    pushViewport({ scale: 1, panX, panY });
  }, [containerSize, contentWidth, contentHeight, pushViewport]);

  const setScaleCentred = useCallback(
    (nextRaw: number) => {
      if (containerSize.w <= 0 || containerSize.h <= 0) return;
      const nextScale = clamp(nextRaw, MIN_SCALE, MAX_SCALE);
      pushViewport({
        scale: nextScale,
        panX: (containerSize.w - contentWidth * nextScale) / 2,
        panY: (containerSize.h - contentHeight * nextScale) / 2,
      });
    },
    [containerSize, contentWidth, contentHeight, pushViewport],
  );

  // Fit on first layout.
  const didInitialFit = useRef(false);
  useEffect(() => {
    if (didInitialFit.current) return;
    if (containerSize.w <= 0) return;
    fitToContent();
    didInitialFit.current = true;
  }, [containerSize.w, containerSize.h, fitToContent]);

  // Expose imperative API for the CanvasEditor top bar.
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      getViewport: () => viewport,
      setViewport: (v) => pushViewport(v),
      fitToContent,
      resetTo100,
      setScaleCentred,
    };
    return () => {
      if (apiRef.current) apiRef.current = null;
    };
  }, [apiRef, viewport, pushViewport, fitToContent, resetTo100, setScaleCentred]);

  // Wheel → zoom. Must be non-passive to call preventDefault.
  // Per Jon's preference: zoom SNAPS to centre the chart in the viewport
  // rather than zooming-at-cursor. This keeps the content predictably
  // positioned and means a zoom-out never leaves the chart drifted.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      // ~15 % per notch — ctrl-wheel (pinch on trackpad) is a finer pinch step.
      const factor = e.ctrlKey ? (e.deltaY < 0 ? 1.05 : 1 / 1.05) : e.deltaY < 0 ? 1.15 : 1 / 1.15;

      pushViewport((prev) => {
        const nextScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
        // Snap to centre the content within the container at the new scale.
        return {
          scale: nextScale,
          panX: (containerSize.w - contentWidth * nextScale) / 2,
          panY: (containerSize.h - contentHeight * nextScale) / 2,
        };
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [pushViewport, containerSize.w, containerSize.h, contentWidth, contentHeight]);

  // Space hold → drag cursor. Keydown/keyup on window (so focus can be anywhere).
  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      if (t.isContentEditable) return true;
      const tag = t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spaceHeldRef.current && !isTypingTarget(e.target)) {
        spaceHeldRef.current = true;
        setSpaceCursor(true);
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
        setSpaceCursor(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Mouse drag handlers.
  const onMouseDown = (e: React.MouseEvent) => {
    if (spaceHeldRef.current) {
      if (e.button !== 0) return;
      dragStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: viewport.panX,
        startPanY: viewport.panY,
      };
      e.preventDefault();
      return;
    }
    // Not panning — forward to the content handler (selection/drag in
    // CanvasEditor). Middle/right buttons get ignored here.
    if (e.button !== 0) return;
    onContentMouseDown?.(e);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const st = dragStateRef.current;
      if (!st) return;
      pushViewport((prev) => ({
        scale: prev.scale,
        panX: st.startPanX + (e.clientX - st.startX),
        panY: st.startPanY + (e.clientY - st.startY),
      }));
    };
    const onUp = () => {
      dragStateRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [pushViewport]);

  const cursor = spaceCursor
    ? dragStateRef.current
      ? 'grabbing'
      : 'grab'
    : 'default';

  return (
    <div
      ref={(node) => {
        wrapRef.current = node;
        if (wrapperRef) wrapperRef.current = node;
      }}
      onMouseDown={onMouseDown}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#F9FAFB',
        cursor,
      }}
      data-canvas-wrapper=""
    >
      {/* Transformed layer — both grid and preset live inside this. */}
      <div
        id="canvas-svg-root"
        ref={(node) => {
          if (contentRef) contentRef.current = node;
        }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: contentWidth,
          height: contentHeight,
          transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {/* Grid background — 8 px world-space steps. */}
        <svg
          width={contentWidth}
          height={contentHeight}
          viewBox={`0 0 ${contentWidth} ${contentHeight}`}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="visualise-canvas-grid"
              width={GRID_STEP}
              height={GRID_STEP}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={0} cy={0} r={0.5} fill="#D1D5DB" />
            </pattern>
          </defs>
          <rect
            x={0}
            y={0}
            width={contentWidth}
            height={contentHeight}
            fill="white"
            stroke="#E5E7EB"
            strokeWidth={1}
          />
          <rect
            x={0}
            y={0}
            width={contentWidth}
            height={contentHeight}
            fill="url(#visualise-canvas-grid)"
          />
        </svg>
        {/* The preset's natural <svg> — rendered as-provided by the preset. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: contentWidth,
            height: contentHeight,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
