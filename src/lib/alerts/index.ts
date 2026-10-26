import "server-only";
import { getAirQuality } from "@/lib/open-meteo/air-quality";
import type { Place } from "@/lib/places";
import type { Forecast } from "@/lib/weather/types";
import { sortAlerts } from "./describe";
import { detectHazards } from "./hazards";
import { getMetMalaysiaWarnings, matchMetWarnings } from "./official/met-malaysia";
import { NWS_COUNTRY_CODES, getNwsAlerts, normalizeNwsAlerts } from "./official/nws";
import type { PlaceAlerts, SourceStatus, WeatherAlert } from "./types";

interface Options {
  /** Also check current air quality. Off for multi-place views: that upstream is slow. */
  includeAirQuality?: boolean;
}

/**
 * Everything worth warning about for a place: official warnings where a national feed covers
 * it, plus signals from our own forecast thresholds. Never throws: a feed that is down is
 * reported in `sources` so the UI can say it couldn't check, rather than imply "all clear".
 */
export async function getPlaceAlerts(
  place: Place,
  forecast: Forecast,
  { includeAirQuality = false }: Options = {},
): Promise<PlaceAlerts> {
  const timeZone = place.timezone ?? forecast.timezone;
  const now = forecast.current.time;
  const sources: SourceStatus[] = [{ id: "forecast", label: "Forecast signals", status: "ok" }];

  const official = async (): Promise<WeatherAlert[]> => {
    if (place.countryCode === "MY") {
      try {
        const warnings = await getMetMalaysiaWarnings();
        sources.push({ id: "met-malaysia", label: "MET Malaysia", status: "ok" });
        return matchMetWarnings(place, warnings, now);
      } catch (error) {
        console.error("MET Malaysia warnings unavailable", error);
        sources.push({ id: "met-malaysia", label: "MET Malaysia", status: "unavailable" });
      }
    } else if (place.countryCode && NWS_COUNTRY_CODES.has(place.countryCode)) {
      try {
        const raw = await getNwsAlerts(place.latitude, place.longitude);
        sources.push({ id: "nws", label: "US National Weather Service", status: "ok" });
        return normalizeNwsAlerts(raw, timeZone, place.latitude, place.longitude);
      } catch (error) {
        console.error("NWS alerts unavailable", error);
        sources.push({ id: "nws", label: "US National Weather Service", status: "unavailable" });
      }
    }
    return [];
  };

  const airQuality = includeAirQuality
    ? await getAirQuality(place.latitude, place.longitude).catch(() => null)
    : null;

  const officialAlerts = await official();
  return {
    alerts: sortAlerts([...officialAlerts, ...detectHazards(forecast, airQuality)]),
    sources,
  };
}
