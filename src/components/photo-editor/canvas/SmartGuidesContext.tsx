// src/components/photo-editor/canvas/SmartGuidesContext.tsx
//
// State for the smart-guide overlay. A draggable layer node calls
// setGuides(verticalXs, horizontalYs) on each dragmove; SmartGuides
// reads it and renders Konva.Line nodes. clearGuides() on dragend.
// Phase 1 — Apr 2026.

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface SmartGuidesState {
  verticalXs: readonly number[];
  horizontalYs: readonly number[];
}

interface SmartGuidesApi extends SmartGuidesState {
  setGuides: (verticalXs: readonly number[], horizontalYs: readonly number[]) => void;
  clearGuides: () => void;
}

const EMPTY: SmartGuidesState = { verticalXs: [], horizontalYs: [] };

const SmartGuidesContext = createContext<SmartGuidesApi | null>(null);

export function SmartGuidesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SmartGuidesState>(EMPTY);

  const setGuides = useCallback(
    (verticalXs: readonly number[], horizontalYs: readonly number[]) => {
      setState((prev) => {
        if (
          prev.verticalXs.length === verticalXs.length &&
          prev.horizontalYs.length === horizontalYs.length &&
          prev.verticalXs.every((v, i) => v === verticalXs[i]) &&
          prev.horizontalYs.every((v, i) => v === horizontalYs[i])
        ) {
          return prev;
        }
        return { verticalXs, horizontalYs };
      });
    },
    [],
  );

  const clearGuides = useCallback(() => {
    setState((prev) =>
      prev.verticalXs.length === 0 && prev.horizontalYs.length === 0
        ? prev
        : EMPTY,
    );
  }, []);

  const value = useMemo<SmartGuidesApi>(
    () => ({ ...state, setGuides, clearGuides }),
    [state, setGuides, clearGuides],
  );

  return (
    <SmartGuidesContext.Provider value={value}>
      {children}
    </SmartGuidesContext.Provider>
  );
}

export function useSmartGuides(): SmartGuidesApi {
  const ctx = useContext(SmartGuidesContext);
  if (!ctx) {
    throw new Error("useSmartGuides must be used inside <SmartGuidesProvider>");
  }
  return ctx;
}
