import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { geocodedKey, type Place } from "@/lib/places";
import { fetchJson, openMeteoUrl, UpstreamError } from "./client";
import { MIN_QUERY_LENGTH, normalizeQuery } from "./geocoding-query";

const SOURCE = "open-meteo/geocoding";
const MAX_RESULTS = 8;

const resultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country_code: z.string().length(2).optional(),
  country: z.string().optional(),
  admin1: z.string().optional(),
  admin2: z.string().optional(),
  timezone: z.string().optional(),
});

// An empty search omits `results` entirely.
const searchResponseSchema = z.object({ results: z.array(resultSchema).default([]) });

type GeocodingResult = z.infer<typeof resultSchema>;

export function toPlace(result: GeocodingResult): Place {
  return {
    key: geocodedKey(result.id, result.name),
    name: result.name,
    region: result.admin1,
    district: result.admin2,
    country: result.country,
    countryCode: result.country_code?.toUpperCase(),
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  };
}

async function fetchSearch(query: string): Promise<Place[]> {
  "use cache";
  cacheLife("days");

  const url = openMeteoUrl("geocoding", "/v1/search", {
    name: query,
    count: MAX_RESULTS,
    language: "en",
    format: "json",
  });
  const { results } = await fetchJson(url, searchResponseSchema, { source: SOURCE });
  return results.map(toPlace);
}

/** Autocomplete search by place name. Returns [] for queries that are too short. */
export function searchPlaces(query: string): Promise<Place[]> {
  const normalized = normalizeQuery(query);
  if (normalized.length < MIN_QUERY_LENGTH) return Promise.resolve([]);
  return fetchSearch(normalized);
}

async function fetchPlaceById(id: number): Promise<Place | null> {
  "use cache";
  cacheLife("max");

  const url = openMeteoUrl("geocoding", "/v1/get", { id });
  try {
    return toPlace(await fetchJson(url, resultSchema, { source: SOURCE }));
  } catch (error) {
    // Open-Meteo answers 400 "Location ID not found" for unknown IDs.
    if (error instanceof UpstreamError && error.status === 400) return null;
    throw error;
  }
}

/** Resolves a geocoding ID, or null if it doesn't exist. */
export function getPlaceById(id: number): Promise<Place | null> {
  return fetchPlaceById(id);
}
