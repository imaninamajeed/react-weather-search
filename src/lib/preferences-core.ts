import { DEFAULT_PLACE, placeSchema, type Place } from "@/lib/places";
import { DEFAULT_UNITS, isUnits } from "@/lib/units";
import type { Units } from "@/lib/weather/types";

/**
 * What we remember about a visitor. Lives in one cookie, so it is read on the server and
 * the dashboard renders personalised with no loading flash and no account.
 */
export interface Preferences {
  units: Units;
  /** Saved locations, in display order. */
  places: Place[];
  /** Key of the home location (always one of `places`), or null to use the default city. */
  homeKey: string | null;
}

/** Keeps the cookie well under the 4 KB browser limit (a place is ~250 bytes). */
export const MAX_PLACES = 10;

export const DEFAULT_PREFERENCES: Preferences = {
  units: DEFAULT_UNITS,
  places: [],
  homeKey: null,
};

/**
 * Parses the cookie value. The cookie is user-controlled input, so every field is validated
 * and anything invalid is dropped individually rather than discarding the whole thing.
 */
export function parsePreferences(
  raw: string | undefined,
  fallbackUnits: Units = DEFAULT_UNITS,
): Preferences {
  const fallback: Preferences = { ...DEFAULT_PREFERENCES, units: fallbackUnits };
  if (!raw) return fallback;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;

  const seen = new Set<string>();
  const places = (Array.isArray(record.places) ? record.places : []).flatMap((item) => {
    const parsed = placeSchema.safeParse(item);
    if (!parsed.success || seen.has(parsed.data.key)) return [];
    seen.add(parsed.data.key);
    return [parsed.data];
  });

  const homeKey =
    typeof record.homeKey === "string" && seen.has(record.homeKey) ? record.homeKey : null;

  return {
    units: isUnits(record.units) ? record.units : fallbackUnits,
    places: places.slice(0, MAX_PLACES),
    homeKey,
  };
}

export const serializePreferences = (preferences: Preferences) => JSON.stringify(preferences);

export const isSaved = (preferences: Preferences, key: string) =>
  preferences.places.some((place) => place.key === key);

/** The place the dashboard leads with. */
export function homePlace(preferences: Preferences): Place {
  return preferences.places.find((place) => place.key === preferences.homeKey) ?? DEFAULT_PLACE;
}

/**
 * The same preferences with the home location first in the list: home is always the top row,
 * wherever it was saved. Order is otherwise the user's; this only lifts home out of it.
 */
export function homeFirst(preferences: Preferences): Preferences {
  const homeKey = homePlace(preferences).key;
  const index = preferences.places.findIndex((place) => place.key === homeKey);
  if (index <= 0) return preferences;
  const places = [...preferences.places];
  places.unshift(...places.splice(index, 1));
  return { ...preferences, places };
}

/** Adds a place to the end. Returns null when the list is full. Saving twice is a no-op. */
export function addPlace(preferences: Preferences, place: Place): Preferences | null {
  if (isSaved(preferences, place.key)) return preferences;
  if (preferences.places.length >= MAX_PLACES) return null;
  return { ...preferences, places: [...preferences.places, place] };
}

/** Removes a place and reports where it was (and whether it was home), so undo can restore both. */
export function removePlace(
  preferences: Preferences,
  key: string,
): { preferences: Preferences; index: number; wasHome: boolean } | null {
  const index = preferences.places.findIndex((place) => place.key === key);
  if (index === -1) return null;
  return {
    index,
    wasHome: preferences.homeKey === key,
    preferences: {
      ...preferences,
      places: preferences.places.filter((place) => place.key !== key),
      homeKey: preferences.homeKey === key ? null : preferences.homeKey,
    },
  };
}

/** Inserts a place at `index` (clamped), optionally as home again. Used by undo. */
export function insertPlace(
  preferences: Preferences,
  place: Place,
  index: number,
  makeHome = false,
): Preferences | null {
  if (isSaved(preferences, place.key)) return preferences;
  if (preferences.places.length >= MAX_PLACES) return null;
  const places = [...preferences.places];
  places.splice(Math.min(Math.max(index, 0), places.length), 0, place);
  return homeFirst({ ...preferences, places, homeKey: makeHome ? place.key : preferences.homeKey });
}

export function movePlace(
  preferences: Preferences,
  key: string,
  direction: "up" | "down",
): Preferences {
  // Home stays on top: it cannot move, and nothing moves above it.
  const base = homeFirst(preferences);
  const first = base.places[0]?.key === homePlace(base).key ? 1 : 0;
  const from = base.places.findIndex((place) => place.key === key);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < first || to < first || to >= base.places.length) return preferences;
  const places = [...base.places];
  [places[from], places[to]] = [places[to], places[from]];
  return { ...base, places };
}

/**
 * Puts the saved places in the order given (a drag and drop sends the whole new order). Null unless
 * `keys` is exactly the saved places, or exactly the saved places other than home (the list on
 * screen, where home has its own tab), each once: this is client input, and it may only reorder.
 * Home goes to the top whatever order was sent.
 */
export function reorderPlaces(preferences: Preferences, keys: string[]): Preferences | null {
  const homeKey = homePlace(preferences).key;
  const byKey = new Map(preferences.places.map((place) => [place.key, place]));
  const withoutHome = keys.length === byKey.size - (byKey.has(homeKey) ? 1 : 0);
  if (new Set(keys).size !== keys.length) return null;
  if (keys.length !== byKey.size && !(withoutHome && !keys.includes(homeKey))) return null;
  const places = keys.map((key) => byKey.get(key));
  if (places.some((place) => place === undefined)) return null;
  const home = byKey.get(homeKey);
  const ordered = keys.includes(homeKey) || !home ? places : [home, ...places];
  return homeFirst({ ...preferences, places: ordered as Place[] });
}

/** Makes a place the home location, saving it first if needed. Null when the list is full. */
export function setHome(preferences: Preferences, place: Place): Preferences | null {
  const withPlace = addPlace(preferences, place);
  return withPlace && homeFirst({ ...withPlace, homeKey: place.key });
}

export function setUnits(preferences: Preferences, units: Units): Preferences {
  return { ...preferences, units };
}

/** US, Liberia and Myanmar are the places still on imperial units. */
const IMPERIAL_REGIONS = new Set(["US", "LR", "MM"]);

/** A first-visit default from the browser's preferred language, e.g. "en-US,en;q=0.9". */
export function defaultUnitsFor(acceptLanguage: string | null | undefined): Units {
  const primary = acceptLanguage?.split(",")[0]?.trim() ?? "";
  const region = primary.split("-")[1]?.toUpperCase();
  return region && IMPERIAL_REGIONS.has(region) ? "imperial" : "metric";
}
