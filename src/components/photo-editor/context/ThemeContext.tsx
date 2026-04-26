// src/components/photo-editor/context/ThemeContext.tsx
//
// React context wrapping the useThemeStore hook so any component
// inside the editor can read or toggle the theme without prop-drilling.
// Q24 — user-toggleable, remembered between sessions.
// Theme is scoped to the editor only; it does not affect the rest of
// the Ebrora site.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useThemeStore, type ThemeStore } from "@/lib/photo-editor/theme/store";

const ThemeContext = createContext<ThemeStore | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const store = useThemeStore();
  return (
    <ThemeContext.Provider value={store}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeStore {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
