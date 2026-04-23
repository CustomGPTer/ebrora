// src/lib/site-photo-stamp/use-settings.ts
//
// Client-side settings hook with localStorage persistence.
//
// Settings are loaded once on mount, merged over DEFAULT_SETTINGS (so new
// fields added in future releases don't break existing saved state), and
// written back on every mutation.
//
// All methods are safe on the server (SSR): they return DEFAULT_SETTINGS
// until hydration runs.
"use client";

import { useCallback, useEffect, useState } from "react";
import type { Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const STORAGE_KEY = "spstamp:settings";

export interface UseSettings {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  loaded: boolean;
}

export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Load on first mount.
  useEffect(() => {
    if (typeof window === "undefined") {
      setLoaded(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // Corrupted JSON or quota error — fall back to defaults.
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next: Settings) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota exceeded (rare — settings are tiny). Settings are still held
      // in-memory for the session, just not persisted.
    }
  }, []);

  const update = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next: Settings = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { settings, update, reset, loaded };
}
