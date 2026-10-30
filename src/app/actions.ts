"use server";

import { getPreferences, writePreferences } from "@/lib/preferences";
import {
  MAX_PLACES,
  addPlace,
  insertPlace,
  movePlace as movePlaceIn,
  removePlace as removePlaceIn,
  reorderPlaces as reorderPlacesIn,
  setHome as setHomeIn,
  setUnits as setUnitsIn,
  type Preferences,
} from "@/lib/preferences-core";
import { isLocale } from "@/lib/i18n/locales";
import { getTranslations, writeLocale } from "@/lib/i18n/server";
import { lookupPlace } from "@/lib/resolve-place";
import { isUnits } from "@/lib/units";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Errors are shown to the visitor, so they are written in their language. */
async function messages() {
  const { errors } = (await getTranslations()).common;
  return { limit: errors.limitReached(MAX_PLACES), notFound: errors.locationNotFound, errors };
}

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
  const text = await messages();
  const place = await resolve(key);
  if (!place) return { ok: false, error: text.notFound };
  return (await update((prefs) => addPlace(prefs, place)))
    ? { ok: true }
    : { ok: false, error: text.limit };
}

export async function removePlace(
  key: string,
): Promise<ActionResult<{ index: number; wasHome: boolean }>> {
  const preferences = await getPreferences();
  const removed = typeof key === "string" ? removePlaceIn(preferences, key) : null;
  if (!removed) return { ok: false, error: (await messages()).notFound };
  await writePreferences(removed.preferences);
  return { ok: true, index: removed.index, wasHome: removed.wasHome };
}

/** Undo for removePlace: puts the place back where it was. */
export async function restorePlace(
  key: string,
  index: number,
  wasHome: boolean,
): Promise<ActionResult> {
  const text = await messages();
  const place = await resolve(key);
  if (!place || !Number.isInteger(index)) return { ok: false, error: text.notFound };
  return (await update((prefs) => insertPlace(prefs, place, index, wasHome === true)))
    ? { ok: true }
    : { ok: false, error: text.limit };
}

export async function setHome(key: string): Promise<ActionResult> {
  const text = await messages();
  const place = await resolve(key);
  if (!place) return { ok: false, error: text.notFound };
  return (await update((prefs) => setHomeIn(prefs, place)))
    ? { ok: true }
    : { ok: false, error: text.limit };
}

export async function movePlace(key: string, direction: "up" | "down"): Promise<ActionResult> {
  if (typeof key !== "string" || (direction !== "up" && direction !== "down")) {
    return { ok: false, error: (await messages()).errors.invalidRequest };
  }
  await update((prefs) => movePlaceIn(prefs, key, direction));
  return { ok: true };
}

/** Drag and drop: the whole new order, as keys. Anything but a reordering of the saved places is refused. */
export async function reorderPlaces(keys: string[]): Promise<ActionResult> {
  if (!Array.isArray(keys) || keys.some((key) => typeof key !== "string")) {
    return { ok: false, error: (await messages()).errors.invalidRequest };
  }
  return (await update((prefs) => reorderPlacesIn(prefs, keys)))
    ? { ok: true }
    : { ok: false, error: "Your places changed. Try again." };
}

export async function setUnits(units: string): Promise<ActionResult> {
  if (!isUnits(units)) return { ok: false, error: (await messages()).errors.invalidUnits };
  await update((prefs) => setUnitsIn(prefs, units));
  return { ok: true };
}

/** Saves the interface language. Setting the cookie also re-renders the current page in it. */
export async function setLanguage(language: string): Promise<ActionResult> {
  if (!isLocale(language)) return { ok: false, error: (await messages()).errors.invalidLanguage };
  await writeLocale(language);
  return { ok: true };
}
