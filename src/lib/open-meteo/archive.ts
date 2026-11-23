import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { roundCoordinate } from "@/lib/places";
import {
  NORMALS_PERIOD,
  buildNormals,
  trimTrailingGaps,
  type ClimateNormals,
  type DailySeries,
} from "@/lib/weather/climate";
import { fetchJson, openMeteoUrl } from "./client";

const num = z.number().nullable();
const archiveSchema = z.object({
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(num),
    precipitation_sum: z.array(num),
  }),
});

export function normalizeArchive(raw: z.infer<typeof archiveSchema>): DailySeries {
  return {
    time: raw.daily.time,
    temperatureMax: raw.daily.temperature_2m_max,
    precipitation: raw.daily.precipitation_sum,
  };
}

/**
 * Both the normals and the recent days must come from the same dataset. Left on its default
 * ("best match"), the archive blends different models over time, and the 1991–2020 baseline came
 * out ~1.5 °C cooler than the same period from ERA5 itself, which made every recent year look
 * several degrees "warmer than normal". Pinning ERA5 keeps the comparison like-for-like.
 */
const CLIMATE_MODEL = "era5";

function archiveUrl(latitude: number, longitude: number, start: string, end: string) {
  return openMeteoUrl("archive", "/v1/archive", {
    latitude,
    longitude,
    start_date: start,
    end_date: end,
    daily: "temperature_2m_max,precipitation_sum",
    models: CLIMATE_MODEL,
    timezone: "auto",
    temperature_unit: "celsius",
    precipitation_unit: "mm",
  });
}

async function fetchNormals(latitude: number, longitude: number): Promise<ClimateNormals> {
  "use cache";
  cacheLife("max");

  // ~300 KB of raw daily data: fetched once, reduced to a few hundred numbers, then cached for good.
  const raw = await fetchJson(
    archiveUrl(latitude, longitude, NORMALS_PERIOD.start, NORMALS_PERIOD.end),
    archiveSchema,
    { source: "open-meteo/archive", timeoutMs: 15_000 },
  );
  return buildNormals(normalizeArchive(raw));
}

/** 1991–2020 climate normals for a location. */
export function getClimateNormals(latitude: number, longitude: number): Promise<ClimateNormals> {
  return fetchNormals(roundCoordinate(latitude), roundCoordinate(longitude));
}

async function fetchRecent(
  latitude: number,
  longitude: number,
  start: string,
  end: string,
): Promise<DailySeries> {
  "use cache";
  cacheLife("days");

  const raw = await fetchJson(archiveUrl(latitude, longitude, start, end), archiveSchema, {
    source: "open-meteo/archive",
  });
  return trimTrailingGaps(normalizeArchive(raw));
}

/** Daily highs and rainfall between two dates (inclusive), from the ERA5 reanalysis. */
export function getRecentDaily(
  latitude: number,
  longitude: number,
  start: string,
  end: string,
): Promise<DailySeries> {
  return fetchRecent(roundCoordinate(latitude), roundCoordinate(longitude), start, end);
}
