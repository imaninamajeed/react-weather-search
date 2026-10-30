import { Droplets } from "lucide-react";
import { WeatherIcon } from "@/components/shared/weather-icon";
import { formatWeekday } from "@/lib/format";
import { formatTemperature } from "@/lib/units";
import { cn } from "@/lib/utils";
import { describeWeather } from "@/lib/weather/codes";
import type { Forecast, Units } from "@/lib/weather/types";

/**
 * The next seven days as one row of small tiles: the day, what it looks like, the high over the low,
 * and the chance of rain. Enough to plan the week at a glance; the full two weeks, with how far to
 * trust them, are one link away. Today is the slightly stronger tile.
 */
export function WeekStrip({ forecast, units }: { forecast: Forecast; units: Units }) {
  return (
    <ol aria-label="Next 7 days" className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {forecast.daily.slice(0, 7).map((day, index) => {
        const weather = describeWeather(day.weatherCode);
        return (
          <li
            key={day.date}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-center ring-1 ring-foreground/5 dark:ring-white/10",
              index === 0 ? "bg-muted" : "bg-muted/40",
            )}
          >
            <span className="label-caps max-w-full truncate">
              {index === 0 ? "Today" : formatWeekday(day.date)}
            </span>
            <WeatherIcon name={weather.icon} className="size-5" />
            <span className="sr-only">{weather.label}</span>
            <span className="tnum text-base font-medium">
              {formatTemperature(day.temperatureMax, units)}
            </span>
            <span className="tnum text-xs text-muted-foreground">
              {formatTemperature(day.temperatureMin, units)}
            </span>
            <span className="tnum flex items-center gap-0.5 text-xs text-muted-foreground">
              <Droplets aria-hidden="true" className="size-3" />
              {day.precipitationProbabilityMax}%<span className="sr-only"> chance of rain</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
