import { getModelDays } from "@/lib/open-meteo/models";
import { assessConfidence } from "@/lib/weather/confidence";
import type { Forecast, Units } from "@/lib/weather/types";
import { DailyList } from "./daily-list";

/**
 * The 14-day list with each day's model agreement alongside. The three-model fetch is shared (cached)
 * with the confidence panel below, and a failure just leaves the list without the extra column.
 */
export async function OutlookDaily({ forecast, units }: { forecast: Forecast; units: Units }) {
  const days = await getModelDays(forecast.latitude, forecast.longitude)
    .then(assessConfidence)
    .catch(() => null);
  const confidence = days
    ? Object.fromEntries(days.map((day) => [day.date, day.level]))
    : undefined;
  return <DailyList forecast={forecast} units={units} confidence={confidence} />;
}
