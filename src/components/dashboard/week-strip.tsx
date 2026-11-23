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

const DAYS = 7;

/** Rain below this is a trace, not worth printing next to the chance. */
export const MEASURABLE_MM = 0.1;

/**
 * Seven days in a row: plain text with hairlines between the days, as on the Alerts page, and colour
 * only where it means something (an alert's icon). Wind and each day's full summary are for
 * assistive tech. The days are the place's own calendar, so its "today" is always the first.
 */
export async function WeekStrip({
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
  const days = forecast.daily.slice(0, DAYS);
  // Each day's low-to-high range is drawn on the week's own scale, so the bars compare days.
  const weekLow = Math.min(...days.map((day) => day.temperatureMin));
  const weekSpan = Math.max(...days.map((day) => day.temperatureMax)) - weekLow || 1;

  return (
    <ul className="grid min-w-0 grid-cols-7 divide-x divide-border dark:divide-white/10">
      {days.map((day) => {
        const weather = describeWeather(day.weatherCode, true, locale);
        const severity = severityOnDay(alerts, day.date, today);
        const isToday = day.date === today;
        const amount =
          day.precipitationSum >= MEASURABLE_MM
            ? formatPrecipitation(day.precipitationSum, units)
            : null;
        const label = `${isToday ? t.common.today : formatWeekday(day.date, "long", locale)} ${formatDayMonth(day.date, locale)}`;
        const AlertIcon = severity === "warning" ? OctagonAlert : TriangleAlert;

        return (
          <li
            key={day.date}
            aria-current={isToday ? "date" : undefined}
            className={cn("relative px-0.5 py-1 text-center sm:px-2", isToday && "bg-foreground/5")}
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
            <div aria-hidden="true" className="tnum">
              <p
                className={cn(
                  "text-xs text-muted-foreground",
                  isToday && "font-medium text-foreground",
                )}
              >
                {isToday ? t.common.today : formatWeekday(day.date, "short", locale)}
              </p>
              <WeatherIcon name={weather.icon} className="mx-auto mt-2 size-5" />
              <p className="mt-2 text-sm font-medium sm:text-base">
                {formatTemperature(day.temperatureMax, units)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatTemperature(day.temperatureMin, units)}
              </p>
              <div className="mx-auto mt-2 h-1 w-full max-w-10 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-(--brand-teal-text)/70"
                  style={{
                    marginLeft: `${((day.temperatureMin - weekLow) / weekSpan) * 100}%`,
                    width: `${Math.max(((day.temperatureMax - day.temperatureMin) / weekSpan) * 100, 12)}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Droplets className="size-3" />
                {day.precipitationProbabilityMax}%
              </p>
            </div>
            {severity && (
              <AlertIcon
                aria-hidden="true"
                className={cn(
                  "absolute top-1 right-1 size-3.5",
                  severity === "warning" ? "text-warning" : "text-advisory",
                )}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
