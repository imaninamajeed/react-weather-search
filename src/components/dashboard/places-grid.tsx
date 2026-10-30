import { ShownCount } from "@/components/shared/shown-count";
import { getPlaceAlerts } from "@/lib/alerts";
import { highestSeverity } from "@/lib/alerts/describe";
import type { WeatherAlert } from "@/lib/alerts/types";
import { getForecast } from "@/lib/open-meteo/forecast";
import { getI18n } from "@/lib/i18n/server";
import type { Place } from "@/lib/places";
import type { Forecast, Units } from "@/lib/weather/types";
import { AddPlaceTile } from "./add-place-tile";
import { LocationTile } from "./location-tile";

/**
 * How many tiles the dashboard shows. /places already compares every location you follow, so this
 * panel stays a glance: the few that most need it, then a way to the rest.
 */
export const MAX_TILES = 3;

interface Entry {
  place: Place;
  index: number;
  forecast: Forecast | null;
  alerts: WeatherAlert[];
}

/** A place's forecast and alerts. Each can fail on its own without losing the other, or the place. */
async function load(place: Place, index: number): Promise<Entry> {
  const forecast = await getForecast(place.latitude, place.longitude).catch(() => null);
  const alerts = forecast
    ? await getPlaceAlerts(place, forecast).then(
        (result) => result.alerts,
        () => [],
      )
    : [];
  return { place, index, forecast, alerts };
}

/**
 * The followed places other than home, most urgent first: warnings, then advisories, then the rest in
 * the order you saved them. The panel exists to answer "which of my places needs attention?", and
 * saved order says nothing about that. Only the first few are shown; /places, one button away in the
 * card header, has the rest.
 * Every place's forecast and alerts load together here, because ordering needs all of them.
 */
export async function PlacesGrid({ places, units }: { places: Place[]; units: Units }) {
  const [entries, { t }] = await Promise.all([Promise.all(places.map(load)), getI18n()]);
  const urgency = (entry: Entry) => {
    const severity = highestSeverity(entry.alerts);
    return severity === "warning" ? 0 : severity === "advisory" ? 1 : 2;
  };
  const sorted = entries.sort((a, b) => urgency(a) - urgency(b) || a.index - b.index);
  const shown = sorted.slice(0, MAX_TILES);

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3">
        {shown.map(({ place, forecast, alerts }) => (
          <li key={place.key}>
            <LocationTile place={place} units={units} forecast={forecast} alerts={alerts} />
          </li>
        ))}
      </ul>
      {/* Room left over: following another place is right here, as a slim row. */}
      {places.length < MAX_TILES && <AddPlaceTile className="mt-3" />}
      {places.length > shown.length && (
        <ShownCount
          className="mt-3"
          shown={shown.length}
          total={places.length}
          noun={t.dashboard.view.otherLocations}
        />
      )}
    </>
  );
}
