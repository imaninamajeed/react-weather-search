import { getPlaceAlerts } from "@/lib/alerts";
import type { Place } from "@/lib/places";
import type { Forecast, Units } from "@/lib/weather/types";
import { AlertList } from "./alert-list";
import { SourceNote } from "./source-note";

/** Alerts for one place, including an air-quality check (that upstream is shared with the AQ tile). */
export async function PlaceAlerts({
  place,
  forecast,
  units,
}: {
  place: Place;
  forecast: Forecast;
  units: Units;
}) {
  const { alerts, sources } = await getPlaceAlerts(place, forecast, { includeAirQuality: true });
  const now = forecast.current.time;

  return (
    <div>
      {alerts.length === 0 ? (
        <p>No active alerts for {place.name}.</p>
      ) : (
        <AlertList alerts={alerts} units={units} now={now} />
      )}
      <SourceNote sources={sources} />
    </div>
  );
}
