"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { placeSchema, type Place } from "@/lib/places";

const STORAGE_KEY = "isobar:recent-searches";
const MAX_RECENT = 5;
const CHANGE_EVENT = "isobar:recent-searches-changed";

function read(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    // Storage can be blocked (private windows, site settings); recents just stay empty.
    return "[]";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function parse(raw: string): Place[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const result = placeSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

/** Per-device recent searches. Stored places are re-validated on every read. */
export function useRecentSearches() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const recents = useMemo(() => parse(raw), [raw]);

  const add = useCallback((place: Place) => {
    const next = [place, ...parse(read()).filter((item) => item.key !== place.key)].slice(
      0,
      MAX_RECENT,
    );
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Ignore: recents are a convenience.
    }
  }, []);

  return { recents, add };
}
