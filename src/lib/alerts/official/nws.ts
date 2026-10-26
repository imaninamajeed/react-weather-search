import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { isoToWallClock } from "@/lib/format";
import { fetchJson } from "@/lib/open-meteo/client";
import { roundCoordinate } from "@/lib/places";
import type { HazardKind, OfficialAlert } from "../types";

/** The NWS covers the US and its territories. */
export const NWS_COUNTRY_CODES = new Set(["US", "PR", "GU", "VI", "AS", "MP"]);

const featureSchema = z.object({
  properties: z.object({
    id: z.string(),
    event: z.string(),
    severity: z.string().nullable().optional(),
    status: z.string().optional(),
    messageType: z.string().optional(),
    headline: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    instruction: z.string().nullable().optional(),
    onset: z.string().nullable().optional(),
    effective: z.string().nullable().optional(),
    ends: z.string().nullable().optional(),
    expires: z.string().nullable().optional(),
    senderName: z.string().nullable().optional(),
  }),
});

const responseSchema = z.object({ features: z.array(featureSchema) });
export type NwsResponse = z.infer<typeof responseSchema>;

// The NWS asks every client to identify itself so it can reach the operator if needed.
const userAgent = () =>
  process.env.NWS_USER_AGENT ?? "Isobar weather app (https://github.com/imaninamajeed)";

async function fetchNws(latitude: number, longitude: number): Promise<NwsResponse> {
  "use cache";
  cacheLife("alerts");
  return fetchJson(
    `https://api.weather.gov/alerts/active?point=${latitude},${longitude}`,
    responseSchema,
    {
      source: "api.weather.gov/alerts",
      headers: { "User-Agent": userAgent(), Accept: "application/geo+json" },
    },
  );
}

export function getNwsAlerts(latitude: number, longitude: number): Promise<NwsResponse> {
  return fetchNws(roundCoordinate(latitude), roundCoordinate(longitude));
}

function kindOf(event: string): HazardKind | "other" {
  if (/thunderstorm|tornado/i.test(event)) return "thunderstorm";
  if (/flood|rain/i.test(event)) return "rain";
  if (/wind|hurricane|tropical|storm surge/i.test(event)) return "wind";
  if (/heat/i.test(event)) return "heat";
  if (/freeze|frost/i.test(event)) return "frost";
  if (/snow|blizzard|winter|ice/i.test(event)) return "snow";
  if (/air quality|smoke/i.test(event)) return "air-quality";
  return "other";
}

/** Maps NWS alerts to ours, converting their offset timestamps to the place's wall-clock time. */
export function normalizeNwsAlerts(
  raw: NwsResponse,
  timeZone: string,
  latitude: number,
  longitude: number,
): OfficialAlert[] {
  const local = (iso: string | null | undefined) => (iso ? isoToWallClock(iso, timeZone) : null);

  return raw.features
    .map((feature) => feature.properties)
    .filter((p) => (p.status ?? "Actual") === "Actual" && p.messageType !== "Cancel")
    .map((p) => ({
      source: "nws" as const,
      id: p.id,
      kind: kindOf(p.event),
      severity:
        /warning$/i.test(p.event) || p.severity === "Severe" || p.severity === "Extreme"
          ? ("warning" as const)
          : ("advisory" as const),
      title: p.event,
      summary: p.headline ?? undefined,
      text: (p.description ?? "").trim(),
      instruction: p.instruction?.trim() || undefined,
      starts: local(p.onset ?? p.effective),
      ends: local(p.ends ?? p.expires),
      issuer: p.senderName ?? "National Weather Service",
      url: `https://forecast.weather.gov/MapClick.php?lat=${latitude}&lon=${longitude}`,
    }));
}
