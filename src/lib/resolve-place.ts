import "server-only";
import { notFound, redirect } from "next/navigation";
import { getPlaceById } from "@/lib/open-meteo/geocoding";
import {
  coordinateKey,
  parsePlaceKey,
  placeFromCoordinates,
  placeHref,
  type Place,
} from "@/lib/places";

/** Finds the place a URL key points at, or null if the key is malformed or unknown. */
export async function lookupPlace(rawKey: string): Promise<Place | null> {
  const parsed = parsePlaceKey(rawKey);
  if (!parsed) return null;
  if (parsed.kind === "geocoded") return getPlaceById(parsed.id);
  return placeFromCoordinates(parsed.latitude, parsed.longitude);
}

/**
 * Resolves a URL key to a place for rendering: 404s for bad keys and redirects
 * non-canonical keys (wrong slug, over-precise coordinates) to the canonical URL, keeping
 * any sub-path such as "/history".
 */
export async function resolvePlace(rawKey: string, subPath = ""): Promise<Place> {
  const place = await lookupPlace(rawKey);
  if (!place) notFound();

  const requested = decodeURIComponent(rawKey);
  const canonical =
    parsePlaceKey(rawKey)?.kind === "coordinates"
      ? coordinateKey(place.latitude, place.longitude)
      : place.key;
  if (requested !== canonical) redirect(`${placeHref({ key: canonical })}${subPath}`);

  return place;
}
