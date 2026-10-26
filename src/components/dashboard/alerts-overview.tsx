import { AlertList } from "@/components/alerts/alert-list";
import { SourceNote } from "@/components/alerts/source-note";
import { getPlaceAlerts } from "@/lib/alerts";
import type { SourceStatus } from "@/lib/alerts/types";
import { getForecast } from "@/lib/open-meteo/forecast";
import type { Place } from "@/lib/places";
import type { Units } from "@/lib/weather/types";
import Link from "next/link";
import { placeHref } from "@/lib/places";

/** Alerts across every place the visitor follows, grouped by place. One place failing doesn't hide the rest. */
export async function AlertsOverview({ places, units }: { places: Place[]; units: Units }) {
  const results = await Promise.allSettled(
    places.map(async (place) => {
      const forecast = await getForecast(place.latitude, place.longitude);
      const { alerts, sources } = await getPlaceAlerts(place, forecast);
      return { place, alerts, sources, now: forecast.current.time };
    }),
  );

  const checked = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const withAlerts = checked.filter((entry) => entry.alerts.length > 0);
  const failed = results.length - checked.length;

  // One note covering every feed consulted; a feed counts as down if it failed for any place.
  const sources = new Map<string, SourceStatus>();
  for (const { sources: list } of checked) {
    for (const source of list) {
      if (sources.get(source.id)?.status !== "unavailable") sources.set(source.id, source);
    }
  }

  return (
    <div>
      {withAlerts.length === 0 ? (
        <p>
          No active alerts across your {places.length === 1 ? "place" : `${places.length} places`}.
        </p>
      ) : (
        <div className="space-y-6">
          {withAlerts.map(({ place, alerts, now }) => (
            <div key={place.key}>
              <h3 className="mb-2 font-medium">
                <Link
                  href={placeHref(place)}
                  className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  {place.name}
                </Link>
              </h3>
              <AlertList alerts={alerts} units={units} now={now} limit={2} />
            </div>
          ))}
        </div>
      )}
      {failed > 0 && (
        <p className="mt-3 text-xs font-medium">
          Couldn&apos;t check {failed === 1 ? "one place" : `${failed} places`} just now.
        </p>
      )}
      {sources.size > 0 && <SourceNote sources={[...sources.values()]} />}
    </div>
  );
}
