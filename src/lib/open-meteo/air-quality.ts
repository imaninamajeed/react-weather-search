import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { roundCoordinate } from "@/lib/places";
import type { AirQuality } from "@/lib/weather/types";
import { fetchJson, openMeteoUrl } from "./client";

const num = z.number().nullable();

const airQualityResponseSchema = z.object({
  current: z.object({
    time: z.string(),
    us_aqi: num,
    pm2_5: num,
    pm10: num,
    ozone: num,
    nitrogen_dioxide: num,
  }),
});

export function normalizeAirQuality(
  raw: z.infer<typeof airQualityResponseSchema>,
): AirQuality | null {
  const c = raw.current;
  // Some regions have no AQI coverage; the card is simply omitted for them.
  if (c.us_aqi === null) return null;
  return {
    time: c.time,
    usAqi: c.us_aqi,
    pm25: c.pm2_5,
    pm10: c.pm10,
    ozone: c.ozone,
    nitrogenDioxide: c.nitrogen_dioxide,
  };
}

async function fetchAirQuality(latitude: number, longitude: number): Promise<AirQuality | null> {
  "use cache";
  cacheLife("airQuality");

  const url = openMeteoUrl("air-quality", "/v1/air-quality", {
    latitude,
    longitude,
    timezone: "auto",
    current: "us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide",
  });
  // This endpoint is noticeably slower than the others, so it gets a longer timeout
  // and is always rendered behind its own Suspense boundary.
  const raw = await fetchJson(url, airQualityResponseSchema, {
    source: "open-meteo/air-quality",
    timeoutMs: 10_000,
  });
  return normalizeAirQuality(raw);
}

export function getAirQuality(latitude: number, longitude: number): Promise<AirQuality | null> {
  return fetchAirQuality(roundCoordinate(latitude), roundCoordinate(longitude));
}
