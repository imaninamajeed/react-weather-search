import Link from "next/link";
import { IconHome } from "@tabler/icons-react";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { formatDayMonth, formatWeekday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { getForecast } from "@/lib/open-meteo/forecast";
import { placeHref, type Place } from "@/lib/places";
import { temperatureColor } from "@/lib/temperature-color";
import { formatTemperature } from "@/lib/units";
import { describeWeather } from "@/lib/weather/codes";
import type { Units } from "@/lib/weather/types";

const DAYS = 7;

/**
 * Seven days for every place at once, for trip planning. Rows come in the caller's order, which is
 * the order of the place cards beside it, and light up with their card (see LinkedPlaces). Columns are calendar dates taken from
 * the first place, so "Sat 31 Oct" lines up across timezones. One place failing leaves a dash
 * in its row instead of breaking the table.
 */
export async function WeekAheadTable({
  places,
  units,
  homeKey,
}: {
  places: Place[];
  units: Units;
  homeKey: string;
}) {
  const [results, { locale, t }] = await Promise.all([
    Promise.allSettled(places.map((place) => getForecast(place.latitude, place.longitude))),
    getI18n(),
  ]);
  const text = t.dashboard.week;
  const reference = results.find((result) => result.status === "fulfilled");
  if (!reference) throw new Error("No forecast available for the week-ahead table");
  const dates = reference.value.daily.slice(0, DAYS).map((day) => day.date);

  return (
    <div>
      <div
        className="relative -mx-4 overflow-x-auto px-4"
        tabIndex={0}
        role="region"
        aria-label={text.tableLabel}
      >
        <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-left fit:min-w-0">
          <caption className="sr-only">{text.caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 bg-card px-2 py-2" />
              {dates.map((date, index) => (
                <th key={date} scope="col" className="px-1 py-2 text-center font-normal">
                  <span className="block text-sm font-medium">
                    {index === 0 ? t.common.today : formatWeekday(date, "short", locale)}
                  </span>
                  <span className="label-caps">{formatDayMonth(date, locale)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {places.map((place, row) => {
              const result = results[row];
              const forecast = result.status === "fulfilled" ? result.value : null;
              return (
                <tr key={place.key} data-place-key={place.key} className="group">
                  <th
                    scope="row"
                    className="sticky left-0 max-w-40 truncate rounded-l-md bg-card px-2 py-1 text-left text-sm font-medium transition-colors group-data-linked:bg-primary/10"
                  >
                    <Link href={placeHref(place)} className="hover:underline">
                      {place.name}
                    </Link>
                    {place.key === homeKey && (
                      <>
                        <IconHome
                          aria-hidden="true"
                          className="ml-1 inline size-3.5 align-text-bottom text-muted-foreground"
                        />
                        <span className="sr-only"> ({text.home})</span>
                      </>
                    )}
                  </th>
                  {dates.map((date) => {
                    const day = forecast?.daily.find((d) => d.date === date);
                    if (!day) {
                      return (
                        <td key={date} className="p-1 text-center text-muted-foreground">
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">{text.noData}</span>
                        </td>
                      );
                    }
                    const weather = describeWeather(day.weatherCode, true, locale);
                    return (
                      <td key={date} className="p-1">
                        {/* Text sits on a temperature tint, so it uses foreground ink: muted grey fails contrast on it. */}
                        <div
                          className="rounded-md px-2 py-2 text-center ring-primary/40 transition-shadow group-data-linked:ring-2"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${temperatureColor(day.temperatureMax)} 30%, transparent)`,
                          }}
                        >
                          <WeatherIcon name={weather.icon} className="mx-auto size-4" />
                          <span className="sr-only">
                            {weather.label}
                            {text.high}
                          </span>
                          <span className="block text-sm font-medium">
                            {formatTemperature(day.temperatureMax, units)}
                          </span>
                          <span className="tnum block text-xs text-foreground/80">
                            {day.precipitationProbabilityMax}%
                            <span className="sr-only">{text.chanceOfRain}</span>
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{text.note}</p>
    </div>
  );
}
