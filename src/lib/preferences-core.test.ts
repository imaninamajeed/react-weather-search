import { describe, expect, it } from "vitest";
import { DEFAULT_PLACE, type Place } from "@/lib/places";
import {
  DEFAULT_PREFERENCES,
  MAX_PLACES,
  addPlace,
  defaultUnitsFor,
  homePlace,
  insertPlace,
  movePlace,
  parsePreferences,
  removePlace,
  serializePreferences,
  setHome,
  setUnits,
  type Preferences,
} from "./preferences-core";

const place = (id: number): Place => ({
  key: `${id}-p${id}`,
  name: `Place ${id}`,
  latitude: id,
  longitude: id,
});

const withPlaces = (...ids: number[]): Preferences => ({
  ...DEFAULT_PREFERENCES,
  places: ids.map(place),
});

describe("parsePreferences", () => {
  it("round-trips", () => {
    const prefs: Preferences = { units: "imperial", places: [place(1), place(2)], homeKey: "2-p2" };
    expect(parsePreferences(serializePreferences(prefs))).toEqual(prefs);
  });

  it("falls back to defaults for missing or garbage cookies", () => {
    expect(parsePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("not json")).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("42")).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("null")).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(undefined, "imperial").units).toBe("imperial");
  });

  it("drops invalid, duplicate and excess places individually", () => {
    const raw = JSON.stringify({
      units: "kelvin",
      places: [
        place(1),
        { key: "bad", name: "x", latitude: 999, longitude: 0 },
        "nonsense",
        place(1),
        ...Array.from({ length: 20 }, (_, i) => place(i + 10)),
      ],
      homeKey: "1-p1",
    });
    const prefs = parsePreferences(raw);
    expect(prefs.units).toBe("metric");
    expect(prefs.places).toHaveLength(MAX_PLACES);
    expect(prefs.places[0]).toEqual(place(1));
    expect(new Set(prefs.places.map((p) => p.key)).size).toBe(MAX_PLACES);
  });

  it("ignores a home key that isn't a saved place", () => {
    const raw = JSON.stringify({ units: "metric", places: [place(1)], homeKey: "99-ghost" });
    expect(parsePreferences(raw).homeKey).toBeNull();
  });
});

describe("mutations", () => {
  it("adds places once and respects the limit", () => {
    const once = addPlace(DEFAULT_PREFERENCES, place(1))!;
    expect(addPlace(once, place(1))).toBe(once);
    const full = withPlaces(...Array.from({ length: MAX_PLACES }, (_, i) => i + 1));
    expect(addPlace(full, place(99))).toBeNull();
  });

  it("removes a place, reports its index, and clears home if it was home", () => {
    const prefs = { ...withPlaces(1, 2, 3), homeKey: "2-p2" };
    const result = removePlace(prefs, "2-p2")!;
    expect(result.index).toBe(1);
    expect(result.wasHome).toBe(true);
    expect(result.preferences.places.map((p) => p.key)).toEqual(["1-p1", "3-p3"]);
    expect(result.preferences.homeKey).toBeNull();
    expect(removePlace(prefs, "nope")).toBeNull();
  });

  it("restores a removed place at its old position", () => {
    const prefs = withPlaces(1, 2, 3);
    const { preferences, index } = removePlace(prefs, "2-p2")!;
    expect(insertPlace(preferences, place(2), index)!.places.map((p) => p.key)).toEqual([
      "1-p1",
      "2-p2",
      "3-p3",
    ]);
    expect(insertPlace(preferences, place(2), 99)!.places.at(-1)).toEqual(place(2));
  });

  it("undoing the removal of the home place makes it home again", () => {
    const prefs = { ...withPlaces(1, 2), homeKey: "1-p1" };
    const { preferences, index, wasHome } = removePlace(prefs, "1-p1")!;
    expect(preferences.homeKey).toBeNull();
    const restored = insertPlace(preferences, place(1), index, wasHome)!;
    expect(restored).toEqual(prefs);
  });

  it("moves places and stops at the ends", () => {
    const prefs = withPlaces(1, 2, 3);
    expect(movePlace(prefs, "3-p3", "up").places.map((p) => p.key)).toEqual([
      "1-p1",
      "3-p3",
      "2-p2",
    ]);
    expect(movePlace(prefs, "1-p1", "up")).toBe(prefs);
    expect(movePlace(prefs, "3-p3", "down")).toBe(prefs);
    expect(movePlace(prefs, "ghost", "up")).toBe(prefs);
  });

  it("setHome saves the place first when needed", () => {
    const prefs = setHome(DEFAULT_PREFERENCES, place(5))!;
    expect(prefs.places).toEqual([place(5)]);
    expect(homePlace(prefs)).toEqual(place(5));
  });

  it("home falls back to the default city", () => {
    expect(homePlace(DEFAULT_PREFERENCES)).toEqual(DEFAULT_PLACE);
  });

  it("sets units", () => {
    expect(setUnits(DEFAULT_PREFERENCES, "imperial").units).toBe("imperial");
  });
});

describe("defaultUnitsFor", () => {
  it.each([
    ["en-US,en;q=0.9", "imperial"],
    ["en-GB,en;q=0.9", "metric"],
    ["ms-MY", "metric"],
    ["en", "metric"],
    ["", "metric"],
    [null, "metric"],
  ])("%s → %s", (header, expected) => {
    expect(defaultUnitsFor(header)).toBe(expected);
  });
});
