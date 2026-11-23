"use client";

import { useSyncExternalStore } from "react";

export const COLUMN_OPTIONS = [4, 5] as const;
export type Columns = (typeof COLUMN_OPTIONS)[number];

/** Four across is the default: roomy enough to read at a glance, and a full set fits on one screen. */
export const DEFAULT_COLUMNS: Columns = 4;
const STORAGE_KEY = "saved-columns";
const CHANGE_EVENT = "saved-columns-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(): Columns {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return COLUMN_OPTIONS.find((columns) => columns === stored) ?? DEFAULT_COLUMNS;
  } catch {
    return DEFAULT_COLUMNS;
  }
}

function write(columns: Columns) {
  try {
    localStorage.setItem(STORAGE_KEY, String(columns));
  } catch {
    // Private windows can refuse storage; the choice then lasts until the page closes.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * How many saved-location tiles go across, kept on this device and shared by the control and the
 * grid wherever they are on the page. The server cannot know the stored choice, so it renders the
 * default and the browser corrects it.
 */
export function useSavedColumns(): [Columns, (columns: Columns) => void] {
  return [useSyncExternalStore(subscribe, read, () => DEFAULT_COLUMNS), write];
}
