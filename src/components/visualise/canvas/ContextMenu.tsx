'use client';

// =============================================================================
// ContextMenu — fixed-position menu opened by right-click on the canvas.
//
// Items (verbatim, British spelling, sentence case):
//   Bring forward
//   Send backward
//   Delete
//   ─────
//   Copy style
//   Paste style   (disabled when no style in clipboard)
//
// Closed when:
//   - An item is clicked (handler fires, then menu dismisses)
//   - The user clicks anywhere outside the menu (window-level mousedown)
//   - The user presses Escape
//   - The parent conditionally unmounts it (e.g. selection cleared)
//
// Positioning: `left` / `top` are raw clientX / clientY from the right-click
// event. We nudge back onto-screen if the menu would overflow the viewport.
//
// Styling follows Ebrora tokens: primary #1B5B50 for hover, gold #D4A44C
// reserved for selection guides elsewhere — not used here.
// =============================================================================

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  /** Display label, already in British spelling / sentence case. */
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface Props {
  /** Viewport-space coords where the menu should anchor. */
  left: number;
  top: number;
  items: Array<ContextMenuItem | 'separator'>;
  onClose: () => void;
}

export default function ContextMenu({ left, top, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left, top });

  // Re-clamp to viewport after layout so we can measure the menu.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nextLeft = left;
    let nextTop = top;
    const margin = 4;
    if (nextLeft + r.width > vw - margin) nextLeft = Math.max(margin, vw - r.width - margin);
    if (nextTop + r.height > vh - margin) nextTop = Math.max(margin, vh - r.height - margin);
    if (nextLeft !== pos.left || nextTop !== pos.top) setPos({ left: nextLeft, top: nextTop });
    // Only re-run on anchor change — pos is derived state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, top]);

  // Outside click + Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    // Capture so we win against the canvas's own mousedown handlers.
    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Canvas actions"
      // Stop contextmenu bubbling so right-click inside the menu doesn't
      // re-trigger the canvas's own contextmenu handler.
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        zIndex: 10001,
        minWidth: 180,
        padding: '4px 0',
        background: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: 6,
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
        fontSize: 13,
        color: '#111827',
        userSelect: 'none',
      }}
    >
      {items.map((item, i) => {
        if (item === 'separator') {
          return (
            <div
              key={`sep-${i}`}
              role="separator"
              style={{ height: 1, margin: '4px 0', background: '#E5E7EB' }}
            />
          );
        }
        return (
          <MenuButton
            key={`item-${i}`}
            label={item.label}
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              item.onClick();
              onClose();
            }}
          />
        );
      })}
    </div>
  );
}

function MenuButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      // Prevent mousedown from being interpreted as "outside click" by the
      // window listener above — mousedown fires BEFORE click, so if we didn't
      // stop it the menu would close before onClick resolves.
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        display: 'block',
        width: '100%',
        padding: '6px 14px',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        fontSize: 13,
        color: disabled ? '#9CA3AF' : '#111827',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#E6F0EE';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {label}
    </button>
  );
}
