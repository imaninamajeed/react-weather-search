import { z } from "zod";

/**
 * A place is addressed by a URL key, one of:
 *   - "8504423-subang-jaya"  geocoding ID + cosmetic slug (the ID is authoritative)
 *   - "3.04,101.58"          raw coordinates (map click, geolocation)
 */
export const placeSchema = z.object({
  key: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  region: z.string().max(120).optional(),
  /** Second-level admin area (county / district), used to match official warnings. */
  district: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  countryCode: z.string().length(2).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().max(64).optional(),
});

export type Place = z.infer<typeof placeSchema>;

/** Subang Jaya, the default city of the original app. */
export const DEFAULT_PLACE: Place = {
  key: "8504423-subang-jaya",
  name: "Subang Jaya",
  region: "Selangor",
  district: "Petaling",
  country: "Malaysia",
  countryCode: "MY",
  latitude: 3.04384,
  longitude: 101.58062,
  timezone: "Asia/Kuala_Lumpur",
};

/** ~1 km resolution: plenty for weather, better cache hits, less precise location data. */
export const roundCoordinate = (value: number) => Math.round(value * 100) / 100;

export function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug || "place";
}

export function geocodedKey(id: number, name: string): string {
  return `${id}-${slugify(name)}`;
}

export function coordinateKey(latitude: number, longitude: number): string {
  return `${roundCoordinate(latitude)},${roundCoordinate(longitude)}`;
}

export type ParsedPlaceKey =
  | { kind: "geocoded"; id: number; slug: string }
  | { kind: "coordinates"; latitude: number; longitude: number };

const GEOCODED = /^(\d{1,10})(?:-([a-z0-9-]{0,60}))?$/;
const COORDINATES = /^(-?\d{1,2}(?:\.\d{1,6})?),(-?\d{1,3}(?:\.\d{1,6})?)$/;

export function parsePlaceKey(rawKey: string): ParsedPlaceKey | null {
  let key: string;
  try {
    key = decodeURIComponent(rawKey);
  } catch {
    return null;
  }

  const geocoded = GEOCODED.exec(key);
  if (geocoded) {
    const id = Number(geocoded[1]);
    return id > 0 ? { kind: "geocoded", id, slug: geocoded[2] ?? "" } : null;
  }

  const coordinates = COORDINATES.exec(key);
  if (coordinates) {
    const latitude = Number(coordinates[1]);
    const longitude = Number(coordinates[2]);
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
      return { kind: "coordinates", latitude, longitude };
    }
  }
  return null;
}

/** "3.04°N, 101.58°E" */
export function coordinateLabel(latitude: number, longitude: number): string {
  const lat = `${Math.abs(roundCoordinate(latitude))}°${latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(roundCoordinate(longitude))}°${longitude >= 0 ? "E" : "W"}`;
  return `${lat}, ${lon}`;
}

export function placeFromCoordinates(
  latitude: number,
  longitude: number,
  extra: { name?: string; timezone?: string } = {},
): Place {
  const lat = roundCoordinate(latitude);
  const lon = roundCoordinate(longitude);
  return {
    key: coordinateKey(lat, lon),
    name: extra.name ?? coordinateLabel(lat, lon),
    region: extra.name ? coordinateLabel(lat, lon) : "Dropped pin",
    latitude: lat,
    longitude: lon,
    timezone: extra.timezone,
  };
}

export function placeHref(place: Pick<Place, "key">): string {
  return `/place/${encodeURIComponent(place.key)}`;
}
