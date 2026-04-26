// src/lib/photo-editor/theme/store.ts
//
// Theme state hook — light / dark, persisted to localStorage.
// Q24: user-toggleable, remembered between sessions.
// Q26: default is light.
//
// Scoped to the photo editor only — does not affect the rest of the
// Ebrora site theme.

"use client";

import { useEffect, useState } from "react";
import type { Theme } from "../types";
import { STORAGE_PREFIX } from "../types";

const THEME_KEY = `${STORAGE_PREFIX}theme`;

export interface ThemeStore {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  /** True once we've read from localStorage. Use to avoid theme flicker. */
  loaded: boolean;
}

export function useThemeStore(): ThemeStore {
  const [theme, setThemeState] = useState<Theme>("light");
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
      }
    } catch {
      // localStorage unavailable (private mode, blocked) — fall back to light.
    }
    setLoaded(true);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      // Ignore storage failures.
    }
  };

  const toggle = () => setTheme(theme === "light" ? "dark" : "light");

  return { theme, setTheme, toggle, loaded };
}
