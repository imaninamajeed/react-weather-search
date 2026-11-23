import "server-only";
import { cacheLife } from "next/cache";
import { fetchJson } from "@/lib/open-meteo/client";
import { normalizeRadar, radarResponseSchema, type RadarData } from "@/lib/map/radar";

/** The last ~2 hours of radar frames (about every 10 minutes). */
export async function getRadarFrames(): Promise<RadarData> {
  "use cache";
  cacheLife("radar");
  const raw = await fetchJson(
    "https://api.rainviewer.com/public/weather-maps.json",
    radarResponseSchema,
    {
      source: "rainviewer",
    },
  );
  return normalizeRadar(raw);
}
