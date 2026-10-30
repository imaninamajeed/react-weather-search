import { Droplets, OctagonAlert, TriangleAlert } from "lucide-react";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { severityOnDay } from "@/lib/alerts/on-day";
import type { WeatherAlert } from "@/lib/alerts/types";
import { formatDayMonth, formatWeekday } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { formatPrecipitation, formatSpeed, formatTemperature } from "@/lib/units";
import { cn } from "@/lib/utils";
import { describeWeather } from "@/lib/weather/codes";
import type { Forecast, Units } from "@/lib/weather/types";
import { MEASURABLE_MM } from "./week-strip";

/**
 * The seven days as a list in a saved tile: the rows share the square's height up to 2rem each, the
 * height they have at four across, so the wider three-across tiles get the same rows rather than
 * stretched ones. Each row reads left to right as the day, the
 * conditions icon, the low, a bar placing the day's range on the week's own scale (so the bars compare
 * days), the high, and the chance of rain, which darkens when rain is likely. The conditions in words,
 * the amount of rain and the top wind have no room here and are for assistive tech.
 */
export async function WeekDetails({
  forecast,
  alerts,
  units,
}: {
  forecast: Forecast;
  alerts: WeatherAlert[];
  units: Units;
}) {
  const { locale, t } = await getI18n();
  const text = t.dashboard.week;
  const today = forecast.daily[0].date;
  const days = forecast.daily.slice(0, 7);
  const weekLow = Math.min(...days.map((day) => day.temperatureMin));
  const weekSpan = Math.max(...days.map((day) => day.temperatureMax)) - weekLow || 1;

  return (
    <ul className="flex h-full min-h-0 flex-col divide-y divide-border/60">
      {days.map((day) => {
        const weather = describeWeather(day.weatherCode, true, locale);
        const severity = severityOnDay(alerts, day.date, today);
        const isToday = day.date === today;
        const AlertIcon = severity === "warning" ? OctagonAlert : TriangleAlert;
        const likely = day.precipitationProbabilityMax >= 50;
        const amount =
          day.precipitationSum >= MEASURABLE_MM
            ? formatPrecipitation(day.precipitationSum, units)
            : null;
        const label = `${isToday ? t.common.today : formatWeekday(day.date, "long", locale)} ${formatDayMonth(day.date, locale)}`;

        return (
          <li
            key={day.date}
            aria-current={isToday ? "date" : undefined}
            className={cn(
              "flex max-h-8 min-h-5 flex-1 items-center gap-1.5 px-1.5 text-xs @min-[18rem]:min-h-8 @min-[18rem]:gap-2 @min-[18rem]:text-sm",
              isToday && "rounded-xl bg-muted/60",
            )}
          >
            <span className="sr-only">
              {text.day(
                label,
                weather.label,
                formatTemperature(day.temperatureMax, units),
                formatTemperature(day.temperatureMin, units),
                day.precipitationProbabilityMax,
                amount,
                formatSpeed(day.windSpeedMax, units),
              )}
              {severity && `. ${severity === "warning" ? text.warning : text.advisory}`}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "w-7 shrink-0 @min-[18rem]:w-10",
                isToday ? "font-medium" : "text-muted-foreground",
              )}
            >
              {isToday ? t.common.today : formatWeekday(day.date, "short", locale)}
            </span>
            <WeatherIcon name={weather.icon} className="size-4 shrink-0 @min-[18rem]:size-5" />
            <span
              aria-hidden="true"
              className="tnum flex min-w-0 flex-1 items-center justify-center gap-1.5 @min-[18rem]:gap-2"
            >
              <span className="w-7 shrink-0 text-right text-xs text-muted-foreground @min-[18rem]:w-8">
                {formatTemperature(day.temperatureMin, units)}
              </span>
              <span className="h-1.5 max-w-8 min-w-0 flex-1 rounded-full bg-muted @min-[18rem]:max-w-14">
                <span
                  className="block h-full rounded-full bg-(--chart-1)"
                  style={{
                    marginLeft: `${((day.temperatureMin - weekLow) / weekSpan) * 100}%`,
                    width: `${Math.max(((day.temperatureMax - day.temperatureMin) / weekSpan) * 100, 8)}%`,
                  }}
                />
              </span>
              <span className="w-7 shrink-0 font-medium @min-[18rem]:w-8">
                {formatTemperature(day.temperatureMax, units)}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "tnum flex w-9 shrink-0 items-center justify-end gap-0.5 text-xs @min-[18rem]:w-11",
                likely ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <Droplets className="size-3" />
              {day.precipitationProbabilityMax}%
            </span>
            <span className="grid size-3.5 shrink-0 place-items-center @min-[18rem]:size-4">
              {severity && (
                <AlertIcon
                  aria-hidden="true"
                  className={cn(
                    "size-3.5 @min-[18rem]:size-4",
                    severity === "warning" ? "text-warning" : "text-advisory",
                  )}
                />
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
