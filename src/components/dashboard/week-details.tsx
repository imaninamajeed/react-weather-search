import { OctagonAlert, TriangleAlert } from "lucide-react";
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
 * The seven days as a list, one day a line, with what a tile has no room for: the conditions in
 * words, the chance and amount of rain, and the top wind speed.
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
  const today = forecast.daily[0].date;

  return (
    <ul className="divide-y divide-border">
      {forecast.daily.slice(0, 7).map((day) => {
        const weather = describeWeather(day.weatherCode, true, locale);
        const severity = severityOnDay(alerts, day.date, today);
        const isToday = day.date === today;
        const AlertIcon = severity === "warning" ? OctagonAlert : TriangleAlert;
        const facts = [
          t.dashboard.stats.rain(day.precipitationProbabilityMax),
          day.precipitationSum >= MEASURABLE_MM && formatPrecipitation(day.precipitationSum, units),
          formatSpeed(day.windSpeedMax, units),
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <li
            key={day.date}
            aria-current={isToday ? "date" : undefined}
            className="flex items-center gap-3 py-2.5"
          >
            <div className="w-16 shrink-0">
              <p className={cn("text-sm", isToday ? "font-medium" : "text-foreground/90")}>
                {isToday ? t.common.today : formatWeekday(day.date, "short", locale)}
              </p>
              <p className="text-xs text-muted-foreground">{formatDayMonth(day.date, locale)}</p>
            </div>
            <WeatherIcon name={weather.icon} className="size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{weather.label}</p>
              <p className="truncate text-xs text-muted-foreground">{facts}</p>
            </div>
            {severity && (
              <>
                <AlertIcon
                  aria-hidden="true"
                  className={cn(
                    "size-4 shrink-0",
                    severity === "warning" ? "text-warning" : "text-advisory",
                  )}
                />
                <span className="sr-only">
                  {severity === "warning" ? t.dashboard.week.warning : t.dashboard.week.advisory}
                </span>
              </>
            )}
            <p className="tnum w-20 shrink-0 text-right text-sm">
              <span className="font-medium">{formatTemperature(day.temperatureMax, units)}</span>{" "}
              <span className="text-muted-foreground">
                {formatTemperature(day.temperatureMin, units)}
              </span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
