"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Place } from "@/lib/places";

interface PalettePlacesState {
  places: Place[];
  homeKey: string | undefined;
}

const EMPTY: PalettePlacesState = { places: [], homeKey: undefined };

// The palette is mounted once and never swapped, or opening it while the cookie streams in would
// lose the open dialog. The followed places reach it through this store instead.
let state = EMPTY;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** The places the palette offers before anything is typed. */
export function usePalettePlaces(): PalettePlacesState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}

/** Renders nothing; hands the followed places (from the server) to the palette. */
export function PalettePlaces({ places, homeKey }: PalettePlacesState) {
  useEffect(() => {
    state = { places, homeKey };
    listeners.forEach((listener) => listener());
  }, [places, homeKey]);
  return null;
}
