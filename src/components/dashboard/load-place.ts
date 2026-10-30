import { getPlaceAlerts } from "@/lib/alerts";
import type { WeatherAlert } from "@/lib/alerts/types";
import { getForecast } from "@/lib/open-meteo/forecast";
import type { Place } from "@/lib/places";
import type { Forecast } from "@/lib/weather/types";

/**
 * A place's forecast and alerts. Each can fail on its own: no forecast is null (the card still
 * names the place and its menu works), and no alerts is an empty list.
 */
export async function loadPlace(
  place: Place,
): Promise<{ forecast: Forecast | null; alerts: WeatherAlert[] }> {
  const forecast = await getForecast(place.latitude, place.longitude).catch(() => null);
  const alerts = forecast
    ? await getPlaceAlerts(place, forecast).then(
        (result) => result.alerts,
        () => [],
      )
    : [];
  return { forecast, alerts };
}
