import { getPlaceAlerts } from "@/lib/alerts";
import type { SourceStatus, WeatherAlert } from "@/lib/alerts/types";
import { getForecast } from "@/lib/open-meteo/forecast";
import type { Place } from "@/lib/places";

export interface PlaceAlertEntry {
  place: Place;
  alerts: WeatherAlert[];
  /** The place's current local time, for phrasing "until…" correctly. */
  now: string;
}

/**
 * Alerts for every place the visitor follows. One place failing doesn't hide the rest: it is counted
 * in `failed` so the UI can say it couldn't check, instead of implying "all clear".
 */
export async function loadAlerts(places: Place[]) {
  const results = await Promise.allSettled(
    places.map(async (place): Promise<PlaceAlertEntry & { sources: SourceStatus[] }> => {
      const forecast = await getForecast(place.latitude, place.longitude);
      const { alerts, sources } = await getPlaceAlerts(place, forecast);
      return { place, alerts, sources, now: forecast.current.time };
    }),
  );

  const entries = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  // One note covering every feed consulted; a feed counts as down if it failed for any place.
  const sources = new Map<string, SourceStatus>();
  for (const { sources: list } of entries) {
    for (const source of list) {
      if (sources.get(source.id)?.status !== "unavailable") sources.set(source.id, source);
    }
  }

  return {
    entries: entries.map(({ place, alerts, now }) => ({ place, alerts, now })),
    failed: results.length - entries.length,
    sources: [...sources.values()],
  };
}
