"use server";

import { getPreferences, writePreferences } from "@/lib/preferences";
import {
  MAX_PLACES,
  addPlace,
  insertPlace,
  movePlace as movePlaceIn,
  removePlace as removePlaceIn,
  setHome as setHomeIn,
  setUnits as setUnitsIn,
  type Preferences,
} from "@/lib/preferences-core";
import { lookupPlace } from "@/lib/resolve-place";
import { isUnits } from "@/lib/units";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const LIMIT_MESSAGE = `You can save up to ${MAX_PLACES} places. Remove one to add another.`;
const NOT_FOUND_MESSAGE = "We couldn't find that place.";

/*
 * Server Actions are public POST endpoints, so each one treats its arguments as untrusted:
 * places are always re-resolved from their key on the server (never taken from the client),
 * and enums are validated. Setting the cookie also re-renders the current page.
 */

async function resolve(key: unknown) {
  return typeof key === "string" && key.length <= 120 ? lookupPlace(key) : null;
}

async function update(change: (preferences: Preferences) => Preferences | null) {
  const next = change(await getPreferences());
  if (!next) return false;
  await writePreferences(next);
  return true;
}

export async function savePlace(key: string): Promise<ActionResult> {
  const place = await resolve(key);
  if (!place) return { ok: false, error: NOT_FOUND_MESSAGE };
  return (await update((prefs) => addPlace(prefs, place)))
    ? { ok: true }
    : { ok: false, error: LIMIT_MESSAGE };
}

export async function removePlace(
  key: string,
): Promise<ActionResult<{ index: number; wasHome: boolean }>> {
  const preferences = await getPreferences();
  const removed = typeof key === "string" ? removePlaceIn(preferences, key) : null;
  if (!removed) return { ok: false, error: NOT_FOUND_MESSAGE };
  await writePreferences(removed.preferences);
  return { ok: true, index: removed.index, wasHome: removed.wasHome };
}

/** Undo for removePlace: puts the place back where it was. */
export async function restorePlace(
  key: string,
  index: number,
  wasHome: boolean,
): Promise<ActionResult> {
  const place = await resolve(key);
  if (!place || !Number.isInteger(index)) return { ok: false, error: NOT_FOUND_MESSAGE };
  return (await update((prefs) => insertPlace(prefs, place, index, wasHome === true)))
    ? { ok: true }
    : { ok: false, error: LIMIT_MESSAGE };
}

export async function setHome(key: string): Promise<ActionResult> {
  const place = await resolve(key);
  if (!place) return { ok: false, error: NOT_FOUND_MESSAGE };
  return (await update((prefs) => setHomeIn(prefs, place)))
    ? { ok: true }
    : { ok: false, error: LIMIT_MESSAGE };
}

export async function movePlace(key: string, direction: "up" | "down"): Promise<ActionResult> {
  if (typeof key !== "string" || (direction !== "up" && direction !== "down")) {
    return { ok: false, error: "Invalid request." };
  }
  await update((prefs) => movePlaceIn(prefs, key, direction));
  return { ok: true };
}

export async function setUnits(units: string): Promise<ActionResult> {
  if (!isUnits(units)) return { ok: false, error: "Invalid units." };
  await update((prefs) => setUnitsIn(prefs, units));
  return { ok: true };
}
